
/**
 * Base interface for all AI agents in the system
 */
export interface AgentInterface {
  /**
   * Handle a user request and return a response
   * @param request The user's request or query
   * @param context Additional context information that might be useful for the agent
   * @returns A promise that resolves to the agent's response
   */
  handleRequest(request: string, context?: AgentContext): Promise<AgentResponse>;
  
  /**
   * Get the name of the agent
   * @returns The agent's name
   */
  getName(): string;
}

/**
 * Context information that can be passed to agents
 */
export interface AgentContext {
  // User information
  userId?: string;
  userPreferences?: UserPreferences;
  
  // Current state
  currentRecipeId?: string;
  currentStepNumber?: number;
  
  // Conversation state
  conversationId?: string;
  previousMessages?: AgentMessage[];
  
  // Additional context
  additionalContext?: Record<string, any>;
}

/**
 * User preferences that might influence agent behavior
 */
export interface UserPreferences {
  dietaryRestrictions?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  favoriteCuisines?: string[];
  savedRecipes?: string[];
  cookingHistory?: string[];
}

/**
 * Response from an agent
 */
export interface AgentResponse {
  message: string;
  data?: any;
  suggestedActions?: SuggestedAction[];
  source?: 'database' | 'ai' | 'combined';
  success: boolean;
  error?: string;
}

/**
 * A message in a conversation between a user and an agent
 */
export interface AgentMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'agent';
  agentName?: string;
}

/**
 * Actions that the agent suggests the user might want to take
 */
export interface SuggestedAction {
  type: 'viewRecipe' | 'startCooking' | 'searchRecipe' | 'askQuestion' | 'other';
  label: string;
  value: string;
}
