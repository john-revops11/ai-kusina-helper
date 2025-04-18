
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import type { Recipe } from './RecipeCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface FeaturedRecipeProps {
  recipe: Recipe;
}

const FeaturedRecipe: React.FC<FeaturedRecipeProps> = ({ recipe }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-kusina-orange/20 hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-kusina-brown/30 to-kusina-brown/80" style={{ height: '250px' }}>
        {/* Placeholder div instead of image */}
        <div className="w-full h-full bg-gray-300"></div>
      </div>
      <div className="relative z-10 p-4 md:p-6 flex flex-col h-full justify-end min-h-[250px]">
        <Badge className="w-fit mb-2 bg-kusina-orange text-white hover:bg-kusina-orange/80">
          <span className="truncate">{recipe.category}</span>
        </Badge>
        <h2 className="text-white text-xl md:text-2xl font-bold mb-2 drop-shadow-md break-words line-clamp-2">
          {recipe.title}
        </h2>
        <div className="flex items-center text-white mb-4">
          <Clock size={isMobile ? 14 : 16} className="mr-1" />
          <span className={`${isMobile ? "text-xs" : "text-sm"}`}>{recipe.prepTime}</span>
        </div>
        <Link to={`/recipe/${recipe.id}`}>
          <Button variant="secondary" className="w-full justify-between bg-gradient-to-r from-kusina-orange to-kusina-red text-white hover:from-kusina-orange/90 hover:to-kusina-red/90 transition-all duration-300">
            <span className={`${isMobile ? "text-sm" : ""}`}>Start Cooking</span> <ChevronRight size={isMobile ? 14 : 16} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FeaturedRecipe;
