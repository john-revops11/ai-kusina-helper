
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Utensils, 
  ChevronDown, 
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import MobileNavBar from '@/components/MobileNavBar';
import RecipeTabs from '@/components/RecipeTabs';
import EnhancedAIChatBox from '@/components/EnhancedAIChatBox';
import voiceService from '@/services/voiceService';
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

const RecipeDetailPage = () => {
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
  const [voiceEnabled, setVoiceEnabled] = useState(voiceService.enabled);
  const [sequenceMode, setSequenceMode] = useState(voiceService.sequenceMode);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [substitutes, setSubstitutes] = useState<Record<string, string[]>>({});
  const [conversationId, setConversationId] = useState<string>('');
  
  const timerRef = useRef<number | null>(null);

  // Load recipe data
  useEffect(() => {
    const loadRecipeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const recipeData = await fetchRecipeById(id);
        if (recipeData) {
          setRecipe(recipeData);
          
          if (voiceEnabled) {
            const announcement = `Recipe loaded: ${recipeData.title}. ${recipeData.description}`;
            voiceService.speak(announcement);
          }
          
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
  }, [id, toast, voiceEnabled]);

  // Create new conversation
  useEffect(() => {
    if (recipe) {
      const newConversationId = agentOrchestrator.createNewConversation();
      setConversationId(newConversationId);
    }
  }, [recipe]);

  // Timer effect
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
      
      if (voiceEnabled) {
        const nextStep = steps[activeStep + 1];
        if (nextStep) {
          setTimeout(() => {
            voiceService.speak(`Moving to step ${nextStep.number}: ${nextStep.instruction}`, { stepNumber: nextStep.number });
          }, 1000);
        }
      }
    } else if (activeStep === steps.length - 1) {
      if (voiceEnabled) {
        voiceService.speak("Congratulations! You've completed all steps in the recipe. Enjoy your meal!");
      }
    }
  };

  const restartCooking = () => {
    setActiveStep(0);
    setCompletedSteps({});
    setTimerRunning(false);
    voiceService.resetSequence();
    
    if (steps[0]?.timeInMinutes) {
      setRemainingTime(steps[0].timeInMinutes * 60);
    } else {
      setRemainingTime(0);
    }
    
    toast({
      description: "Recipe restarted. Starting from the first step.",
    });
    
    if (voiceEnabled && steps.length > 0) {
      voiceService.speak(`Recipe restarted. Starting with step 1: ${steps[0].instruction}`, { stepNumber: 1 });
    }
  };

  const toggleVoice = () => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    voiceService.setEnabled(newValue);
    
    if (newValue && steps.length > 0 && activeStep < steps.length) {
      const currentStep = steps[activeStep];
      voiceService.speak(`Voice guidance enabled. Current step ${currentStep.number}: ${currentStep.instruction}`, { force: true, stepNumber: currentStep.number });
    } else if (!newValue) {
      voiceService.stopAllAudio();
    }
  };

  const toggleSequenceMode = () => {
    const newValue = !sequenceMode;
    setSequenceMode(newValue);
    voiceService.setSequenceMode(newValue);
    
    if (newValue) {
      voiceService.resetSequence();
      toast({
        description: "Sequence mode enabled. Voice guidance will follow step order.",
      });
      
      if (voiceEnabled) {
        voiceService.speak("Sequence mode enabled. Voice guidance will now follow steps in order starting from step 1.", { force: true });
      }
    } else {
      toast({
        description: "Sequence mode disabled. Voice guidance will play for any step.",
      });
      
      if (voiceEnabled) {
        voiceService.speak("Sequence mode disabled. Voice guidance will now play for any step.", { force: true });
      }
    }
  };

  const toggleAiAssistant = () => {
    setAiAssistantOpen(!aiAssistantOpen);
  };

  const addToShoppingList = (ingredient: Ingredient) => {
    toast({
      description: `${ingredient.name} added to shopping list`
    });
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
        {/* Tabs Component */}
        <RecipeTabs 
          ingredients={ingredients}
          steps={steps}
          checkedIngredients={checkedIngredients}
          toggleIngredientCheck={toggleIngredientCheck}
          toggleSubstitutesView={toggleSubstitutesView}
          showSubstitutes={showSubstitutes}
          substitutes={substitutes}
          activeStep={activeStep}
          timerRunning={timerRunning}
          remainingTime={remainingTime}
          completedSteps={completedSteps}
          startTimer={startTimer}
          stopTimer={stopTimer}
          restartTimer={restartTimer}
          markStepComplete={markStepComplete}
          restartCooking={restartCooking}
          toggleVoice={toggleVoice}
          voiceEnabled={voiceEnabled}
          toggleSequenceMode={toggleSequenceMode}
          sequenceMode={sequenceMode}
          onAddToList={addToShoppingList}
        />

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

export default RecipeDetailPage;
