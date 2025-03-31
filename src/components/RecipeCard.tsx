
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
    Easy: 'bg-green-500',
    Medium: 'bg-amber-500',
    Hard: 'bg-red-500'
  };

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card block">
      <div className="relative">
        <img 
          src={recipe.imageUrl} 
          alt={recipe.title} 
          className="w-full h-48 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1617611647086-baf8019744ab?q=80&w=2070"; // Fallback image
          }}
        />
        <Badge className={`absolute top-2 right-2 ${difficultyColor[recipe.difficulty]}`}>
          {recipe.difficulty}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg line-clamp-1">{recipe.title}</h3>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{recipe.prepTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Utensils size={14} />
            <span>{recipe.category}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
