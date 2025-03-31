
type AIProvider = 'gemini' | 'openai';

/**
 * Service for managing AI provider preferences
 */
export const aiProviderService = {
  /**
   * The default AI provider
   */
  defaultProvider: 'gemini' as AIProvider,
  
  /**
   * Gets the current AI provider preference
   */
  getCurrentProvider(): AIProvider {
    const stored = localStorage.getItem('ai_provider');
    return (stored as AIProvider) || this.defaultProvider;
  },
  
  /**
   * Sets the current AI provider preference
   * @param provider The AI provider to set as current
   */
  setCurrentProvider(provider: AIProvider): void {
    localStorage.setItem('ai_provider', provider);
  }
};
