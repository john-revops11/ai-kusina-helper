
import React from 'react';
import { Clock, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export type Recipe = {
  id: string;
  title: string;
  imageUrl: string;
  prepTime: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const difficultyColor = {
    Easy: 'bg-kusina-green text-white',
    Medium: 'bg-kusina-orange text-white',
    Hard: 'bg-kusina-red text-white'
  };

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card block transform hover:-translate-y-1 transition-all duration-300">
      <div className="relative overflow-hidden rounded-t-lg">
        <div className="overflow-hidden bg-gray-200" style={{ height: '12rem' }}>
          {/* Image removed */}
        </div>
        <Badge className={`absolute top-2 right-2 ${difficultyColor[recipe.difficulty]}`}>
          {recipe.difficulty}
        </Badge>
      </div>
      <div className="p-4 border-t-0 border-2 border-kusina-cream rounded-b-lg bg-gradient-to-b from-white to-kusina-cream/30">
        <h3 className="font-bold text-lg line-clamp-1 text-kusina-brown">{recipe.title}</h3>
        <div className="flex justify-between mt-2 text-sm text-kusina-brown/70">
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-kusina-orange" />
            <span>{recipe.prepTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Utensils size={14} className="text-kusina-green" />
            <span>{recipe.category}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
