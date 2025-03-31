import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Utensils, 
  ChevronDown, 
  ChevronUp,
  Volume2, 
  VolumeX,
  RefreshCw,
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
import EnhancedAIChatBox from '@/components/EnhancedAIChatBox';
import { 
  fetchRecipeById, 
  fetchIngredientsByRecipeId, 
  fetchRecipeSteps,
  fetchIngredientSubstitutes,
  type RecipeDetail
} from '@/services/recipeService';
import { Ingredient } from '@/components/IngredientItem';
import { RecipeStep } from '@/components/RecipeStepCard';
import agentOrchestrator from '@/agents';

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
  const [conversationId, setConversationId] = useState<string>('');
  
  const timerRef = useRef<number | null>(null);

  const getLocalPlaceholder = () => {
    return "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect width='100' height='100' fill='%23f5f5f5'/%3e%3cpath d='M30,40 L70,40 L70,60 L30,60 Z' fill='%23ccc'/%3e%3cpath d='M50,30 C55.5228,30 60,34.4772 60,40 C60,45.5228 55.5228,50 50,50 C44.4772,50 40,45.5228 40,40 C40,34.4772 44.4772,30 50,30 Z' fill='%23ccc'/%3e%3cpath d='M70,60 C70,50 80,50 80,60 L80,70 L70,70 Z' fill='%23ccc'/%3e%3cpath d='M30,60 C30,50 20,50 20,60 L20,70 L30,70 Z' fill='%23ccc'/%3e%3c/svg%3e";
  };

  useEffect(() => {
    const loadRecipeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const recipeData = await fetchRecipeById(id);
        if (recipeData) {
          setRecipe(recipeData);
          
          const ingredientsData = await fetchIngredientsByRecipeId(id);
          setIngredients(ingredientsData);
          
          const stepsData = await fetchRecipeSteps(id);
          const sortedSteps = stepsData.sort((a, b) => a.number - b.number);
          setSteps(sortedSteps);
          
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

  useEffect(() => {
    if (recipe) {
      const newConversationId = agentOrchestrator.createNewConversation();
      setConversationId(newConversationId);
    }
  }, [recipe]);

  useEffect(() => {
    if (timerRunning && remainingTime > 0) {
      timerRef.current = window.setTimeout(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    } else if (timerRunning && remainingTime === 0) {
      setTimerRunning(false);
      toast({
        title: "Timer Complete",
        description: `Step ${activeStep + 1} timer is complete!`,
      });
    }
  }, [timerRunning, remainingTime, activeStep, toast]);

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
      if (remainingTime === 0) {
        setRemainingTime(steps[activeStep].timeInMinutes * 60);
      }
      setTimerRunning(true);
    }
  };

  const stopTimer = () => {
    setTimerRunning(false);
  };

  const restartTimer = () => {
    if (steps[activeStep]) {
      setRemainingTime(steps[activeStep].timeInMinutes * 60);
      setTimerRunning(true);
    }
  };

  const markStepComplete = (id: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [id]: true
    }));
    
    if (timerRunning) {
      stopTimer();
    }
    
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
      if (steps[activeStep + 1]?.timeInMinutes) {
        setRemainingTime(steps[activeStep + 1].timeInMinutes * 60);
      }
    }
  };

  const restartCooking = () => {
    setActiveStep(0);
    setCompletedSteps({});
    setTimerRunning(false);
    if (steps[0]?.timeInMinutes) {
      setRemainingTime(steps[0].timeInMinutes * 60);
    } else {
      setRemainingTime(0);
    }
    
    toast({
      description: "Recipe restarted. Starting from the first step.",
    });
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
      <div className="relative h-60 bg-gray-300">
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

      <div className="p-4 space-y-6">
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
                      }}
                    />
                    
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

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">Cooking Steps</h2>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs flex items-center gap-1"
                onClick={restartCooking}
              >
                <RefreshCw size={14} /> Restart
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={toggleVoice}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {steps
              .sort((a, b) => a.number - b.number)
              .map((step, index) => (
                <RecipeStepCard
                  key={step.id}
                  step={step}
                  isActive={index === activeStep}
                  isCompleted={!!completedSteps[step.id]}
                  onStartTimer={startTimer}
                  onStopTimer={stopTimer}
                  onRestartTimer={restartTimer}
                  timerRunning={timerRunning && index === activeStep}
                  remainingTime={index === activeStep ? remainingTime : step.timeInMinutes * 60}
                  onToggleVoice={toggleVoice}
                  voiceEnabled={voiceEnabled}
                />
              ))}
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            {activeStep < steps.length && (
              <Button 
                className="w-full" 
                onClick={() => markStepComplete(steps[activeStep].id)}
              >
                {activeStep === steps.length - 1 ? 'Finish Recipe' : 'Mark Step Complete'}
              </Button>
            )}
            
            {activeStep > 0 || Object.keys(completedSteps).length > 0 ? (
              <Button 
                variant="outline"
                className="w-full" 
                onClick={restartCooking}
              >
                <RefreshCw size={16} className="mr-2" /> Restart Cooking
              </Button>
            ) : null}
          </div>
        </div>

        <div className="fixed bottom-20 right-4 z-40">
          <Button
            className="rounded-full h-12 w-12 shadow-lg flex items-center justify-center"
            onClick={toggleAiAssistant}
          >
            {aiAssistantOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </Button>
        </div>

        <div 
          className={`fixed bottom-20 left-4 right-4 z-30 transition-transform duration-300 ${
            aiAssistantOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <EnhancedAIChatBox 
            recipeId={id} 
            recipeName={recipe?.title}
            currentStepNumber={activeStep + 1}
            conversationId={conversationId}
            onNewConversation={setConversationId}
          />
        </div>
      </div>

      <MobileNavBar />
    </div>
  );
};

export default RecipeDetail;
