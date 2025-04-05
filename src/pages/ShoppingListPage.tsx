
import React, { useState, useEffect } from 'react';
import MobileNavBar from '@/components/MobileNavBar';
import ShoppingListHeader from '@/components/shopping/ShoppingListHeader';
import AddItemForm from '@/components/shopping/AddItemForm';
import RecipeSearchSection from '@/components/shopping/RecipeSearchSection';
import ShoppingItemsList from '@/components/shopping/ShoppingItemsList';
import { useShoppingList } from '@/hooks/useShoppingList';
import { fetchRecipes } from '@/services/recipeService';
import type { Recipe } from '@/components/RecipeCard';

const ShoppingListPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  
  const {
    shoppingList,
    toggleItemCheck,
    removeItem,
    clearCheckedItems,
    addNewItem,
    handleRecipeSelect
  } = useShoppingList();

  // Load recipes on component mount
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
  }, []);

  // Get counts for header
  const totalItems = shoppingList.length;
  const checkedItems = shoppingList.filter(item => item.checked).length;

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <ShoppingListHeader 
        totalItems={totalItems} 
        checkedItems={checkedItems} 
        onClearChecked={clearCheckedItems} 
      />

      {/* Main Content */}
      <main className="px-4 py-4 space-y-6">
        {/* Recipe Search */}
        <RecipeSearchSection 
          onSelectRecipe={handleRecipeSelect} 
          recipes={recipes} 
          isLoadingRecipes={isLoadingRecipes} 
        />

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

        {/* Add New Item Form */}
        <AddItemForm onAddItem={addNewItem} />

        {/* Shopping List */}
        <ShoppingItemsList 
          items={shoppingList} 
          onToggleCheck={toggleItemCheck} 
          onRemoveItem={removeItem} 
        />
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default ShoppingListPage;
