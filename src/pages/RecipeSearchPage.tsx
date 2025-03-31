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
import EnhancedAIChatBox from '@/components/EnhancedAIChatBox';
import agentOrchestrator from '@/agents';
import AIProviderInfo from '@/components/AIProviderInfo';

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
  const [showAIChat, setShowAIChat] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    setIsLoading(true);
    setSelectedRecipe(null);
    setRecipeIngredients([]);
    setRecipeSteps([]);
    setFoundOnline(false);
    
    try {
      const recipeDetail = await fetchRecipeById(recipe.id);
      if (recipeDetail) {
        setSelectedRecipe(recipeDetail);
        
        const ingredients = await fetchIngredientsByRecipeId(recipe.id);
        setRecipeIngredients(ingredients);
        
        const steps = await fetchRecipeSteps(recipe.id);
        setRecipeSteps(steps);
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

  const handleSearchExternal = async (query: string) => {
    setIsSearchingOnline(true);
    setSelectedRecipe(null);
    setRecipeIngredients([]);
    setRecipeSteps([]);
    
    try {
      toast({
        title: 'Searching',
        description: 'Looking for recipe using AI...',
      });
      
      const response = await agentOrchestrator.processRequest(
        query,
        'RecipeDiscovery',
        { conversationId }
      );
      
      if (response.success && response.data) {
        if (response.source === 'ai') {
          setSelectedRecipe(response.data.recipe);
          setRecipeIngredients(response.data.ingredients);
          setRecipeSteps(response.data.steps);
          setFoundOnline(true);
        } else {
          setSelectedRecipe(response.data);
          const ingredients = await fetchIngredientsByRecipeId(response.data.id);
          const steps = await fetchRecipeSteps(response.data.id);
          setRecipeIngredients(ingredients);
          setRecipeSteps(steps);
          setFoundOnline(false);
        }
        
        toast({
          title: 'Recipe Found',
          description: `Found recipe for "${query}"`,
        });
      } else {
        toast({
          title: 'Not Found',
          description: `AI couldn't find a recipe for "${query}"`,
          style: { backgroundColor: "red", color: "white" }
        });
      }
    } catch (error) {
      console.error('Error searching recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for recipe using AI',
        style: { backgroundColor: "red", color: "white" }
      });
    } finally {
      setIsSearchingOnline(false);
    }
  };

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
        
        const recipesData = await fetchRecipes();
        setRecipes(recipesData);
        
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

  const copyToClipboard = () => {
    if (!selectedRecipe) return;
    
    let recipeText = `# ${selectedRecipe.title}\n\n`;
    recipeText += `Difficulty: ${selectedRecipe.difficulty}\n`;
    recipeText += `Preparation Time: ${selectedRecipe.prepTime}\n`;
    recipeText += `Cooking Time: ${selectedRecipe.cookTime}\n`;
    recipeText += `Servings: ${selectedRecipe.servings}\n\n`;
    
    recipeText += "## Ingredients\n";
    recipeIngredients.forEach(ing => {
      recipeText += `- ${ing.quantity} ${ing.unit} ${ing.name}${ing.isOptional ? ' (optional)' : ''}\n`;
    });
    
    recipeText += "\n## Instructions\n";
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

  const viewRecipeDetails = () => {
    if (selectedRecipe) {
      navigate(`/recipe/${selectedRecipe.id}`);
    }
  };

  useEffect(() => {
    if (!conversationId) {
      const newConversationId = agentOrchestrator.createNewConversation();
      setConversationId(newConversationId);
    }
  }, [conversationId]);

  const getLocalPlaceholder = () => {
    return "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f5f5f5'/%3e%3cpath d='M30,40 L70,40 L70,60 L30,60 Z' fill='%23ccc'/%3e%3cpath d='M50,30 C55.5228,30 60,34.4772 60,40 C60,45.5228 55.5228,50 50,50 C44.4772,50 40,45.5228 40,40 C40,34.4772 44.4772,30 50,30 Z' fill='%23ccc'/%3e%3cpath d='M70,60 C70,50 80,50 80,60 L80,70 L70,70 Z' fill='%23ccc'/%3e%3cpath d='M30,60 C30,50 20,50 20,60 L20,70 L30,70 Z' fill='%23ccc'/%3e%3c/svg%3e";
  };

  return (
    <div className="pb-20 min-h-screen">
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
          <AIProviderInfo className="ml-2" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAIChat(!showAIChat)}
        >
          {showAIChat ? 'Hide AI Chat' : 'Ask AI Assistant'}
        </Button>
      </header>

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
                'Searching for recipes with AI...'
              ) : selectedRecipe ? (
                'Recipe found!'
              ) : recipes.length > 0 ? (
                'Type a recipe name to search'
              ) : (
                'No recipes available. Try searching with AI.'
              )}
            </p>
          </div>
        </div>

        {selectedRecipe && (
          <Card className="overflow-hidden bg-card border rounded-lg max-w-md mx-auto">
            <div className="relative h-48 bg-gray-300">
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
                        {ingredient.quantity} {ingredient.unit} {ingredient.name}
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
        
        {showAIChat && (
          <div className="mb-6">
            <EnhancedAIChatBox 
              conversationId={conversationId}
              onNewConversation={setConversationId}
              recipeId={selectedRecipe?.id}
              recipeName={selectedRecipe?.title}
            />
          </div>
        )}
      </main>

      <MobileNavBar />
    </div>
  );
};

export default RecipeSearchPage;
