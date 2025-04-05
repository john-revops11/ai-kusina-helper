
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Filter, CookingPot, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MobileNavBar from '@/components/MobileNavBar';
import SearchBar from '@/components/SearchBar';
import RecipeCard from '@/components/RecipeCard';
import { fetchRecipes } from '@/services/recipeService';
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const CookPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCookingId, setActiveCookingId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadRecipes = async () => {
      setIsLoading(true);
      try {
        const recipesData = await fetchRecipes();
        setRecipes(recipesData);
      } catch (error) {
        console.error('Error loading recipes:', error);
        toast({
          description: "Failed to load recipes. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipes();
  }, []);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe => 
    recipe?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestartCooking = () => {
    if (activeCookingId) {
      // In a real app, this would reset cooking progress in the database
      toast({
        description: "Cooking progress has been reset.",
      });
      setActiveCookingId(null);
    } else {
      toast({
        description: "No active cooking session found.",
      });
    }
  };

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CookingPot className="text-primary" size={24} />
          <h1 className="text-xl font-bold">Cookerist</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/search">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <Search size={18} />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="icon"
            title="Reset Cooking Progress"
            onClick={handleRestartCooking}
          >
            <RefreshCw size={18} />
          </Button>
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

        {/* Active Cooking Section */}
        {activeCookingId && (
          <section>
            <div className="flex justify-between items-center">
              <h2 className="section-title mb-3">Currently Cooking</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleRestartCooking}
              >
                <RefreshCw size={14} /> Restart
              </Button>
            </div>
            <Card className="bg-primary/10 border-primary mb-4">
              <CardContent className="p-4">
                <p className="text-sm font-medium">
                  You have an active cooking session.
                </p>
                <div className="flex justify-end mt-2">
                  <Link to={`/cook/${activeCookingId}`}>
                    <Button size="sm">Resume Cooking</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* All Recipes */}
        <section>
          <h2 className="section-title mb-3">All Recipes</h2>
          
          <Tabs defaultValue="all" className="mb-4">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mains">Mains</TabsTrigger>
              <TabsTrigger value="desserts">Desserts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRecipes.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {filteredRecipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-6">
                  <p className="text-muted-foreground">
                    No recipes found matching your criteria
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="mains">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {filteredRecipes
                    .filter(recipe => recipe.category === "Main Course" || recipe.category === "Main Dish")
                    .map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="desserts">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {filteredRecipes
                    .filter(recipe => recipe.category === "Dessert")
                    .map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default CookPage;
