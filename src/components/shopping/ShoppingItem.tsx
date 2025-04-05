
import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
  category: string;
  recipeId?: string;
  recipeName?: string;
};

interface ShoppingItemProps {
  item: ShoppingItem;
  onToggleCheck: (id: string) => void;
  onRemoveItem: (id: string) => void;
}

const ShoppingItem: React.FC<ShoppingItemProps> = ({ 
  item, 
  onToggleCheck, 
  onRemoveItem 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <li className="flex items-center justify-between py-2 border-b">
      <div className="flex items-start gap-3 max-w-[85%]">
        <Button
          variant={item.checked ? "default" : "outline"}
          size="icon"
          className={`h-6 w-6 rounded-full shrink-0 mt-1 ${item.checked ? 'bg-kusina-green' : 'border-kusina-green'}`}
          onClick={() => onToggleCheck(item.id)}
        >
          {item.checked && <Check size={12} />}
        </Button>
        <div className={`flex flex-col ${item.checked ? "line-through text-muted-foreground" : ""}`}>
          <span className="font-medium text-sm md:text-base break-words leading-tight">{item.name}</span>
          <div className="flex flex-wrap gap-1 md:gap-2 mt-0.5">
            <span className="text-xs md:text-sm text-muted-foreground">{item.quantity} {item.unit}</span>
            {item.recipeName && (
              <Badge variant="outline" className="text-xs py-0.5 bg-kusina-light-green/20 break-words hyphens-auto max-w-full">
                {item.recipeName.length > 20 && isMobile ? 
                  `${item.recipeName.substring(0, 20)}...` : 
                  item.recipeName}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onRemoveItem(item.id)}
      >
        <Trash2 size={14} />
      </Button>
    </li>
  );
};

export default ShoppingItem;
