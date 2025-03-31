
import { AgentInterface, AgentContext, AgentResponse } from './AgentInterface';
import { geminiService } from '@/services/geminiService';

/**
 * Agent responsible for general chat support and Q&A
 */
export class ChatSupportAgent implements AgentInterface {
  private readonly name = 'ChatSupport';
  
  getName(): string {
    return this.name;
  }
  
  async handleRequest(request: string, context?: AgentContext): Promise<AgentResponse> {
    try {
      // Prepare context for the AI request
      let contextualPrompt = '';
      
      // Add user preferences to the contextual prompt if available
      if (context?.userPreferences) {
        const prefs = context.userPreferences;
        
        if (prefs.dietaryRestrictions && prefs.dietaryRestrictions.length > 0) {
          contextualPrompt += `The user has the following dietary restrictions: ${prefs.dietaryRestrictions.join(', ')}. `;
        }
        
        if (prefs.skillLevel) {
          contextualPrompt += `The user's cooking skill level is ${prefs.skillLevel}. `;
        }
        
        if (prefs.favoriteCuisines && prefs.favoriteCuisines.length > 0) {
          contextualPrompt += `The user's favorite cuisines are: ${prefs.favoriteCuisines.join(', ')}. `;
        }
      }
      
      // Add current recipe context if available
      if (context?.currentRecipeId) {
        contextualPrompt += `The user is currently viewing or cooking a recipe. `;
      }
      
      // Add conversation history if available
      if (context?.previousMessages && context.previousMessages.length > 0) {
        const lastMessages = context.previousMessages.slice(-3); // Get last 3 messages for context
        contextualPrompt += `Recent conversation history: `;
        
        lastMessages.forEach(msg => {
          contextualPrompt += `\n${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
        });
        
        contextualPrompt += '\n';
      }
      
      // Complete prompt with the user's request
      const fullPrompt = `${contextualPrompt}\nUser question about Filipino cooking: "${request}"
      
      Please provide a helpful, concise response about Filipino cuisine, cooking techniques, ingredients, or cultural context. Focus on being accurate and educational. If you don't know, say so rather than making up information.`;
      
      // Call the Gemini AI service
      const aiResponse = await geminiService.generateContent(fullPrompt);
      
      // Sometimes the AI might return formatted responses, clean it up
      const cleanedResponse = this.cleanupAIResponse(aiResponse);
      
      return {
        message: cleanedResponse,
        source: 'ai',
        success: true
      };
    } catch (error) {
      console.error('Error in ChatSupportAgent:', error);
      return {
        message: "I'm sorry, I encountered an error while processing your question. Please try again.",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Clean up AI response to remove any problematic formatting or JSON artifacts
   */
  private cleanupAIResponse(response: string): string {
    // Remove any JSON syntax or code blocks the AI might have included
    let cleaned = response.replace(/```json|```|{|}|\[|\]/g, '');
    
    // Remove multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Remove any "AI:" or "Assistant:" prefixes the AI might add
    cleaned = cleaned.replace(/^(AI:|Assistant:)/m, '');
    
    return cleaned.trim();
  }
}

// Create and export a singleton instance
export const chatSupportAgent = new ChatSupportAgent();
