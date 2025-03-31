
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
    const prompt = `Please provide a detailed Filipino recipe for "${recipeName}" in the exact JSON format specified in your instructions. Make sure to include complete and accurate ingredients with precise measurements, and detailed step-by-step cooking instructions.`;
    
    // Call Gemini AI to get recipe information
    const aiResponse = await geminiService.generateContent(prompt);
    console.log("AI Response:", aiResponse);
    
    // Extract the JSON from the response (in case the AI included additional text)
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Could not extract JSON from AI response");
      toast("The AI response format was invalid. Please try again.", {
        description: "Error processing recipe data",
        style: { backgroundColor: "red", color: "white" }
      });
      return null;
    }
    
    let jsonStr = jsonMatch[0];
    
    try {
      // Parse the JSON response
      const recipeData = JSON.parse(jsonStr);
      
      // Validate the structure of the response
      if (!recipeData.recipe || !recipeData.ingredients || !recipeData.steps) {
        throw new Error("Incomplete recipe data structure");
      }
      
      if (recipeData.ingredients.length === 0 || recipeData.steps.length === 0) {
        throw new Error("Missing ingredients or steps");
      }
      
      // Generate a reliable image URL from Unsplash for the recipe
      const cleanRecipeName = recipeName.replace(/\s+/g, ',');
      const imageUrl = `https://source.unsplash.com/featured/?filipino,food,${cleanRecipeName}`;
      
      // Format the response to match our expected structure
      const recipe = {
        id: recipeId,
        title: recipeData.recipe.title,
        imageUrl: imageUrl,
        prepTime: recipeData.recipe.prepTime,
        category: recipeData.recipe.category,
        difficulty: recipeData.recipe.difficulty,
        description: recipeData.recipe.description,
        servings: recipeData.recipe.servings,
        cookTime: recipeData.recipe.cookTime,
        instructions: recipeData.recipe.instructions
      };
      
      // Format ingredients
      const ingredients = recipeData.ingredients.map((ing: any) => ({
        id: `ing-${uuidv4()}`,
        name: ing.name,
        quantity: ing.quantity.toString(),
        unit: ing.unit,
        recipeId: recipeId,
        isOptional: ing.isOptional || false,
        hasSubstitutions: ing.hasSubstitutions || false
      }));
      
      // Format steps with reliable image URLs
      const steps = recipeData.steps.map((step: any, index: number) => {
        // Add step images for key steps (every other step)
        const stepImageUrl = index % 2 === 0 ? 
          `https://source.unsplash.com/featured/?cooking,${step.instruction.split(' ').slice(0, 2).join(',')}` : 
          undefined;
          
        return {
          id: `step-${uuidv4()}`,
          number: step.number,
          instruction: step.instruction,
          timeInMinutes: step.timeInMinutes,
          isCritical: step.isCritical || false,
          imageUrl: stepImageUrl
        };
      });
      
      return {
        recipe,
        ingredients,
        steps
      };
    } catch (error) {
      console.error('Error parsing recipe data:', error);
      toast("Failed to parse recipe data. Please try again.", {
        description: "The AI generated an invalid response format",
        style: { backgroundColor: "red", color: "white" }
      });
      return null;
    }
  } catch (error) {
    console.error('Error searching recipe online:', error);
    toast("Failed to search for recipe online. Please try again.", {
        description: "Error connecting to AI service",
        style: { backgroundColor: "red", color: "white" }
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
    console.log("Saving recipe to database:", recipe.id, recipe.title);
    
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
    
    console.log("Successfully saved recipe:", recipe.id);
    return true;
  } catch (error) {
    console.error('Error saving recipe to database:', error);
    return false;
  }
};
