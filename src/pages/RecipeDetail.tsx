
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Utensils, 
  ChevronDown, 
  ChevronUp,
  Volume2, 
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import MobileNavBar from '@/components/MobileNavBar';
import IngredientItem from '@/components/IngredientItem';
import RecipeStepCard from '@/components/RecipeStepCard';
import AIChatBox from '@/components/AIChatBox';
import { 
  fetchRecipeById, 
  fetchIngredientsByRecipeId, 
  fetchRecipeSteps,
  fetchIngredientSubstitutes,
  type RecipeDetail
} from '@/services/recipeService';
import { Ingredient } from '@/components/IngredientItem';
import { RecipeStep } from '@/components/RecipeStepCard';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [timerRunning, setTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showSubstitutes, setShowSubstitutes] = useState<Record<string, boolean>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [substitutes, setSubstitutes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadRecipeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch recipe details
        const recipeData = await fetchRecipeById(id);
        if (recipeData) {
          setRecipe(recipeData);
          
          // Fetch ingredients
          const ingredientsData = await fetchIngredientsByRecipeId(id);
          setIngredients(ingredientsData);
          
          // Fetch recipe steps
          const stepsData = await fetchRecipeSteps(id);
          // Sort steps by number to ensure correct order
          const sortedSteps = stepsData.sort((a, b) => a.number - b.number);
          setSteps(sortedSteps);
          
          // Fetch substitutes for ingredients that have them
          const substitutesPromises = ingredientsData
            .filter(ing => ing.hasSubstitutions)
            .map(async (ing) => {
              const subs = await fetchIngredientSubstitutes(ing.id);
              return { id: ing.id, substitutes: subs };
            });
          
          const substitutesResults = await Promise.all(substitutesPromises);
          const substitutesMap: Record<string, string[]> = {};
          
          substitutesResults.forEach(result => {
            substitutesMap[result.id] = result.substitutes;
          });
          
          setSubstitutes(substitutesMap);
        } else {
          toast({
            title: "Not Found",
            description: "Recipe not found",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error loading recipe data:", error);
        toast({
          title: "Error",
          description: "Failed to load recipe details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipeData();
  }, [id, toast]);

  const toggleIngredientCheck = (id: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSubstitutesView = (id: string) => {
    setShowSubstitutes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const startTimer = () => {
    if (steps[activeStep]) {
      setRemainingTime(steps[activeStep].timeInMinutes * 60);
      setTimerRunning(true);
      // In a real app, we would implement a timer countdown here
    }
  };

  const stopTimer = () => {
    setTimerRunning(false);
  };

  const markStepComplete = (id: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [id]: true
    }));
    
    // Move to next step if available
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  const toggleAiAssistant = () => {
    setAiAssistantOpen(!aiAssistantOpen);
  };

  if (isLoading) {
    return (
      <div className="pb-20 min-h-screen p-4">
        <div className="h-60 bg-muted animate-pulse rounded-md mb-4"></div>
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded-md w-1/2"></div>
          <div className="h-20 bg-muted animate-pulse rounded-md"></div>
          <div className="h-20 bg-muted animate-pulse rounded-md"></div>
        </div>
        <MobileNavBar />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl font-bold">Recipe not found</p>
        <Link to="/" className="mt-4">
          <Button>Back to Home</Button>
        </Link>
        <MobileNavBar />
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <div className="relative h-60">
        <img 
          src={recipe?.imageUrl} 
          alt={recipe?.title} 
          className="w-full h-full object-cover brightness-50"
          loading="eager" // Load header image eagerly for better UX
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1617611647086-baf8019744ab?q=80&w=2070";
          }}
        />
        <Link 
          to="/" 
          className="absolute top-4 left-4 bg-black/30 p-2 rounded-full"
        >
          <ArrowLeft className="text-white" size={20} />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <Badge className="mb-2">{recipe?.category}</Badge>
          <h1 className="text-2xl font-bold mb-1">{recipe?.title}</h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{recipe?.prepTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Utensils size={14} />
              <span>Difficulty: {recipe?.difficulty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Ingredients */}
        <Accordion type="single" collapsible defaultValue="ingredients">
          <AccordionItem value="ingredients" className="border-b-0">
            <AccordionTrigger className="py-2">
              <h2 className="section-title">Ingredients</h2>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1">
                {ingredients.map(ingredient => (
                  <div key={ingredient.id}>
                    <IngredientItem
                      ingredient={ingredient}
                      isChecked={!!checkedIngredients[ingredient.id]}
                      onToggle={() => toggleIngredientCheck(ingredient.id)}
                      onViewSubstitutions={
                        ingredient.hasSubstitutions 
                          ? () => toggleSubstitutesView(ingredient.id) 
                          : undefined
                      }
                      showAddToList={true}
                      onAddToList={() => {
                        toast({
                          description: `${ingredient.name} added to shopping list`
                        });
                        // In a real app, this would add to a shopping list
                      }}
                    />
                    
                    {/* Show substitutes if available and toggled */}
                    {ingredient.hasSubstitutions && showSubstitutes[ingredient.id] && (
                      <div className="ml-8 mt-1 mb-2 p-2 bg-muted rounded-md text-sm">
                        <p className="font-medium text-xs mb-1">Substitutes:</p>
                        <ul className="space-y-1">
                          {substitutes[ingredient.id]?.map((sub, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {sub}</li>
                          )) || (
                            <li className="text-xs text-muted-foreground">Loading substitutes...</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Cooking Steps */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">Cooking Steps</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={toggleVoice}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </Button>
          </div>

          <div className="space-y-4">
            {steps
              .sort((a, b) => a.number - b.number) // Ensure steps are always ordered by number
              .map((step, index) => (
                <RecipeStepCard
                  key={step.id}
                  step={step}
                  isActive={index === activeStep}
                  isCompleted={!!completedSteps[step.id]}
                  onStartTimer={startTimer}
                  onStopTimer={stopTimer}
                  timerRunning={timerRunning && index === activeStep}
                  remainingTime={remainingTime}
                  onToggleVoice={toggleVoice}
                  voiceEnabled={voiceEnabled}
                />
            ))}
          </div>
          
          {activeStep < steps.length && (
            <Button 
              className="w-full mt-4" 
              onClick={() => markStepComplete(steps[activeStep].id)}
            >
              {activeStep === steps.length - 1 ? 'Finish Recipe' : 'Mark Step Complete'}
            </Button>
          )}
        </div>

        {/* AI Assistant Toggle */}
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            className="rounded-full h-12 w-12 shadow-lg flex items-center justify-center"
            onClick={toggleAiAssistant}
          >
            {aiAssistantOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </Button>
        </div>

        {/* AI Assistant Panel */}
        <div 
          className={`fixed bottom-20 left-4 right-4 z-30 transition-transform duration-300 ${
            aiAssistantOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <AIChatBox recipeContext={recipe?.title} />
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default RecipeDetail;
