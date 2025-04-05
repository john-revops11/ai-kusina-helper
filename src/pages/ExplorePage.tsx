
import React, { useState, useEffect } from 'react';
import MobileNavBar from '@/components/MobileNavBar';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryList from '@/components/CategoryList';
import RecipeCard from '@/components/RecipeCard';
import SearchBar from '@/components/SearchBar';
import { fetchRecipes, fetchCategories } from '@/services/recipeService';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  
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
        toast("Failed to load recipes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter recipes based on search query and category
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || recipe?.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-kusina-green`}>Explore</h1>
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
          <h2 className="text-lg font-semibold text-kusina-green mb-3 md:text-xl">Categories</h2>
          <CategoryList 
            categories={categories} 
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
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRecipes.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
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
          
          <TabsContent value="ingredients" className="mt-6">
            <div className="text-center p-6">
              <h3 className="text-lg font-medium mb-2 break-words">Coming Soon</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                Explore Filipino ingredients, their uses, and where to find them
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="techniques" className="mt-6">
            <div className="text-center p-6">
              <h3 className="text-lg font-medium mb-2 break-words">Coming Soon</h3>
              <p className="text-muted-foreground text-sm md:text-base">
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
