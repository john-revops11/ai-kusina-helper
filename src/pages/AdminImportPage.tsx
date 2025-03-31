
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Upload, 
  FileText, 
  Loader2,
  AlertCircle,
  Check,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { database, ref, set, remove } from '@/services/firebase';
import { toast } from "sonner";
import { databasePopulationService } from '@/services/databasePopulationService';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Define the expected structure for imported data
type ImportedRecipe = {
  recipeName: string;
  description: string;
  culture: string;
  category: string;
  imageUrl: string;
  steps: string[];
  ingredients: {
    ingredientName: string;
    quantity: string;
    unit: string;
  }[];
};

// Import mode options
type ImportMode = 'update' | 'create-new';

const AdminImportPage = () => {
  const [jsonData, setJsonData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    recipeCount?: number;
  } | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [dupesFound, setDupesFound] = useState(0);
  const [importMode, setImportMode] = useState<ImportMode>('update');

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonData(content);
      validateJsonData(content);
    };
    reader.readAsText(file);
  };

  // Validate JSON data
  const validateJsonData = (data: string) => {
    try {
      // Try to parse the JSON
      const parsedData = JSON.parse(data);
      
      // Check if it's an array
      if (!Array.isArray(parsedData)) {
        setValidationResult({
          isValid: false,
          message: 'Data must be an array of recipes'
        });
        return;
      }
      
      // Check if array has items
      if (parsedData.length === 0) {
        setValidationResult({
          isValid: false,
          message: 'No recipes found in the data'
        });
        return;
      }
      
      // Basic structure validation
      let isValid = true;
      let missingFields: string[] = [];
      
      for (const recipe of parsedData) {
        if (!recipe.recipeName) missingFields.push('recipeName');
        if (!recipe.description) missingFields.push('description');
        if (!recipe.category) missingFields.push('category');
        if (!Array.isArray(recipe.steps)) missingFields.push('steps (array)');
        if (!Array.isArray(recipe.ingredients)) missingFields.push('ingredients (array)');
      }
      
      if (missingFields.length > 0) {
        setValidationResult({
          isValid: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }
      
      // Check for potential duplicates
      checkForDuplicates(parsedData);
      
      // Success
      setValidationResult({
        isValid: true,
        message: 'Data validation successful',
        recipeCount: parsedData.length
      });
      
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: `Invalid JSON format: ${(error as Error).message}`
      });
    }
  };

  // Check for potential duplicate recipes in the database
  const checkForDuplicates = async (recipes: ImportedRecipe[]) => {
    try {
      let duplicateCount = 0;
      for (const recipe of recipes) {
        const exists = await databasePopulationService.recipeExists(recipe.recipeName);
        if (exists) {
          duplicateCount++;
        }
      }
      
      setDupesFound(duplicateCount);
      
      if (duplicateCount > 0) {
        toast.info(`Found ${duplicateCount} recipe(s) that already exist in the database.`);
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    }
  };

  // Process validated data and import to Firebase
  const importRecipes = async () => {
    if (!jsonData || !validationResult?.isValid) {
      toast.error('Please provide valid JSON data first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const recipes = JSON.parse(jsonData) as ImportedRecipe[];
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;
      let updateCount = 0;
      
      for (const recipe of recipes) {
        try {
          // Check if recipe exists
          const exists = await databasePopulationService.recipeExists(recipe.recipeName);
          const existingRecipeId = await databasePopulationService.findExistingRecipeId(recipe.recipeName);
          
          if (exists) {
            if (importMode === 'update') {
              // Update the existing recipe
              if (existingRecipeId) {
                await importSingleRecipe(recipe, existingRecipeId);
                toast.info(`Updated "${recipe.recipeName}"`);
                updateCount++;
              }
            } else if (importMode === 'create-new') {
              // Create as new recipe
              const newId = await importSingleRecipe(recipe);
              toast.success(`Added "${recipe.recipeName}" as a new entry`);
              successCount++;
            } else if (!overwriteExisting) {
              // Skip this recipe if it exists and overwrite is off
              toast.info(`Skipping "${recipe.recipeName}" as it already exists`);
              skipCount++;
              continue;
            }
          } else {
            // Recipe doesn't exist, create new
            const newId = await importSingleRecipe(recipe);
            successCount++;
          }
        } catch (error) {
          console.error(`Error importing recipe ${recipe.recipeName}:`, error);
          errorCount++;
        }
      }
      
      toast.success(`Import completed: ${successCount} added, ${updateCount} updated, ${skipCount} skipped, ${errorCount} failed`);
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Failed to import recipes');
    } finally {
      setIsProcessing(false);
    }
  };

  // Import a single recipe to Firebase
  const importSingleRecipe = async (importedRecipe: ImportedRecipe, existingId?: string) => {
    // Check if recipe already exists
    const recipeId = existingId || databasePopulationService.generateId();
    
    // If updating existing recipe and we need to delete first
    if (existingId && overwriteExisting) {
      await databasePopulationService.deleteExistingRecipe(existingId);
    }
    
    // Map the imported recipe to our Firebase structure
    const recipeData = {
      id: recipeId,
      title: importedRecipe.recipeName,
      description: importedRecipe.description,
      category: importedRecipe.category,
      prepTime: '30 mins', // Default values, could be added to import schema
      cookTime: '45 mins',
      difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
      servings: 4,
      imageUrl: importedRecipe.imageUrl || `https://source.unsplash.com/random/?philippine,${importedRecipe.recipeName.toLowerCase().replace(/ /g, ',')}`,
      instructions: importedRecipe.steps.join('\n')
    };
    
    // Store recipe in database
    await set(ref(database, `recipes/${recipeId}`), recipeData);
    
    // Create and store ingredients
    const ingredients = {};
    for (const importedIngredient of importedRecipe.ingredients) {
      const ingredientId = databasePopulationService.generateId();
      ingredients[ingredientId] = {
        id: ingredientId,
        name: importedIngredient.ingredientName,
        quantity: importedIngredient.quantity,
        unit: importedIngredient.unit || '',
        hasSubstitutions: false // Default to false, could be added to import schema
      };
    }
    await set(ref(database, `ingredients/${recipeId}`), ingredients);
    
    // Create and store steps
    const steps = {};
    importedRecipe.steps.forEach((step, index) => {
      const stepId = databasePopulationService.generateId();
      steps[stepId] = {
        id: stepId,
        number: index + 1,
        instruction: step,
        timeInMinutes: 5, // Default value, could be added to import schema
        isCritical: index === 0 // First step is critical by default
      };
    });
    await set(ref(database, `steps/${recipeId}`), steps);
    
    return recipeId;
  };

  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const data = e.target.value;
    setJsonData(data);
    if (data.trim()) {
      validateJsonData(data);
    } else {
      setValidationResult(null);
      setDupesFound(0);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl pb-20">
      <Link to="/admin" className="flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={16} />
        <span>Back to admin page</span>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>Import Recipe Data</CardTitle>
          <CardDescription>
            Import recipe data from JSON format into your database.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p>This utility imports recipe data in bulk from a JSON file or pasted text.</p>
            <p className="mt-2">Expected format:</p>
            <pre className="mt-1 bg-muted/50 p-2 rounded text-xs overflow-auto">
              {`[
  {
    "recipeName": "Recipe Name",
    "description": "Description",
    "culture": "Culture",
    "category": "Category",
    "imageUrl": "https://example.com/image.jpg",
    "steps": ["Step 1", "Step 2"],
    "ingredients": [
      { "ingredientName": "Ingredient 1", "quantity": "1", "unit": "cup" }
    ]
  }
]`}
            </pre>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="jsonData" className="text-sm font-medium block">
              Paste JSON data or upload a file:
            </label>
            
            <Textarea
              id="jsonData"
              placeholder="Paste your JSON recipe data here..."
              value={jsonData}
              onChange={handleTextChange}
              className="font-mono text-sm min-h-[200px]"
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="relative">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="relative">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload JSON File
                </Button>
              </div>
              
              {validationResult && (
                <span className={`text-sm flex items-center gap-1 ${
                  validationResult.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.isValid ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {validationResult.isValid 
                    ? `Valid: ${validationResult.recipeCount} recipes found` 
                    : validationResult.message}
                </span>
              )}
            </div>
          </div>
          
          {validationResult?.isValid && (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <h3 className="text-sm font-medium mb-2">Import Mode:</h3>
                  <ToggleGroup type="single" value={importMode} onValueChange={(value) => value && setImportMode(value as ImportMode)} className="justify-start">
                    <ToggleGroupItem value="update" aria-label="Update existing recipes" className="gap-1.5">
                      <RefreshCw className="h-4 w-4" />
                      <span>Update existing</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="create-new" aria-label="Create all as new recipes" className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      <span>Create all as new</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                {importMode === 'update' && (
                  <div className="flex items-center space-x-2 pt-1">
                    <Switch 
                      id="overwrite" 
                      checked={overwriteExisting}
                      onCheckedChange={setOverwriteExisting}
                    />
                    <Label htmlFor="overwrite" className="cursor-pointer">
                      Completely overwrite existing recipes (deletes and recreates)
                    </Label>
                  </div>
                )}
              </div>
              
              <Alert className={`${dupesFound > 0 ? 'bg-amber-50 border-amber-200' : 'bg-muted'}`}>
                {dupesFound > 0 ? (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertTitle>
                  {dupesFound > 0 
                    ? `Found ${dupesFound} duplicate recipe(s)` 
                    : 'Ready to import'}
                </AlertTitle>
                <AlertDescription>
                  <p>
                    {dupesFound > 0
                      ? importMode === 'update'
                        ? `${validationResult.recipeCount} recipes are ready to be imported. ${dupesFound} existing recipes will be updated.`
                        : `${validationResult.recipeCount} recipes are ready to be imported as new entries, even though ${dupesFound} already exist with the same name.`
                      : `${validationResult.recipeCount} recipes are ready to be imported.`}
                  </p>
                </AlertDescription>
              </Alert>
            </>
          )}
          
          <Button 
            className="w-full" 
            onClick={importRecipes} 
            disabled={isProcessing || !validationResult?.isValid}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing Recipes...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {importMode === 'update' 
                  ? dupesFound > 0 
                    ? `Import & Update Recipes` 
                    : `Import Recipes`
                  : `Import as New Recipes`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImportPage;
