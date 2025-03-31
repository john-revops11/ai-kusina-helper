
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Filter, CookingPot, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MobileNavBar from '@/components/MobileNavBar';
import SearchBar from '@/components/SearchBar';
import RecipeCard from '@/components/RecipeCard';
import { mockRecipes } from '@/data/mockData';

const CookPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter recipes based on search query
  const filteredRecipes = mockRecipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CookingPot className="text-primary" size={24} />
          <h1 className="text-xl font-bold">Let's Cook</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/search">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <Search size={18} />
            </Button>
          </Link>
          <Button variant="outline" size="icon">
            <Filter size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 space-y-6">
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} placeholder="Search recipes to cook..." />

        {/* Quick Start */}
        <section>
          <h2 className="section-title mb-3">Ready to Cook?</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-kusina-brown/10 border-kusina-brown/30">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-kusina-brown/20 flex items-center justify-center mb-2">
                  <ChefHat size={24} className="text-kusina-brown" />
                </div>
                <h3 className="font-medium mb-1">Recent Recipes</h3>
                <p className="text-xs text-muted-foreground">Continue where you left off</p>
              </CardContent>
            </Card>
            
            <Link to="/search" className="block w-full">
              <Card className="bg-kusina-green/10 border-kusina-green/30 h-full transition-transform hover:scale-[1.02]">
                <CardContent className="p-4 flex flex-col items-center text-center h-full">
                  <div className="h-12 w-12 rounded-full bg-kusina-green/20 flex items-center justify-center mb-2">
                    <Search size={24} className="text-kusina-green" />
                  </div>
                  <h3 className="font-medium mb-1">Find Recipes</h3>
                  <p className="text-xs text-muted-foreground">Search any recipe</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* All Recipes */}
        <section>
          <h2 className="section-title mb-3">All Recipes</h2>
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

export default CookPage;
