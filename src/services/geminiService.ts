import { toast } from "sonner";

type GeminiRequestContent = {
  role: "user";
  parts: {
    text: string;
  }[];
};

type GeminiSystemInstruction = {
  parts: {
    text: string;
  }[];
};

type GeminiRequestBody = {
  contents: GeminiRequestContent[];
  systemInstruction?: GeminiSystemInstruction;
  generationConfig: {
    topP?: number;
    responseMimeType: string;
  };
};

/**
 * Service for interacting with the Gemini AI API
 */
export const geminiService = {
  /**
   * The Gemini API key
   */
  apiKey: "AIzaSyCxILwyPFK5D8DrD7T0hJHs2ieV-SpDfZU",
  
  /**
   * The Gemini model ID - using the faster flash model to reduce rate limit issues
   */
  modelId: "gemini-2.0-flash",
  
  /**
   * The system instruction for the Gemini AI
   */
  systemInstruction: {
    parts: [
      {
        text: `You are an AI Cooking Assistant specialized in understanding and retrieving recipes, particularly Filipino cuisine and desserts. Your purpose is to provide detailed, accurate recipe information structured for easy consumption.

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

EXTREMELY IMPORTANT: Never generate incomplete recipes. Always ensure your response contains the complete JSON structure with all required fields populated with accurate, detailed information. Do NOT include any explanatory text before or after the JSON - provide ONLY the JSON object.`
      }
    ]
  },
  
  /**
   * Makes a request to the Gemini AI API
   * @param userQuery The user's query
   * @returns The response from the Gemini AI
   */
  async generateContent(userQuery: string): Promise<string> {
    try {
      const requestBody: GeminiRequestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: userQuery
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "text/plain"
        }
      };
      
      // Add system instruction only for the full model, not for the flash model
      if (this.modelId.includes("2.5")) {
        requestBody.systemInstruction = this.systemInstruction;
      }
      
      // First attempt with standard generateContent
      return await this.attemptApiCall(requestBody);
    } catch (error) {
      console.error("Error generating content with Gemini:", error);
      throw error; // Let the recipe search service handle the fallback
    }
  },
  
  /**
   * Attempts to call the Gemini API with backoff and fallback strategies
   * @param requestBody The request body to send to the API
   * @returns The response from the Gemini API
   */
  async attemptApiCall(requestBody: GeminiRequestBody): Promise<string> {
    // First try with the faster model
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error response:", errorData);
        
        // Handle rate limit errors specifically
        if (errorData.error && errorData.error.code === 429) {
          toast("Trying alternative Gemini model...", {
            description: "The recipe search service is switching to a different model"
          });
          
          // Fall back to the more powerful model with higher quota
          this.modelId = "gemini-2.5-pro-exp-03-25";
          
          // Add system instruction for the full model
          requestBody.systemInstruction = this.systemInstruction;
          
          // Retry with the fallback model
          const fallbackResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(requestBody)
            }
          );
          
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback Gemini API error: ${fallbackResponse.statusText}`);
          }
          
          return this.processApiResponse(await fallbackResponse.json());
        }
        
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      return this.processApiResponse(data);
    } catch (error) {
      console.error("Error in Gemini API call:", error);
      throw error; // Let the recipe search service handle the fallback
    }
  },
  
  /**
   * Processes the API response to extract the recipe JSON
   * @param data The raw API response data
   * @returns The extracted JSON string
   */
  processApiResponse(data: any): string {
    if (!data.candidates || data.candidates.length === 0) {
      console.error("No candidates in Gemini API response:", data);
      throw new Error("No candidates in Gemini API response");
    }
    
    const candidate = data.candidates[0];
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error("No content in Gemini API response candidate:", candidate);
      throw new Error("No content in Gemini API response candidate");
    }
    
    const responseText = candidate.content.parts[0].text || "I couldn't generate a response. Please try again.";
    console.log("AI Response:", responseText);
    
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
