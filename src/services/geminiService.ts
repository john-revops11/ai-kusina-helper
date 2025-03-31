
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
  systemInstruction: GeminiSystemInstruction;
  generationConfig: {
    topP: number;
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
   * The Gemini model ID
   */
  modelId: "gemini-2.5-pro-exp-03-25",
  
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

2. **Ingredient Specification Requirements:**
   - Be extremely precise with ingredients - list EVERY ingredient needed
   - Provide exact measurements (e.g., "2 tablespoons" not just "some")
   - Specify the preparation state when relevant (e.g., "minced garlic" not just "garlic")
   - For Filipino recipes, include both English and Tagalog names when appropriate
   - Mark ingredients as optional only when they truly are
   - Always specify if common allergens are present

3. **Cooking Steps Requirements:**
   - Break down the cooking process into clear, logical steps
   - Number steps sequentially
   - Provide clear timing indicators where relevant
   - Include temperature settings when applicable
   - Highlight critical steps that affect the success of the recipe
   - Use precise cooking terminology
   - Include visual cues that indicate when a step is complete

4. **Response Accuracy:**
   - Focus on authentic Filipino recipe formulations
   - Include regional variations when relevant
   - Provide culturally accurate information
   - Never omit key ingredients or steps to simplify the recipe
   - Maintain proper technique and temperature guidance

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
      const requestBody = {
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
        systemInstruction: this.systemInstruction,
        generationConfig: {
          topP: 1,
          responseMimeType: "text/plain"
        }
      };
      
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
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
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
      console.log("Raw AI response:", responseText);
      
      return responseText;
    } catch (error) {
      console.error("Error generating content with Gemini:", error);
      return "I'm sorry, I couldn't process your request at this time. Please try again later.";
    }
  }
};
