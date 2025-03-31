
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
    
    // Generate more realistic ingredients based on recipe type
    const ingredients = generateIngredientsForRecipe(recipeName, recipeId);
    
    // Generate more realistic steps based on recipe type
    const steps = generateStepsForRecipe(recipeName);
    
    // Create mock recipe
    const mockRecipe = {
      recipe: {
        id: recipeId,
        title: recipeName,
        imageUrl: `https://source.unsplash.com/800x600/?${recipeName.replace(/\s/g, ',')}`,
        prepTime: '30 mins',
        category: category,
        difficulty: difficulty,
        description: `This delicious ${recipeName} is perfect for any occasion. It combines the best flavors and textures for a memorable dining experience.`,
        servings: 4,
        cookTime: '45 mins',
        instructions: `Complete instructions for making ${recipeName}. Follow all steps carefully for best results.`
      },
      ingredients: ingredients,
      steps: steps
    };
    
    return mockRecipe;
  } catch (error) {
    console.error('Error searching recipe online:', error);
    return null;
  }
};

// Generate realistic ingredients based on recipe name
const generateIngredientsForRecipe = (recipeName: string, recipeId: string): Ingredient[] => {
  const searchTermLower = recipeName.toLowerCase();
  const ingredients: Ingredient[] = [];
  
  // Base ingredients that most recipes have
  ingredients.push({
    id: `ing-${uuidv4()}`,
    name: 'Salt',
    quantity: '1',
    unit: 'tsp',
    recipeId: recipeId,
    isOptional: false,
    hasSubstitutions: false
  });
  
  ingredients.push({
    id: `ing-${uuidv4()}`,
    name: 'Black Pepper',
    quantity: '1/2',
    unit: 'tsp',
    recipeId: recipeId,
    isOptional: false,
    hasSubstitutions: false
  });
  
  // Add recipe-specific ingredients
  if (searchTermLower.includes('chicken')) {
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Chicken Breast',
      quantity: '500',
      unit: 'g',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Olive Oil',
      quantity: '2',
      unit: 'tbsp',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Garlic',
      quantity: '3',
      unit: 'cloves',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
  } else if (searchTermLower.includes('pasta') || searchTermLower.includes('spaghetti')) {
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Pasta',
      quantity: '400',
      unit: 'g',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Tomato Sauce',
      quantity: '350',
      unit: 'ml',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Parmesan Cheese',
      quantity: '50',
      unit: 'g',
      recipeId: recipeId,
      isOptional: true,
      hasSubstitutions: true
    });
  } else if (searchTermLower.includes('beef') || searchTermLower.includes('steak')) {
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Beef Steak',
      quantity: '500',
      unit: 'g',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Butter',
      quantity: '30',
      unit: 'g',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Rosemary',
      quantity: '2',
      unit: 'sprigs',
      recipeId: recipeId,
      isOptional: true,
      hasSubstitutions: false
    });
  } else if (searchTermLower.includes('salad')) {
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Lettuce',
      quantity: '1',
      unit: 'head',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Tomatoes',
      quantity: '2',
      unit: 'medium',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Cucumber',
      quantity: '1',
      unit: 'medium',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Olive Oil',
      quantity: '3',
      unit: 'tbsp',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
  } else if (searchTermLower.includes('soup')) {
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Vegetable Broth',
      quantity: '1',
      unit: 'liter',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Onion',
      quantity: '1',
      unit: 'large',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Carrots',
      quantity: '2',
      unit: 'medium',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Celery',
      quantity: '2',
      unit: 'stalks',
      recipeId: recipeId,
      isOptional: true,
      hasSubstitutions: false
    });
  } else if (searchTermLower.includes('cake') || searchTermLower.includes('dessert')) {
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'All-Purpose Flour',
      quantity: '250',
      unit: 'g',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Sugar',
      quantity: '200',
      unit: 'g',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Butter',
      quantity: '150',
      unit: 'g',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Eggs',
      quantity: '3',
      unit: 'large',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Vanilla Extract',
      quantity: '1',
      unit: 'tsp',
      recipeId: recipeId,
      isOptional: true,
      hasSubstitutions: false
    });
  } else {
    // Default ingredients for any other recipe
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Main Ingredient',
      quantity: '400',
      unit: 'g',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: false
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Secondary Ingredient',
      quantity: '200',
      unit: 'g',
      recipeId: recipeId,
      isOptional: true,
      hasSubstitutions: true
    });
    
    ingredients.push({
      id: `ing-${uuidv4()}`,
      name: 'Flavoring',
      quantity: '1',
      unit: 'tbsp',
      recipeId: recipeId,
      isOptional: false,
      hasSubstitutions: true
    });
  }
  
  return ingredients;
};

// Generate realistic steps based on recipe name
const generateStepsForRecipe = (recipeName: string): RecipeStep[] => {
  const searchTermLower = recipeName.toLowerCase();
  const steps: RecipeStep[] = [];
  
  if (searchTermLower.includes('chicken')) {
    steps.push({
      id: `step-${uuidv4()}`,
      number: 1,
      instruction: 'Preheat the oven to 180°C (350°F).',
      timeInMinutes: 5,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 2,
      instruction: 'Season the chicken breasts with salt and pepper on both sides.',
      timeInMinutes: 5,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 3,
      instruction: 'Heat olive oil in an oven-safe skillet over medium-high heat.',
      timeInMinutes: 3,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 4,
      instruction: 'Add minced garlic to the skillet and cook until fragrant, about 30 seconds.',
      timeInMinutes: 1,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 5,
      instruction: 'Add the chicken breasts to the skillet and cook until golden brown, about 5 minutes per side.',
      timeInMinutes: 10,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 6,
      instruction: 'Transfer the skillet to the preheated oven and bake until the chicken is cooked through (internal temperature of 165°F/74°C), about 15-20 minutes.',
      timeInMinutes: 20,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 7,
      instruction: 'Remove from the oven and let the chicken rest for 5 minutes before serving.',
      timeInMinutes: 5,
      isCritical: false
    });
  } else if (searchTermLower.includes('pasta') || searchTermLower.includes('spaghetti')) {
    steps.push({
      id: `step-${uuidv4()}`,
      number: 1,
      instruction: 'Bring a large pot of salted water to a boil.',
      timeInMinutes: 8,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 2,
      instruction: 'Add pasta to the boiling water and cook according to package instructions until al dente.',
      timeInMinutes: 10,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 3,
      instruction: 'While pasta is cooking, heat tomato sauce in a separate pan over medium heat.',
      timeInMinutes: 5,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 4,
      instruction: 'Drain the pasta, reserving about 1/4 cup of the pasta water.',
      timeInMinutes: 1,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 5,
      instruction: 'Add the drained pasta to the sauce, along with a splash of the reserved pasta water if needed. Toss to combine.',
      timeInMinutes: 2,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 6,
      instruction: 'Serve hot, topped with grated Parmesan cheese if desired.',
      timeInMinutes: 1,
      isCritical: false
    });
  } else if (searchTermLower.includes('beef') || searchTermLower.includes('steak')) {
    steps.push({
      id: `step-${uuidv4()}`,
      number: 1,
      instruction: 'Remove the steak from the refrigerator and let it come to room temperature, about 30 minutes.',
      timeInMinutes: 30,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 2,
      instruction: 'Pat the steak dry with paper towels and season generously with salt and pepper on both sides.',
      timeInMinutes: 2,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 3,
      instruction: 'Heat a cast-iron skillet over high heat until very hot.',
      timeInMinutes: 5,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 4,
      instruction: 'Add the steak to the hot skillet and cook for 3-4 minutes on each side for medium-rare, or to your desired doneness.',
      timeInMinutes: 8,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 5,
      instruction: 'During the last minute of cooking, add butter and rosemary to the skillet. Tilt the pan and spoon the melted butter over the steak.',
      timeInMinutes: 1,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 6,
      instruction: 'Transfer the steak to a cutting board and let it rest for at least 5 minutes before slicing against the grain.',
      timeInMinutes: 5,
      isCritical: true
    });
  } else if (searchTermLower.includes('salad')) {
    steps.push({
      id: `step-${uuidv4()}`,
      number: 1,
      instruction: 'Wash and dry all vegetables thoroughly.',
      timeInMinutes: 5,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 2,
      instruction: 'Tear or chop the lettuce into bite-sized pieces and place in a large salad bowl.',
      timeInMinutes: 3,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 3,
      instruction: 'Dice the tomatoes and cucumber and add to the bowl.',
      timeInMinutes: 4,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 4,
      instruction: 'In a small bowl, whisk together olive oil, vinegar, salt, and pepper to make the dressing.',
      timeInMinutes: 2,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 5,
      instruction: 'Drizzle the dressing over the salad and toss gently to coat.',
      timeInMinutes: 1,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 6,
      instruction: 'Serve immediately for best freshness.',
      timeInMinutes: 1,
      isCritical: false
    });
  } else if (searchTermLower.includes('soup')) {
    steps.push({
      id: `step-${uuidv4()}`,
      number: 1,
      instruction: 'Heat oil in a large pot over medium heat.',
      timeInMinutes: 2,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 2,
      instruction: 'Add diced onion, carrots, and celery to the pot and cook until softened, about 5 minutes.',
      timeInMinutes: 5,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 3,
      instruction: 'Add vegetable broth to the pot and bring to a simmer.',
      timeInMinutes: 5,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 4,
      instruction: 'Reduce heat to low, cover, and simmer for 20 minutes to allow flavors to meld.',
      timeInMinutes: 20,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 5,
      instruction: 'Season with salt and pepper to taste.',
      timeInMinutes: 1,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 6,
      instruction: 'Serve hot, garnished with fresh herbs if desired.',
      timeInMinutes: 1,
      isCritical: false
    });
  } else if (searchTermLower.includes('cake') || searchTermLower.includes('dessert')) {
    steps.push({
      id: `step-${uuidv4()}`,
      number: 1,
      instruction: 'Preheat oven to 180°C (350°F). Grease and line a cake pan with parchment paper.',
      timeInMinutes: 5,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 2,
      instruction: 'In a large bowl, cream together butter and sugar until light and fluffy.',
      timeInMinutes: 5,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 3,
      instruction: 'Add eggs one at a time, beating well after each addition. Stir in vanilla extract.',
      timeInMinutes: 3,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 4,
      instruction: 'In a separate bowl, sift together flour, baking powder, and salt.',
      timeInMinutes: 2,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 5,
      instruction: 'Gradually fold the dry ingredients into the wet ingredients, mixing just until combined.',
      timeInMinutes: 3,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 6,
      instruction: 'Pour the batter into the prepared cake pan and smooth the top.',
      timeInMinutes: 2,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 7,
      instruction: 'Bake in the preheated oven for 30-35 minutes, or until a toothpick inserted into the center comes out clean.',
      timeInMinutes: 35,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 8,
      instruction: 'Allow to cool in the pan for 10 minutes, then transfer to a wire rack to cool completely.',
      timeInMinutes: 30,
      isCritical: false
    });
  } else {
    // Default steps for any other recipe
    steps.push({
      id: `step-${uuidv4()}`,
      number: 1,
      instruction: `Prepare all ingredients for ${recipeName}.`,
      timeInMinutes: 10,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 2,
      instruction: `Combine the main and secondary ingredients in a suitable container.`,
      timeInMinutes: 5,
      isCritical: false
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 3,
      instruction: `Process the ingredients according to the standard method for ${recipeName}.`,
      timeInMinutes: 15,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 4,
      instruction: `Cook or bake as appropriate for this type of dish.`,
      timeInMinutes: 20,
      isCritical: true
    });
    
    steps.push({
      id: `step-${uuidv4()}`,
      number: 5,
      instruction: `Finish preparation and serve ${recipeName}.`,
      timeInMinutes: 5,
      isCritical: false
    });
  }
  
  return steps;
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
