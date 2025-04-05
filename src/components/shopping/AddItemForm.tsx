
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
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <form 
      className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3`}
      onSubmit={(e) => {
        e.preventDefault();
        handleAddItem();
      }}
    >
      <div className="flex flex-1 gap-2">
        <Input 
          placeholder="Add item..." 
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          className={`flex-1 ${isMobile ? 'h-9 text-sm' : 'h-10'}`}
          onKeyPress={handleKeyPress}
        />
        <Input
          placeholder="Qty"
          type="text"
          inputMode="numeric"
          value={newItemQuantity}
          onChange={e => setNewItemQuantity(e.target.value)}
          className={`${isMobile ? 'w-20 h-9 text-sm' : 'w-24 h-10'}`}
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Unit"
          value={newItemUnit}
          onChange={e => setNewItemUnit(e.target.value)}
          className={`${isMobile ? 'flex-1 h-9 text-sm' : 'w-28 h-10'}`}
          onKeyPress={handleKeyPress}
        />
        <Button 
          type="submit"
          size={isMobile ? "sm" : "default"}
          disabled={!newItemName.trim()}
          className={`shrink-0 ${isMobile ? 'h-9' : 'h-10'}`}
          aria-label="Add item"
        >
          <Plus size={isMobile ? 16 : 18} />
        </Button>
      </div>
    </form>
  );
};

export default AddItemForm;
