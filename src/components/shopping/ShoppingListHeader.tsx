
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ShoppingListHeaderProps {
  totalItems: number;
  checkedItems: number;
  onClearChecked: () => void;
}

const ShoppingListHeader: React.FC<ShoppingListHeaderProps> = ({ 
  totalItems, 
  checkedItems, 
  onClearChecked 
}) => {
  return (
    <header className="p-4 border-b">
      <h1 className="text-xl font-bold">Shopping List</h1>
      <div className="flex items-center justify-between mt-2">
        <Badge variant="outline" className="text-xs">
          {checkedItems} of {totalItems} items checked
        </Badge>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => {
            if (checkedItems > 0 && confirm('Remove all checked items?')) {
              onClearChecked();
            }
          }}
        >
          Clear checked
        </Button>
      </div>
    </header>
  );
};

export default ShoppingListHeader;
