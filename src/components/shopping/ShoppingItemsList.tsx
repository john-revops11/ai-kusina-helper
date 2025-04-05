
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ShoppingItem from './ShoppingItem';
import { type ShoppingItem as ShoppingItemType } from './ShoppingItem';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShoppingItemsListProps {
  items: ShoppingItemType[];
  onToggleCheck: (id: string) => void;
  onRemoveItem: (id: string) => void;
}

const ShoppingItemsList: React.FC<ShoppingItemsListProps> = ({ 
  items, 
  onToggleCheck, 
  onRemoveItem 
}) => {
  const isMobile = useIsMobile();
  
  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, ShoppingItemType[]>);

  // Sort categories
  const sortedCategories = Object.keys(groupedItems).sort();

  // Calculate appropriate height based on device
  const scrollHeight = isMobile ? "h-[calc(100vh-330px)]" : "h-[calc(100vh-300px)]";

  return (
    <ScrollArea className={scrollHeight}>
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm md:text-base">Your shopping list is empty</p>
          <p className="text-xs md:text-sm mt-1">Search for recipes or add items manually</p>
        </div>
      ) : (
        <div className="space-y-4 pr-2">
          {sortedCategories.map(category => (
            <div key={category} className="mb-4">
              <h2 className="font-medium text-xs md:text-sm text-muted-foreground mb-2 sticky top-0 bg-background/95 backdrop-blur-sm py-1">
                {category}
              </h2>
              <ul className="space-y-2">
                {groupedItems[category].map(item => (
                  <ShoppingItem 
                    key={item.id} 
                    item={item} 
                    onToggleCheck={onToggleCheck} 
                    onRemoveItem={onRemoveItem} 
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
};

export default ShoppingItemsList;
