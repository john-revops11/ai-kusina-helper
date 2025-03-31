
import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Bot, InfoIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { aiProviderService } from '@/services/aiProviderService';
import { toast } from 'sonner';

const AIProviderSelector = () => {
  const [currentProvider, setCurrentProvider] = useState<'gemini' | 'openai'>(
    aiProviderService.getCurrentProvider()
  );

  useEffect(() => {
    // Load the current provider preference
    setCurrentProvider(aiProviderService.getCurrentProvider());
  }, []);

  const handleProviderChange = (value: string) => {
    const provider = value as 'gemini' | 'openai';
    setCurrentProvider(provider);
    aiProviderService.setCurrentProvider(provider);
    
    toast.success(`AI Provider changed to ${provider.toUpperCase()}`, {
      description: `Recipe searches will now use ${provider.toUpperCase()} by default`
    });
  };

  return (
    <Card className="border-kusina-orange/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-kusina-orange/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-kusina-orange" />
            <CardTitle className="text-kusina-brown text-xl">AI Provider Settings</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Set your preferred AI provider for recipe generation. If the primary provider fails, the system will automatically fall back to the other provider.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Choose which AI service should be used for recipe searches and generation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="ai-provider" className="text-sm font-medium text-kusina-brown">
                Primary AI Provider
              </label>
              <Select value={currentProvider} onValueChange={handleProviderChange}>
                <SelectTrigger id="ai-provider" className="w-full border-kusina-orange/20">
                  <SelectValue placeholder="Select an AI provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-kusina-green" />
                      <span>Gemini AI</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-500" />
                      <span>OpenAI</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                The selected AI will be used first, with automatic fallback if it fails
              </p>
            </div>
          </div>
          
          <div className="flex flex-col justify-center space-y-2 p-4 bg-gray-50 rounded-lg border border-kusina-orange/10">
            <h3 className="text-sm font-medium text-kusina-brown">Current Configuration</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm">Primary:</span>
              <Badge variant="outline" className={currentProvider === 'gemini' ? 'bg-kusina-green/10 text-kusina-green border-kusina-green/20' : 'bg-blue-50 text-blue-500 border-blue-200'}>
                {currentProvider === 'gemini' ? 'Gemini AI' : 'OpenAI'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Fallback:</span>
              <Badge variant="outline" className={currentProvider === 'openai' ? 'bg-kusina-green/10 text-kusina-green border-kusina-green/20' : 'bg-blue-50 text-blue-500 border-blue-200'}>
                {currentProvider === 'openai' ? 'Gemini AI' : 'OpenAI'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fallback occurs automatically if the primary AI service fails
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIProviderSelector;
