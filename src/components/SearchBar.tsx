
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search recipes, ingredients..." 
}) => {
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <div className="relative w-full">
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
        size={18} 
      />
      <Input
        className="pl-10 pr-4 py-2 w-full rounded-lg"
        placeholder={placeholder}
        onChange={handleSearch}
      />
    </div>
  );
};

export default SearchBar;
