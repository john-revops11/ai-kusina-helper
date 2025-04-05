
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import RecipeStepCard from './RecipeStepCard';
import IngredientItem from './IngredientItem';
import { RecipeStep } from './RecipeStepCard';
import { Ingredient } from './IngredientItem';
import { Volume2, VolumeX, RefreshCw, ListOrdered, PlayCircle } from 'lucide-react';

interface RecipeTabsProps {
  ingredients: Ingredient[];
  steps: RecipeStep[];
  checkedIngredients: Record<string, boolean>;
  toggleIngredientCheck: (id: string) => void;
  toggleSubstitutesView: (id: string) => void;
  showSubstitutes: Record<string, boolean>;
  substitutes: Record<string, string[]>;
  activeStep: number;
  timerRunning: boolean;
  remainingTime: number;
  completedSteps: Record<string, boolean>;
  startTimer: () => void;
  stopTimer: () => void;
  restartTimer: () => void;
  markStepComplete: (id: string) => void;
  restartCooking: () => void;
  toggleVoice: () => void;
  voiceEnabled: boolean;
  toggleSequenceMode: () => void;
  sequenceMode: boolean;
  onAddToList?: (ingredient: Ingredient) => void;
  playVoiceInstruction?: (step: RecipeStep) => void;
}

const RecipeTabs: React.FC<RecipeTabsProps> = ({
  ingredients,
  steps,
  checkedIngredients,
  toggleIngredientCheck,
  toggleSubstitutesView,
  showSubstitutes,
  substitutes,
  activeStep,
  timerRunning,
  remainingTime,
  completedSteps,
  startTimer,
  stopTimer,
  restartTimer,
  markStepComplete,
  restartCooking,
  toggleVoice,
  voiceEnabled,
  toggleSequenceMode,
  sequenceMode,
  onAddToList,
  playVoiceInstruction
}) => {
  return (
    <Tabs defaultValue="ingredients" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
        <TabsTrigger value="steps">Steps</TabsTrigger>
        <TabsTrigger value="substitutes">Substitutes</TabsTrigger>
      </TabsList>
      
      <TabsContent value="ingredients" className="mt-4 space-y-2">
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
              onAddToList={onAddToList ? () => onAddToList(ingredient) : undefined}
            />
          </div>
        ))}
      </TabsContent>
      
      <TabsContent value="steps" className="mt-4">
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
              className={`text-xs ${sequenceMode ? 'text-primary' : ''}`}
              onClick={toggleSequenceMode}
              title={sequenceMode ? "Sequence mode on" : "Sequence mode off"}
            >
              <ListOrdered size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-xs ${voiceEnabled ? 'text-primary' : ''}`}
              onClick={toggleVoice}
              title={voiceEnabled ? "Voice enabled" : "Voice disabled"}
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
                sequenceMode={sequenceMode}
                onPlayVoiceInstruction={playVoiceInstruction}
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
      </TabsContent>
      
      <TabsContent value="substitutes" className="mt-4 space-y-4">
        {ingredients.filter(ing => ing.hasSubstitutions).length > 0 ? (
          ingredients.filter(ing => ing.hasSubstitutions).map(ingredient => (
            <div key={ingredient.id} className="p-3 border rounded-lg">
              <h3 className="font-medium mb-2">Instead of {ingredient.name}:</h3>
              <ul className="space-y-1 ml-4">
                {substitutes[ingredient.id]?.map((sub, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    <span>{sub}</span>
                  </li>
                )) || (
                  <li className="text-sm text-muted-foreground">Loading substitutes...</li>
                )}
              </ul>
              {ingredient.name.toLowerCase().includes('chicken') && (
                <p className="text-xs text-muted-foreground mt-2">If using pork, cooking time may need to be adjusted.</p>
              )}
              {ingredient.name.toLowerCase().includes('vinegar') && (
                <p className="text-xs text-muted-foreground mt-2">The flavor profile will change slightly.</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No substitutes available for this recipe.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default RecipeTabs;
