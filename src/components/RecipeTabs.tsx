
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import RecipeStepCard from './RecipeStepCard';
import IngredientItem from './IngredientItem';
import { RecipeStep } from './RecipeStepCard';
import { Ingredient } from './IngredientItem';
import { Volume2, VolumeX, RefreshCw, ListOrdered, PlayCircle, Leaf } from 'lucide-react';

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
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
      <h2 className="baybayin-title mb-4 flex items-center justify-center">
        <Leaf size={24} className="text-kusina-green mr-2 leaf-animation" />
        <span>Lutuin</span>
      </h2>
      
      <Tabs defaultValue="ingredients" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-kusina-light-green/30">
          <TabsTrigger 
            value="ingredients" 
            className="data-[state=active]:bg-kusina-green data-[state=active]:text-white"
          >
            Ingredients
          </TabsTrigger>
          <TabsTrigger 
            value="steps" 
            className="data-[state=active]:bg-kusina-green data-[state=active]:text-white"
          >
            Steps
          </TabsTrigger>
          <TabsTrigger 
            value="substitutes" 
            className="data-[state=active]:bg-kusina-green data-[state=active]:text-white"
          >
            Substitutes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ingredients" className="mt-4 space-y-2">
          {ingredients.map(ingredient => (
            <div key={ingredient.id} className="tropical-card">
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
          <div className="flex justify-between items-center mb-4 border-b-2 border-kusina-green/30 pb-2">
            <h2 className="baybayin-subtitle">Cooking Steps</h2>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs flex items-center gap-1 text-kusina-green hover:bg-kusina-light-green/50"
                onClick={restartCooking}
              >
                <RefreshCw size={14} /> Restart
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-xs ${sequenceMode ? 'text-kusina-green bg-kusina-light-green/30' : ''} hover:bg-kusina-light-green/50`}
                onClick={toggleSequenceMode}
                title={sequenceMode ? "Sequence mode on" : "Sequence mode off"}
              >
                <ListOrdered size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-xs ${voiceEnabled ? 'text-kusina-green bg-kusina-light-green/30' : ''} hover:bg-kusina-light-green/50`}
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
                  onMarkComplete={markStepComplete}
                />
              ))}
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            {activeStep === steps.length && (
              <Button 
                variant="outline"
                className="w-full bg-kusina-light-green/20 border-kusina-green text-kusina-green hover:bg-kusina-light-green/50" 
                onClick={restartCooking}
              >
                <RefreshCw size={16} className="mr-2" /> Restart Cooking
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="substitutes" className="mt-4 space-y-4">
          {ingredients.filter(ing => ing.hasSubstitutions).length > 0 ? (
            ingredients.filter(ing => ing.hasSubstitutions).map(ingredient => (
              <div key={ingredient.id} className="tropical-card">
                <h3 className="font-medium mb-2 flex items-center">
                  <span className="font-baybayin text-kusina-green mr-1">{ingredient.name.charAt(0)}</span>
                  Instead of {ingredient.name.slice(1)}:
                </h3>
                <ul className="space-y-1 ml-4">
                  {substitutes[ingredient.id]?.map((sub, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-kusina-green"></span>
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
            <div className="text-center py-8 tropical-card">
              <p className="text-muted-foreground baybayin-accent">No substitutes available for this recipe.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecipeTabs;
