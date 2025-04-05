
import React from 'react';
import EnhancedSearchBar from '@/components/EnhancedSearchBar';
import type { Recipe } from '@/components/RecipeCard';

interface RecipeSearchSectionProps {
  onSelectRecipe: (recipe: Recipe) => void;
  recipes: Recipe[];
  isLoadingRecipes: boolean;
}

const RecipeSearchSection: React.FC<RecipeSearchSectionProps> = ({ 
  onSelectRecipe, 
  recipes,
  isLoadingRecipes 
}) => {
  // These functions are required by the EnhancedSearchBar but not used in this context
  const handleSearch = () => {};
  const handleExternalSearch = () => {};

  return (
    <div className="space-y-2">
      <h2 className="text-sm md:text-base font-medium text-kusina-green">Add ingredients from recipe</h2>
      <EnhancedSearchBar
        onSearch={handleSearch}
        onSelectRecipe={onSelectRecipe}
        onSearchExternal={handleExternalSearch}
        recipes={recipes}
        placeholder="Search recipes to add ingredients..."
        isSearching={isLoadingRecipes}
      />
    </div>
  );
};

export default RecipeSearchSection;
