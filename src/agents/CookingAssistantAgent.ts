
import { AgentInterface, AgentContext, AgentResponse } from './AgentInterface';
import { fetchRecipeById, fetchRecipeSteps, fetchIngredientsByRecipeId, fetchIngredientSubstitutes } from '@/services/recipeService';

/**
 * Agent responsible for guiding users through the cooking process
 */
export class CookingAssistantAgent implements AgentInterface {
  private readonly name = 'CookingAssistant';
  
  getName(): string {
    return this.name;
  }
  
  async handleRequest(request: string, context?: AgentContext): Promise<AgentResponse> {
    try {
      // We need recipe context to provide cooking guidance
      if (!context?.currentRecipeId) {
        return {
          message: "I need to know which recipe you're cooking to help you. Could you select a recipe first?",
          success: false
        };
      }
      
      // Get recipe details, ingredients, and steps
      const recipe = await fetchRecipeById(context.currentRecipeId);
      if (!recipe) {
        return {
          message: "I couldn't find the recipe you're referring to. Could you select a recipe first?",
          success: false
        };
      }
      
      const ingredients = await fetchIngredientsByRecipeId(context.currentRecipeId);
      const steps = await fetchRecipeSteps(context.currentRecipeId);
      
      // Sort steps by number to ensure correct order
      steps.sort((a, b) => a.number - b.number);
      
      // Determine what kind of cooking assistance is needed
      if (this.isNextStepRequest(request)) {
        // Get the current step or move to the next one
        const currentStepNumber = context.currentStepNumber || 0;
        const nextStep = steps.find(step => step.number === currentStepNumber + 1);
        
        if (nextStep) {
          return {
            message: `Step ${nextStep.number}: ${nextStep.instruction}${nextStep.isCritical ? ' (This is a critical step!)' : ''}`,
            data: {
              currentStep: nextStep,
              totalSteps: steps.length
            },
            success: true
          };
        } else {
          return {
            message: "That's it! You've completed all the steps for this recipe. Enjoy your meal!",
            success: true
          };
        }
      }
      
      if (this.isTimerRequest(request)) {
        // Find the current step and check if it has a time component
        const currentStepNumber = context.currentStepNumber || 1;
        const currentStep = steps.find(step => step.number === currentStepNumber);
        
        if (currentStep && currentStep.timeInMinutes > 0) {
          return {
            message: `Starting a ${currentStep.timeInMinutes} minute timer for step ${currentStep.number}.`,
            data: {
              timerMinutes: currentStep.timeInMinutes,
              step: currentStep
            },
            success: true
          };
        } else {
          return {
            message: "The current step doesn't have a specific time associated with it.",
            success: false
          };
        }
      }
      
      if (this.isIngredientSubstituteRequest(request)) {
        // Extract the ingredient name from the request
        const ingredientName = this.extractIngredientName(request);
        
        if (!ingredientName) {
          return {
            message: "Which ingredient are you looking to substitute?",
            success: false
          };
        }
        
        // Find the ingredient in the recipe
        const ingredient = ingredients.find(ing => 
          ing.name.toLowerCase().includes(ingredientName.toLowerCase())
        );
        
        if (ingredient && ingredient.hasSubstitutions) {
          const substitutes = await fetchIngredientSubstitutes(ingredient.id);
          
          if (substitutes && substitutes.length > 0) {
            return {
              message: `For ${ingredient.name}, you can substitute: ${substitutes.join(', ')}`,
              data: {
                ingredient,
                substitutes
              },
              success: true
            };
          }
        }
        
        // If no specific substitutes are found, provide generic advice
        return {
          message: `I don't have specific substitutes for ${ingredientName} in this recipe. In Filipino cooking, you might try using similar ingredients that match the flavor profile.`,
          success: true
        };
      }
      
      // For general how-to questions related to the recipe
      if (this.isHowToRequest(request)) {
        // Extract the technique/ingredient from the request
        const technique = this.extractTechnique(request);
        
        // Provide general guidance based on the technique
        return {
          message: this.getGenericCookingAdvice(technique),
          success: true
        };
      }
      
      // For specific step questions
      const stepNumber = this.extractStepNumber(request);
      if (stepNumber !== null) {
        const step = steps.find(s => s.number === stepNumber);
        
        if (step) {
          return {
            message: `Step ${step.number}: ${step.instruction}${step.isCritical ? ' (This is a critical step!)' : ''}`,
            data: {
              step,
              totalSteps: steps.length
            },
            success: true
          };
        }
      }
      
      // Default to providing an overview of the recipe
      return {
        message: `You're cooking ${recipe.title}, a ${recipe.difficulty} ${recipe.category} recipe. ` + 
                 `It takes about ${recipe.prepTime} to prepare and ${recipe.cookTime} to cook. ` +
                 `There are ${ingredients.length} ingredients and ${steps.length} steps. ` +
                 `Would you like me to guide you through the steps or answer a specific question?`,
        data: {
          recipe,
          ingredientCount: ingredients.length,
          stepCount: steps.length
        },
        success: true
      };
    } catch (error) {
      console.error('Error in CookingAssistantAgent:', error);
      return {
        message: "I'm sorry, I encountered an error while helping you with cooking. Please try again.",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Helper methods to categorize requests
  
  private isNextStepRequest(request: string): boolean {
    const lowerRequest = request.toLowerCase();
    return lowerRequest.includes('next step') || 
           lowerRequest.includes('what next') || 
           lowerRequest.includes('proceed') ||
           lowerRequest.includes('continue') ||
           lowerRequest.includes('what do i do next');
  }
  
  private isTimerRequest(request: string): boolean {
    const lowerRequest = request.toLowerCase();
    return lowerRequest.includes('timer') || 
           lowerRequest.includes('set timer') || 
           lowerRequest.includes('how long') ||
           lowerRequest.includes('start timer');
  }
  
  private isIngredientSubstituteRequest(request: string): boolean {
    const lowerRequest = request.toLowerCase();
    return lowerRequest.includes('substitute') || 
           lowerRequest.includes('replacement') || 
           lowerRequest.includes('instead of') ||
           lowerRequest.includes('don\'t have');
  }
  
  private isHowToRequest(request: string): boolean {
    const lowerRequest = request.toLowerCase();
    return lowerRequest.includes('how do i') || 
           lowerRequest.includes('how to') || 
           lowerRequest.includes('what is') ||
           lowerRequest.includes('technique');
  }
  
  // Extraction helpers
  
  private extractIngredientName(request: string): string | null {
    // Try to extract an ingredient name from patterns like "substitute for X" or "don't have X"
    const patterns = [
      /substitute for ([\w\s]+)/i,
      /replacement for ([\w\s]+)/i,
      /instead of ([\w\s]+)/i,
      /don't have ([\w\s]+)/i,
      /don't have any ([\w\s]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = request.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  private extractTechnique(request: string): string {
    // Try to extract a cooking technique
    const patterns = [
      /how do i ([\w\s]+)/i,
      /how to ([\w\s]+)/i,
      /what is ([\w\s]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = request.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return request.trim();
  }
  
  private extractStepNumber(request: string): number | null {
    // Extract a step number if the user is asking about a specific step
    const match = request.match(/step (\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }
  
  // Generic cooking advice for common techniques in Filipino cooking
  private getGenericCookingAdvice(technique: string): string {
    const lowerTechnique = technique.toLowerCase();
    
    if (lowerTechnique.includes('saute') || lowerTechnique.includes('sauté')) {
      return "To sauté in Filipino cooking (known as 'gisa'), heat oil in a pan over medium heat. Add aromatics like garlic, onions, and sometimes ginger, and cook until fragrant and softened but not browned. This forms the flavor base of many Filipino dishes.";
    }
    
    if (lowerTechnique.includes('adobo') || lowerTechnique.includes('marinate')) {
      return "Marinating is key in Filipino cooking, especially for adobo. Combine your protein with vinegar, soy sauce, garlic, bay leaves, and peppercorns. For best results, marinate for at least 30 minutes, though overnight in the refrigerator is ideal for maximum flavor absorption.";
    }
    
    if (lowerTechnique.includes('simmer')) {
      return "Simmering is essential for developing deep flavors in Filipino stews. Maintain a gentle bubbling - not a rolling boil. Cover the pot partially to allow some evaporation and flavor concentration while preventing the liquid from reducing too quickly.";
    }
    
    // Generic response for unrecognized techniques
    return `For ${technique}, take your time and pay attention to visual cues in the food. Filipino cooking often relies on sensory judgment rather than strict timing. Look for changes in color, smell, and texture as indicators of doneness.`;
  }
}

// Create and export a singleton instance
export const cookingAssistantAgent = new CookingAssistantAgent();
