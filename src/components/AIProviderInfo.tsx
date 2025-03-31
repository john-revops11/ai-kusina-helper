
import React from 'react';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { aiProviderService } from '@/services/aiProviderService';

interface AIProviderInfoProps {
  className?: string;
}

const AIProviderInfo: React.FC<AIProviderInfoProps> = ({ className }) => {
  const currentProvider = aiProviderService.getCurrentProvider();
  
  return (
    <div className={`flex items-center ${className}`}>
      <Bot className="h-4 w-4 mr-1 text-muted-foreground" />
      <Badge variant="outline" className="text-xs">
        {currentProvider === 'gemini' ? 'Gemini AI' : 'OpenAI'}
      </Badge>
    </div>
  );
};

export default AIProviderInfo;
