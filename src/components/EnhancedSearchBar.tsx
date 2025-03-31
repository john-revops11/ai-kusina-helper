
import React, { useState, useEffect } from 'react';
import { Search, Mic, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Fuse from 'fuse.js';

interface Recipe {
  id: string;
  title: string;
  [key: string]: any;
}

interface EnhancedSearchBarProps {
  onSearch: (query: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onSearchExternal: (query: string) => void;
  recipes: Recipe[];
  placeholder?: string;
  isSearching?: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ 
  onSearch, 
  onSelectRecipe,
  onSearchExternal,
  recipes,
  placeholder = "Search Filipino recipes...",
  isSearching = false
}) => {
  const [searchText, setSearchText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [noResultsVisible, setNoResultsVisible] = useState(false);
  const { toast } = useToast();

  // Initialize Fuse for fuzzy search
  const fuseOptions = {
    keys: ['title'],
    threshold: 0.4, // Lower threshold means more strict matching
    includeScore: true
  };
  
  const fuse = new Fuse(recipes, fuseOptions);

  useEffect(() => {
    if (searchText.trim().length >= 2) {
      const results = fuse.search(searchText).map(result => result.item);
      setSuggestions(results);
      
      // If no results found and there's text, show the "not found" prompt
      setNoResultsVisible(results.length === 0);
    } else {
      setSuggestions([]);
      setNoResultsVisible(false);
    }
  }, [searchText, recipes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setShowSuggestions(value.length >= 2);
    
    // If user clears the search, notify parent component
    if (!value.trim()) {
      onSearch('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (suggestions.length > 0) {
        // If suggestions exist, select first one
        onSelectRecipe(suggestions[0]);
      } else if (searchText.trim().length > 0) {
        // If no suggestions but there's text, perform search
        onSearch(searchText.trim());
        // Also show the "not found" prompt to allow searching online
        setNoResultsVisible(true);
      }
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setSearchText('');
    onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setNoResultsVisible(false);
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
        description: "Voice search started. Say a recipe name...",
      });
      // In a real app, this would start voice recording
    }
  };

  const handleSearchExternal = () => {
    if (searchText.trim()) {
      onSearchExternal(searchText.trim());
      setNoResultsVisible(false);
      setShowSuggestions(false);
    } else {
      toast({
        description: "Please enter a recipe name to search",
        variant: "destructive"
      });
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSearchText(recipe.title);
    onSelectRecipe(recipe);
    setShowSuggestions(false);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking on the search UI elements
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full search-container" onClick={e => e.stopPropagation()}>
      <div className="flex items-center">
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary animate-spin" 
              size={18} 
            />
          ) : (
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              size={18} 
            />
          )}
          <Input
            className="pl-10 pr-9 py-2 w-full rounded-lg"
            placeholder={placeholder}
            value={searchText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(searchText.length >= 2)}
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
          className={`ml-2 ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : ''}`}
          onClick={toggleVoiceSearch}
        >
          <Mic size={18} />
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {suggestions.map((recipe) => (
              <li 
                key={recipe.id}
                className="px-4 py-2 hover:bg-accent cursor-pointer text-sm flex items-center"
                onClick={() => handleSelectRecipe(recipe)}
              >
                <div className="h-8 w-8 mr-2 rounded-md overflow-hidden flex-shrink-0">
                  <img 
                    src={recipe.imageUrl || ""} 
                    alt={recipe.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1617611647086-baf8019744ab?q=80&w=2070";
                    }}
                  />
                </div>
                <span>{recipe.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No results prompt */}
      {noResultsVisible && searchText.trim().length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg p-4">
          <p className="text-sm mb-2">Recipe not found. Would you like me to search for "{searchText}" online?</p>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setNoResultsVisible(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSearchExternal}
            >
              Search Online
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchBar;
