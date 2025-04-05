
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  return (
    <header className="p-4 md:p-6 border-b">
      <h1 className="text-xl md:text-2xl font-bold text-kusina-green mb-2">Shopping List</h1>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge variant="outline" className={`${isMobile ? "text-xs" : "text-sm"} py-1 px-2 whitespace-nowrap`}>
          {checkedItems} of {totalItems} items checked
        </Badge>
        <Button 
          variant="ghost" 
          size={isMobile ? "sm" : "default"}
          className="text-xs md:text-sm text-muted-foreground h-8 md:h-9"
          onClick={() => {
            if (checkedItems > 0 && confirm('Remove all checked items?')) {
              onClearChecked();
            }
          }}
          disabled={checkedItems === 0}
        >
          Clear checked
        </Button>
      </div>
    </header>
  );
};

export default ShoppingListHeader;
