
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
  if (recipeData.recipe && 
      recipeData.recipe.title && 
      recipeData.ingredients && 
      recipeData.steps) {
    // Traditional format is valid
    return true;
  }
  
  // Check for new format (array of recipes with recipeName)
  if (Array.isArray(recipeData) && recipeData.length > 0) {
    const firstRecipe = recipeData[0];
    if (firstRecipe.recipeName && 
        firstRecipe.ingredients && 
        firstRecipe.steps) {
      return true;
    }
  }
  
  // Check if this is a single recipe in the new format (not in an array)
  if (recipeData.recipeName && 
      recipeData.ingredients && 
      recipeData.steps) {
    return true;
  }
  
  // No valid format found
  return false;
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
} | any> => {
  try {
    // Generate a unique ID for the new recipe
    const recipeId = uuidv4();
    
    // The request is either a simple recipe name or a full prompt
    const isFullPrompt = recipeName.toLowerCase().includes('json') || 
                        (recipeName.includes('[') && recipeName.includes(']'));
    
    // Create the prompt for AI - ensure we're asking for JSON
    const prompt = isFullPrompt 
      ? recipeName 
      : `Please provide a detailed Filipino recipe for "${recipeName}". Return the result as a JSON array of recipe objects with the following format:
[
  {
    "recipeName": "Full Recipe Name",
    "description": "Detailed description with cultural context",
    "culture": "Filipino",
    "category": "Appropriate category (Main Dish, Dessert, etc.)",
    "imageUrl": "URL placeholder", 
    "ingredients": [
      {
        "ingredientName": "Name of ingredient",
        "quantity": "Amount",
        "unit": "Unit of measurement"
      }
    ],
    "steps": [
      "Step 1 instruction",
      "Step 2 instruction"
    ]
  }
]`;
    
    // Get the current AI provider
    const currentProvider = aiProviderService.getCurrentProvider();
    
    // Call the appropriate AI service based on the provider
    toast(`Searching for recipes...`, {
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
      toast.error(`Could not find recipe for the provided request`, {
        description: "Try a different prompt or try again later"
      });
      return null;
    }
    
    // Try to clean and parse the response
    try {
      // Parse the JSON response - this might throw if JSON is invalid
      let recipeData;
      try {
        recipeData = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error("Error parsing initial JSON response:", parseError);
        
        // Try extracting JSON from the response
        if (aiResponse.includes('{') && aiResponse.includes('}')) {
          const jsonStart = aiResponse.indexOf('{');
          const jsonEnd = aiResponse.lastIndexOf('}') + 1;
          const jsonString = aiResponse.substring(jsonStart, jsonEnd);
          recipeData = JSON.parse(jsonString);
        } else if (aiResponse.includes('[') && aiResponse.includes(']')) {
          const jsonStart = aiResponse.indexOf('[');
          const jsonEnd = aiResponse.lastIndexOf(']') + 1;
          const jsonString = aiResponse.substring(jsonStart, jsonEnd);
          recipeData = JSON.parse(jsonString);
        } else {
          throw new Error("Could not extract valid JSON from response");
        }
      }
      
      // Check if the recipeData is an array of recipe objects that match the import format
      // This handles the case where the AI returns recipes in the import format directly
      if (Array.isArray(recipeData) && 
          recipeData.length > 0 && 
          recipeData[0].recipeName &&
          recipeData[0].ingredients &&
          Array.isArray(recipeData[0].ingredients)) {
        console.log("Received recipes in import format:", recipeData);
        return recipeData;
      }
      
      // Validate the structure of the response
      if (!validateRecipeData(recipeData)) {
        console.error("Invalid recipe data structure:", recipeData);
        toast.error("Received invalid recipe data", {
          description: "The recipe format was incorrect"
        });
        return null;
      }
      
      let recipe, ingredients, steps;
      
      // Process data based on format received
      if (recipeData.recipe && recipeData.ingredients && recipeData.steps) {
        // Standard format from the transformation
        recipe = {
          id: recipeId,
          title: recipeData.recipe.title || recipeName,
          imageUrl: recipeData.recipe.imageUrl || `https://source.unsplash.com/featured/?filipino,food,${recipeName.replace(/\s+/g, ',')}`,
          prepTime: recipeData.recipe.prepTime || "30 minutes",
          category: recipeData.recipe.category || "Main Dish",
          difficulty: recipeData.recipe.difficulty || "Medium",
          description: recipeData.recipe.description || "A delicious Filipino dish",
          servings: recipeData.recipe.servings || 4,
          cookTime: recipeData.recipe.cookTime || "45 minutes",
          instructions: recipeData.recipe.instructions || "Follow the steps below to prepare this dish."
        };
        
        ingredients = Array.isArray(recipeData.ingredients) ? recipeData.ingredients.map((ing: any, index: number) => ({
          id: `ing-${uuidv4()}`,
          name: ing.name || `Ingredient ${index + 1}`,
          quantity: (ing.quantity || "1").toString(),
          unit: ing.unit || "",
          recipeId: recipeId,
          isOptional: ing.isOptional || false,
          hasSubstitutions: ing.hasSubstitutions || false
        })) : [];
        
        steps = Array.isArray(recipeData.steps) ? recipeData.steps.map((step: any, index: number) => {
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
      } else if (Array.isArray(recipeData) && recipeData.length > 0) {
        // New array format with recipeName
        const firstRecipe = recipeData[0];
        
        recipe = {
          id: recipeId,
          title: firstRecipe.recipeName || recipeName,
          imageUrl: firstRecipe.imageUrl || `https://source.unsplash.com/featured/?filipino,food,${recipeName.replace(/\s+/g, ',')}`,
          prepTime: "30 minutes", // Default since not in new format
          category: firstRecipe.category || "Main Dish",
          difficulty: "Medium", // Default since not in new format
          description: firstRecipe.description || "A delicious Filipino dish",
          servings: 4, // Default since not in new format
          cookTime: "45 minutes", // Default since not in new format
          instructions: Array.isArray(firstRecipe.steps) ? firstRecipe.steps.join(". ") : "Follow the steps below to prepare this dish."
        };
        
        ingredients = Array.isArray(firstRecipe.ingredients) ? firstRecipe.ingredients.map((ing: any, index: number) => ({
          id: `ing-${uuidv4()}`,
          name: ing.ingredientName || `Ingredient ${index + 1}`,
          quantity: (ing.quantity || "1").toString(),
          unit: ing.unit || "",
          recipeId: recipeId,
          isOptional: false, // Default since not in new format
          hasSubstitutions: false // Default since not in new format
        })) : [];
        
        steps = Array.isArray(firstRecipe.steps) ? firstRecipe.steps.map((step: string, index: number) => {
          // Add step images for key steps (every other step)
          const stepImageUrl = index % 2 === 0 ? 
            `https://source.unsplash.com/featured/?cooking,${step?.split(' ').slice(0, 2).join(',') || 'cooking'}` : 
            undefined;
            
          return {
            id: `step-${uuidv4()}`,
            number: index + 1,
            instruction: step || `Step ${index + 1}`,
            timeInMinutes: 5, // Default since not in new format
            isCritical: index === 0, // First step is usually important
            imageUrl: stepImageUrl
          };
        }) : [];
      } else if (recipeData.recipeName) {
        // Single recipe in new format (not in array)
        recipe = {
          id: recipeId,
          title: recipeData.recipeName || recipeName,
          imageUrl: recipeData.imageUrl || `https://source.unsplash.com/featured/?filipino,food,${recipeName.replace(/\s+/g, ',')}`,
          prepTime: "30 minutes", // Default since not in new format
          category: recipeData.category || "Main Dish",
          difficulty: "Medium", // Default since not in new format
          description: recipeData.description || "A delicious Filipino dish",
          servings: 4, // Default since not in new format
          cookTime: "45 minutes", // Default since not in new format
          instructions: Array.isArray(recipeData.steps) ? recipeData.steps.join(". ") : "Follow the steps below to prepare this dish."
        };
        
        ingredients = Array.isArray(recipeData.ingredients) ? recipeData.ingredients.map((ing: any, index: number) => ({
          id: `ing-${uuidv4()}`,
          name: ing.ingredientName || `Ingredient ${index + 1}`,
          quantity: (ing.quantity || "1").toString(),
          unit: ing.unit || "",
          recipeId: recipeId,
          isOptional: false, // Default since not in new format
          hasSubstitutions: false // Default since not in new format
        })) : [];
        
        steps = Array.isArray(recipeData.steps) ? recipeData.steps.map((step: string, index: number) => {
          // Add step images for key steps (every other step)
          const stepImageUrl = index % 2 === 0 ? 
            `https://source.unsplash.com/featured/?cooking,${step?.split(' ').slice(0, 2).join(',') || 'cooking'}` : 
            undefined;
            
          return {
            id: `step-${uuidv4()}`,
            number: index + 1,
            instruction: step || `Step ${index + 1}`,
            timeInMinutes: 5, // Default since not in new format
            isCritical: index === 0, // First step is usually important
            imageUrl: stepImageUrl
          };
        }) : [];
      } else {
        throw new Error("Unrecognized recipe data format");
      }
      
      // Verify we have minimum requirements
      if (ingredients && ingredients.length === 0 || steps && steps.length === 0) {
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
