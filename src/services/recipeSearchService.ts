
import { database, ref, set } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '@/components/RecipeCard';
import { RecipeStep } from '@/components/RecipeStepCard';
import { Ingredient } from '@/components/IngredientItem';
import { geminiService } from './geminiService';

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
    const prompt = `I need a Filipino recipe for "${recipeName}". Please provide the following information in JSON format:
    {
      "recipe": {
        "title": "Recipe Title",
        "description": "Brief description of the dish",
        "category": "Category (Main Course, Dessert, etc.)",
        "difficulty": "Easy, Medium, or Hard",
        "prepTime": "Preparation time in minutes",
        "cookTime": "Cooking time in minutes",
        "servings": number of servings,
        "instructions": "Brief summary of instructions"
      },
      "ingredients": [
        {
          "name": "Ingredient name",
          "quantity": "Amount",
          "unit": "Unit of measurement",
          "isOptional": boolean,
          "hasSubstitutions": boolean
        }
      ],
      "steps": [
        {
          "number": step number,
          "instruction": "Detailed instruction",
          "timeInMinutes": time in minutes,
          "isCritical": boolean
        }
      ]
    }
    
    Make sure to provide accurate information for a Filipino recipe, with realistic ingredients and steps. Include at least 5 ingredients and 5 steps.`;
    
    // Call Gemini AI to get recipe information
    const aiResponse = await geminiService.generateContent(prompt);
    console.log("AI Response:", aiResponse);
    
    // Extract the JSON from the response (in case the AI included additional text)
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Could not extract JSON from AI response");
      return null;
    }
    
    let jsonStr = jsonMatch[0];
    
    // Parse the JSON response
    const recipeData = JSON.parse(jsonStr);
    
    // Format the response to match our expected structure
    const recipe = {
      id: recipeId,
      title: recipeData.recipe.title,
      imageUrl: `https://source.unsplash.com/800x600/?filipino,${recipeName.replace(/\s/g, ',')}`,
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
    
    // Format steps
    const steps = recipeData.steps.map((step: any) => ({
      id: `step-${uuidv4()}`,
      number: step.number,
      instruction: step.instruction,
      timeInMinutes: step.timeInMinutes,
      isCritical: step.isCritical || false
    }));
    
    return {
      recipe,
      ingredients,
      steps
    };
  } catch (error) {
    console.error('Error searching recipe online:', error);
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
