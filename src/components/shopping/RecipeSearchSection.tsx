
import React from 'react';
import EnhancedSearchBar from '@/components/EnhancedSearchBar';
import type { Recipe } from '@/components/RecipeCard';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  // These functions are required by the EnhancedSearchBar but not used in this context
  const handleSearch = () => {};
  const handleExternalSearch = () => {};

  return (
    <div className="space-y-2 md:space-y-3">
      <h2 className={`${isMobile ? "text-sm font-medium" : "text-base font-semibold"} text-kusina-green truncate`}>
        Add ingredients from recipe
      </h2>
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
