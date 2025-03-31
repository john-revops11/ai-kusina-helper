
import { database, ref, set } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '@/components/RecipeCard';
import { RecipeStep } from '@/components/RecipeStepCard';
import { Ingredient } from '@/components/IngredientItem';
import { geminiService } from './geminiService';
import { openaiService } from './openaiService';
import { aiProviderService } from './aiProviderService';
import { toast } from 'sonner';

/**
 * Validates the structure of a recipe object
 * @param recipeData The recipe data to validate
 * @returns Whether the recipe data is valid
 */
const validateRecipeData = (recipeData: any): boolean => {
  if (!recipeData) return false;
  
  // Check for recipe object with required fields
  if (!recipeData.recipe || 
      !recipeData.recipe.title || 
      !recipeData.recipe.category || 
      !recipeData.recipe.difficulty) {
    return false;
  }
  
  // Check for ingredients array
  if (!Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
    return false;
  }
  
  // Check for steps array
  if (!Array.isArray(recipeData.steps) || recipeData.steps.length === 0) {
    return false;
  }
  
  return true;
};

// Use AI to search for recipes online
export const searchRecipeOnline = async (recipeName: string): Promise<{
  recipe: Recipe & {
    description: string;
    servings: number;
    cookTime: string;
    instructions: string;
  };
  ingredients: Ingredient[];
  steps: RecipeStep[];
} | null> => {
  try {
    // Generate a unique ID for the new recipe
    const recipeId = uuidv4();
    
    // Create the prompt for AI - ensure we're asking for JSON
    const prompt = `Please provide a detailed Filipino recipe for "${recipeName}" in the exact JSON format specified in your instructions. Make sure to include complete and accurate ingredients with precise measurements, and detailed step-by-step cooking instructions. Only return the JSON object.`;
    
    // Get the current AI provider
    const currentProvider = aiProviderService.getCurrentProvider();
    
    // Call the appropriate AI service based on the provider
    toast(`Searching for "${recipeName}" recipe...`, {
      description: `Connecting to ${currentProvider.toUpperCase()} service`
    });
    
    let aiResponse: string;
    
    try {
      if (currentProvider === 'gemini') {
        aiResponse = await geminiService.generateContent(prompt);
      } else {
        aiResponse = await openaiService.generateContent(prompt);
      }
    } catch (primaryError) {
      // Primary AI service failed, try the fallback
      console.error(`Error with ${currentProvider} AI service:`, primaryError);
      
      toast.warning(`${currentProvider.toUpperCase()} service failed, trying fallback AI...`, {
        duration: 3000
      });
      
      try {
        // Use the opposite service as fallback
        const fallbackProvider = currentProvider === 'gemini' ? 'openai' : 'gemini';
        
        if (fallbackProvider === 'gemini') {
          aiResponse = await geminiService.generateContent(prompt);
        } else {
          aiResponse = await openaiService.generateContent(prompt);
        }
        
        toast.success(`Using ${fallbackProvider.toUpperCase()} as fallback`, {
          duration: 3000
        });
      } catch (fallbackError) {
        console.error('Error with fallback AI service:', fallbackError);
        toast.error('All AI services failed', {
          description: 'Please try again later'
        });
        return null;
      }
    }
    
    console.log("AI Response:", aiResponse);
    
    // Check if the response starts with error message
    if (aiResponse.startsWith("I'm sorry") || 
        aiResponse.includes("Recipe Not Available") || 
        aiResponse.includes("Recipe Unavailable")) {
      toast.error(`Could not find recipe for "${recipeName}"`, {
        description: "Try a different recipe or try again later"
      });
      return null;
    }
    
    // Try to clean and parse the response
    try {
      // Parse the JSON response - this might throw if JSON is invalid
      const recipeData = JSON.parse(aiResponse);
      
      // Validate the structure of the response
      if (!validateRecipeData(recipeData)) {
        console.error("Invalid recipe data structure:", recipeData);
        toast.error("Received invalid recipe data", {
          description: "The recipe format was incorrect"
        });
        return null;
      }
      
      // Generate a reliable image URL from Unsplash for the recipe
      const cleanRecipeName = recipeName.replace(/\s+/g, ',');
      const imageUrl = `https://source.unsplash.com/featured/?filipino,food,${cleanRecipeName}`;
      
      // Format the response to match our expected structure
      const recipe = {
        id: recipeId,
        title: recipeData.recipe.title || recipeName,
        imageUrl: imageUrl,
        prepTime: recipeData.recipe.prepTime || "30 minutes",
        category: recipeData.recipe.category || "Main Dish",
        difficulty: recipeData.recipe.difficulty || "Medium",
        description: recipeData.recipe.description || "A delicious Filipino dish",
        servings: recipeData.recipe.servings || 4,
        cookTime: recipeData.recipe.cookTime || "45 minutes",
        instructions: recipeData.recipe.instructions || "Follow the steps below to prepare this dish."
      };
      
      // Format ingredients with fallback for required fields
      const ingredients = Array.isArray(recipeData.ingredients) ? recipeData.ingredients.map((ing: any, index: number) => ({
        id: `ing-${uuidv4()}`,
        name: ing.name || `Ingredient ${index + 1}`,
        quantity: (ing.quantity || "1").toString(),
        unit: ing.unit || "",
        recipeId: recipeId,
        isOptional: ing.isOptional || false,
        hasSubstitutions: ing.hasSubstitutions || false
      })) : [];
      
      // Format steps with reliable image URLs and fallbacks
      const steps = Array.isArray(recipeData.steps) ? recipeData.steps.map((step: any, index: number) => {
        // Add step images for key steps (every other step)
        const stepImageUrl = index % 2 === 0 ? 
          `https://source.unsplash.com/featured/?cooking,${step.instruction?.split(' ').slice(0, 2).join(',') || 'cooking'}` : 
          undefined;
          
        return {
          id: `step-${uuidv4()}`,
          number: step.number || index + 1, // Ensure we have a number even if missing
          instruction: step.instruction || `Step ${index + 1}`,
          timeInMinutes: typeof step.timeInMinutes === 'number' ? step.timeInMinutes : 5,
          isCritical: step.isCritical || false,
          imageUrl: stepImageUrl
        };
      }) : [];
      
      // Verify we have minimum requirements
      if (ingredients.length === 0 || steps.length === 0) {
        console.error("Missing ingredients or steps:", { ingredients, steps });
        toast.error("Recipe is missing ingredients or steps", {
          description: "Please try searching for a different recipe"
        });
        return null;
      }
      
      // Log the created recipe for debugging
      console.log("Successfully created recipe:", {
        recipe,
        ingredients,
        steps
      });
      
      toast.success(`Found recipe for ${recipe.title}!`);
      
      return {
        recipe,
        ingredients,
        steps
      };
    } catch (error) {
      console.error('Error parsing recipe data:', error);
      console.error('Problematic JSON string:', aiResponse);
      
      toast.error("Failed to parse recipe data", {
        description: "The AI generated an invalid response format"
      });
      
      return null;
    }
  } catch (error) {
    console.error('Error searching recipe online:', error);
    
    toast.error("Failed to search for recipe online", {
      description: "Error connecting to AI service"
    });
    
    return null;
  }
};

// Save a new recipe to the database
export const saveRecipeToDatabase = async (
  recipe: Recipe & {
    description: string;
    servings: number;
    cookTime: string;
    instructions: string;
  },
  ingredients: Ingredient[],
  steps: RecipeStep[]
): Promise<boolean> => {
  try {
    // Save recipe details
    await set(ref(database, `recipes/${recipe.id}`), {
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      prepTime: recipe.prepTime,
      category: recipe.category,
      difficulty: recipe.difficulty,
      description: recipe.description,
      servings: recipe.servings,
      cookTime: recipe.cookTime,
      instructions: recipe.instructions
    });
    
    // Save ingredients
    const ingredientsObj: { [key: string]: any } = {};
    ingredients.forEach(ing => {
      ingredientsObj[ing.id] = {
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: ing.isOptional || false,
        hasSubstitutions: ing.hasSubstitutions || false
      };
    });
    await set(ref(database, `ingredients/${recipe.id}`), ingredientsObj);
    
    // Save steps
    const stepsObj: { [key: string]: any } = {};
    steps.forEach(step => {
      stepsObj[step.id] = {
        number: step.number,
        instruction: step.instruction,
        timeInMinutes: step.timeInMinutes,
        isCritical: step.isCritical || false,
        imageUrl: step.imageUrl || null
      };
    });
    await set(ref(database, `steps/${recipe.id}`), stepsObj);
    
    return true;
  } catch (error) {
    console.error('Error saving recipe to database:', error);
    return false;
  }
};
