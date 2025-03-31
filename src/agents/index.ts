
import { agentOrchestrator } from './AgentOrchestrator';
import { recipeDiscoveryAgent } from './RecipeDiscoveryAgent';
import { cookingAssistantAgent } from './CookingAssistantAgent';
import { userPreferenceAgent } from './UserPreferenceAgent';
import { chatSupportAgent } from './ChatSupportAgent';

// Register all agents with the orchestrator
agentOrchestrator.registerAgent(recipeDiscoveryAgent);
agentOrchestrator.registerAgent(cookingAssistantAgent);
agentOrchestrator.registerAgent(userPreferenceAgent);
agentOrchestrator.registerAgent(chatSupportAgent);

// Export everything for easy imports
export * from './AgentInterface';
export * from './AgentOrchestrator';
export * from './RecipeDiscoveryAgent';
export * from './CookingAssistantAgent';
export * from './UserPreferenceAgent';
export * from './ChatSupportAgent';

// Export the orchestrator instance as the default
export default agentOrchestrator;
