
import React, { useState } from 'react';
import { CookingPot } from 'lucide-react';
import MobileNavBar from '@/components/MobileNavBar';
import FeaturedRecipe from '@/components/FeaturedRecipe';
import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import CategoryList from '@/components/CategoryList';
import { mockRecipes, mockCategories } from '@/data/mockData';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter recipes based on search query and active category
  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || recipe.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Get featured recipe (first in the array for demo purposes)
  const featuredRecipe = mockRecipes[0];

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
          <FeaturedRecipe recipe={featuredRecipe} />
        </section>

        {/* Categories */}
        <section>
          <h2 className="section-title mb-3">Categories</h2>
          <CategoryList 
            categories={mockCategories} 
            activeCategory={activeCategory} 
            onSelectCategory={setActiveCategory} 
          />
        </section>

        {/* Popular Recipes */}
        <section>
          <h2 className="section-title mb-3">Popular Recipes</h2>
          <div className="grid grid-cols-2 gap-4">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default Index;
