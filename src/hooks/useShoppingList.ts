
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShoppingItem } from '@/components/shopping/ShoppingItem';
import { Ingredient } from '@/components/IngredientItem';
import { Recipe } from '@/components/RecipeCard';
import { useToast } from '@/hooks/use-toast';
import { fetchIngredientsByRecipeId } from '@/services/recipeService';

export const useShoppingList = () => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const { toast } = useToast();

  // Load shopping list from localStorage on component mount
  useEffect(() => {
    const savedShoppingList = localStorage.getItem('shoppingList');
    if (savedShoppingList) {
      try {
        setShoppingList(JSON.parse(savedShoppingList));
      } catch (e) {
        console.error("Error parsing shopping list from localStorage:", e);
        setShoppingList([]);
      }
    }
  }, []);

  // Save shopping list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  const toggleItemCheck = (id: string) => {
    setShoppingList(prevList => 
      prevList.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setShoppingList(prevList => prevList.filter(item => item.id !== id));
  };

  const clearCheckedItems = () => {
    setShoppingList(prevList => prevList.filter(item => !item.checked));
  };

  const addNewItem = (name: string, quantity: string, unit: string) => {
    const newItem: ShoppingItem = {
      id: uuidv4(),
      name,
      quantity: quantity || '1',
      unit: unit || 'item',
      checked: false,
      category: 'Other',
    };
    
    addItemToShoppingList(newItem);
  };

  // Handle recipe selection
  const handleRecipeSelect = async (recipe: Recipe) => {
    try {
      const ingredients = await fetchIngredientsByRecipeId(recipe.id);
      
      if (ingredients.length === 0) {
        toast({
          title: "No ingredients found",
          description: `No ingredients found for ${recipe.title}`,
          variant: "destructive"
        });
        return;
      }

      // Convert ingredients to shopping items and add them
      ingredients.forEach(ingredient => {
        const shoppingItem: ShoppingItem = {
          id: uuidv4(),
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit || '',
          checked: false,
          category: ingredient.category || 'Other',
          recipeId: recipe.id,
          recipeName: recipe.title,
        };
        
        addItemToShoppingList(shoppingItem);
      });

      toast({
        description: `Added ingredients from ${recipe.title} to your shopping list`,
      });
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      toast({
        title: "Error",
        description: "Failed to add ingredients to shopping list",
        variant: "destructive"
      });
    }
  };

  // Add item to shopping list, combining duplicates
  const addItemToShoppingList = (newItem: ShoppingItem) => {
    setShoppingList(prevList => {
      // Check if a similar item already exists (same name and unit)
      const existingItemIndex = prevList.findIndex(
        item => item.name.toLowerCase() === newItem.name.toLowerCase() && 
               item.unit.toLowerCase() === newItem.unit.toLowerCase()
      );

      if (existingItemIndex !== -1) {
        // Item exists, combine quantities
        const existingItem = prevList[existingItemIndex];
        
        // Try to parse quantities as numbers
        const existingQty = parseFloat(existingItem.quantity) || 0;
        const newQty = parseFloat(newItem.quantity) || 0;
        
        // If both are valid numbers, add them
        let updatedQuantity;
        if (!isNaN(existingQty) && !isNaN(newQty)) {
          updatedQuantity = (existingQty + newQty).toString();
        } else {
          // If not valid numbers, concatenate with a '+'
          updatedQuantity = `${existingItem.quantity}+${newItem.quantity}`;
        }

        // Create combined recipe name if they're from different recipes
        let combinedRecipeName = existingItem.recipeName;
        if (newItem.recipeName && existingItem.recipeName !== newItem.recipeName) {
          combinedRecipeName = existingItem.recipeName 
            ? `${existingItem.recipeName}, ${newItem.recipeName}`
            : newItem.recipeName;
        }

        // Create a new array with the updated item
        const newList = [...prevList];
        newList[existingItemIndex] = {
          ...existingItem,
          quantity: updatedQuantity,
          recipeName: combinedRecipeName
        };
        
        return newList;
      } else {
        // Item doesn't exist, add it
        return [...prevList, newItem];
      }
    });
  };

  return {
    shoppingList,
    toggleItemCheck,
    removeItem,
    clearCheckedItems,
    addNewItem,
    handleRecipeSelect
  };
};
