
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
  onClick?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const difficultyColor = {
    Easy: 'bg-kusina-green text-white',
    Medium: 'bg-kusina-orange text-white',
    Hard: 'bg-kusina-red text-white'
  };

  // Wrap with Link only if onClick is not provided
  const CardContent = () => (
    <>
      <div className="relative overflow-hidden rounded-t-lg">
        <div className="overflow-hidden bg-kusina-light-green/30" style={{ height: '12rem' }}>
          {/* Placeholder div instead of image */}
        </div>
        <Badge className={`absolute top-2 right-2 ${difficultyColor[recipe.difficulty]}`}>
          {recipe.difficulty}
        </Badge>
      </div>
      <div className="p-4 border-t-0 border-2 border-kusina-cream rounded-b-lg bg-gradient-to-b from-white to-kusina-light-green/30">
        <h3 className="font-bold text-kusina-green line-clamp-2 min-h-[3rem]">
          <span className="font-baybayin tracking-wide mr-1">{recipe.title.charAt(0)}</span>
          <span className="text-base md:text-lg break-words">{recipe.title.slice(1)}</span>
        </h3>
        <div className="flex justify-between mt-2 text-xs md:text-sm text-kusina-green/80">
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-kusina-orange" />
            <span className="truncate">{recipe.prepTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Utensils size={14} className="text-kusina-green" />
            <span className="truncate">{recipe.category}</span>
          </div>
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <div 
        className="recipe-card block transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        onClick={onClick}
      >
        <CardContent />
      </div>
    );
  }

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card block transform hover:-translate-y-1 transition-all duration-300">
      <CardContent />
    </Link>
  );
};

export default RecipeCard;
