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

Format it as valid JSON without explanation. The system will transform this format to the internal application format.`,
  
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
   * Processes the API response to extract the recipe JSON and transform it to the expected format
   * @param responseText The raw API response text
   * @returns The extracted JSON string in the expected format
   */
  processApiResponse(responseText: string): string {
    // Extract JSON content
    try {
      // Check if the response contains valid JSON array
      if (responseText.includes('[') && responseText.includes(']')) {
        const jsonStart = responseText.indexOf('[');
        const jsonEnd = responseText.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonString = responseText.substring(jsonStart, jsonEnd);
          
          // Test parse the JSON to validate it
          const parsed = JSON.parse(jsonString);
          
          // Check if the parsed content is in the new format
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].recipeName) {
            return this.transformToExpectedFormat(parsed);
          }
          
          // If this is already in our expected format, return as is
          if (parsed.recipe && parsed.ingredients && parsed.steps) {
            return jsonString;
          }
          
          // Otherwise, attempt to transform any format
          return this.transformToExpectedFormat(parsed);
        }
      }
      
      // Try to parse for regular JSON object (not array)
      if (responseText.includes('{') && responseText.includes('}')) {
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonString = responseText.substring(jsonStart, jsonEnd);
          
          // Test parse the JSON
          const parsed = JSON.parse(jsonString);
          
          // Check if the parsed object has the expected structure
          if (parsed.recipe || parsed.recipeName) {
            return this.transformToExpectedFormat(parsed);
          }
        }
      }
      
      // If we couldn't extract valid JSON, log and handle the error
      console.warn("Couldn't extract JSON from response:", responseText);
      
      // Return a fallback empty recipe structure
      const fallbackRecipe = {
        recipe: {
          title: "Invalid Response Format",
          description: "The AI didn't generate a valid recipe format.",
          category: "Unknown",
          difficulty: "Medium",
          prepTime: "N/A",
          cookTime: "N/A",
          servings: 0,
          instructions: "Please try searching for a different recipe."
        },
        ingredients: [],
        steps: []
      };
      
      toast("Could not process recipe data from AI", {
        description: "Please try searching for a different recipe"
      });
      
      return JSON.stringify(fallbackRecipe);
    } catch (jsonError) {
      console.error("Error parsing JSON from AI response:", jsonError);
      console.log("Problematic response:", responseText);
      
      // Return a fallback empty recipe structure
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
        description: "Please try searching for a different recipe"
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
        title: recipe.recipeName || recipe.recipe?.title || "Unknown Recipe",
        description: recipe.description || recipe.recipe?.description || "A delicious Filipino recipe",
        category: recipe.category || recipe.recipe?.category || "Main Dish",
        difficulty: recipe.recipe?.difficulty || "Medium", // Default since not in original format
        prepTime: recipe.recipe?.prepTime || `${prepTimeMinutes} mins`,
        cookTime: recipe.recipe?.cookTime || `${Math.round(prepTimeMinutes * 1.5)} mins`,
        servings: recipe.recipe?.servings || 4, // Default since not in original format
        instructions: Array.isArray(recipe.steps) 
          ? recipe.steps.join(". ") 
          : recipe.recipe?.instructions || ""
      },
      ingredients: Array.isArray(recipe.ingredients) 
        ? recipe.ingredients.map((ing: any) => ({
            name: ing.ingredientName || ing.name || "",
            quantity: ing.quantity || "",
            unit: ing.unit || "",
            hasSubstitutions: ing.hasSubstitutions || false,
            isOptional: ing.isOptional || false
          }))
        : recipe.ingredients || [],
      steps: Array.isArray(recipe.steps)
        ? recipe.steps.map((step: string, index: number) => ({
            number: index + 1,
            instruction: step,
            timeInMinutes: avgStepTime,
            isCritical: index === 0 // First step is usually important
          }))
        : recipe.steps || []
    };
    
    return JSON.stringify(transformedData);
  }
};
