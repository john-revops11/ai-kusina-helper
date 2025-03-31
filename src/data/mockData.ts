
import type { Recipe } from '@/components/RecipeCard';
import type { Ingredient } from '@/components/IngredientItem';
import type { RecipeStep } from '@/components/RecipeStepCard';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Chicken Adobo',
    imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2013/02/chicken-adobo-7.jpg',
    prepTime: '45 mins',
    category: 'Main Course',
    difficulty: 'Easy',
  },
  {
    id: '2',
    title: 'Sinigang na Baboy',
    imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2019/11/sinigang-na-baboy-3.jpg',
    prepTime: '1 hour',
    category: 'Soup',
    difficulty: 'Medium',
  },
  {
    id: '3',
    title: 'Halo-Halo',
    imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2018/07/halo-halo-2.jpg',
    prepTime: '30 mins',
    category: 'Dessert',
    difficulty: 'Easy',
  },
  {
    id: '4',
    title: 'Pancit Canton',
    imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2013/01/pancit-canton-2.jpg',
    prepTime: '35 mins',
    category: 'Noodles',
    difficulty: 'Easy',
  },
  {
    id: '5',
    title: 'Bibingka',
    imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2014/12/bibingka-2.jpg',
    prepTime: '50 mins',
    category: 'Dessert',
    difficulty: 'Medium',
  },
  {
    id: '6',
    title: 'Kare-Kare',
    imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2018/01/oxtail-kare-kare-4.jpg',
    prepTime: '2 hours',
    category: 'Main Course',
    difficulty: 'Hard',
  },
];

export const mockCategories = [
  'All', 
  'Main Course', 
  'Soup', 
  'Dessert', 
  'Noodles', 
  'Rice Dishes', 
  'Seafood', 
  'Street Food', 
  'Vegetarian'
];

export const mockIngredients: Record<string, Ingredient[]> = {
  '1': [
    { id: '1-1', name: 'Chicken', quantity: '2', unit: 'lbs', hasSubstitutions: false },
    { id: '1-2', name: 'Soy Sauce', quantity: '1/2', unit: 'cup', hasSubstitutions: true },
    { id: '1-3', name: 'White Vinegar', quantity: '1/4', unit: 'cup', hasSubstitutions: true },
    { id: '1-4', name: 'Garlic', quantity: '8', unit: 'cloves', hasSubstitutions: false },
    { id: '1-5', name: 'Bay Leaves', quantity: '4', unit: 'pieces', hasSubstitutions: true },
    { id: '1-6', name: 'Black Peppercorns', quantity: '1', unit: 'tsp', hasSubstitutions: false },
    { id: '1-7', name: 'Cooking Oil', quantity: '2', unit: 'tbsp', hasSubstitutions: true },
    { id: '1-8', name: 'Brown Sugar', quantity: '1', unit: 'tbsp', hasSubstitutions: true },
  ],
};

export const mockRecipeSteps: Record<string, RecipeStep[]> = {
  '1': [
    {
      id: '1-1',
      number: 1,
      instruction: 'In a large pot, combine chicken, soy sauce, vinegar, garlic, bay leaves, and peppercorns. Marinate for at least 30 minutes or overnight for best results.',
      timeInMinutes: 30,
      isCritical: true,
    },
    {
      id: '1-2',
      number: 2,
      instruction: 'Place the pot over medium heat and bring to a boil. Once boiling, reduce heat to a simmer and cover.',
      imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2013/02/chicken-adobo-2.jpg',
      timeInMinutes: 5,
      isCritical: false,
    },
    {
      id: '1-3',
      number: 3,
      instruction: 'Simmer for about 30 minutes or until the chicken is tender and cooked through.',
      timeInMinutes: 30,
      isCritical: false,
    },
    {
      id: '1-4',
      number: 4,
      instruction: 'Remove the chicken pieces from the pot and set aside.',
      timeInMinutes: 0,
      isCritical: false,
    },
    {
      id: '1-5',
      number: 5,
      instruction: 'In a large skillet, heat the cooking oil over medium-high heat. Add the chicken pieces and fry until the skin is crispy and golden brown.',
      imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2013/02/chicken-adobo-5.jpg',
      timeInMinutes: 8,
      isCritical: true,
    },
    {
      id: '1-6',
      number: 6,
      instruction: 'Meanwhile, continue simmering the sauce in the pot. Add brown sugar and stir until dissolved.',
      timeInMinutes: 5,
      isCritical: false,
    },
    {
      id: '1-7',
      number: 7,
      instruction: 'Return the fried chicken to the sauce and simmer for another 5 minutes to allow the flavors to meld together.',
      timeInMinutes: 5,
      isCritical: false,
    },
    {
      id: '1-8',
      number: 8,
      instruction: 'Serve hot with steamed rice. Enjoy your Chicken Adobo!',
      imageUrl: 'https://www.kawalingpinoy.com/wp-content/uploads/2013/02/chicken-adobo-7.jpg',
      timeInMinutes: 0,
      isCritical: false,
    },
  ],
};

export const mockIngredientSubstitutes: Record<string, string[]> = {
  '1-2': ['Coconut Aminos', 'Tamari', 'Liquid Aminos'], // Soy Sauce
  '1-3': ['Apple Cider Vinegar', 'Rice Vinegar', 'Lemon Juice'], // White Vinegar
  '1-5': ['Basil Leaves', 'Curry Leaves'], // Bay Leaves
  '1-7': ['Coconut Oil', 'Avocado Oil', 'Olive Oil'], // Cooking Oil
  '1-8': ['Coconut Sugar', 'Honey', 'Maple Syrup'], // Brown Sugar
};
