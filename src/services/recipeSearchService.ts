
import { database, ref, set } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '@/components/RecipeCard';
import { RecipeStep } from '@/components/RecipeStepCard';
import { Ingredient } from '@/components/IngredientItem';
import { geminiService } from './geminiService';
import { toast } from 'sonner';

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
    
    // Create the prompt for Gemini AI
    const prompt = `Please provide a detailed Filipino recipe for "${recipeName}" in the exact JSON format specified in your instructions. Make sure to include complete and accurate ingredients with precise measurements, and detailed step-by-step cooking instructions. Only return the JSON object.`;
    
    // Call Gemini AI to get recipe information
    toast(`Searching for "${recipeName}" recipe...`, {
      description: "Connecting to AI service"
    });
    
    const aiResponse = await geminiService.generateContent(prompt);
    console.log("AI Response:", aiResponse);
    
    // Check if the response starts with error message
    if (aiResponse.startsWith("I'm sorry") || aiResponse.includes("Recipe Not Available") || aiResponse.includes("Recipe Unavailable")) {
      toast.error(`Could not find recipe for "${recipeName}"`, {
        description: "Try a different recipe or try again later"
      });
      return null;
    }
    
    let jsonStr = aiResponse;
    
    // Try to clean the response string if needed
    try {
      // Parse the JSON response - this might throw if JSON is invalid
      const recipeData = JSON.parse(jsonStr);
      
      // Validate the structure of the response
      if (!recipeData.recipe || !recipeData.ingredients || !recipeData.steps) {
        throw new Error("Incomplete recipe data structure");
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
      console.error('Problematic JSON string:', jsonStr);
      
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
