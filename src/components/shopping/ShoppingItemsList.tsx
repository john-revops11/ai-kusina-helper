
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ShoppingItem from './ShoppingItem';
import { type ShoppingItem as ShoppingItemType } from './ShoppingItem';

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

  return (
    <ScrollArea className="h-[calc(100vh-350px)]">
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Your shopping list is empty</p>
          <p className="text-sm">Search for recipes or add items manually</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map(category => (
            <div key={category}>
              <h2 className="font-medium text-sm text-muted-foreground mb-2">{category}</h2>
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
