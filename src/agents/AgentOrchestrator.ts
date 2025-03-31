import { AgentInterface, AgentContext, AgentResponse, AgentMessage } from './AgentInterface';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

/**
 * Orchestrator that manages multiple agents and routes requests to the appropriate agent
 */
export class AgentOrchestrator {
  private agents: Map<string, AgentInterface> = new Map();
  private conversations: Map<string, AgentMessage[]> = new Map();
  
  /**
   * Register an agent with the orchestrator
   * @param agent The agent to register
   */
  registerAgent(agent: AgentInterface): void {
    this.agents.set(agent.getName(), agent);
    console.log(`Registered agent: ${agent.getName()}`);
  }
  
  /**
   * Get all registered agents
   * @returns An array of registered agents
   */
  getAgents(): AgentInterface[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Process a user request and route it to the appropriate agent
   * @param request The user's request
   * @param agentName Optional specific agent to direct the request to
   * @param context Additional context information
   * @returns The response from the agent
   */
  async processRequest(
    request: string, 
    agentName?: string, 
    context: AgentContext = {}
  ): Promise<AgentResponse> {
    try {
      // Ensure we have a conversation ID
      if (!context.conversationId) {
        context.conversationId = uuidv4();
      }
      
      // Add this message to the conversation history
      const userMessage: AgentMessage = {
        id: uuidv4(),
        content: request,
        timestamp: new Date(),
        sender: 'user'
      };
      
      this.addMessageToConversation(context.conversationId, userMessage);
      
      // Update context with conversation history
      context.previousMessages = this.getConversationMessages(context.conversationId);
      
      // If a specific agent is requested, route to that agent
      if (agentName && this.agents.has(agentName)) {
        const agent = this.agents.get(agentName)!;
        const response = await agent.handleRequest(request, context);
        
        // Add agent response to conversation history
        const agentMessage: AgentMessage = {
          id: uuidv4(),
          content: response.message,
          timestamp: new Date(),
          sender: 'agent',
          agentName: agent.getName()
        };
        
        this.addMessageToConversation(context.conversationId, agentMessage);
        return response;
      }
      
      // Otherwise, determine which agent should handle the request
      const agent = this.determineAgent(request, context);
      console.log(`Selected agent: ${agent.getName()} for request: ${request}`);
      
      const response = await agent.handleRequest(request, context);
      
      // Add agent response to conversation history
      const agentMessage: AgentMessage = {
        id: uuidv4(),
        content: response.message,
        timestamp: new Date(),
        sender: 'agent',
        agentName: agent.getName()
      };
      
      this.addMessageToConversation(context.conversationId, agentMessage);
      return response;
    } catch (error) {
      console.error('Error processing request:', error);
      toast('Something went wrong. Please try again.');
      return {
        message: 'Sorry, I encountered an error while processing your request. Please try again.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Determine which agent should handle a given request
   * @param request The user's request
   * @param context The context information
   * @returns The agent that should handle the request
   */
  private determineAgent(request: string, context: AgentContext): AgentInterface {
    // Simple keyword-based routing for now
    const requestLower = request.toLowerCase();
    
    // Check if we're in a recipe context
    if (context.currentRecipeId) {
      if (requestLower.includes('step') || 
          requestLower.includes('how do i') || 
          requestLower.includes('what should i') ||
          requestLower.includes('timer') ||
          requestLower.includes('next')) {
        // Cooking-related questions in a recipe context go to the cooking assistant
        const cookingAssistant = this.agents.get('CookingAssistant');
        if (cookingAssistant) return cookingAssistant;
      }
    }
    
    // Recipe search queries
    if (requestLower.includes('recipe for') || 
        requestLower.includes('how to make') || 
        requestLower.includes('find me a') ||
        requestLower.includes('search for')) {
      const recipeDiscovery = this.agents.get('RecipeDiscovery');
      if (recipeDiscovery) return recipeDiscovery;
    }
    
    // Preference-related queries
    if (requestLower.includes('prefer') || 
        requestLower.includes('like') || 
        requestLower.includes('favorite') ||
        requestLower.includes('dietary') ||
        requestLower.includes('allergic')) {
      const userPreference = this.agents.get('UserPreference');
      if (userPreference) return userPreference;
    }
    
    // Default to chat support for general queries
    const chatSupport = this.agents.get('ChatSupport');
    if (chatSupport) return chatSupport;
    
    // Fallback to the first available agent if none match
    return this.getAgents()[0];
  }
  
  /**
   * Add a message to a conversation's history
   * @param conversationId The ID of the conversation
   * @param message The message to add
   */
  private addMessageToConversation(conversationId: string, message: AgentMessage): void {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, []);
    }
    
    const conversation = this.conversations.get(conversationId)!;
    conversation.push(message);
    
    // Limit conversation history to last 20 messages to prevent memory issues
    if (conversation.length > 20) {
      this.conversations.set(conversationId, conversation.slice(-20));
    }
  }
  
  /**
   * Get all messages in a conversation
   * @param conversationId The ID of the conversation
   * @returns An array of messages in the conversation
   */
  getConversationMessages(conversationId: string): AgentMessage[] {
    return this.conversations.get(conversationId) || [];
  }
  
  /**
   * Create a new conversation
   * @returns The ID of the new conversation
   */
  createNewConversation(): string {
    const conversationId = uuidv4();
    this.conversations.set(conversationId, []);
    return conversationId;
  }
}

// Create and export a singleton instance of the orchestrator
export const agentOrchestrator = new AgentOrchestrator();
