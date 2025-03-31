
import React, { useState, useEffect } from 'react';
import { CookingPot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MobileNavBar from '@/components/MobileNavBar';
import FeaturedRecipe from '@/components/FeaturedRecipe';
import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import CategoryList from '@/components/CategoryList';
import { fetchCategories, fetchRecipes } from '@/services/recipeService';
import type { Recipe } from '@/components/RecipeCard';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories
        const categoriesData = await fetchCategories();
        setCategories(['All', ...categoriesData]);
        
        // Fetch recipes
        const recipesData = await fetchRecipes();
        setRecipes(recipesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recipes. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter recipes based on search query and active category
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || recipe.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Get featured recipe (first in the array for demo purposes)
  const featuredRecipe = recipes.length > 0 ? recipes[0] : null;

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CookingPot className="text-primary" size={24} />
          <h1 className="text-xl font-bold">AI Kusina</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 space-y-6">
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />

        {/* Featured Recipe */}
        <section>
          <h2 className="section-title mb-3">Featured Recipe</h2>
          {isLoading ? (
            <div className="h-[250px] bg-muted animate-pulse rounded-xl"></div>
          ) : featuredRecipe ? (
            <FeaturedRecipe recipe={featuredRecipe} />
          ) : (
            <div className="text-center p-6 bg-muted rounded-xl">
              No recipes available
            </div>
          )}
        </section>

        {/* Categories */}
        <section>
          <h2 className="section-title mb-3">Categories</h2>
          <CategoryList 
            categories={categories} 
            activeCategory={activeCategory} 
            onSelectCategory={setActiveCategory} 
          />
        </section>

        {/* Popular Recipes */}
        <section>
          <h2 className="section-title mb-3">Popular Recipes</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-muted rounded-lg">
              No recipes found matching your criteria
            </div>
          )}
        </section>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default Index;
