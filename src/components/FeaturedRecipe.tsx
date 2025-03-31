
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import type { Recipe } from './RecipeCard';

interface FeaturedRecipeProps {
  recipe: Recipe;
}

const FeaturedRecipe: React.FC<FeaturedRecipeProps> = ({ recipe }) => {
  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src={recipe.imageUrl} 
          alt={recipe.title}
          className="w-full h-full object-cover brightness-50"
        />
      </div>
      <div className="relative z-10 p-6 flex flex-col h-full justify-end min-h-[250px]">
        <Badge className="w-fit mb-2">{recipe.category}</Badge>
        <h2 className="text-white text-2xl font-bold mb-2">{recipe.title}</h2>
        <div className="flex items-center text-white/80 mb-4">
          <Clock size={16} className="mr-1" />
          <span className="text-sm">{recipe.prepTime}</span>
        </div>
        <Link to={`/recipe/${recipe.id}`}>
          <Button variant="secondary" className="w-full justify-between">
            Start Cooking <ChevronRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FeaturedRecipe;
