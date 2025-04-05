
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddItemFormProps {
  onAddItem: (name: string, quantity: string, unit: string) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem(newItemName, newItemQuantity || '1', newItemUnit || 'item');
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Input 
        placeholder="Add item..." 
        value={newItemName}
        onChange={e => setNewItemName(e.target.value)}
        className="flex-1"
      />
      <Input
        placeholder="Qty"
        value={newItemQuantity}
        onChange={e => setNewItemQuantity(e.target.value)}
        className="w-16"
      />
      <Input
        placeholder="Unit"
        value={newItemUnit}
        onChange={e => setNewItemUnit(e.target.value)}
        className="w-20"
      />
      <Button 
        size="icon" 
        onClick={handleAddItem}
        disabled={!newItemName.trim()}
      >
        <Plus size={16} />
      </Button>
    </div>
  );
};

export default AddItemForm;
