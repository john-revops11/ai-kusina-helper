import { database, ref, get, child, update, remove } from './firebase';
import type { Recipe } from '@/components/RecipeCard';
import type { RecipeStep } from '@/components/RecipeStepCard';
import type { Ingredient } from '@/components/IngredientItem';

// Types
export type RecipeDetail = Recipe & {
  description: string;
  servings: number;
  cookTime: string;
  instructions: string;
};

// Firebase data fetching functions
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'categories'));
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log("No categories data available");
      return [];
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const fetchRecipes = async (): Promise<Recipe[]> => {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'recipes'));
    
    if (snapshot.exists()) {
      const recipesData = snapshot.val();
      return Object.keys(recipesData).map(key => ({
        id: key,
        ...recipesData[key]
      }));
    } else {
      console.log("No recipes data available");
      return [];
    }
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
};

export const fetchRecipeById = async (id: string): Promise<RecipeDetail | null> => {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `recipes/${id}`));
    
    if (snapshot.exists()) {
      return {
        id,
        ...snapshot.val()
      };
    } else {
      console.log("No recipe found with ID:", id);
      return null;
    }
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
};

export const fetchIngredientsByRecipeId = async (recipeId: string): Promise<Ingredient[]> => {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `ingredients/${recipeId}`));
    
    if (snapshot.exists()) {
      const ingredientsData = snapshot.val();
      return Object.keys(ingredientsData).map(key => {
        const ingredient = ingredientsData[key];
        return {
          id: key,
          ...ingredient,
          unit: ingredient.unit || "", // Ensure unit property exists
        };
      });
    } else {
      console.log("No ingredients found for recipe:", recipeId);
      return [];
    }
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return [];
  }
};

export const fetchRecipeSteps = async (recipeId: string): Promise<RecipeStep[]> => {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `steps/${recipeId}`));
    
    if (snapshot.exists()) {
      const stepsData = snapshot.val();
      // Map data and sort by step number immediately
      const steps = Object.keys(stepsData).map(key => ({
        id: key,
        ...stepsData[key]
      }));
      return steps.sort((a, b) => a.number - b.number);
    } else {
      console.log("No steps found for recipe:", recipeId);
      return [];
    }
  } catch (error) {
    console.error("Error fetching recipe steps:", error);
    return [];
  }
};

export const fetchIngredientSubstitutes = async (ingredientId: string): Promise<string[]> => {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `substitutes/${ingredientId}`));
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log("No substitutes found for ingredient:", ingredientId);
      return [];
    }
  } catch (error) {
    console.error("Error fetching ingredient substitutes:", error);
    return [];
  }
};

export const updateRecipeImage = async (recipeId: string, imageUrl: string): Promise<void> => {
  try {
    const updates: {[key: string]: string} = {};
    updates[`recipes/${recipeId}/imageUrl`] = imageUrl;
    
    await update(ref(database), updates);
    console.log(`Updated image for recipe ${recipeId}`);
  } catch (error) {
    console.error("Error updating recipe image:", error);
    throw error;
  }
};

/**
 * Finds and deletes duplicate recipes from the database
 * @returns An array of deleted recipe IDs
 */
export const deleteDuplicateRecipes = async (): Promise<string[]> => {
  try {
    // Fetch all recipes
    const recipes = await fetchRecipes();
    
    // Create a map to track recipes by title (normalized to lowercase)
    const recipeMap: Record<string, Recipe[]> = {};
    
    // Group recipes by their normalized title
    recipes.forEach(recipe => {
      const normalizedTitle = recipe.title.toLowerCase().trim();
      if (!recipeMap[normalizedTitle]) {
        recipeMap[normalizedTitle] = [];
      }
      recipeMap[normalizedTitle].push(recipe);
    });
    
    // Find duplicate recipes (any title with more than one recipe)
    const duplicateSets = Object.values(recipeMap).filter(group => group.length > 1);
    
    if (duplicateSets.length === 0) {
      console.log("No duplicate recipes found");
      return [];
    }
    
    // For each set of duplicates, keep the most recently created one (assuming it has the most data)
    // and delete the others
    const deletedRecipeIds: string[] = [];
    
    for (const duplicateGroup of duplicateSets) {
      // Sort by ID (assuming higher IDs are more recent)
      // This is a simple heuristic - if your IDs have a different structure,
      // you might want to use a different approach
      duplicateGroup.sort((a, b) => b.id.localeCompare(a.id));
      
      // Keep the first one (most recent by our sorting) and delete the rest
      const [keeper, ...toDelete] = duplicateGroup;
      
      console.log(`Found duplicates for "${keeper.title}". Keeping ${keeper.id}, deleting ${toDelete.length} others.`);
      
      // Delete each duplicate
      for (const recipe of toDelete) {
        await deleteRecipe(recipe.id);
        deletedRecipeIds.push(recipe.id);
      }
    }
    
    return deletedRecipeIds;
  } catch (error) {
    console.error("Error deleting duplicate recipes:", error);
    return [];
  }
};

/**
 * Deletes a recipe and all its related data (ingredients, steps, etc.)
 * @param recipeId ID of the recipe to delete
 */
export const deleteRecipe = async (recipeId: string): Promise<void> => {
  try {
    // Delete the recipe
    await remove(ref(database, `recipes/${recipeId}`));
    
    // Delete related ingredients
    await remove(ref(database, `ingredients/${recipeId}`));
    
    // Delete related steps
    await remove(ref(database, `steps/${recipeId}`));
    
    console.log(`Deleted recipe ${recipeId} and all related data`);
  } catch (error) {
    console.error(`Error deleting recipe ${recipeId}:`, error);
    throw error;
  }
};
