
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bug, Check, FileWarning } from 'lucide-react';
import { geminiService } from '@/services/geminiService';
import { openaiService } from '@/services/openaiService';
import { toast } from 'sonner';

interface RecipeDataDebuggerProps {
  className?: string;
}

// Sample recipe data in new format for testing
const sampleNewFormat = [
  {
    recipeName: "Adobo",
    description: "Filipino Adobo is a savory stew of meat...",
    culture: "Filipino",
    category: "Main Dish",
    imageUrl: "https://source.unsplash.com/random/?filipino,adobo",
    steps: [
      "Combine the meat, soy sauce, vinegar...",
      "Bring the pot to a boil, then reduce heat..."
    ],
    ingredients: [
      {
        ingredientName: "Pork belly",
        quantity: "1",
        unit: "kg"
      },
      {
        ingredientName: "Soy sauce",
        quantity: "1/2",
        unit: "cup"
      }
    ]
  }
];

// Sample recipe data in expected app format for comparison
const sampleExpectedFormat = {
  recipe: {
    title: "Adobo",
    description: "Filipino Adobo is a savory stew of meat...",
    category: "Main Dish",
    difficulty: "Medium",
    prepTime: "30 mins",
    cookTime: "45 mins",
    servings: 4,
    instructions: "Combine the meat, soy sauce, vinegar... Bring the pot to a boil, then reduce heat..."
  },
  ingredients: [
    {
      name: "Pork belly",
      quantity: "1",
      unit: "kg",
      hasSubstitutions: false,
      isOptional: false
    },
    {
      name: "Soy sauce",
      quantity: "1/2",
      unit: "cup",
      hasSubstitutions: false,
      isOptional: false
    }
  ],
  steps: [
    {
      number: 1,
      instruction: "Combine the meat, soy sauce, vinegar...",
      timeInMinutes: 5,
      isCritical: true
    },
    {
      number: 2,
      instruction: "Bring the pot to a boil, then reduce heat...",
      timeInMinutes: 5,
      isCritical: false
    }
  ]
};

const RecipeDataDebugger: React.FC<RecipeDataDebuggerProps> = ({ className }) => {
  const [newFormatData, setNewFormatData] = useState<string>(JSON.stringify(sampleNewFormat, null, 2));
  const [expectedFormatData, setExpectedFormatData] = useState<string>(JSON.stringify(sampleExpectedFormat, null, 2));
  const [transformedData, setTransformedData] = useState<string>("");
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformError, setTransformError] = useState<string | null>(null);

  const handleTransform = async () => {
    setIsTransforming(true);
    setTransformError(null);

    try {
      let parsedInput;
      try {
        parsedInput = JSON.parse(newFormatData);
      } catch (e) {
        throw new Error("Invalid JSON in new format data");
      }

      let result;
      if (aiProvider === 'gemini') {
        result = geminiService.transformToExpectedFormat(parsedInput);
      } else {
        result = openaiService.transformToExpectedFormat(parsedInput);
      }

      setTransformedData(JSON.stringify(JSON.parse(result), null, 2));
      toast.success("Data successfully transformed");
    } catch (error) {
      console.error("Transformation error:", error);
      setTransformError(error instanceof Error ? error.message : "Unknown error during transformation");
      toast.error("Failed to transform data", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-amber-500" />
            <CardTitle>Recipe Data Format Debugger</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={aiProvider === 'gemini' ? 'default' : 'outline'}
              onClick={() => setAiProvider('gemini')}
            >
              Gemini
            </Button>
            <Button 
              size="sm" 
              variant={aiProvider === 'openai' ? 'default' : 'outline'}
              onClick={() => setAiProvider('openai')}
            >
              OpenAI
            </Button>
          </div>
        </div>
        <CardDescription>
          Debug and test the data transformation between different recipe formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="data">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="data">Data Transformation</TabsTrigger>
            <TabsTrigger value="compare">Field Mapping</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">New Data Format (Input)</h3>
                <ScrollArea className="h-64 border rounded-md">
                  <div className="p-2">
                    <textarea 
                      className="w-full h-60 font-mono text-xs bg-transparent resize-none focus:outline-none"
                      value={newFormatData}
                      onChange={(e) => setNewFormatData(e.target.value)}
                    />
                  </div>
                </ScrollArea>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Transformed Result (Output)</h3>
                <ScrollArea className="h-64 border rounded-md">
                  <div className="p-2">
                    <textarea 
                      className="w-full h-60 font-mono text-xs bg-transparent resize-none focus:outline-none"
                      value={transformedData}
                      readOnly
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                {transformError && (
                  <div className="flex items-center text-xs text-red-500 gap-1">
                    <FileWarning className="h-3 w-3" />
                    <span>{transformError}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleTransform}
                  disabled={isTransforming}
                >
                  {isTransforming ? 'Transforming...' : 'Transform Data'}
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              <p>This tool helps verify that the recipe data transformation works correctly between formats.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="compare">
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">New Format Field</TableHead>
                    <TableHead className="w-[200px]">App Format Field</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">recipeName</TableCell>
                    <TableCell className="font-mono text-xs">recipe.title</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" /> Direct mapping
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">description</TableCell>
                    <TableCell className="font-mono text-xs">recipe.description</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" /> Direct mapping
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">category</TableCell>
                    <TableCell className="font-mono text-xs">recipe.category</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" /> Direct mapping
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">-</TableCell>
                    <TableCell className="font-mono text-xs">recipe.difficulty</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Defaults to "Medium"
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">-</TableCell>
                    <TableCell className="font-mono text-xs">recipe.prepTime</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Calculated from steps
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">-</TableCell>
                    <TableCell className="font-mono text-xs">recipe.cookTime</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Calculated from steps
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">steps[i]</TableCell>
                    <TableCell className="font-mono text-xs">recipe.instructions</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        Joined with periods
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">ingredients[i].ingredientName</TableCell>
                    <TableCell className="font-mono text-xs">ingredients[i].name</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" /> Renamed mapping
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">ingredients[i].quantity</TableCell>
                    <TableCell className="font-mono text-xs">ingredients[i].quantity</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" /> Direct mapping
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">ingredients[i].unit</TableCell>
                    <TableCell className="font-mono text-xs">ingredients[i].unit</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" /> Direct mapping
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">steps[i] (string)</TableCell>
                    <TableCell className="font-mono text-xs">steps[i].instruction (object)</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        Transformed to object structure
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="text-xs text-muted-foreground mt-2">
                <p>This table shows how fields are mapped between the new array-based format and the application's expected format.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RecipeDataDebugger;
