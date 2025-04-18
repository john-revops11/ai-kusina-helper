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
  SortDesc,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';
import { 
  fetchRecipes, 
  fetchIngredientsByRecipeId,
  fetchRecipeSteps,
  updateRecipeImage,
  deleteRecipe,
  fetchCategories,
  removeDuplicateRecipes
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
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const [duplicateRemovalDialogOpen, setDuplicateRemovalDialogOpen] = useState(false);
  const [removedDuplicates, setRemovedDuplicates] = useState<string[]>([]);
  
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [bulkActionDialogOpen, setBlkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'regenerate' | 'delete' | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
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
      toast("Failed to load recipes");
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
      toast("Failed to load recipe details");
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
      toast(`Regenerating data for "${recipe.title}"...`);
      
      await databasePopulationService.populateSingleRecipe(recipe.title, true);
      
      toast(`"${recipe.title}" data has been regenerated with enhanced accuracy`);
      
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
      toast(`Failed to regenerate "${recipe.title}" data`);
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
      
      toast(`Image updated for "${selectedRecipe.title}"`);
      
      setImageDialogOpen(false);
    } catch (error) {
      console.error("Error updating recipe image:", error);
      toast("Failed to update recipe image");
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
      
      toast(`"${recipeToDelete.title}" has been deleted`);
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error(`Error deleting recipe ${recipeToDelete.title}:`, error);
      toast(`Failed to delete "${recipeToDelete.title}"`);
    } finally {
      setIsDeleting(false);
      setRecipeToDelete(null);
    }
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const resetFilters = () => {
    setFilterCategory('all');
    setFilterDifficulty('all');
    setSortBy('title-asc');
  };

  const applySort = (recipes: Recipe[]): Recipe[] => {
    const [field, direction] = sortBy.split('-');
    
    return [...recipes].sort((a, b) => {
      let comparison = 0;
      
      if (field === 'title') {
        const titleA = a.title || '';
        const titleB = b.title || '';
        comparison = titleA.localeCompare(titleB);
      } else if (field === 'category') {
        const categoryA = a.category || '';
        const categoryB = b.category || '';
        comparison = categoryA.localeCompare(categoryB);
      } else if (field === 'difficulty') {
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        const diffA = a.difficulty ? difficultyOrder[a.difficulty] || 0 : 0;
        const diffB = b.difficulty ? difficultyOrder[b.difficulty] || 0 : 0;
        comparison = diffA - diffB;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const handleRemoveDuplicates = async () => {
    setDuplicateRemovalDialogOpen(true);
  };

  const confirmRemoveDuplicates = async () => {
    setIsRemovingDuplicates(true);
    try {
      const result = await removeDuplicateRecipes();
      
      if (result.removed > 0) {
        setRemovedDuplicates(result.recipeNames);
        toast(`Removed ${result.removed} duplicate recipes`);
        
        await loadRecipes();
      } else {
        toast("No duplicate recipes were found in the database");
      }
      
      setDuplicateRemovalDialogOpen(false);
    } catch (error) {
      console.error("Error removing duplicate recipes:", error);
      toast("Failed to remove duplicate recipes");
    } finally {
      setIsRemovingDuplicates(false);
    }
  };

  const getLocalFallbackImage = () => {
    return "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f5f5f5'/%3e%3cpath d='M30,40 L70,40 L70,60 L30,60 Z' fill='%23ccc'/%3e%3cpath d='M50,30 C55.5228,30 60,34.4772 60,40 C60,45.5228 55.5228,50 50,50 C44.4772,50 40,45.5228 40,40 C40,34.4772 44.4772,30 50,30 Z' fill='%23ccc'/%3e%3cpath d='M70,60 C70,50 80,50 80,60 L80,70 L70,70 Z' fill='%23ccc'/%3e%3cpath d='M30,60 C30,50 20,50 20,60 L20,70 L30,70 Z' fill='%23ccc'/%3e%3c/svg%3e";
  };

  const toggleSelectRecipe = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecipes(prev => {
      if (prev.includes(recipeId)) {
        return prev.filter(id => id !== recipeId);
      } else {
        return [...prev, recipeId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedRecipes.length === filteredAndSortedRecipes.length) {
      setSelectedRecipes([]);
    } else {
      setSelectedRecipes(filteredAndSortedRecipes.map(recipe => recipe.id));
    }
  };

  const openBulkActionDialog = (action: 'regenerate' | 'delete') => {
    if (selectedRecipes.length === 0) {
      toast("Please select at least one recipe first");
      return;
    }
    
    setBulkAction(action);
    setBlkActionDialogOpen(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedRecipes.length === 0) return;
    
    setIsBulkProcessing(true);
    
    try {
      if (bulkAction === 'regenerate') {
        for (const recipeId of selectedRecipes) {
          const recipe = recipes.find(r => r.id === recipeId);
          if (recipe) {
            toast(`Regenerating data for "${recipe.title}"...`);
            
            await databasePopulationService.populateSingleRecipe(recipe.title, true);
          }
        }
        
        toast(`${selectedRecipes.length} recipes have been regenerated`);
        
      } else if (bulkAction === 'delete') {
        for (const recipeId of selectedRecipes) {
          await deleteRecipe(recipeId);
        }
        
        setRecipes(prev => prev.filter(recipe => !selectedRecipes.includes(recipe.id)));
        
        setRecipeIngredients(prev => {
          const newState = {...prev};
          selectedRecipes.forEach(id => delete newState[id]);
          return newState;
        });
        
        setRecipeSteps(prev => {
          const newState = {...prev};
          selectedRecipes.forEach(id => delete newState[id]);
          return newState;
        });
        
        toast(`${selectedRecipes.length} recipes have been deleted`);
      }
      
      setSelectedRecipes([]);
      await loadRecipes();
      
    } catch (error) {
      console.error(`Error performing bulk action:`, error);
      toast(`Failed to ${bulkAction} recipes`);
    } finally {
      setIsBulkProcessing(false);
      setBlkActionDialogOpen(false);
      setBulkAction(null);
    }
  };

  const getFilteredAndSortedRecipes = () => {
    let result = [...recipes];
    
    if (searchTerm) {
      result = result.filter(recipe => 
        recipe?.title ? recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) : false
      );
    }
    
    if (filterCategory && filterCategory !== 'all') {
      result = result.filter(recipe => recipe?.category === filterCategory);
    }
    
    if (filterDifficulty && filterDifficulty !== 'all') {
      result = result.filter(recipe => recipe?.difficulty === filterDifficulty);
    }
    
    return applySort(result);
  };
  
  const filteredAndSortedRecipes = getFilteredAndSortedRecipes();

  return (
    <div className="container mx-auto p-4 max-w-6xl pb-20 bg-gradient-to-br from-amber-50 to-orange-50">
      <Link to="/admin" className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={16} />
        <span>Back to admin page</span>
      </Link>
      
      <Card className="border-kusina-orange/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-kusina-orange/10 to-transparent">
          <CardTitle className="text-kusina-brown text-2xl">Recipe Management</CardTitle>
          <CardDescription>
            Manage your recipes, remove duplicates, and update recipe information.
          </CardDescription>
          <div className="flex justify-between mt-4">
            <div className="flex items-center gap-2">
              {selectedRecipes.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedRecipes.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openBulkActionDialog('regenerate')}
                    className="border-kusina-orange/20 text-kusina-orange hover:bg-kusina-orange/10"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm" 
                    onClick={() => openBulkActionDialog('delete')}
                    className="border-kusina-red/20 text-kusina-red hover:bg-kusina-red/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </>
              )}
            </div>
            <Button
              onClick={handleRemoveDuplicates}
              className="bg-kusina-orange text-white hover:bg-kusina-orange/80"
              disabled={isRemovingDuplicates}
            >
              {isRemovingDuplicates ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Remove Duplicate Recipes
            </Button>
          </div>
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
                      <SelectItem value="all">All categories</SelectItem>
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
                      <SelectItem value="all">All difficulties</SelectItem>
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
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedRecipes.length > 0 && selectedRecipes.length === filteredAndSortedRecipes.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all recipes"
                      />
                    </TableHead>
                    <TableHead className="w-[300px]">Recipe</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedRecipes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No recipes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedRecipes.map(recipe => (
                      <React.Fragment key={recipe.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-kusina-cream/20"
                        >
                          <TableCell onClick={(e) => e.stopPropagation()} className="p-0 pl-4">
                            <Checkbox 
                              checked={selectedRecipes.includes(recipe.id)}
                              onCheckedChange={(checked) => {
                                if (checked !== "indeterminate") {
                                  toggleSelectRecipe(recipe.id, { stopPropagation: () => {} } as React.MouseEvent);
                                }
                              }}
                              aria-label={`Select ${recipe.title}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-md overflow-hidden shrink-0 hover:ring-2 hover:ring-kusina-orange/50 transition-all cursor-pointer bg-gray-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageDialog(recipe);
                              }}
                            >
                              <img
                                src={recipe.imageUrl || getLocalFallbackImage()}
                                alt={recipe.title}
                                className="object-cover w-full h-full"
                                onError={(e: any) => {
                                  e.target.src = getLocalFallbackImage();
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
                            <TableCell colSpan={5} className="p-0">
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
              <div className="relative aspect-video rounded-md overflow-hidden border border-kusina-orange/20 bg-gray-300">
                <img
                  src={imagePreview}
                  alt="Image Preview"
                  className="object-cover w-full h-full"
                  onError={(e: any) => {
                    e.target.src = getLocalFallbackImage();
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
              className="border-kusina-orange/20 text-kusina-orange"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecipe}
              className="bg-kusina-red text-white hover:bg-kusina-red/80"
              disabled={isDeleting}
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
      
      <AlertDialog open={duplicateRemovalDialogOpen} onOpenChange={setDuplicateRemovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-kusina-orange">Remove Duplicate Recipes</AlertDialogTitle>
            <AlertDialogDescription>
              This will scan your recipe database for duplicates and keep only the most recent version of each recipe. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-kusina-orange/20 text-kusina-orange"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveDuplicates}
              className="bg-kusina-orange text-white hover:bg-kusina-orange/80"
              disabled={isRemovingDuplicates}
            >
              {isRemovingDuplicates ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Remove Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBlkActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={bulkAction === 'delete' ? 'text-kusina-red' : 'text-kusina-orange'}>
              {bulkAction === 'delete' ? 'Delete Selected Recipes' : 'Regenerate Selected Recipes'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'delete' 
                ? `This will delete ${selectedRecipes.length} selected recipe(s). This action cannot be undone.`
                : `This will regenerate ${selectedRecipes.length} selected recipe(s) with enhanced accuracy.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-kusina-orange/20 text-kusina-orange"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              className={bulkAction === 'delete' ? 'bg-kusina-red text-white hover:bg-kusina-red/80' : 'bg-kusina-orange text-white hover:bg-kusina-orange/80'}
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : bulkAction === 'delete' ? (
                <Trash2 className="mr-2 h-4 w-4" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {bulkAction === 'delete' ? 'Delete' : 'Regenerate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRecipesPage;
