import React from 'react';
import { Check, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  hasSubstitutions: boolean;
  isOptional?: boolean;
  recipeId?: string;
  category?: string; // Added category property as optional
};

interface IngredientItemProps {
  ingredient: Ingredient;
  isChecked: boolean;
  onToggle: () => void;
  onViewSubstitutions?: () => void;
  showAddToList?: boolean;
  onAddToList?: () => void;
}

const IngredientItem: React.FC<IngredientItemProps> = ({
  ingredient,
  isChecked,
  onToggle,
  onViewSubstitutions,
  showAddToList = false,
  onAddToList,
}) => {
  return (
    <div className="ingredient-item">
      <Checkbox 
        id={`ingredient-${ingredient.id}`} 
        checked={isChecked} 
        onCheckedChange={onToggle}
      />
      <label 
        htmlFor={`ingredient-${ingredient.id}`} 
        className={`flex-1 text-sm ml-2 ${isChecked ? 'line-through text-muted-foreground' : ''}`}
      >
        <span className="font-medium">{ingredient.name}</span>
        <span className="text-muted-foreground"> - {ingredient.quantity} {ingredient.unit}</span>
      </label>
      
      {ingredient.hasSubstitutions && onViewSubstitutions && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={onViewSubstitutions}
        >
          Substitutes
        </Button>
      )}
      
      {showAddToList && onAddToList && (
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onAddToList}
        >
          <Plus size={14} />
        </Button>
      )}
    </div>
  );
};

export default IngredientItem;
