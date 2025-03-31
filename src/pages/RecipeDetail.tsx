
import React, { useState } from 'react';
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
import MobileNavBar from '@/components/MobileNavBar';
import IngredientItem from '@/components/IngredientItem';
import RecipeStepCard from '@/components/RecipeStepCard';
import AIChatBox from '@/components/AIChatBox';

import { 
  mockRecipes, 
  mockIngredients, 
  mockRecipeSteps,
  mockIngredientSubstitutes
} from '@/data/mockData';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const recipe = mockRecipes.find(r => r.id === id);
  const ingredients = mockIngredients[id || ''] || [];
  const steps = mockRecipeSteps[id || ''] || [];
  
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [timerRunning, setTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showSubstitutes, setShowSubstitutes] = useState<Record<string, boolean>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  if (!recipe) {
    return <div className="p-4">Recipe not found</div>;
  }

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

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <div className="relative h-60">
        <img 
          src={recipe.imageUrl} 
          alt={recipe.title} 
          className="w-full h-full object-cover brightness-50"
        />
        <Link 
          to="/" 
          className="absolute top-4 left-4 bg-black/30 p-2 rounded-full"
        >
          <ArrowLeft className="text-white" size={20} />
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <Badge className="mb-2">{recipe.category}</Badge>
          <h1 className="text-2xl font-bold mb-1">{recipe.title}</h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{recipe.prepTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Utensils size={14} />
              <span>Difficulty: {recipe.difficulty}</span>
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
                        console.log('Add to shopping list:', ingredient.name);
                        // In a real app, this would add to a shopping list
                      }}
                    />
                    
                    {/* Show substitutes if available and toggled */}
                    {ingredient.hasSubstitutions && showSubstitutes[ingredient.id] && (
                      <div className="ml-8 mt-1 mb-2 p-2 bg-muted rounded-md text-sm">
                        <p className="font-medium text-xs mb-1">Substitutes:</p>
                        <ul className="space-y-1">
                          {mockIngredientSubstitutes[ingredient.id]?.map((sub, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {sub}</li>
                          ))}
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
            {steps.map((step, index) => (
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
          <AIChatBox />
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default RecipeDetail;
