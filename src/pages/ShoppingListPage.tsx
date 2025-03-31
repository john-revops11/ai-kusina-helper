
import React, { useState } from 'react';
import MobileNavBar from '@/components/MobileNavBar';
import { Check, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type ShoppingItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
  category: string;
};

// Mock shopping list data
const initialShoppingList: ShoppingItem[] = [
  { id: '1', name: 'Chicken', quantity: '2', unit: 'lbs', checked: false, category: 'Protein' },
  { id: '2', name: 'Soy Sauce', quantity: '1', unit: 'bottle', checked: false, category: 'Condiments' },
  { id: '3', name: 'White Vinegar', quantity: '1', unit: 'bottle', checked: false, category: 'Condiments' },
  { id: '4', name: 'Garlic', quantity: '1', unit: 'head', checked: true, category: 'Produce' },
  { id: '5', name: 'Bay Leaves', quantity: '1', unit: 'pack', checked: false, category: 'Spices' },
  { id: '6', name: 'Rice', quantity: '5', unit: 'lbs', checked: false, category: 'Grains' },
];

const ShoppingListPage = () => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(initialShoppingList);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');

  const toggleItemCheck = (id: string) => {
    setShoppingList(prevList => 
      prevList.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setShoppingList(prevList => prevList.filter(item => item.id !== id));
  };

  const addNewItem = () => {
    if (newItemName.trim()) {
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name: newItemName,
        quantity: newItemQuantity || '1',
        unit: newItemUnit || 'item',
        checked: false,
        category: 'Other',
      };
      
      setShoppingList(prevList => [...prevList, newItem]);
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
    }
  };

  // Group items by category
  const groupedItems = shoppingList.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, ShoppingItem[]>);

  // Sort categories
  const sortedCategories = Object.keys(groupedItems).sort();

  // Get counts
  const totalItems = shoppingList.length;
  const checkedItems = shoppingList.filter(item => item.checked).length;

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
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
                setShoppingList(prevList => prevList.filter(item => !item.checked));
              }
            }}
          >
            Clear checked
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-6">
        {/* Add New Item */}
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
            onClick={addNewItem}
            disabled={!newItemName.trim()}
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Shopping List */}
        <ScrollArea className="h-[calc(100vh-230px)]">
          <div className="space-y-4">
            {sortedCategories.map(category => (
              <div key={category}>
                <h2 className="font-medium text-sm text-muted-foreground mb-2">{category}</h2>
                <ul className="space-y-2">
                  {groupedItems[category].map(item => (
                    <li key={item.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-3">
                        <Button
                          variant={item.checked ? "default" : "outline"}
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => toggleItemCheck(item.id)}
                        >
                          {item.checked && <Check size={12} />}
                        </Button>
                        <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground"> - {item.quantity} {item.unit}</span>
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar />
    </div>
  );
};

export default ShoppingListPage;
