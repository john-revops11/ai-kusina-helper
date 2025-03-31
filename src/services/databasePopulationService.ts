
import { database, ref, get, child, set, remove } from './firebase';
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

// Progress tracking callback type
export type ProgressCallback = (current: number, total: number, currentRecipe?: string) => void;

/**
 * A service for populating the Firebase database with recipe data
 */
export const databasePopulationService = {
  
  /**
   * The list of Philippine recipes to populate
   */
  philippineRecipes: [
    // Breakfast
    'Tapsilog',
    'Longsilog',
    'Tocilog',
    'Pandesal with Kesong Puti',
    'Champorado',
    
    // Lunch/Dinner
    'Adobo',
    'Sinigang',
    'Kare-Kare',
    'Lechon Kawali',
    'Pinakbet',
    'Bulalo',
    'Crispy Pata',
    'Laing',
    'Pancit Palabok',
    'Chicken Inasal',
    'Ginataang Gulay',
    'Dinuguan',
    
    // Desserts
    'Halo-Halo',
    'Leche Flan',
    'Biko',
    'Turon',
    'Ginataang Bilo-Bilo',
    'Suman',
    'Ube Halaya',
    'Puto Bumbong',
    'Bibingka',
    
    // Snacks/Merienda
    'Ukoy',
    'Banana Cue',
    'Maruya',
    'Lumpia Shanghai'
  ],
  
  /**
   * The list of recipe categories
   */
  recipeCategories: [
    'Breakfast',
    'Lunch/Dinner',
    'Dessert',
    'Snack/Merienda',
    'Main Dish',
    'Soup',
    'Appetizer',
    'Vegetable Dish',
    'Seafood',
    'Meat Dish',
    'Rice Dish',
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
   * Checks if a recipe already exists in the database and returns the recipe ID if found
   */
  async findExistingRecipeId(recipeName: string): Promise<string | null> {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, 'recipes'));
      
      if (snapshot.exists()) {
        const recipes = snapshot.val();
        for (const id in recipes) {
          if (recipes[id].title.toLowerCase() === recipeName.toLowerCase()) {
            return id;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error checking if recipe exists: ${recipeName}`, error);
      return null;
    }
  },
  
  /**
   * Checks if a recipe already exists in the database
   */
  async recipeExists(recipeName: string): Promise<boolean> {
    const recipeId = await this.findExistingRecipeId(recipeName);
    return recipeId !== null;
  },

  /**
   * Deletes an existing recipe and all its related data from the database
   */
  async deleteExistingRecipe(recipeId: string): Promise<void> {
    try {
      // Delete the recipe and all its related data
      await remove(ref(database, `recipes/${recipeId}`));
      await remove(ref(database, `ingredients/${recipeId}`));
      await remove(ref(database, `steps/${recipeId}`));
      
      // Get ingredients with substitutions to delete their substitutes
      const ingredientsRef = ref(database);
      const ingredientsSnapshot = await get(child(ingredientsRef, `ingredients/${recipeId}`));
      
      if (ingredientsSnapshot.exists()) {
        const ingredients = ingredientsSnapshot.val();
        for (const id in ingredients) {
          if (ingredients[id].hasSubstitutions) {
            await remove(ref(database, `substitutes/${id}`));
          }
        }
      }
      
      console.log(`Successfully deleted recipe with ID: ${recipeId}`);
    } catch (error) {
      console.error(`Error deleting recipe with ID: ${recipeId}`, error);
      throw error;
    }
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
   * Gets recipe data from Gemini AI with enhanced accuracy
   */
  async getRecipeDataFromGemini(recipeName: string): Promise<RecipePopulationData> {
    const prompt = `
      Generate highly accurate detailed information about the authentic Filipino dish "${recipeName}".
      
      Please return a JSON object with the following structure:
      {
        "title": "${recipeName}",
        "description": "A detailed and culturally accurate description of the dish, including regional variations and cultural context",
        "category": "One of: ${this.recipeCategories.join(', ')} - select the most accurate category",
        "prepTime": "Realistic preparation time (e.g., '15 mins')",
        "cookTime": "Realistic cooking time (e.g., '30 mins')",
        "difficulty": "One of: Easy, Medium, Hard - based on complexity of preparation",
        "servings": "Typical number of servings as a number",
        "imageUrl": "A working image URL for this dish (use https://source.unsplash.com/random/?philippine,${recipeName.toLowerCase().replace(/ /g, ',')})",
        "instructions": "Detailed authentic cooking instructions with traditional techniques"
      }
      
      Format it as valid JSON without explanation. Make sure the imageUrl is a valid, working URL.
      Focus on accuracy and authenticity of Filipino cooking techniques and flavors.
    `;
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Extract JSON object from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback to creating default recipe data if Gemini fails
        console.warn(`No valid JSON found in Gemini response for ${recipeName}, using fallback data`);
        return this.createFallbackRecipeData(recipeName);
      }
      
      try {
        const recipeData = JSON.parse(jsonMatch[0]) as RecipePopulationData;
        recipeData.id = this.generateId();
        
        // Ensure the image URL is valid by replacing spaces and using a default pattern
        if (!recipeData.imageUrl || recipeData.imageUrl.includes('INSERT_IMAGE_URL')) {
          recipeData.imageUrl = `https://source.unsplash.com/random/?philippine,${recipeName.toLowerCase().replace(/ /g, ',')}`;
        }
        
        return recipeData;
      } catch (parseError) {
        console.error(`Error parsing JSON for ${recipeName}:`, parseError);
        return this.createFallbackRecipeData(recipeName);
      }
    } catch (error) {
      console.error(`Error getting recipe data for ${recipeName}:`, error);
      toast.error(`Failed to get recipe data for ${recipeName}`);
      return this.createFallbackRecipeData(recipeName);
    }
  },
  
  /**
   * Creates fallback recipe data when Gemini API fails
   */
  createFallbackRecipeData(recipeName: string): RecipePopulationData {
    let category = 'Main Dish';
    
    // Determine category based on recipe name
    if (['Tapsilog', 'Longsilog', 'Tocilog', 'Champorado', 'Pandesal'].some(item => 
      recipeName.toLowerCase().includes(item.toLowerCase())
    )) {
      category = 'Breakfast';
    } else if (['Halo-Halo', 'Leche Flan', 'Biko', 'Turon', 'Suman', 'Ube', 'Puto', 'Bibingka'].some(item => 
      recipeName.toLowerCase().includes(item.toLowerCase())
    )) {
      category = 'Dessert';
    } else if (['Ukoy', 'Banana Cue', 'Maruya', 'Lumpia'].some(item => 
      recipeName.toLowerCase().includes(item.toLowerCase())
    )) {
      category = 'Snack/Merienda';
    }
    
    return {
      id: this.generateId(),
      title: recipeName,
      description: `Traditional Filipino dish known as ${recipeName}. This is a fallback description as AI generation failed.`,
      category,
      prepTime: '30 mins',
      cookTime: '1 hour',
      difficulty: 'Medium',
      servings: 4,
      imageUrl: `https://source.unsplash.com/random/?philippine,${recipeName.toLowerCase().replace(/ /g, ',')}`,
      instructions: 'Detailed instructions could not be generated. Please search for a recipe online.',
    };
  },
  
  /**
   * Gets ingredient data from Gemini AI with enhanced accuracy
   */
  async getIngredientsDataFromGemini(recipeName: string): Promise<IngredientPopulationData[]> {
    const prompt = `
      Generate a detailed and accurate list of ingredients for the authentic Filipino dish "${recipeName}".
      
      Please return a JSON array with the following structure:
      [
        {
          "name": "Ingredient name (use authentic Filipino ingredients)",
          "quantity": "Precise amount needed",
          "unit": "Appropriate unit of measurement",
          "hasSubstitutions": true or false (set true for ingredients that might be hard to find outside Philippines)
        },
        ...more ingredients
      ]
      
      Include 8-15 ingredients, depending on the complexity of the dish. Be precise with measurements.
      Format it as valid JSON without explanation. Focus on authentic Filipino ingredients.
    `;
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn(`No valid JSON found in Gemini response for ${recipeName} ingredients, using fallback data`);
        return this.createFallbackIngredientsData(recipeName);
      }
      
      try {
        const ingredientsData = JSON.parse(jsonMatch[0]) as Omit<IngredientPopulationData, 'id'>[];
        
        // Add IDs to each ingredient
        return ingredientsData.map(ingredient => ({
          ...ingredient,
          id: this.generateId()
        }));
      } catch (parseError) {
        console.error(`Error parsing ingredient JSON for ${recipeName}:`, parseError);
        return this.createFallbackIngredientsData(recipeName);
      }
    } catch (error) {
      console.error(`Error getting ingredients data for ${recipeName}:`, error);
      toast.error(`Failed to get ingredients data for ${recipeName}`);
      return this.createFallbackIngredientsData(recipeName);
    }
  },
  
  /**
   * Creates fallback ingredients data when Gemini API fails
   */
  createFallbackIngredientsData(recipeName: string): IngredientPopulationData[] {
    // Generic ingredients that could apply to most Filipino dishes
    return [
      {
        id: this.generateId(),
        name: 'Garlic',
        quantity: '3',
        unit: 'cloves',
        hasSubstitutions: true
      },
      {
        id: this.generateId(),
        name: 'Onion',
        quantity: '1',
        unit: 'medium',
        hasSubstitutions: true
      },
      {
        id: this.generateId(),
        name: 'Rice',
        quantity: '2',
        unit: 'cups',
        hasSubstitutions: false
      },
      {
        id: this.generateId(),
        name: 'Soy sauce',
        quantity: '1/4',
        unit: 'cup',
        hasSubstitutions: true
      },
      {
        id: this.generateId(),
        name: 'Salt',
        quantity: '1',
        unit: 'teaspoon',
        hasSubstitutions: false
      }
    ];
  },
  
  /**
   * Gets recipe steps data from Gemini AI with enhanced accuracy
   */
  async getRecipeStepsFromGemini(recipeName: string): Promise<RecipeStepPopulationData[]> {
    const prompt = `
      Generate a detailed, step-by-step cooking process for the authentic Filipino dish "${recipeName}".
      
      Please return a JSON array with the following structure:
      [
        {
          "number": 1,
          "instruction": "Detailed and precise instruction for this step, including traditional techniques",
          "timeInMinutes": Realistic time needed for this step (as a number),
          "isCritical": true or false (true for steps that are crucial for flavor development or proper cooking)
        },
        ...more steps
      ]
      
      Include 7-12 steps, depending on the complexity of the dish. Be detailed and specific.
      Format it as valid JSON without explanation. Focus on traditional Filipino cooking methods.
    `;
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn(`No valid JSON found in Gemini response for ${recipeName} steps, using fallback data`);
        return this.createFallbackStepsData(recipeName);
      }
      
      try {
        const stepsData = JSON.parse(jsonMatch[0]) as Omit<RecipeStepPopulationData, 'id'>[];
        
        // Add IDs to each step
        return stepsData.map(step => ({
          ...step,
          id: this.generateId()
        }));
      } catch (parseError) {
        console.error(`Error parsing steps JSON for ${recipeName}:`, parseError);
        return this.createFallbackStepsData(recipeName);
      }
    } catch (error) {
      console.error(`Error getting recipe steps for ${recipeName}:`, error);
      toast.error(`Failed to get recipe steps for ${recipeName}`);
      return this.createFallbackStepsData(recipeName);
    }
  },
  
  /**
   * Creates fallback steps data when Gemini API fails
   */
  createFallbackStepsData(recipeName: string): RecipeStepPopulationData[] {
    return [
      {
        id: this.generateId(),
        number: 1,
        instruction: "Prepare all ingredients for the dish.",
        timeInMinutes: 10,
        isCritical: true
      },
      {
        id: this.generateId(),
        number: 2,
        instruction: "Follow a traditional recipe for preparation steps.",
        timeInMinutes: 15,
        isCritical: true
      },
      {
        id: this.generateId(),
        number: 3,
        instruction: "Cook according to traditional methods.",
        timeInMinutes: 30,
        isCritical: true
      },
      {
        id: this.generateId(),
        number: 4,
        instruction: "Serve hot and enjoy.",
        timeInMinutes: 5,
        isCritical: false
      }
    ];
  },
  
  /**
   * Gets substitution data from Gemini AI with enhanced accuracy
   */
  async getSubstitutionsFromGemini(ingredientName: string): Promise<string[]> {
    const prompt = `
      Suggest 2-3 highly accurate substitutes for the ingredient "${ingredientName}" that could be used in Filipino cooking.
      
      Please return a JSON array of strings with the substitutes, considering:
      - Flavor profile match
      - Texture similarity 
      - Cultural appropriateness
      - Availability outside the Philippines
      
      Format it as valid JSON without explanation.
    `;
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn(`No valid JSON found in Gemini response for ${ingredientName} substitutions, using fallback data`);
        return [`Alternative for ${ingredientName}`, `Another option instead of ${ingredientName}`];
      }
      
      try {
        return JSON.parse(jsonMatch[0]) as string[];
      } catch (parseError) {
        console.error(`Error parsing substitutions JSON for ${ingredientName}:`, parseError);
        return [`Alternative for ${ingredientName}`, `Another option instead of ${ingredientName}`];
      }
    } catch (error) {
      console.error(`Error getting substitutions for ${ingredientName}:`, error);
      return [`Alternative for ${ingredientName}`, `Another option instead of ${ingredientName}`];
    }
  },
  
  /**
   * Populates a single recipe in the database
   * @param recipeName The name of the recipe to populate
   * @param forceRegenerate If true, will delete the existing recipe if found and regenerate it
   */
  async populateSingleRecipe(recipeName: string, forceRegenerate: boolean = false): Promise<void> {
    try {
      // Check if recipe already exists
      const existingRecipeId = await this.findExistingRecipeId(recipeName);
      
      if (existingRecipeId) {
        if (forceRegenerate) {
          console.log(`Recipe ${recipeName} exists but will be regenerated as requested`);
          // Delete the existing recipe
          await this.deleteExistingRecipe(existingRecipeId);
        } else {
          console.log(`Recipe ${recipeName} already exists in database, skipping`);
          toast.info(`Recipe "${recipeName}" already exists in database`);
          return;
        }
      }
      
      // 1. Get recipe data
      const recipeData = await this.getRecipeDataFromGemini(recipeName);
      
      // 2. Get ingredients data
      const ingredientsData = await this.getIngredientsDataFromGemini(recipeName);
      
      // 3. Get recipe steps
      const stepsData = await this.getRecipeStepsFromGemini(recipeName);
      
      // 4. Store recipe in database
      await set(ref(database, `recipes/${recipeData.id}`), {
        title: recipeData.title,
        description: recipeData.description,
        category: recipeData.category,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        difficulty: recipeData.difficulty,
        servings: recipeData.servings,
        imageUrl: recipeData.imageUrl,
        instructions: recipeData.instructions
      });
      
      // 5. Store ingredients in database
      const ingredientsObj = Object.fromEntries(ingredientsData.map(i => [i.id, {
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        hasSubstitutions: i.hasSubstitutions
      }]));
      await set(ref(database, `ingredients/${recipeData.id}`), ingredientsObj);
      
      // 6. Store steps in database
      const stepsObj = Object.fromEntries(stepsData.map(s => [s.id, {
        number: s.number,
        instruction: s.instruction,
        timeInMinutes: s.timeInMinutes,
        isCritical: s.isCritical || false
      }]));
      await set(ref(database, `steps/${recipeData.id}`), stepsObj);
      
      // 7. Get and store substitutions for ingredients that have them
      for (const ingredient of ingredientsData.filter(i => i.hasSubstitutions)) {
        const substitutes = await this.getSubstitutionsFromGemini(ingredient.name);
        if (substitutes.length > 0) {
          await set(ref(database, `substitutes/${ingredient.id}`), substitutes);
        }
      }
      
      if (forceRegenerate) {
        toast.success(`Recipe "${recipeName}" regenerated with enhanced accuracy`);
      } else {
        toast.success(`Recipe "${recipeName}" populated successfully`);
      }
    } catch (error) {
      console.error(`Error populating recipe ${recipeName}:`, error);
      toast.error(`Failed to populate recipe "${recipeName}"`);
      throw error;
    }
  },
  
  /**
   * Populates all recipes in the database
   */
  async populateAllRecipes(progressCallback?: ProgressCallback): Promise<void> {
    toast('Starting database population, this might take some time...', {
      duration: 5000
    });
    
    try {
      // 1. Populate categories
      await this.populateCategories();
      
      // 2. Populate recipes one by one
      let successCount = 0;
      for (let i = 0; i < this.philippineRecipes.length; i++) {
        const recipe = this.philippineRecipes[i];
        
        // Update progress
        if (progressCallback) {
          progressCallback(i, this.philippineRecipes.length, recipe);
        }
        
        toast(`Populating recipe: ${recipe}...`);
        try {
          await this.populateSingleRecipe(recipe);
          successCount++;
        } catch (error) {
          console.error(`Failed to populate recipe ${recipe}:`, error);
          // Continue with next recipe even if this one fails
        }
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Final progress update
      if (progressCallback) {
        progressCallback(this.philippineRecipes.length, this.philippineRecipes.length);
      }
      
      toast.success(`Database population completed successfully! ${successCount} recipes added.`, {
        duration: 5000
      });
    } catch (error) {
      console.error('Error during database population:', error);
      toast.error('Database population failed. See console for details.');
      throw error;
    }
  }
};
