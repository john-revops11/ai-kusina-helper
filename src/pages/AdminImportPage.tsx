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
  Plus,
  Trash2,
  FileWarning,
  Download,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { database, ref, set, remove } from '@/services/firebase';
import { toast } from "sonner";
import { databasePopulationService } from '@/services/databasePopulationService';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { convertToDownloadableJSON, recipeImportTemplate } from '@/data/mockData';
import { aiJsonRepairService } from '@/services/aiJsonRepairService';
import { aiProviderService } from '@/services/aiProviderService';

type ImportedRecipe = {
  recipeName: string;
  description: string;
  culture: string;
  category: string;
  imageUrl: string;
  prepTime?: string;
  cookTime?: string;
  difficulty?: string;
  servings?: number;
  steps: string[];
  ingredients: {
    ingredientName: string;
    quantity: string;
    unit: string;
  }[];
};

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
  const [duplicateRecipes, setDuplicateRecipes] = useState<string[]>([]);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [isFixingWithAI, setIsFixingWithAI] = useState(false);

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

  const validateJsonData = (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      
      if (!Array.isArray(parsedData)) {
        setValidationResult({
          isValid: false,
          message: 'Data must be an array of recipes'
        });
        return;
      }
      
      if (parsedData.length === 0) {
        setValidationResult({
          isValid: false,
          message: 'No recipes found in the data'
        });
        return;
      }
      
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
      
      checkForDuplicates(parsedData);
      
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

  const checkForDuplicates = async (recipes: ImportedRecipe[]) => {
    try {
      let duplicateCount = 0;
      const duplicateNames: string[] = [];
      
      for (const recipe of recipes) {
        const exists = await databasePopulationService.recipeExists(recipe.recipeName);
        if (exists) {
          duplicateCount++;
          duplicateNames.push(recipe.recipeName);
        }
      }
      
      setDupesFound(duplicateCount);
      setDuplicateRecipes(duplicateNames);
      
      if (duplicateCount > 0) {
        toast.info(`Found ${duplicateCount} recipe(s) that already exist in the database.`);
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    }
  };

  const deduplicateRecipes = () => {
    if (!jsonData || !validationResult?.isValid) {
      toast("Please provide valid JSON data first");
      return;
    }
    
    setIsDeduplicating(true);
    
    try {
      const recipes = JSON.parse(jsonData) as ImportedRecipe[];
      
      const uniqueRecipes = recipes.filter(recipe => !duplicateRecipes.includes(recipe.recipeName));
      
      if (uniqueRecipes.length === recipes.length) {
        toast.info('No duplicates to remove');
        setIsDeduplicating(false);
        return;
      }
      
      const newJsonData = JSON.stringify(uniqueRecipes, null, 2);
      setJsonData(newJsonData);
      
      setValidationResult({
        isValid: true,
        message: 'Data validation successful',
        recipeCount: uniqueRecipes.length
      });
      
      setDupesFound(0);
      setDuplicateRecipes([]);
      
      toast.success(`Removed ${recipes.length - uniqueRecipes.length} duplicate recipes`);
    } catch (error) {
      console.error('Error deduplicating recipes:', error);
      toast("Failed to deduplicate recipes");
    } finally {
      setIsDeduplicating(false);
    }
  };

  const importRecipes = async () => {
    if (!jsonData || !validationResult?.isValid) {
      toast("Please provide valid JSON data first");
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
          const exists = await databasePopulationService.recipeExists(recipe.recipeName);
          const existingRecipeId = await databasePopulationService.findExistingRecipeId(recipe.recipeName);
          
          if (exists && existingRecipeId) {
            if (importMode === 'update') {
              await importSingleRecipe(recipe, existingRecipeId);
              console.log(`Updated recipe: ${recipe.recipeName} with ID: ${existingRecipeId}`);
              toast.info(`Updated "${recipe.recipeName}"`);
              updateCount++;
            } else if (importMode === 'create-new') {
              const newId = await importSingleRecipe(recipe);
              console.log(`Created new instance of recipe: ${recipe.recipeName} with new ID: ${newId}`);
              toast.success(`Added "${recipe.recipeName}" as a new entry`);
              successCount++;
            } else if (!overwriteExisting) {
              toast.info(`Skipping "${recipe.recipeName}" as it already exists`);
              skipCount++;
              continue;
            }
          } else {
            const newId = await importSingleRecipe(recipe);
            console.log(`Added new recipe: ${recipe.recipeName} with ID: ${newId}`);
            toast.success(`Added new recipe: "${recipe.recipeName}"`);
            successCount++;
          }
        } catch (error) {
          console.error(`Error importing recipe ${recipe.recipeName}:`, error);
          toast.error(`Failed to import "${recipe.recipeName}"`);
          errorCount++;
        }
      }
      
      toast.success(`Import completed: ${successCount} added, ${updateCount} updated, ${skipCount} skipped, ${errorCount} failed`);
    } catch (error) {
      console.error('Error during import:', error);
      toast.error("Failed to import recipes");
    } finally {
      setIsProcessing(false);
    }
  };

  const importSingleRecipe = async (importedRecipe: ImportedRecipe, existingId?: string) => {
    const recipeId = existingId || databasePopulationService.generateId();
    
    console.log(`Importing recipe "${importedRecipe.recipeName}" with ID: ${recipeId}, existing: ${!!existingId}`);
    
    if (existingId && overwriteExisting && importMode === 'update') {
      console.log(`Completely overwriting existing recipe: ${existingId}`);
      await databasePopulationService.deleteExistingRecipe(existingId);
    }
    
    const recipeData = {
      id: recipeId,
      title: importedRecipe.recipeName,
      description: importedRecipe.description,
      category: importedRecipe.category,
      prepTime: importedRecipe.prepTime || '30 mins',
      cookTime: importedRecipe.cookTime || '45 mins',
      difficulty: importedRecipe.difficulty || 'Medium' as 'Easy' | 'Medium' | 'Hard',
      servings: importedRecipe.servings || 4,
      imageUrl: importedRecipe.imageUrl || `https://source.unsplash.com/random/?philippine,${importedRecipe.recipeName.toLowerCase().replace(/ /g, ',')}`,
      instructions: importedRecipe.steps.join('\n')
    };
    
    await set(ref(database, `recipes/${recipeId}`), recipeData);
    
    const ingredients = {};
    for (const importedIngredient of importedRecipe.ingredients) {
      const ingredientId = databasePopulationService.generateId();
      ingredients[ingredientId] = {
        id: ingredientId,
        name: importedIngredient.ingredientName,
        quantity: importedIngredient.quantity,
        unit: importedIngredient.unit || '',
        hasSubstitutions: false
      };
    }
    await set(ref(database, `ingredients/${recipeId}`), ingredients);
    
    const steps = {};
    importedRecipe.steps.forEach((step, index) => {
      const stepId = databasePopulationService.generateId();
      steps[stepId] = {
        id: stepId,
        number: index + 1,
        instruction: step,
        timeInMinutes: 5,
        isCritical: index === 0
      };
    });
    await set(ref(database, `steps/${recipeId}`), steps);
    
    return recipeId;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const data = e.target.value;
    setJsonData(data);
    if (data.trim()) {
      validateJsonData(data);
    } else {
      setValidationResult(null);
      setDupesFound(0);
      setDuplicateRecipes([]);
    }
  };

  const downloadTemplate = () => {
    setIsGeneratingTemplate(true);
    try {
      const jsonString = convertToDownloadableJSON();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'recipe_template.json';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Template downloaded successfully');
      }, 100);
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template');
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const fillWithTemplateData = () => {
    const templateJson = JSON.stringify(recipeImportTemplate.recipes, null, 2);
    setJsonData(templateJson);
    validateJsonData(templateJson);
  };

  const handleFixWithAI = async () => {
    if (!jsonData) {
      toast("Please provide JSON data first");
      return;
    }
    
    setIsFixingWithAI(true);
    
    try {
      const currentProvider = aiProviderService.getCurrentProvider();
      toast(`Using ${currentProvider} to fix JSON data...`);
      
      const fixedJson = await aiJsonRepairService.repairJson(jsonData);
      
      setJsonData(fixedJson);
      
      validateJsonData(fixedJson);
      
      toast.success("AI successfully repaired the JSON data");
    } catch (error) {
      console.error("Error fixing JSON with AI:", error);
      toast.error("Failed to repair JSON with AI", {
        description: (error as Error).message
      });
    } finally {
      setIsFixingWithAI(false);
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
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Template</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadTemplate}
                disabled={isGeneratingTemplate}
                className="flex items-center gap-2"
              >
                {isGeneratingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Download Template
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fillWithTemplateData}
                className="flex items-center gap-2"
              >
                <FileText size={14} />
                View Example
              </Button>
            </div>
          </div>
          
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
    "prepTime": "30 mins",
    "cookTime": "45 mins", 
    "difficulty": "Easy|Medium|Hard",
    "servings": 4,
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
              <div className="flex items-center gap-2">
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
                
                {validationResult && !validationResult.isValid && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleFixWithAI}
                    disabled={isFixingWithAI || !jsonData}
                  >
                    {isFixingWithAI ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Wand2 size={16} />
                    )}
                    Fix with AI
                  </Button>
                )}
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
                  
                  {dupesFound > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 bg-white" 
                      onClick={deduplicateRecipes}
                      disabled={isDeduplicating}
                    >
                      {isDeduplicating ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Removing duplicates...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remove duplicate recipes from import
                        </>
                      )}
                    </Button>
                  )}
                  
                  {duplicateRecipes.length > 0 && (
                    <div className="mt-2 text-xs text-amber-700">
                      <div className="flex items-center gap-1 font-medium">
                        <FileWarning size={12} />
                        <span>Duplicate recipes:</span>
                      </div>
                      <ul className="mt-1 space-y-1 pl-4 list-disc">
                        {duplicateRecipes.map((recipe, index) => (
                          <li key={index}>{recipe}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
