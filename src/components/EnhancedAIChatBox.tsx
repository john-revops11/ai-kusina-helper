
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import agentOrchestrator, { AgentMessage } from '@/agents';

interface EnhancedAIChatBoxProps {
  recipeId?: string;
  recipeName?: string;
  currentStepNumber?: number;
  className?: string;
  conversationId?: string;
  onNewConversation?: (id: string) => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

const EnhancedAIChatBox: React.FC<EnhancedAIChatBoxProps> = ({
  recipeId,
  recipeName,
  currentStepNumber,
  className = '',
  conversationId: externalConversationId,
  onNewConversation,
  minimized = false,
  onToggleMinimize
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>(externalConversationId || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation if needed
  useEffect(() => {
    if (!conversationId) {
      const newConversationId = agentOrchestrator.createNewConversation();
      setConversationId(newConversationId);
      
      if (onNewConversation) {
        onNewConversation(newConversationId);
      }
      
      // Add initial welcome message
      const welcomeMessage: AgentMessage = {
        id: 'welcome',
        content: recipeName 
          ? `Hello! I'm your AI cooking assistant for Philippine cuisine. Ask me anything about ${recipeName} or any other Filipino recipe!`
          : "Hello! I'm your AI cooking assistant for Philippine cuisine. How can I help you with your cooking today?",
        timestamp: new Date(),
        sender: 'agent',
        agentName: 'ChatSupport'
      };
      
      setMessages([welcomeMessage]);
    } else if (externalConversationId) {
      // Load existing conversation if an ID was provided
      const conversationMessages = agentOrchestrator.getConversationMessages(externalConversationId);
      if (conversationMessages.length > 0) {
        setMessages(conversationMessages);
      } else {
        // If no messages in the conversation, add a welcome message
        const welcomeMessage: AgentMessage = {
          id: 'welcome',
          content: recipeName 
            ? `Hello! I'm your AI cooking assistant for Philippine cuisine. Ask me anything about ${recipeName} or any other Filipino recipe!`
            : "Hello! I'm your AI cooking assistant for Philippine cuisine. How can I help you with your cooking today?",
          timestamp: new Date(),
          sender: 'agent',
          agentName: 'ChatSupport'
        };
        
        setMessages([welcomeMessage]);
      }
    }
  }, [conversationId, externalConversationId, onNewConversation, recipeName]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat becomes visible
  useEffect(() => {
    if (!minimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [minimized]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      content: inputText,
      timestamp: new Date(),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call the agent orchestrator with the appropriate context
      const response = await agentOrchestrator.processRequest(
        inputText,
        undefined, // Let the orchestrator decide which agent to use
        {
          conversationId,
          currentRecipeId: recipeId,
          currentStepNumber,
          previousMessages: messages
        }
      );
      
      const agentMessage: AgentMessage = {
        id: `agent-${Date.now()}`,
        content: response.message,
        timestamp: new Date(),
        sender: 'agent',
        agentName: response.source === 'ai' ? 'ChatSupport' : 'RecipeAssistant'
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // Handle suggested actions if any
      if (response.suggestedActions && response.suggestedActions.length > 0) {
        // For now, we just log them - in a real app, we'd show buttons or other UI
        console.log('Suggested actions:', response.suggestedActions);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast("Failed to get a response from the AI assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast("Voice recording stopped");
      // In a real app, this would process the voice recording
    } else {
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

  if (minimized) {
    return (
      <Button
        onClick={onToggleMinimize}
        className="fixed bottom-20 right-4 z-40 rounded-full h-12 w-12 shadow-lg"
      >
        AI
      </Button>
    );
  }

  return (
    <Card className={`w-full h-[350px] flex flex-col ${className}`}>
      <CardHeader className="px-4 py-2 border-b">
        <CardTitle className="text-base flex justify-between items-center">
          <span>Filipino Cuisine AI Assistant</span>
          {onToggleMinimize && (
            <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
              Minimize
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.agentName && message.sender === 'agent' && (
                  <div className="text-xs font-semibold mb-1">{message.agentName}</div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
          
          <div ref={messagesEndRef} />
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
            ref={inputRef}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage} 
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAIChatBox;
