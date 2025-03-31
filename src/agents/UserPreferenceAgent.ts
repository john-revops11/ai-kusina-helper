
import { AgentInterface, AgentContext, AgentResponse, UserPreferences } from './AgentInterface';
import { database, ref, get, set, child } from '@/services/firebase';
import { toast } from 'sonner';

/**
 * Agent responsible for managing user preferences
 */
export class UserPreferenceAgent implements AgentInterface {
  private readonly name = 'UserPreference';
  
  getName(): string {
    return this.name;
  }
  
  async handleRequest(request: string, context?: AgentContext): Promise<AgentResponse> {
    try {
      // Currently this is a simple agent since we don't have full user authentication
      // but it's structured for future expansion
      
      // If we don't have a userId, we'll use a default/anonymous one
      const userId = context?.userId || 'anonymous-user';
      
      // Check if this is a preference setting request
      if (this.isSetPreferenceRequest(request)) {
        const { preferenceType, value } = this.extractPreference(request);
        
        if (preferenceType && value) {
          // Save the preference
          await this.saveUserPreference(userId, preferenceType, value);
          
          return {
            message: `I've updated your ${preferenceType} preference to ${value}.`,
            success: true
          };
        }
      }
      
      // Check if this is a preference retrieval request
      if (this.isGetPreferenceRequest(request)) {
        const preferenceType = this.extractPreferenceType(request);
        
        if (preferenceType) {
          const preferences = await this.getUserPreferences(userId);
          
          // Handle specific preference types
          if (preferenceType === 'dietary restrictions' && preferences.dietaryRestrictions) {
            return {
              message: `Your dietary restrictions are: ${preferences.dietaryRestrictions.join(', ')}`,
              data: preferences.dietaryRestrictions,
              success: true
            };
          }
          
          if (preferenceType === 'skill level' && preferences.skillLevel) {
            return {
              message: `Your cooking skill level is set to: ${preferences.skillLevel}`,
              data: preferences.skillLevel,
              success: true
            };
          }
          
          if (preferenceType === 'favorite cuisines' && preferences.favoriteCuisines) {
            return {
              message: `Your favorite cuisines are: ${preferences.favoriteCuisines.join(', ')}`,
              data: preferences.favoriteCuisines,
              success: true
            };
          }
          
          return {
            message: `I don't have any information about your ${preferenceType} preferences yet.`,
            success: false
          };
        }
      }
      
      // If it's neither a set nor get request, return all preferences
      const preferences = await this.getUserPreferences(userId);
      
      if (Object.keys(preferences).length === 0) {
        return {
          message: "I don't have any preference information for you yet. You can set preferences like dietary restrictions, skill level, or favorite cuisines.",
          suggestedActions: [
            {
              type: 'other',
              label: 'Set Dietary Restrictions',
              value: 'I am vegetarian'
            },
            {
              type: 'other',
              label: 'Set Skill Level',
              value: 'My cooking skill level is intermediate'
            }
          ],
          success: true
        };
      }
      
      // Format the preferences into a readable message
      let message = "Here are your current preferences:\n";
      
      if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
        message += `\nDietary Restrictions: ${preferences.dietaryRestrictions.join(', ')}`;
      }
      
      if (preferences.skillLevel) {
        message += `\nCooking Skill Level: ${preferences.skillLevel}`;
      }
      
      if (preferences.favoriteCuisines && preferences.favoriteCuisines.length > 0) {
        message += `\nFavorite Cuisines: ${preferences.favoriteCuisines.join(', ')}`;
      }
      
      return {
        message,
        data: preferences,
        success: true
      };
    } catch (error) {
      console.error('Error in UserPreferenceAgent:', error);
      return {
        message: "I'm sorry, I encountered an error while managing your preferences. Please try again.",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Helper methods for request interpretation
  
  private isSetPreferenceRequest(request: string): boolean {
    const lowerRequest = request.toLowerCase();
    return lowerRequest.includes('i am') || 
           lowerRequest.includes('i\'m') || 
           lowerRequest.includes('my') ||
           lowerRequest.includes('set my') ||
           lowerRequest.includes('change my') ||
           lowerRequest.includes('update my');
  }
  
  private isGetPreferenceRequest(request: string): boolean {
    const lowerRequest = request.toLowerCase();
    return lowerRequest.includes('what are my') || 
           lowerRequest.includes('show me my') || 
           lowerRequest.includes('tell me my') ||
           lowerRequest.includes('my preferences');
  }
  
  // Extraction methods
  
  private extractPreference(request: string): { preferenceType: string | null, value: string | null } {
    const lowerRequest = request.toLowerCase();
    
    // Check for dietary restrictions
    if (lowerRequest.includes('vegetarian') || 
        lowerRequest.includes('vegan') || 
        lowerRequest.includes('gluten') ||
        lowerRequest.includes('allergic') ||
        lowerRequest.includes('allergy')) {
      let value = null;
      
      if (lowerRequest.includes('vegetarian')) value = 'vegetarian';
      else if (lowerRequest.includes('vegan')) value = 'vegan';
      else if (lowerRequest.includes('gluten')) value = 'gluten-free';
      
      // Extract specific allergies
      const allergyMatch = request.match(/allergic to ([\w\s,]+)/i);
      if (allergyMatch && allergyMatch[1]) {
        value = allergyMatch[1].trim();
      }
      
      return {
        preferenceType: 'dietary restrictions',
        value
      };
    }
    
    // Check for skill level
    if (lowerRequest.includes('beginner') || 
        lowerRequest.includes('intermediate') || 
        lowerRequest.includes('advanced') ||
        lowerRequest.includes('expert') ||
        lowerRequest.includes('novice') ||
        lowerRequest.includes('skill level')) {
      let value = null;
      
      if (lowerRequest.includes('beginner') || lowerRequest.includes('novice')) value = 'beginner';
      else if (lowerRequest.includes('intermediate')) value = 'intermediate';
      else if (lowerRequest.includes('advanced') || lowerRequest.includes('expert')) value = 'advanced';
      
      return {
        preferenceType: 'skill level',
        value
      };
    }
    
    // Check for favorite cuisines
    if (lowerRequest.includes('cuisine') || 
        lowerRequest.includes('food') || 
        lowerRequest.includes('like')) {
      // Try to extract specific cuisines
      const cuisineMatch = request.match(/like ([\w\s,]+) food/i) || 
                          request.match(/favorite ([\w\s,]+) food/i) ||
                          request.match(/love ([\w\s,]+) food/i) ||
                          request.match(/prefer ([\w\s,]+) food/i);
      
      if (cuisineMatch && cuisineMatch[1]) {
        return {
          preferenceType: 'favorite cuisines',
          value: cuisineMatch[1].trim()
        };
      }
    }
    
    return {
      preferenceType: null,
      value: null
    };
  }
  
  private extractPreferenceType(request: string): string | null {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('diet') || 
        lowerRequest.includes('allerg') || 
        lowerRequest.includes('restriction')) {
      return 'dietary restrictions';
    }
    
    if (lowerRequest.includes('skill') || 
        lowerRequest.includes('level') || 
        lowerRequest.includes('experience')) {
      return 'skill level';
    }
    
    if (lowerRequest.includes('cuisine') || 
        lowerRequest.includes('favorite food') || 
        lowerRequest.includes('like to eat')) {
      return 'favorite cuisines';
    }
    
    return null;
  }
  
  // Firebase interaction methods
  
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `userPreferences/${userId}`));
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      return {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }
  
  private async saveUserPreference(userId: string, preferenceType: string, value: string): Promise<void> {
    try {
      // Get existing preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Update the specific preference type
      if (preferenceType === 'dietary restrictions') {
        // Split comma-separated values
        const restrictions = value.split(',').map(v => v.trim());
        preferences.dietaryRestrictions = restrictions;
      } else if (preferenceType === 'skill level') {
        preferences.skillLevel = value as 'beginner' | 'intermediate' | 'advanced';
      } else if (preferenceType === 'favorite cuisines') {
        // Split comma-separated values
        const cuisines = value.split(',').map(v => v.trim());
        preferences.favoriteCuisines = cuisines;
      }
      
      // Save updated preferences
      await set(ref(database, `userPreferences/${userId}`), preferences);
      
      toast(`Updated your ${preferenceType}`);
    } catch (error) {
      console.error('Error saving user preference:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const userPreferenceAgent = new UserPreferenceAgent();
