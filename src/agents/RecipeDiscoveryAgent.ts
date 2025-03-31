
import { AgentInterface, AgentContext, AgentResponse } from './AgentInterface';
import { searchRecipeOnline, saveRecipeToDatabase } from '@/services/recipeSearchService';
import { fetchRecipes, fetchRecipeById } from '@/services/recipeService';
import { toast } from 'sonner';

/**
 * Agent responsible for discovering recipes in both local database and via AI
 */
export class RecipeDiscoveryAgent implements AgentInterface {
  private readonly name = 'RecipeDiscovery';
  
  getName(): string {
    return this.name;
  }
  
  async handleRequest(request: string, context?: AgentContext): Promise<AgentResponse> {
    try {
      // Extract recipe query from the request
      const recipeQuery = this.extractRecipeQuery(request);
      
      if (!recipeQuery) {
        return {
          message: "I couldn't determine which recipe you're looking for. Could you please specify the recipe you'd like me to find?",
          success: false
        };
      }
      
      // First, check if the recipe exists in the local database
      console.log(`Searching for recipe: ${recipeQuery}`);
      const localRecipes = await fetchRecipes();
      
      // Filter recipes that match the query (case insensitive partial match)
      const matchingRecipes = localRecipes.filter(recipe => 
        recipe.title.toLowerCase().includes(recipeQuery.toLowerCase())
      );
      
      // If we found matches in the local database
      if (matchingRecipes.length > 0) {
        const bestMatch = matchingRecipes[0]; // Take the first match for now
        
        // Get full recipe details
        const recipeDetails = await fetchRecipeById(bestMatch.id);
        
        if (recipeDetails) {
          return {
            message: `I found the recipe for ${recipeDetails.title} in our collection.`,
            data: recipeDetails,
            suggestedActions: [
              {
                type: 'viewRecipe',
                label: 'View Recipe',
                value: recipeDetails.id
              },
              {
                type: 'startCooking',
                label: 'Start Cooking',
                value: recipeDetails.id
              }
            ],
            source: 'database',
            success: true
          };
        }
      }
      
      // If we didn't find a match locally, search online via AI
      console.log(`No local match found for ${recipeQuery}, searching online...`);
      toast(`Searching for "${recipeQuery}" recipe online...`);
      
      const onlineResult = await searchRecipeOnline(recipeQuery);
      
      if (onlineResult) {
        // Save the recipe to the database for future use
        const saveResult = await saveRecipeToDatabase(
          onlineResult.recipe, 
          onlineResult.ingredients, 
          onlineResult.steps
        );
        
        if (saveResult) {
          toast(`Found and saved recipe for ${onlineResult.recipe.title}!`);
        }
        
        return {
          message: `I found a recipe for ${onlineResult.recipe.title} online. Here it is!`,
          data: onlineResult,
          suggestedActions: [
            {
              type: 'viewRecipe',
              label: 'View Recipe',
              value: onlineResult.recipe.id
            },
            {
              type: 'startCooking',
              label: 'Start Cooking',
              value: onlineResult.recipe.id
            }
          ],
          source: 'ai',
          success: true
        };
      }
      
      // If we didn't find anything
      return {
        message: `I couldn't find a recipe for "${recipeQuery}". Would you like to try a different search?`,
        success: false
      };
    } catch (error) {
      console.error('Error in RecipeDiscoveryAgent:', error);
      return {
        message: "I'm sorry, I encountered an error while searching for recipes. Please try again.",
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Extract the recipe query from a user request
   * @param request The user's request text
   * @returns The extracted recipe query, or null if no recipe query was found
   */
  private extractRecipeQuery(request: string): string | null {
    // Patterns to extract recipe queries
    const patterns = [
      /recipe for ([\w\s]+)/i,
      /how to make ([\w\s]+)/i,
      /find me a ([\w\s]+) recipe/i,
      /search for ([\w\s]+)/i,
      /looking for ([\w\s]+)/i,
      /i want to cook ([\w\s]+)/i,
      /i want to make ([\w\s]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = request.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // If no pattern matched, just use the whole request
    // This makes the agent more flexible for simple queries like "Adobo"
    return request.trim();
  }
}

// Create and export a singleton instance
export const recipeDiscoveryAgent = new RecipeDiscoveryAgent();
