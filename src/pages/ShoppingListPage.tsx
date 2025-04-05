
import React, { useState, useEffect } from 'react';
import MobileNavBar from '@/components/MobileNavBar';
import { Check, Trash2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { fetchRecipes } from '@/services/recipeService';
import { fetchIngredientsByRecipeId } from '@/services/recipeService';
import { useToast } from '@/hooks/use-toast';
import EnhancedSearchBar from '@/components/EnhancedSearchBar';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe } from '@/components/RecipeCard';

type ShoppingItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
  category: string;
  recipeId?: string;
  recipeName?: string;
};

const ShoppingListPage = () => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const { toast } = useToast();

  // Load recipes and existing shopping list from localStorage on component mount
  useEffect(() => {
    const loadRecipes = async () => {
      setIsLoadingRecipes(true);
      try {
        const fetchedRecipes = await fetchRecipes();
        setRecipes(fetchedRecipes);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    loadRecipes();
    
    // Load shopping list from localStorage
    const savedShoppingList = localStorage.getItem('shoppingList');
    if (savedShoppingList) {
      try {
        setShoppingList(JSON.parse(savedShoppingList));
      } catch (e) {
        console.error("Error parsing shopping list from localStorage:", e);
        // If there's an error parsing, start with an empty list
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

  const addNewItem = () => {
    if (newItemName.trim()) {
      const newItem: ShoppingItem = {
        id: uuidv4(),
        name: newItemName,
        quantity: newItemQuantity || '1',
        unit: newItemUnit || 'item',
        checked: false,
        category: 'Other',
      };
      
      addItemToShoppingList(newItem);
      
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
    }
  };

  // Function to handle recipe selection
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

  // Function for external recipe search (not used here)
  const handleExternalSearch = () => {
    // This function is required by EnhancedSearchBar but not used in this context
  };

  // Group items by category
  const groupedItems = shoppingList.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, ShoppingItem[]>);

  // Sort categories
  const sortedCategories = Object.keys(groupedItems).sort();

  // Get counts
  const totalItems = shoppingList.length;
  const checkedItems = shoppingList.filter(item => item.checked).length;

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Shopping List</h1>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-xs">
            {checkedItems} of {totalItems} items checked
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              if (checkedItems > 0 && confirm('Remove all checked items?')) {
                setShoppingList(prevList => prevList.filter(item => !item.checked));
              }
            }}
          >
            Clear checked
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-6">
        {/* Recipe Search */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-kusina-green">Add ingredients from recipe</h2>
          <EnhancedSearchBar
            onSearch={() => {}}
            onSelectRecipe={handleRecipeSelect}
            onSearchExternal={handleExternalSearch}
            recipes={recipes}
            placeholder="Search recipes to add ingredients..."
            isSearching={isLoadingRecipes}
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              or add individual items
            </span>
          </div>
        </div>

        {/* Add New Item */}
        <div className="flex gap-2 items-center">
          <Input 
            placeholder="Add item..." 
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Qty"
            value={newItemQuantity}
            onChange={e => setNewItemQuantity(e.target.value)}
            className="w-16"
          />
          <Input
            placeholder="Unit"
            value={newItemUnit}
            onChange={e => setNewItemUnit(e.target.value)}
            className="w-20"
          />
          <Button 
            size="icon" 
            onClick={addNewItem}
            disabled={!newItemName.trim()}
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Shopping List */}
        <ScrollArea className="h-[calc(100vh-350px)]">
          {shoppingList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your shopping list is empty</p>
              <p className="text-sm">Search for recipes or add items manually</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedCategories.map(category => (
                <div key={category}>
                  <h2 className="font-medium text-sm text-muted-foreground mb-2">{category}</h2>
                  <ul className="space-y-2">
                    {groupedItems[category].map(item => (
                      <li key={item.id} className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center gap-3">
                          <Button
                            variant={item.checked ? "default" : "outline"}
                            size="icon"
                            className={`h-6 w-6 rounded-full ${item.checked ? 'bg-kusina-green' : 'border-kusina-green'}`}
                            onClick={() => toggleItemCheck(item.id)}
                          >
                            {item.checked && <Check size={12} />}
                          </Button>
                          <div className={`flex flex-col ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                            <span className="font-medium">{item.name}</span>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-muted-foreground">{item.quantity} {item.unit}</span>
                              {item.recipeName && (
                                <Badge variant="outline" className="text-xs bg-kusina-light-green/20">
                                  {item.recipeName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default ShoppingListPage;
