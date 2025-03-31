
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Search, 
  Loader2, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchRecipes, 
  fetchIngredientsByRecipeId,
  fetchRecipeSteps
} from '@/services/recipeService';
import { databasePopulationService } from '@/services/databasePopulationService';
import { Recipe } from '@/components/RecipeCard';
import { Ingredient } from '@/components/IngredientItem';
import { RecipeStep } from '@/components/RecipeStepCard';

const AdminRecipesPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<{[key: string]: Ingredient[]}>({});
  const [recipeSteps, setRecipeSteps] = useState<{[key: string]: RecipeStep[]}>({});
  const [regenerating, setRegenerating] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const recipesData = await fetchRecipes();
      setRecipes(recipesData);
    } catch (error) {
      console.error("Error loading recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load recipes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecipeDetails = async (recipeId: string) => {
    if (recipeIngredients[recipeId] && recipeSteps[recipeId]) {
      return; // Already loaded
    }

    try {
      // Fetch ingredients
      const ingredients = await fetchIngredientsByRecipeId(recipeId);
      setRecipeIngredients(prev => ({
        ...prev,
        [recipeId]: ingredients
      }));

      // Fetch steps
      const steps = await fetchRecipeSteps(recipeId);
      setRecipeSteps(prev => ({
        ...prev,
        [recipeId]: steps
      }));
    } catch (error) {
      console.error("Error loading recipe details:", error);
      toast({
        title: "Error",
        description: "Failed to load recipe details",
        variant: "destructive"
      });
    }
  };

  const toggleRecipeExpansion = (recipeId: string) => {
    if (expandedRecipe === recipeId) {
      setExpandedRecipe(null);
    } else {
      setExpandedRecipe(recipeId);
      loadRecipeDetails(recipeId);
    }
  };

  const regenerateRecipeData = async (recipe: Recipe) => {
    // Set regenerating state for this recipe
    setRegenerating(prev => ({ ...prev, [recipe.id]: true }));
    
    try {
      toast({
        title: "Processing",
        description: `Regenerating data for "${recipe.title}"...`,
      });
      
      // Delete existing recipe data first to ensure clean regeneration
      // Then populate with fresh AI-generated data
      await databasePopulationService.populateSingleRecipe(recipe.title, true); // Pass true to force regeneration
      
      toast({
        title: "Success",
        description: `"${recipe.title}" data has been regenerated with enhanced accuracy`,
      });
      
      // Reload all recipes to show the updated data
      await loadRecipes();
      
      // If this recipe was expanded, reload its details
      if (expandedRecipe === recipe.id) {
        // Remove from expanded state temporarily
        setExpandedRecipe(null);
        
        // Clear the cached data for this recipe
        setRecipeIngredients(prev => {
          const newState = {...prev};
          delete newState[recipe.id];
          return newState;
        });
        
        setRecipeSteps(prev => {
          const newState = {...prev};
          delete newState[recipe.id];
          return newState;
        });
      }
    } catch (error) {
      console.error(`Error regenerating recipe ${recipe.title}:`, error);
      toast({
        title: "Error",
        description: `Failed to regenerate "${recipe.title}" data`,
        variant: "destructive"
      });
    } finally {
      // Clear regenerating state
      setRegenerating(prev => ({ ...prev, [recipe.id]: false }));
    }
  };

  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 max-w-6xl pb-20">
      <Link to="/admin" className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={16} />
        <span>Back to admin page</span>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>Recipe Management</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <Search className="text-muted-foreground" size={18} />
            <Input 
              type="text" 
              placeholder="Search recipes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Recipe</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No recipes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecipes.map(recipe => (
                      <React.Fragment key={recipe.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleRecipeExpansion(recipe.id)}
                        >
                          <TableCell className="font-medium flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md overflow-hidden shrink-0">
                              <img 
                                src={recipe.imageUrl} 
                                alt={recipe.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span>{recipe.title}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{recipe.category}</Badge>
                          </TableCell>
                          <TableCell>{recipe.difficulty}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                regenerateRecipeData(recipe);
                              }}
                              disabled={regenerating[recipe.id]}
                            >
                              {regenerating[recipe.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            {expandedRecipe === recipe.id ? (
                              <ChevronUp className="inline-block ml-2 h-4 w-4" />
                            ) : (
                              <ChevronDown className="inline-block ml-2 h-4 w-4" />
                            )}
                          </TableCell>
                        </TableRow>
                        
                        {expandedRecipe === recipe.id && (
                          <TableRow>
                            <TableCell colSpan={4} className="p-0">
                              <div className="px-4 py-3 bg-muted/30">
                                <Accordion type="single" collapsible className="w-full">
                                  <AccordionItem value="ingredients" className="border-none">
                                    <AccordionTrigger className="py-2">
                                      <h3 className="text-sm font-medium">Ingredients</h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      {!recipeIngredients[recipe.id] ? (
                                        <div className="flex justify-center py-4">
                                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                      ) : (
                                        <ul className="space-y-1 text-sm">
                                          {recipeIngredients[recipe.id].map(ingredient => (
                                            <li key={ingredient.id} className="flex">
                                              <span className="font-medium">{ingredient.name}</span>
                                              <span className="text-muted-foreground ml-2">
                                                {ingredient.quantity} {ingredient.unit}
                                              </span>
                                              {ingredient.hasSubstitutions && (
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                  Has substitutes
                                                </Badge>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                  
                                  <AccordionItem value="steps" className="border-none">
                                    <AccordionTrigger className="py-2">
                                      <h3 className="text-sm font-medium">Cooking Steps</h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      {!recipeSteps[recipe.id] ? (
                                        <div className="flex justify-center py-4">
                                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                      ) : (
                                        <ol className="space-y-3 text-sm list-decimal pl-5">
                                          {recipeSteps[recipe.id]
                                            .sort((a, b) => a.number - b.number)
                                            .map(step => (
                                            <li key={step.id}>
                                              <div className="flex flex-col gap-1">
                                                <p>{step.instruction}</p>
                                                <div className="flex gap-2 text-xs text-muted-foreground">
                                                  <span>Time: {step.timeInMinutes} min</span>
                                                  {step.isCritical && (
                                                    <Badge variant="destructive" className="text-xs">
                                                      Critical Step
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            </li>
                                          ))}
                                        </ol>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRecipesPage;
