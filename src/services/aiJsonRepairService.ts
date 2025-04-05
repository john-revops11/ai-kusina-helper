
import { toast } from "sonner";
import { openaiService } from "./openaiService";
import { geminiService } from "./geminiService";
import { aiProviderService } from "./aiProviderService";

/**
 * Service for repairing JSON using AI
 */
export const aiJsonRepairService = {
  /**
   * System instruction for AI JSON repair
   */
  systemInstruction: `You are an AI expert in JSON repair and data transformation. Your task is to analyze and fix JSON data 
  that is intended to match a specific template format for a recipe import system. 
  
  Here is the expected format:
  [
    {
      "recipeName": "Recipe Name",
      "description": "Description",
      "culture": "Culture",
      "category": "Category",
      "prepTime": "30 mins",
      "cookTime": "45 mins", 
      "difficulty": "Easy|Medium|Hard",
      "servings": 4,
      "imageUrl": "https://example.com/image.jpg",
      "steps": ["Step 1", "Step 2"],
      "ingredients": [
        { "ingredientName": "Ingredient 1", "quantity": "1", "unit": "cup" }
      ]
    }
  ]
  
  Common issues to fix:
  1. Missing square brackets around the array 
  2. Missing quotes around keys and string values
  3. Missing commas between objects
  4. Incorrect property names (e.g., 'name' instead of 'recipeName')
  5. Incorrect nested structure for ingredients or steps
  6. Invalid JSON syntax (unclosed brackets, extra commas)
  7. Mixed formats or non-compliant structures
  
  Analyze the provided JSON, identify the errors, and return a corrected version that matches
  the template format exactly. If the data is already valid but uses different property names, map them to the expected format.
  
  Return ONLY the corrected JSON array with no explanation.`,
  
  /**
   * Repairs invalid JSON data using AI
   * @param jsonData The potentially invalid JSON data
   * @returns A promise that resolves to the repaired JSON data
   */
  async repairJson(jsonData: string): Promise<string> {
    try {
      // First attempt to parse the JSON to see if it's already valid
      try {
        JSON.parse(jsonData);
        // If it parses correctly, try to validate against our schema
        const isValid = this.validateAgainstSchema(jsonData);
        if (isValid) {
          console.log("JSON is already valid and matches schema");
          return jsonData;
        }
      } catch (parseError) {
        // JSON is invalid, will proceed with repair
        console.log("Invalid JSON, will attempt repair:", parseError);
      }
      
      // Get the current AI provider
      const provider = aiProviderService.getCurrentProvider();
      
      // Use the appropriate AI service based on user preference
      let result: string;
      if (provider === 'openai') {
        result = await this.repairWithOpenAI(jsonData);
      } else {
        result = await this.repairWithGemini(jsonData);
      }
      
      // Validate the repaired JSON
      try {
        JSON.parse(result);
        return result;
      } catch (error) {
        console.error("AI returned invalid JSON:", error);
        throw new Error("AI repair failed to produce valid JSON");
      }
    } catch (error) {
      console.error("Error repairing JSON:", error);
      throw error;
    }
  },
  
  /**
   * Validate JSON against our expected schema
   * @param jsonData The JSON data to validate
   * @returns True if valid, false otherwise
   */
  validateAgainstSchema(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      
      // Check if it's an array
      if (!Array.isArray(parsed)) {
        return false;
      }
      
      // Check each recipe
      for (const recipe of parsed) {
        if (!recipe.recipeName || 
            !recipe.description || 
            !recipe.category ||
            !Array.isArray(recipe.steps) || 
            !Array.isArray(recipe.ingredients)) {
          return false;
        }
        
        // Check ingredients
        for (const ingredient of recipe.ingredients) {
          if (!ingredient.ingredientName || !ingredient.quantity) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Repair JSON using OpenAI
   * @param jsonData The JSON data to repair
   * @returns A promise that resolves to the repaired JSON data
   */
  async repairWithOpenAI(jsonData: string): Promise<string> {
    try {
      const messages = [
        {
          role: "system",
          content: this.systemInstruction
        },
        {
          role: "user",
          content: `Fix this JSON data to match the template format: ${jsonData}`
        }
      ];
      
      // Make request to OpenAI API through our service
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiService.apiKey}`
        },
        body: JSON.stringify({
          model: openaiService.modelId,
          messages: messages,
          temperature: 0.2, // Lower temperature for more precise JSON repair
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      const repairedJson = data.choices[0].message.content.trim();
      
      return this.extractJsonFromResponse(repairedJson);
    } catch (error) {
      console.error("Error using OpenAI for JSON repair:", error);
      throw error;
    }
  },
  
  /**
   * Repair JSON using Gemini
   * @param jsonData The JSON data to repair
   * @returns A promise that resolves to the repaired JSON data
   */
  async repairWithGemini(jsonData: string): Promise<string> {
    try {
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${this.systemInstruction}\n\nFix this JSON data to match the template format: ${jsonData}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "text/plain"
        }
      };
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiService.modelId}:generateContent?key=${geminiService.apiKey}`,
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
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      const repairedJson = data.candidates[0].content.parts[0].text.trim();
      
      return this.extractJsonFromResponse(repairedJson);
    } catch (error) {
      console.error("Error using Gemini for JSON repair:", error);
      throw error;
    }
  },
  
  /**
   * Extract JSON from AI response which might contain markdown or extra text
   * @param response The AI response text
   * @returns The extracted JSON string
   */
  extractJsonFromResponse(response: string): string {
    // Try to find JSON array in the response
    const jsonMatch = response.match(/\[\s*{[\s\S]*}\s*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    // If no array found, look for a JSON object
    const objectMatch = response.match(/{[\s\S]*}/);
    if (objectMatch) {
      // Wrap the object in an array
      return `[${objectMatch[0]}]`;
    }
    
    // If we couldn't find JSON, return the original response
    return response;
  }
};
