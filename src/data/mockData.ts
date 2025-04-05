
import type { Recipe } from '@/components/RecipeCard';
import type { Ingredient } from '@/components/IngredientItem';
import type { RecipeStep } from '@/components/RecipeStepCard';

// This file only contains template data for import/export purposes
// All actual data is fetched from Firebase

export const recipeImportTemplate = {
  recipes: [
    {
      "recipeName": "Sample Recipe Name",
      "description": "A brief description of the recipe",
      "culture": "Filipino",
      "category": "Main Course",
      "imageUrl": "https://example.com/image.jpg",
      "prepTime": "30 mins",
      "cookTime": "45 mins",
      "difficulty": "Medium",
      "servings": 4,
      "steps": [
        "Prepare ingredients by washing and chopping vegetables",
        "Heat oil in a pan over medium heat",
        "Cook the main ingredients for 5 minutes",
        "Add spices and seasonings",
        "Simmer for 15 minutes until cooked through",
        "Garnish and serve hot"
      ],
      "ingredients": [
        {
          "ingredientName": "Ingredient 1",
          "quantity": "2",
          "unit": "cups"
        },
        {
          "ingredientName": "Ingredient 2",
          "quantity": "1",
          "unit": "tablespoon"
        },
        {
          "ingredientName": "Ingredient 3",
          "quantity": "3",
          "unit": "pieces"
        }
      ]
    }
  ]
};

// Functions to help with import/export
export const convertToDownloadableJSON = (): string => {
  return JSON.stringify(recipeImportTemplate.recipes, null, 2);
};
