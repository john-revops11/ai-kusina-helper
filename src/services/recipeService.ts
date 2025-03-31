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

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  try {
    // Delete the recipe from the recipes node
    await remove(ref(database, `recipes/${recipeId}`));
    
    // Delete associated ingredients
    await remove(ref(database, `ingredients/${recipeId}`));
    
    // Delete associated steps
    await remove(ref(database, `steps/${recipeId}`));
    
    console.log(`Recipe ${recipeId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

// New function to remove duplicate recipes - updated to keep most recent
export const removeDuplicateRecipes = async (): Promise<{removed: number, recipeNames: string[]}> => {
  try {
    const recipes = await fetchRecipes();
    
    // Create a map to track recipes by title (case insensitive)
    const recipeMap: Map<string, Recipe[]> = new Map();
    const duplicatesToRemove: Recipe[] = [];
    const removedRecipeNames: string[] = [];
    
    // Group recipes by normalized title
    recipes.forEach(recipe => {
      const normalizedTitle = recipe.title.toLowerCase().trim();
      
      if (!recipeMap.has(normalizedTitle)) {
        recipeMap.set(normalizedTitle, [recipe]);
      } else {
        const existingRecipes = recipeMap.get(normalizedTitle) || [];
        recipeMap.set(normalizedTitle, [...existingRecipes, recipe]);
      }
    });
    
    // For each group of recipes with the same title, keep only the most recent one
    // (assuming more recent recipes have higher ID values or were added later in the array)
    recipeMap.forEach((recipeGroup, normalizedTitle) => {
      if (recipeGroup.length > 1) {
        // Sort recipes by ID in descending order to get the most recent first
        // This assumes newer recipes have higher/later IDs
        const sortedRecipes = [...recipeGroup].sort((a, b) => b.id.localeCompare(a.id));
        
        // Keep the first one (most recent) and mark the rest for removal
        const [keep, ...remove] = sortedRecipes;
        
        remove.forEach(recipe => {
          duplicatesToRemove.push(recipe);
          removedRecipeNames.push(recipe.title);
        });
      }
    });
    
    // Delete the duplicates
    const deletePromises = duplicatesToRemove.map(recipe => deleteRecipe(recipe.id));
    await Promise.all(deletePromises);
    
    console.log(`Removed ${duplicatesToRemove.length} duplicate recipes, keeping most recent versions`);
    return {
      removed: duplicatesToRemove.length,
      recipeNames: removedRecipeNames
    };
  } catch (error) {
    console.error("Error removing duplicate recipes:", error);
    throw error;
  }
};
