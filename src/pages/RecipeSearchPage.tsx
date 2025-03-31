
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import MobileNavBar from '@/components/MobileNavBar';
import EnhancedSearchBar from '@/components/EnhancedSearchBar';
import { fetchRecipes, fetchRecipeById, fetchIngredientsByRecipeId, fetchRecipeSteps } from '@/services/recipeService';
import { searchRecipeOnline, saveRecipeToDatabase } from '@/services/recipeSearchService';
import type { Recipe } from '@/components/RecipeCard';
import type { RecipeStep } from '@/components/RecipeStepCard';
import type { Ingredient } from '@/components/IngredientItem';

// Extended type for recipe detail
type RecipeDetail = Recipe & {
  description: string;
  servings: number;
  cookTime: string;
  instructions: string;
};

const RecipeSearchPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<Ingredient[]>([]);
  const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [foundOnline, setFoundOnline] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Load recipes from database
  useEffect(() => {
    const loadRecipes = async () => {
      setIsLoading(true);
      try {
        const recipesData = await fetchRecipes();
        setRecipes(recipesData);
      } catch (error) {
        console.error('Error loading recipes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recipes',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipes();
  }, [toast]);

  // Handle search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle selecting an existing recipe
  const handleSelectRecipe = async (recipe: Recipe) => {
    setIsLoading(true);
    setSelectedRecipe(null);
    setRecipeIngredients([]);
    setRecipeSteps([]);
    setFoundOnline(false);
    
    try {
      // Fetch complete recipe details
      const recipeDetail = await fetchRecipeById(recipe.id);
      if (recipeDetail) {
        setSelectedRecipe(recipeDetail);
        
        // Fetch ingredients
        const ingredients = await fetchIngredientsByRecipeId(recipe.id);
        setRecipeIngredients(ingredients);
        
        // Fetch steps
        const steps = await fetchRecipeSteps(recipe.id);
        // Sort steps by number
        const sortedSteps = steps.sort((a, b) => a.number - b.number);
        setRecipeSteps(sortedSteps);
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipe details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle searching for recipe online
  const handleSearchExternal = async (query: string) => {
    setIsSearchingOnline(true);
    setSelectedRecipe(null);
    setRecipeIngredients([]);
    setRecipeSteps([]);
    
    try {
      const result = await searchRecipeOnline(query);
      if (result) {
        setSelectedRecipe(result.recipe);
        setRecipeIngredients(result.ingredients);
        setRecipeSteps(result.steps);
        setFoundOnline(true);
        
        toast({
          title: 'Recipe Found',
          description: `Found recipe for "${query}" online`,
        });
      } else {
        toast({
          title: 'Not Found',
          description: `No recipe found for "${query}"`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error searching recipe online:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for recipe online',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Save recipe found online to database
  const handleSaveRecipe = async () => {
    if (!selectedRecipe || !foundOnline) return;
    
    try {
      const success = await saveRecipeToDatabase(
        selectedRecipe, 
        recipeIngredients, 
        recipeSteps
      );
      
      if (success) {
        toast({
          title: 'Recipe Saved',
          description: 'Recipe has been added to your collection',
        });
        
        // Refresh recipes list
        const recipesData = await fetchRecipes();
        setRecipes(recipesData);
        
        // Mark as no longer found online (now it's in the database)
        setFoundOnline(false);
      } else {
        toast({
          title: 'Save Failed',
          description: 'Failed to save recipe to database',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to save recipe',
        variant: 'destructive',
      });
    }
  };

  // Copy recipe to clipboard
  const copyToClipboard = () => {
    if (!selectedRecipe) return;
    
    let recipeText = `# ${selectedRecipe.title}\n\n`;
    recipeText += `Difficulty: ${selectedRecipe.difficulty}\n`;
    recipeText += `Preparation Time: ${selectedRecipe.prepTime}\n`;
    recipeText += `Cooking Time: ${selectedRecipe.cookTime}\n`;
    recipeText += `Servings: ${selectedRecipe.servings}\n\n`;
    
    recipeText += "## Ingredients\n";
    recipeIngredients.forEach(ing => {
      recipeText += `- ${ing.quantity} ${ing.name}${ing.isOptional ? ' (optional)' : ''}\n`;
    });
    
    recipeText += "\n## Instructions\n";
    // Sort steps by number before creating text
    const sortedSteps = [...recipeSteps].sort((a, b) => a.number - b.number);
    sortedSteps.forEach(step => {
      recipeText += `${step.number}. ${step.instruction}${step.isCritical ? ' (Critical Step)' : ''}\n`;
    });
    
    navigator.clipboard.writeText(recipeText)
      .then(() => {
        setIsCopied(true);
        toast({
          description: 'Recipe copied to clipboard',
        });
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy recipe:', err);
        toast({
          title: 'Copy Failed',
          description: 'Failed to copy recipe to clipboard',
          variant: 'destructive',
        });
      });
  };

  // View full recipe details
  const viewRecipeDetails = () => {
    if (selectedRecipe) {
      navigate(`/recipe/${selectedRecipe.id}`);
    }
  };

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Recipe Search</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        <div className="max-w-md mx-auto">
          <EnhancedSearchBar 
            onSearch={handleSearch}
            onSelectRecipe={handleSelectRecipe}
            onSearchExternal={handleSearchExternal}
            recipes={recipes}
            placeholder="Search for recipes..."
            isSearching={isLoading || isSearchingOnline}
          />
          
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              {isLoading || isSearchingOnline ? (
                'Searching for recipes...'
              ) : selectedRecipe ? (
                'Recipe found!'
              ) : recipes.length > 0 ? (
                'Type a recipe name to search'
              ) : (
                'No recipes available. Try searching online.'
              )}
            </p>
          </div>
        </div>

        {/* Selected Recipe Display */}
        {selectedRecipe && (
          <Card className="overflow-hidden bg-card border rounded-lg max-w-md mx-auto">
            <div className="relative h-48">
              <img 
                src={selectedRecipe.imageUrl} 
                alt={selectedRecipe.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1617611647086-baf8019744ab?q=80&w=2070";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <Badge className="mb-2">{selectedRecipe.category}</Badge>
                <h2 className="text-xl font-bold mb-1">{selectedRecipe.title}</h2>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Badge variant={
                    selectedRecipe.difficulty === 'Easy' ? 'default' : 
                    selectedRecipe.difficulty === 'Medium' ? 'outline' : 'destructive'
                  }>
                    {selectedRecipe.difficulty}
                  </Badge>
                  <div className="text-sm mt-1">Prep: {selectedRecipe.prepTime}</div>
                </div>
                
                {foundOnline && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                    Found Online
                  </Badge>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Ingredients:</h3>
                <ul className="text-sm space-y-1">
                  {recipeIngredients.map((ingredient) => (
                    <li key={ingredient.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      <span>
                        {ingredient.quantity} {ingredient.name}
                        {ingredient.isOptional && <span className="text-muted-foreground"> (optional)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Steps:</h3>
                <ol className="text-sm space-y-2">
                  {recipeSteps
                    .sort((a, b) => a.number - b.number)
                    .map((step) => (
                    <li key={step.id} className="pl-5 relative">
                      <span className="absolute left-0 top-0.5 font-semibold">{step.number}.</span>
                      <span>{step.instruction}</span>
                      {step.isCritical && (
                        <Badge variant="destructive" className="text-xs ml-1 py-0 px-1">Critical</Badge>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
              
              <div className="flex space-x-2 pt-4 mt-2 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={copyToClipboard}
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  {isCopied ? 'Copied!' : 'Copy Recipe'}
                </Button>
                
                <Button 
                  className="flex-1 gap-2"
                  onClick={viewRecipeDetails}
                >
                  <ChefHat size={16} />
                  View Full Recipe
                </Button>
              </div>
              
              {foundOnline && (
                <Button 
                  variant="default" 
                  className="w-full mt-2"
                  onClick={handleSaveRecipe}
                >
                  Save Recipe to Collection
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default RecipeSearchPage;
