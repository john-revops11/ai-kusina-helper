
import { toast } from "sonner";

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAIRequestBody = {
  model: string;
  messages: OpenAIMessage[];
  temperature: number;
  max_tokens: number;
};

/**
 * Service for interacting with the OpenAI API
 */
export const openaiService = {
  /**
   * The OpenAI API key - this should be stored securely in a real production environment
   */
  apiKey: "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",
  
  /**
   * The OpenAI model ID
   */
  modelId: "gpt-4o",
  
  /**
   * The system instruction for the OpenAI model
   */
  systemInstruction: `You are an AI Cooking Assistant specialized in understanding and retrieving recipes, particularly Filipino cuisine and desserts. Your purpose is to provide detailed, accurate recipe information structured for easy consumption.

**Recipe Discovery & Response Structure:**

1. When asked for a recipe, provide a complete, detailed response in JSON format with the following structure:
   {
     "recipe": {
       "title": "Full Recipe Name",
       "description": "Brief cultural or flavor description",
       "category": "Main Course/Dessert/Appetizer/etc.",
       "difficulty": "Easy/Medium/Hard",
       "prepTime": "Preparation time in minutes",
       "cookTime": "Cooking time in minutes",
       "servings": number of servings,
       "instructions": "Brief overview of the cooking process"
     },
     "ingredients": [
       {
         "name": "Specific ingredient name",
         "quantity": "Precise amount",
         "unit": "Appropriate measurement unit",
         "isOptional": boolean,
         "hasSubstitutions": boolean
       }
       // Include ALL ingredients with accurate quantities and measurements
     ],
     "steps": [
       {
         "number": sequential step number,
         "instruction": "Detailed, clear cooking instruction",
         "timeInMinutes": estimated time for this step,
         "isCritical": boolean indicating if this is a crucial step
       }
       // Include ALL steps in proper sequential order
     ]
   }

EXTREMELY IMPORTANT: Never generate incomplete recipes. Always ensure your response contains the complete JSON structure with all required fields populated with accurate, detailed information. Do NOT include any explanatory text before or after the JSON - provide ONLY the JSON object.`,
  
  /**
   * Makes a request to the OpenAI API
   * @param userQuery The user's query
   * @returns The response from the OpenAI API
   */
  async generateContent(userQuery: string): Promise<string> {
    try {
      const messages: OpenAIMessage[] = [
        {
          role: "system",
          content: this.systemInstruction
        },
        {
          role: "user",
          content: userQuery
        }
      ];
      
      const requestBody: OpenAIRequestBody = {
        model: this.modelId,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      };
      
      // Make the request to OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error response:", errorData);
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No choices in OpenAI API response");
      }
      
      const responseText = data.choices[0].message.content;
      console.log("OpenAI Response:", responseText);
      
      return this.processApiResponse(responseText);
    } catch (error) {
      console.error("Error generating content with OpenAI:", error);
      
      // Provide a fallback response with empty recipe structure
      const fallbackResponse = {
        recipe: {
          title: "Recipe Unavailable",
          description: "The recipe service is currently unavailable.",
          category: "Unknown",
          difficulty: "Medium", 
          prepTime: "N/A",
          cookTime: "N/A",
          servings: 0,
          instructions: "Recipe generation failed. Please try again later."
        },
        ingredients: [],
        steps: []
      };
      
      return JSON.stringify(fallbackResponse);
    }
  },
  
  /**
   * Processes the API response to extract the recipe JSON
   * @param data The raw API response data
   * @returns The extracted JSON string
   */
  processApiResponse(responseText: string): string {
    // Extract JSON content
    try {
      // Check if the response contains valid JSON by looking for opening and closing braces
      if (responseText.includes('{') && responseText.includes('}')) {
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonString = responseText.substring(jsonStart, jsonEnd);
          
          // Test parse the JSON to validate it
          const parsed = JSON.parse(jsonString);
          
          // Ensure the parsed object has the expected structure
          if (!parsed.recipe || !parsed.ingredients || !parsed.steps) {
            console.warn("Parsed JSON doesn't have the expected recipe structure:", parsed);
            toast.warning("AI response didn't have the expected recipe structure");
          }
          
          return jsonString;
        }
      }
      
      // If we couldn't extract valid JSON, return the original text
      console.warn("Couldn't extract JSON from response:", responseText);
      return responseText;
    } catch (jsonError) {
      console.error("Error parsing JSON from AI response:", jsonError);
      console.log("Problematic response:", responseText);
      
      // Return a fallback empty recipe structure instead of failing completely
      const fallbackRecipe = {
        recipe: {
          title: "Recipe Not Available",
          description: "The AI couldn't generate a valid recipe at this time.",
          category: "Unknown",
          difficulty: "Medium",
          prepTime: "N/A",
          cookTime: "N/A",
          servings: 0,
          instructions: "Recipe generation failed. Please try again later."
        },
        ingredients: [],
        steps: []
      };
      
      toast("Could not process recipe data from AI", {
        description: "Please try searching for a different recipe",
        style: { backgroundColor: "red", color: "white" }
      });
      
      return JSON.stringify(fallbackRecipe);
    }
  }
};
