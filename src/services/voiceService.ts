
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
   * Set whether voice guidance is enabled
   */
  setEnabled(value: boolean) {
    this.enabled = value;
    // Save preference to localStorage
    localStorage.setItem('voiceGuidanceEnabled', value ? 'true' : 'false');
  },
  
  /**
   * Initialize the voice service with user preferences
   */
  initialize() {
    // Load preference from localStorage
    const savedPreference = localStorage.getItem('voiceGuidanceEnabled');
    if (savedPreference !== null) {
      this.enabled = savedPreference === 'true';
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
  }): Promise<void> {
    // If voice guidance is disabled and not forced, return early
    if (!this.enabled && !options?.force) {
      return;
    }
    
    // Default options
    const voice = options?.voice || 'alloy';
    const speed = options?.speed || 1.0;
    const cacheKey = options?.cacheKey || `${text}-${voice}-${speed}`;
    
    try {
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
  }
};

// Initialize on import
voiceService.initialize();

export default voiceService;
