
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface AddItemFormProps {
  onAddItem: (name: string, quantity: string, unit: string) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const isMobile = useIsMobile();

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem(newItemName, newItemQuantity || '1', newItemUnit || 'item');
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}>
      <div className="flex flex-1 gap-2">
        <Input 
          placeholder="Add item..." 
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          className="flex-1 h-9 md:h-10"
          onKeyPress={handleKeyPress}
        />
        <Input
          placeholder="Qty"
          value={newItemQuantity}
          onChange={e => setNewItemQuantity(e.target.value)}
          className={`${isMobile ? 'w-24' : 'w-20'} h-9 md:h-10`}
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Unit"
          value={newItemUnit}
          onChange={e => setNewItemUnit(e.target.value)}
          className={`${isMobile ? 'flex-1' : 'w-28'} h-9 md:h-10`}
          onKeyPress={handleKeyPress}
        />
        <Button 
          size={isMobile ? "sm" : "default"}
          onClick={handleAddItem}
          disabled={!newItemName.trim()}
          className="shrink-0 h-9 md:h-10"
        >
          <Plus size={isMobile ? 14 : 16} />
        </Button>
      </div>
    </div>
  );
};

export default AddItemForm;
