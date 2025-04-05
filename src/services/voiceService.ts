
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
   * Whether user has granted permission for autoplay
   */
  permissionGranted: false,

  /**
   * The last step number that was spoken
   * Used for sequence mode to ensure steps are followed in order
   */
  lastSpokenStep: 0,
  
  /**
   * Currently playing audio element, if any
   */
  currentlyPlaying: null as HTMLAudioElement | null,
  
  /**
   * Set whether voice guidance is enabled
   */
  setEnabled(value: boolean) {
    this.enabled = value;
    // Save preference to localStorage
    localStorage.setItem('voiceGuidanceEnabled', value ? 'true' : 'false');
    
    // Reset permission if voice is disabled
    if (!value) {
      this.permissionGranted = false;
      this.stopAllAudio();
    }
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
   * Set whether permission is granted for autoplay
   */
  setPermissionGranted(value: boolean) {
    this.permissionGranted = value;
    // Save permission preference to localStorage
    localStorage.setItem('voicePermissionGranted', value ? 'true' : 'false');
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
    
    // Load permission preference from localStorage
    const savedPermission = localStorage.getItem('voicePermissionGranted');
    if (savedPermission !== null) {
      this.permissionGranted = savedPermission === 'true';
    }
    
    return this.enabled;
  },
  
  /**
   * Request permission from user for voice guidance
   * @returns Promise that resolves to boolean indicating if permission was granted
   */
  async requestPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      // If permission already granted, don't ask again
      if (this.permissionGranted) {
        resolve(true);
        return;
      }
      
      // Create toast with actions for permission request
      toast("Allow voice guidance?", {
        description: "Cookerist would like to speak recipe instructions",
        action: {
          label: "Allow",
          onClick: () => {
            this.setPermissionGranted(true);
            resolve(true);
          }
        },
        cancel: {
          label: "Deny",
          onClick: () => {
            resolve(false);
          }
        },
        duration: 10000, // Give user time to decide
        onDismiss: () => resolve(false)
      });
    });
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
    
    // Request permission before speaking (if not forced and permission not granted)
    if (!this.permissionGranted && !options?.force) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.log('Voice permission denied by user');
        return;
      }
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
        if (audioElement) {
          this.currentlyPlaying = audioElement;
          audioElement.play();
          
          // Set up event listener to clear currentlyPlaying when audio ends
          audioElement.addEventListener('ended', () => {
            this.currentlyPlaying = null;
          }, { once: true });
        }
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
      
      // Set up event listener to clear currentlyPlaying when audio ends
      audioElement.addEventListener('ended', () => {
        this.currentlyPlaying = null;
      }, { once: true });
      
      // Store reference to current audio
      this.currentlyPlaying = audioElement;
      
      // Play the audio
      await audioElement.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      this.currentlyPlaying = null;
      
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
    // Stop currently playing audio
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause();
      this.currentlyPlaying.currentTime = 0;
      this.currentlyPlaying = null;
    }
    
    // Stop any other cached audio just in case
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
