import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Search, 
  Loader2, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Image,
  Check,
  X,
  Trash2,
  Filter,
  SortAsc,
  SortDesc
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  fetchRecipes, 
  fetchIngredientsByRecipeId,
  fetchRecipeSteps,
  updateRecipeImage,
  deleteRecipe,
  fetchCategories
} from '@/services/recipeService';
import { databasePopulationService } from '@/services/databasePopulationService';
import { Recipe } from '@/components/RecipeCard';
import { Ingredient } from '@/components/IngredientItem';
import { RecipeStep } from '@/components/RecipeStepCard';

type SortOption = 'title-asc' | 'title-desc' | 'category-asc' | 'category-desc' | 'difficulty-asc' | 'difficulty-desc';

const AdminRecipesPage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<{[key: string]: Ingredient[]}>({});
  const [recipeSteps, setRecipeSteps] = useState<{[key: string]: RecipeStep[]}>({});
  const [regenerating, setRegenerating] = useState<{[key: string]: boolean}>({});
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const { toast } = useToast();
  const imageUrlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRecipes();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

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
      const ingredients = await fetchIngredientsByRecipeId(recipeId);
      setRecipeIngredients(prev => ({
        ...prev,
        [recipeId]: ingredients
      }));

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
    setRegenerating(prev => ({ ...prev, [recipe.id]: true }));
    
    try {
      toast({
        title: "Processing",
        description: `Regenerating data for "${recipe.title}"...`,
      });
      
      await databasePopulationService.populateSingleRecipe(recipe.title, true);
      
      toast({
        title: "Success",
        description: `"${recipe.title}" data has been regenerated with enhanced accuracy`,
      });
      
      await loadRecipes();
      
      if (expandedRecipe === recipe.id) {
        setExpandedRecipe(null);
        
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
      setRegenerating(prev => ({ ...prev, [recipe.id]: false }));
    }
  };

  const openImageDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setNewImageUrl(recipe.imageUrl);
    setImagePreview(recipe.imageUrl);
    setImageDialogOpen(true);
    setTimeout(() => {
      if (imageUrlInputRef.current) {
        imageUrlInputRef.current.focus();
      }
    }, 100);
  };

  const handlePreviewImage = () => {
    if (newImageUrl.trim()) {
      setImagePreview(newImageUrl);
    }
  };

  const handleUpdateImage = async () => {
    if (!selectedRecipe || !newImageUrl.trim()) return;
    
    setIsUpdatingImage(true);
    try {
      await updateRecipeImage(selectedRecipe.id, newImageUrl);
      
      const updatedRecipes = recipes.map(r => {
        if (r.id === selectedRecipe.id) {
          return { ...r, imageUrl: newImageUrl };
        }
        return r;
      });
      setRecipes(updatedRecipes);
      
      toast({
        title: "Success",
        description: `Image updated for "${selectedRecipe.title}"`,
      });
      
      setImageDialogOpen(false);
    } catch (error) {
      console.error("Error updating recipe image:", error);
      toast({
        title: "Error",
        description: "Failed to update recipe image",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const confirmDelete = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteRecipe(recipeToDelete.id);
      
      setRecipes(recipes.filter(r => r.id !== recipeToDelete.id));
      
      setRecipeIngredients(prev => {
        const newState = {...prev};
        delete newState[recipeToDelete.id];
        return newState;
      });
      
      setRecipeSteps(prev => {
        const newState = {...prev};
        delete newState[recipeToDelete.id];
        return newState;
      });
      
      toast({
        title: "Success",
        description: `"${recipeToDelete.title}" has been deleted`,
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error(`Error deleting recipe ${recipeToDelete.title}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete "${recipeToDelete.title}"`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setRecipeToDelete(null);
    }
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const resetFilters = () => {
    setFilterCategory('');
    setFilterDifficulty('');
    setSortBy('title-asc');
  };

  const applySort = (recipes: Recipe[]): Recipe[] => {
    const [field, direction] = sortBy.split('-');
    
    return [...recipes].sort((a, b) => {
      let comparison = 0;
      
      if (field === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (field === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (field === 'difficulty') {
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const filteredAndSortedRecipes = (() => {
    let result = [...recipes];
    
    if (searchTerm) {
      result = result.filter(recipe => 
        recipe?.title ? recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) : false
      );
    }
    
    if (filterCategory) {
      result = result.filter(recipe => recipe.category === filterCategory);
    }
    
    if (filterDifficulty) {
      result = result.filter(recipe => recipe.difficulty === filterDifficulty);
    }
    
    return applySort(result);
  })();

  return (
    <div className="container mx-auto p-4 max-w-6xl pb-20 bg-gradient-to-br from-amber-50 to-orange-50">
      <Link to="/admin" className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={16} />
        <span>Back to admin page</span>
      </Link>
      
      <Card className="border-kusina-orange/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-kusina-orange/10 to-transparent">
          <CardTitle className="text-kusina-brown text-2xl">Recipe Management</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="text-kusina-orange" size={18} />
              <Input 
                type="text" 
                placeholder="Search recipes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-kusina-orange/20 focus-visible:ring-kusina-orange/30"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFilters}
                className="border-kusina-orange/20 text-kusina-orange hover:bg-kusina-orange/10"
              >
                <Filter size={18} />
              </Button>
            </div>
            
            {filtersVisible && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-kusina-cream/20 rounded-md border border-kusina-orange/20 animate-in fade-in-50 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-kusina-brown">Category</label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="border-kusina-orange/20">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-kusina-brown">Difficulty</label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="border-kusina-orange/20">
                      <SelectValue placeholder="All difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All difficulties</SelectItem>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-kusina-brown">Sort by</label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="border-kusina-orange/20">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                      <SelectItem value="category-desc">Category (Z-A)</SelectItem>
                      <SelectItem value="difficulty-asc">Difficulty (Easy-Hard)</SelectItem>
                      <SelectItem value="difficulty-desc">Difficulty (Hard-Easy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1 md:col-span-3 flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="border-kusina-orange/20 text-kusina-orange hover:bg-kusina-orange/10"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-kusina-orange" />
            </div>
          ) : (
            <div className="border rounded-md border-kusina-orange/20">
              <Table>
                <TableHeader className="bg-kusina-cream/30">
                  <TableRow>
                    <TableHead className="w-[300px]">Recipe</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRecipes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No recipes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedRecipes.map(recipe => (
                      <React.Fragment key={recipe.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-kusina-cream/20"
                        >
                          <TableCell className="font-medium flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-md overflow-hidden shrink-0 hover:ring-2 hover:ring-kusina-orange/50 transition-all cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageDialog(recipe);
                              }}
                            >
                              <img 
                                src={recipe.imageUrl} 
                                alt={recipe.title} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://images.unsplash.com/photo-1617611647086-baf8019744ab?q=80&w=2070"; // Fallback image
                                }}
                              />
                            </div>
                            <span 
                              className="text-kusina-brown"
                              onClick={() => toggleRecipeExpansion(recipe.id)}
                            >{recipe.title}</span>
                          </TableCell>
                          <TableCell onClick={() => toggleRecipeExpansion(recipe.id)}>
                            <Badge variant="outline" className="border-kusina-green/50 text-kusina-green">{recipe.category}</Badge>
                          </TableCell>
                          <TableCell onClick={() => toggleRecipeExpansion(recipe.id)}>{recipe.difficulty}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="icon"
                              className="mr-2 text-kusina-orange border-kusina-orange/30 hover:bg-kusina-orange/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageDialog(recipe);
                              }}
                            >
                              <Image className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                regenerateRecipeData(recipe);
                              }}
                              disabled={regenerating[recipe.id]}
                              className="text-kusina-brown hover:text-kusina-red"
                            >
                              {regenerating[recipe.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => confirmDelete(recipe, e)}
                              className="text-kusina-brown hover:text-kusina-red"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleRecipeExpansion(recipe.id)}
                              className="text-kusina-brown hover:text-kusina-brown/70"
                            >
                              {expandedRecipe === recipe.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {expandedRecipe === recipe.id && (
                          <TableRow>
                            <TableCell colSpan={4} className="p-0">
                              <div className="px-4 py-3 bg-kusina-cream/20">
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

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-kusina-brown">Update Recipe Image</DialogTitle>
            <DialogDescription>
              Enter a new image URL for {selectedRecipe?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                ref={imageUrlInputRef}
                placeholder="Image URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 border-kusina-orange/20"
              />
              <Button 
                type="button" 
                onClick={handlePreviewImage}
                variant="outline"
                className="border-kusina-orange/20 text-kusina-orange hover:bg-kusina-orange/10"
              >
                Preview
              </Button>
            </div>
            
            {imagePreview && (
              <div className="relative aspect-video rounded-md overflow-hidden border border-kusina-orange/20">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1617611647086-baf8019744ab?q=80&w=2070"; // Fallback image
                    toast({
                      title: "Image Error",
                      description: "This image URL is invalid. Please try another.",
                      variant: "destructive"
                    });
                  }}
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setImageDialogOpen(false)}
              className="border-kusina-red/30 text-kusina-red hover:bg-kusina-red/10"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateImage} 
              disabled={isUpdatingImage || !newImageUrl.trim()}
              className="bg-kusina-green text-white hover:bg-kusina-green/80"
            >
              {isUpdatingImage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Update Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-kusina-red">Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipeToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-kusina-brown/30 text-kusina-brown hover:bg-kusina-brown/10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecipe}
              disabled={isDeleting}
              className="bg-kusina-red text-white hover:bg-kusina-red/80"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRecipesPage;
