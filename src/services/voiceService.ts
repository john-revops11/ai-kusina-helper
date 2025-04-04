
import { toast } from "sonner";

/**
 * Voice service for text-to-speech functionality
 * Uses OpenAI's API text-to-speech endpoint
 */
export const voiceService = {
  /**
   * The OpenAI API key (from openaiService)
   */
  get apiKey() {
    // Reuse the OpenAI API key from openaiService
    return "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";
  },
  
  /**
   * Cache for storing audio objects to prevent repeat API calls
   */
  audioCache: new Map<string, HTMLAudioElement>(),
  
  /**
   * Whether voice guidance is enabled
   */
  enabled: true,

  /**
   * Whether sequence mode is enabled
   * When true, voice guidance will only play in sequence from step 1 onwards
   */
  sequenceMode: false,

  /**
   * The last step number that was spoken
   * Used for sequence mode to ensure steps are followed in order
   */
  lastSpokenStep: 0,
  
  /**
   * Set whether voice guidance is enabled
   */
  setEnabled(value: boolean) {
    this.enabled = value;
    // Save preference to localStorage
    localStorage.setItem('voiceGuidanceEnabled', value ? 'true' : 'false');
  },

  /**
   * Set whether sequence mode is enabled
   */
  setSequenceMode(value: boolean) {
    this.sequenceMode = value;
    // Save preference to localStorage
    localStorage.setItem('voiceSequenceModeEnabled', value ? 'true' : 'false');
    // Reset last spoken step when toggling sequence mode
    this.lastSpokenStep = 0;
  },
  
  /**
   * Initialize the voice service with user preferences
   */
  initialize() {
    // Load voice guidance preference from localStorage
    const savedPreference = localStorage.getItem('voiceGuidanceEnabled');
    if (savedPreference !== null) {
      this.enabled = savedPreference === 'true';
    }

    // Load sequence mode preference from localStorage
    const savedSequenceMode = localStorage.getItem('voiceSequenceModeEnabled');
    if (savedSequenceMode !== null) {
      this.sequenceMode = savedSequenceMode === 'true';
    }
    
    return this.enabled;
  },
  
  /**
   * Speak text using OpenAI's text-to-speech API
   * @param text The text to speak
   * @param options Options for the speech
   */
  async speak(text: string, options?: { 
    force?: boolean; 
    voice?: string; 
    speed?: number;
    cacheKey?: string;
    stepNumber?: number;
  }): Promise<void> {
    // If voice guidance is disabled and not forced, return early
    if (!this.enabled && !options?.force) {
      return;
    }
    
    // Check sequence mode
    if (this.sequenceMode && options?.stepNumber !== undefined) {
      // In sequence mode, only speak if this is the next step in sequence
      if (options.stepNumber !== this.lastSpokenStep + 1 && !options.force) {
        console.log(`Skipping step ${options.stepNumber} speech due to sequence mode (last: ${this.lastSpokenStep})`);
        return;
      }
      // Update last spoken step
      this.lastSpokenStep = options.stepNumber;
    }
    
    // Default options
    const voice = options?.voice || 'alloy';
    const speed = options?.speed || 1.0;
    const cacheKey = options?.cacheKey || `${text}-${voice}-${speed}`;
    
    try {
      // Stop any currently playing audio before starting a new one
      this.stopAllAudio();
      
      // Check cache first
      if (this.audioCache.has(cacheKey)) {
        const audioElement = this.audioCache.get(cacheKey);
        audioElement?.play();
        return;
      }
      
      // Make request to OpenAI's text-to-speech API
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice,
          speed: speed,
          response_format: 'mp3'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI TTS API error:', errorData);
        throw new Error(`OpenAI TTS API error: ${JSON.stringify(errorData)}`);
      }
      
      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play audio element
      const audioElement = new Audio(audioUrl);
      
      // Cache the audio element for future use
      this.audioCache.set(cacheKey, audioElement);
      
      // Play the audio
      await audioElement.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      // Only show error toast if voice was explicitly requested (force=true)
      if (options?.force) {
        toast('Failed to generate speech', {
          description: 'Check your internet connection and try again.'
        });
      }
    }
  },
  
  /**
   * Stop all currently playing audio
   */
  stopAllAudio() {
    this.audioCache.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  },

  /**
   * Reset the sequence mode counter
   */
  resetSequence() {
    this.lastSpokenStep = 0;
  }
};

// Initialize on import
voiceService.initialize();

export default voiceService;
