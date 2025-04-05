
import React, { useState } from 'react';
import { Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { geminiService } from '@/services/geminiService';
import { openaiService } from '@/services/openaiService';
import { aiProviderService } from '@/services/aiProviderService';
import { toast } from 'sonner';
import AIProviderInfo from '@/components/AIProviderInfo';
import voiceService from '@/services/voiceService';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

interface AIChatBoxProps {
  recipeContext?: string;
}

const AIChatBox: React.FC<AIChatBoxProps> = ({ recipeContext }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: recipeContext 
        ? `Hello! I'm your AI cooking assistant for Philippine cuisine. Ask me anything about ${recipeContext} or any other Filipino recipe!`
        : "Hello! I'm your AI cooking assistant for Philippine cuisine. How can I help you with your cooking today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Enhance query with context if available
      const contextualQuery = recipeContext
        ? `[Context: Currently viewing the ${recipeContext} recipe] ${inputText}`
        : inputText;
        
      // Get current AI provider
      const currentProvider = aiProviderService.getCurrentProvider();
      
      let aiResponse = '';
      
      try {
        // Try with the primary provider
        if (currentProvider === 'gemini') {
          aiResponse = await geminiService.generateContent(contextualQuery);
        } else {
          aiResponse = await openaiService.generateContent(contextualQuery);
        }
      } catch (primaryError) {
        // If the primary provider fails, fall back to the other one
        console.error(`Error with ${currentProvider} AI service:`, primaryError);
        toast.warning(`${currentProvider.toUpperCase()} failed, using fallback AI`);
        
        const fallbackProvider = currentProvider === 'gemini' ? 'openai' : 'gemini';
        
        try {
          if (fallbackProvider === 'gemini') {
            aiResponse = await geminiService.generateContent(contextualQuery);
          } else {
            aiResponse = await openaiService.generateContent(contextualQuery);
          }
        } catch (fallbackError) {
          console.error("Error with fallback AI service:", fallbackError);
          throw new Error("All AI services failed");
        }
      }
      
      // Add AI response to messages
      const aiResponseMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, aiResponseMessage]);
      
      // Only speak the AI response if voice guidance is enabled and permission granted
      if (voiceService.enabled && voiceService.permissionGranted) {
        voiceService.speak(aiResponse);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast("Failed to get a response from the AI assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      toast("Voice recording stopped");
      // In a real app, this would process the voice recording
    } else {
      // Request voice permission first if needed
      if (voiceService.enabled && !voiceService.permissionGranted) {
        const granted = await voiceService.requestPermission();
        if (!granted) {
          toast("Voice permission is needed for voice search");
          return;
        }
      }
      
      setIsRecording(true);
      toast("Voice search started. Speak clearly...");
      // In a real app, this would start voice recording
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-[350px] flex flex-col">
      <CardHeader className="px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filipino Cuisine AI Assistant</CardTitle>
          <AIProviderInfo className="text-xs" />
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-3 py-2 bg-muted max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <CardContent className="p-2 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleRecording}
            className={isRecording ? 'bg-red-100 text-red-500' : ''}
          >
            <Mic size={18} />
          </Button>
          <Input
            placeholder="Ask about ingredients, recipes, or techniques..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatBox;
