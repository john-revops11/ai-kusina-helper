
import React, { useState } from 'react';
import { Search, Mic, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  redirectToSearch?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search Filipino recipes, ingredients...",
  suggestions = [],
  redirectToSearch = false
}) => {
  const [searchText, setSearchText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const handleSearch = () => {
    if (searchText.trim()) {
      onSearch(searchText.trim());
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setShowSuggestions(value.length > 0);
    
    // If user clears the search, notify parent component
    if (!value.trim()) {
      onSearch('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchText('');
    onSearch('');
    setShowSuggestions(false);
  };

  const toggleVoiceSearch = () => {
    if (isRecording) {
      setIsRecording(false);
      toast({
        description: "Voice search stopped",
      });
      // In a real app, this would process the voice recording
    } else {
      setIsRecording(true);
      toast({
        description: "Voice search started. Say a recipe or ingredient...",
      });
      // In a real app, this would start voice recording
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchText(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  // If redirectToSearch is true, render a Link component that wraps the search UI
  if (redirectToSearch) {
    return (
      <Link to="/search" className="block w-full">
        <div className="relative w-full">
          <div className="flex items-center">
            <div className="relative flex-1">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
                size={18} 
              />
              <Input
                className="pl-10 pr-9 py-2 w-full rounded-lg cursor-pointer"
                placeholder={placeholder}
                value=""
                readOnly
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={e => e.preventDefault()}
            >
              <Mic size={18} />
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            size={18} 
          />
          <Input
            className="pl-10 pr-9 py-2 w-full rounded-lg"
            placeholder={placeholder}
            value={searchText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(searchText.length > 0)}
          />
          {searchText && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full"
              onClick={handleClear}
            >
              <X size={16} className="text-muted-foreground" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className={`ml-2 ${isRecording ? 'bg-red-100 text-red-500' : ''}`}
          onClick={toggleVoiceSearch}
        >
          <Mic size={18} />
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {suggestions
              .filter(suggestion => 
                suggestion.toLowerCase().includes(searchText.toLowerCase())
              )
              .map((suggestion, index) => (
                <li 
                  key={index}
                  className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
