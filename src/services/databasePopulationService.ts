
import { database, ref, get, child, set } from './firebase';
import { geminiService } from './geminiService';
import { toast } from "sonner";

// Types
export type RecipePopulationData = {
  id: string;
  title: string;
  description: string;
  category: string;
  prepTime: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  imageUrl: string;
  instructions: string;
};

export type IngredientPopulationData = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  hasSubstitutions: boolean;
};

export type RecipeStepPopulationData = {
  id: string;
  number: number;
  instruction: string;
  timeInMinutes: number;
  isCritical?: boolean;
};

/**
 * A service for populating the Firebase database with recipe data
 */
export const databasePopulationService = {
  
  /**
   * The list of Philippine recipes to populate
   */
  philippineRecipes: [
    'Adobo',
    'Sinigang',
    'Kare-Kare',
    'Lechon',
    'Pancit Canton',
    'Lumpia',
    'Bibingka',
    'Halo-Halo',
    'Pinakbet',
    'Tinola'
  ],
  
  /**
   * The list of recipe categories
   */
  recipeCategories: [
    'Main Dish',
    'Soup',
    'Appetizer',
    'Dessert',
    'Snack',
    'Breakfast',
    'Vegetable Dish',
    'Seafood',
    'Meat Dish',
    'Noodles'
  ],
  
  /**
   * Generates a random ID
   */
  generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  },
  
  /**
   * Populates the categories table
   */
  async populateCategories(): Promise<void> {
    try {
      await set(ref(database, 'categories'), this.recipeCategories);
      toast.success('Categories populated successfully');
    } catch (error) {
      console.error('Error populating categories:', error);
      toast.error('Failed to populate categories');
      throw error;
    }
  },
  
  /**
   * Gets recipe data from Gemini AI
   */
  async getRecipeDataFromGemini(recipeName: string): Promise<RecipePopulationData> {
    const prompt = `
      Generate detailed information about the Filipino dish "${recipeName}".
      
      Please return a JSON object with the following structure:
      {
        "title": "${recipeName}",
        "description": "A detailed description of the dish, including cultural context",
        "category": "One of: ${this.recipeCategories.join(', ')}",
        "prepTime": "Preparation time (e.g., '15 mins')",
        "cookTime": "Cooking time (e.g., '30 mins')",
        "difficulty": "One of: Easy, Medium, Hard",
        "servings": "Number of servings as a number",
        "imageUrl": "A placeholder URL (use https://source.unsplash.com/random/?philippine,${recipeName.toLowerCase()})",
        "instructions": "Detailed cooking instructions"
      }
      
      Format it as valid JSON without explanation.
    `;
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Extract JSON object from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      const recipeData = JSON.parse(jsonMatch[0]) as RecipePopulationData;
      recipeData.id = this.generateId();
      
      return recipeData;
    } catch (error) {
      console.error(`Error getting recipe data for ${recipeName}:`, error);
      toast.error(`Failed to get recipe data for ${recipeName}`);
      throw error;
    }
  },
  
  /**
   * Gets ingredient data from Gemini AI
   */
  async getIngredientsDataFromGemini(recipeName: string): Promise<IngredientPopulationData[]> {
    const prompt = `
      Generate a list of ingredients for the Filipino dish "${recipeName}".
      
      Please return a JSON array with the following structure:
      [
        {
          "name": "Ingredient name",
          "quantity": "Amount needed",
          "unit": "Unit of measurement",
          "hasSubstitutions": true or false
        },
        ...more ingredients
      ]
      
      Include 5-10 ingredients. Format it as valid JSON without explanation.
    `;
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      const ingredientsData = JSON.parse(jsonMatch[0]) as Omit<IngredientPopulationData, 'id'>[];
      
      // Add IDs to each ingredient
      return ingredientsData.map(ingredient => ({
        ...ingredient,
        id: this.generateId()
      }));
    } catch (error) {
      console.error(`Error getting ingredients data for ${recipeName}:`, error);
      toast.error(`Failed to get ingredients data for ${recipeName}`);
      throw error;
    }
  },
  
  /**
   * Gets recipe steps data from Gemini AI
   */
  async getRecipeStepsFromGemini(recipeName: string): Promise<RecipeStepPopulationData[]> {
    const prompt = `
      Generate a list of cooking steps for the Filipino dish "${recipeName}".
      
      Please return a JSON array with the following structure:
      [
        {
          "number": 1,
          "instruction": "Detailed instruction for this step",
          "timeInMinutes": Minutes needed for this step (as a number),
          "isCritical": true or false (based on importance)
        },
        ...more steps
      ]
      
      Include 5-8 steps. Format it as valid JSON without explanation.
    `;
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      const stepsData = JSON.parse(jsonMatch[0]) as Omit<RecipeStepPopulationData, 'id'>[];
      
      // Add IDs to each step
      return stepsData.map(step => ({
        ...step,
        id: this.generateId()
      }));
    } catch (error) {
      console.error(`Error getting recipe steps for ${recipeName}:`, error);
      toast.error(`Failed to get recipe steps for ${recipeName}`);
      throw error;
    }
  },
  
  /**
   * Gets substitution data from Gemini AI
   */
  async getSubstitutionsFromGemini(ingredientName: string): Promise<string[]> {
    const prompt = `
      Suggest 2-3 substitutes for the ingredient "${ingredientName}" that could be used in Filipino cooking.
      
      Please return a JSON array of strings with the substitutes.
      
      Format it as valid JSON without explanation.
    `;
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      return JSON.parse(jsonMatch[0]) as string[];
    } catch (error) {
      console.error(`Error getting substitutions for ${ingredientName}:`, error);
      toast.error(`Failed to get substitutions for ${ingredientName}`);
      return [];
    }
  },
  
  /**
   * Populates a single recipe in the database
   */
  async populateSingleRecipe(recipeName: string): Promise<void> {
    try {
      // 1. Get recipe data
      const recipeData = await this.getRecipeDataFromGemini(recipeName);
      
      // 2. Get ingredients data
      const ingredientsData = await this.getIngredientsDataFromGemini(recipeName);
      
      // 3. Get recipe steps
      const stepsData = await this.getRecipeStepsFromGemini(recipeName);
      
      // 4. Store recipe in database
      await set(ref(database, `recipes/${recipeData.id}`), recipeData);
      
      // 5. Store ingredients in database
      await set(ref(database, `ingredients/${recipeData.id}`), 
        Object.fromEntries(ingredientsData.map(i => [i.id, i]))
      );
      
      // 6. Store steps in database
      await set(ref(database, `steps/${recipeData.id}`),
        Object.fromEntries(stepsData.map(s => [s.id, s]))
      );
      
      // 7. Get and store substitutions for ingredients that have them
      for (const ingredient of ingredientsData.filter(i => i.hasSubstitutions)) {
        const substitutes = await this.getSubstitutionsFromGemini(ingredient.name);
        if (substitutes.length > 0) {
          await set(ref(database, `substitutes/${ingredient.id}`), substitutes);
        }
      }
      
      toast.success(`Recipe "${recipeName}" populated successfully`);
    } catch (error) {
      console.error(`Error populating recipe ${recipeName}:`, error);
      toast.error(`Failed to populate recipe "${recipeName}"`);
    }
  },
  
  /**
   * Populates all recipes in the database
   */
  async populateAllRecipes(): Promise<void> {
    toast('Starting database population, this might take some time...', {
      duration: 5000
    });
    
    try {
      // 1. Populate categories
      await this.populateCategories();
      
      // 2. Populate recipes one by one
      for (const recipe of this.philippineRecipes) {
        toast(`Populating recipe: ${recipe}...`);
        await this.populateSingleRecipe(recipe);
      }
      
      toast.success('Database population completed successfully!', {
        duration: 5000
      });
    } catch (error) {
      console.error('Error during database population:', error);
      toast.error('Database population failed. See console for details.');
    }
  }
};
