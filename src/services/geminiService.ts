
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

When asked for a recipe, provide a complete, detailed response in JSON format with an ARRAY of recipe objects with the following structure:
[
  {
    "recipeName": "Full Recipe Name",
    "description": "Brief cultural or flavor description",
    "culture": "Filipino",
    "category": "Main Course/Dessert/Appetizer/etc.",
    "imageUrl": "URL to an image of this dish",
    "ingredients": [
      {
        "ingredientName": "Specific ingredient name",
        "quantity": "Precise amount",
        "unit": "Appropriate measurement unit"
      }
      // Include ALL ingredients with accurate quantities and measurements
    ],
    "steps": [
      "Step 1 with clear instruction",
      "Step 2 with clear instruction",
      // Include ALL steps in proper sequential order
    ]
  }
]

Format it as valid JSON without explanation. The system will transform this format to the internal application format.`
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
   * Processes the API response to extract the recipe JSON and convert it to the expected format
   * @param data The raw API response data
   * @returns The extracted JSON string in the expected format
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
      if (responseText.includes('[') && responseText.includes(']')) {
        const jsonStart = responseText.indexOf('[');
        const jsonEnd = responseText.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonString = responseText.substring(jsonStart, jsonEnd);
          
          // Test parse the JSON to validate it
          const parsed = JSON.parse(jsonString);
          
          // Ensure the parsed array has recipe objects
          if (!Array.isArray(parsed) || parsed.length === 0) {
            console.warn("Parsed JSON doesn't have the expected array structure:", parsed);
            return this.transformToExpectedFormat(parsed);
          }
          
          // Check if this is already the new array format (with recipeName instead of title)
          if (parsed[0].recipeName) {
            // Transform the new format to the expected app format
            return this.transformToExpectedFormat(parsed);
          } else {
            // Return as is if it's already in the expected format
            return jsonString;
          }
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
  },
  
  /**
   * Transform the new array format to the expected application format
   * @param recipes The array of recipes in the new format
   * @returns A JSON string in the expected format
   */
  transformToExpectedFormat(recipes: any): string {
    // If it's not an array, wrap it in an array
    const recipeArray = Array.isArray(recipes) ? recipes : [recipes];
    
    if (recipeArray.length === 0) {
      console.warn("Empty recipe array received");
      return JSON.stringify({
        recipe: {
          title: "Recipe Not Available",
          description: "No recipes were returned",
          category: "Unknown",
          difficulty: "Medium",
          prepTime: "N/A",
          cookTime: "N/A",
          servings: 0,
          instructions: "Recipe generation failed. Please try again later."
        },
        ingredients: [],
        steps: []
      });
    }
    
    // Take the first recipe from the array
    const recipe = recipeArray[0];
    
    if (!recipe) {
      console.warn("Invalid recipe object received", recipe);
      return JSON.stringify({
        recipe: {
          title: "Invalid Recipe",
          description: "The recipe data was not in the expected format",
          category: "Unknown",
          difficulty: "Medium",
          prepTime: "N/A",
          cookTime: "N/A",
          servings: 0,
          instructions: "Please try a different recipe search."
        },
        ingredients: [],
        steps: []
      });
    }
    
    // Extract step times (approx 5 minutes per step if not specified)
    const avgStepTime = 5;
    const totalSteps = Array.isArray(recipe.steps) ? recipe.steps.length : 0;
    const prepTimeMinutes = totalSteps * avgStepTime;
    
    // Transform to expected format
    const transformedData = {
      recipe: {
        title: recipe.recipeName || "Unknown Recipe",
        description: recipe.description || "A delicious Filipino recipe",
        category: recipe.category || "Main Dish",
        difficulty: "Medium", // Default since not in original format
        prepTime: `${prepTimeMinutes} mins`,
        cookTime: `${Math.round(prepTimeMinutes * 1.5)} mins`,
        servings: 4, // Default since not in original format
        instructions: Array.isArray(recipe.steps) ? recipe.steps.join(". ") : ""
      },
      ingredients: Array.isArray(recipe.ingredients) 
        ? recipe.ingredients.map((ing: any) => ({
            name: ing.ingredientName || "",
            quantity: ing.quantity || "",
            unit: ing.unit || "",
            hasSubstitutions: false, // Default since not in original format
            isOptional: false // Default since not in original format
          }))
        : [],
      steps: Array.isArray(recipe.steps)
        ? recipe.steps.map((step: string, index: number) => ({
            number: index + 1,
            instruction: step,
            timeInMinutes: avgStepTime,
            isCritical: index === 0 // First step is usually important
          }))
        : []
    };
    
    return JSON.stringify(transformedData);
  }
};
