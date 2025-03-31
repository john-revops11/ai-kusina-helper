
import React, { useState } from 'react';
import MobileNavBar from '@/components/MobileNavBar';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryList from '@/components/CategoryList';
import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import { mockRecipes, mockCategories } from '@/data/mockData';

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter recipes based on search query and category
  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || recipe.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Explore</h1>
        <Button variant="outline" size="icon">
          <Filter size={18} />
        </Button>
      </header>

      {/* Main Content */}
      <main className="px-4 space-y-6">
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />

        {/* Categories */}
        <section>
          <h2 className="section-title mb-3">Categories</h2>
          <CategoryList 
            categories={mockCategories} 
            activeCategory={activeCategory} 
            onSelectCategory={setActiveCategory} 
          />
        </section>

        {/* Tabs for different views */}
        <Tabs defaultValue="recipes">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="techniques">Techniques</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recipes" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="ingredients" className="mt-6">
            <div className="text-center p-6">
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Explore Filipino ingredients, their uses, and where to find them
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="techniques" className="mt-6">
            <div className="text-center p-6">
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Learn traditional Filipino cooking techniques and methods
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default ExplorePage;
