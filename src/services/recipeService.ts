
import { database, ref, get, child } from './firebase';
import { Recipe } from '@/components/RecipeCard';
import { RecipeStep } from '@/components/RecipeStepCard';
import { Ingredient } from '@/components/IngredientItem';

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
      return Object.keys(ingredientsData).map(key => ({
        id: key,
        ...ingredientsData[key]
      }));
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
      return Object.keys(stepsData).map(key => ({
        id: key,
        ...stepsData[key]
      }));
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
