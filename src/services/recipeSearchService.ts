
import { database, ref, set } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '@/components/RecipeCard';
import { RecipeStep } from '@/components/RecipeStepCard';
import { Ingredient } from '@/components/IngredientItem';

// This would normally use an actual API key stored securely
// For demonstration purposes, we're simulating API responses
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
    // In a real app, this would be an actual API call to a recipe service
    // For this demo, we'll simulate a delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a unique ID for the new recipe
    const recipeId = uuidv4();
    
    // Create a mock recipe based on the search term
    const searchTermLower = recipeName.toLowerCase();
    
    // Adjust difficulty based on recipe name
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (searchTermLower.includes('simple') || searchTermLower.includes('easy')) {
      difficulty = 'Easy';
    } else if (searchTermLower.includes('complex') || searchTermLower.includes('advanced')) {
      difficulty = 'Hard';
    }
    
    // Determine category based on search term
    let category = 'Main Dish';
    if (searchTermLower.includes('soup') || searchTermLower.includes('stew')) {
      category = 'Soup';
    } else if (searchTermLower.includes('dessert') || searchTermLower.includes('cake') || searchTermLower.includes('sweet')) {
      category = 'Dessert';
    } else if (searchTermLower.includes('appetizer') || searchTermLower.includes('starter')) {
      category = 'Appetizer';
    } else if (searchTermLower.includes('salad')) {
      category = 'Salad';
    }
    
    // Create mock recipe
    const mockRecipe = {
      recipe: {
        id: recipeId,
        title: recipeName,
        imageUrl: `https://source.unsplash.com/800x600/?${recipeName.replace(/\s/g, ',')}`,
        prepTime: '30 mins',
        category: category,
        difficulty: difficulty,
        description: `This is a delicious recipe for ${recipeName}.`,
        servings: 4,
        cookTime: '45 mins',
        instructions: `Instructions for making ${recipeName}:\n1. Prepare ingredients\n2. Cook according to instructions\n3. Serve and enjoy!`
      },
      ingredients: [
        {
          id: `ing-${uuidv4()}`,
          name: 'Main Ingredient',
          quantity: '500g',
          unit: 'g', // Add the required unit property
          recipeId: recipeId,
          isOptional: false,
          hasSubstitutions: false
        },
        {
          id: `ing-${uuidv4()}`,
          name: 'Secondary Ingredient',
          quantity: '250',
          unit: 'g', // Add the required unit property
          recipeId: recipeId,
          isOptional: true,
          hasSubstitutions: true
        },
        {
          id: `ing-${uuidv4()}`,
          name: 'Seasoning',
          quantity: '2',
          unit: 'tbsp', // Add the required unit property
          recipeId: recipeId,
          isOptional: false,
          hasSubstitutions: true
        }
      ],
      steps: [
        {
          id: `step-${uuidv4()}`,
          number: 1,
          instruction: `First step to prepare ${recipeName}`,
          timeInMinutes: 10,
          isCritical: true
        },
        {
          id: `step-${uuidv4()}`,
          number: 2,
          instruction: `Second step to prepare ${recipeName}`,
          timeInMinutes: 15,
          isCritical: false
        },
        {
          id: `step-${uuidv4()}`,
          number: 3,
          instruction: `Final step to prepare ${recipeName}`,
          timeInMinutes: 5,
          isCritical: false
        }
      ]
    };
    
    return mockRecipe;
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
        unit: ing.unit, // Make sure to include the unit property
        isOptional: ing.isOptional ?? false,
        hasSubstitutions: ing.hasSubstitutions
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
        isCritical: step.isCritical,
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
