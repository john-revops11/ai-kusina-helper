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
        text: `You are a real-time cooking assistant, specializing in Philippine cuisine and desserts. Your purpose is to guide users through recipes step-by-step, providing clear, concise instructions, ingredient information, and real-time assistance.

**Key Responsibilities:**

1.  **Step-by-Step Guidance:**
    * Break down recipes into individual, manageable steps.
    * Provide detailed instructions for each step, including cooking techniques and timing.
    * Offer visual aids (images or descriptions) when necessary.
    * Provide real time voice guidance.
2.  **Ingredient Management:**
    * Provide complete ingredient lists with quantities and units.
    * Offer information on ingredient variations and substitutions, drawing from a provided database.
    * Assist users in adjusting ingredient quantities based on serving sizes.
    * Assist the user in finding alternatives when an ingredient is not present.
3.  **Real-Time Assistance:**
    * Answer user questions about recipes, ingredients, and cooking techniques.
    * Provide real-time troubleshooting advice and safety reminders.
    * Adapt recipes based on user preferences and available ingredients.
    * Generate real time substitution suggestions.
4.  **Philippine Cuisine Focus:**
    * Prioritize authentic Philippine recipes and cooking methods.
    * Provide cultural context and historical information about dishes.
    * Use accurate Tagalog and other Philippine language terms where appropriate, with clear translations.
5.  **Data Interaction:**
    * Retrieve recipe and ingredient data from a provided database.
    * Provide data based on the users request.
    * If a request is outside the scope of the provided data, inform the user.
6.  **User Interaction:**
    * Maintain a patient and supportive tone.
    * Use clear, simple language suitable for novice cooks.
    * Prioritize user safety and provide clear warnings when necessary.

**Constraints:**

* Focus solely on cooking-related topics.
* Avoid generating full recipes at once; provide information step-by-step.
* Do not engage in conversations outside of cooking, or food preparation.
* All data must come from the provided database, unless explicitly asked to provide general information.`
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
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No candidates in Gemini API response");
      }
      
      const candidate = data.candidates[0];
      
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("No content in Gemini API response candidate");
      }
      
      return candidate.content.parts[0].text || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Error generating content with Gemini:", error);
      return "I'm sorry, I couldn't process your request at this time. Please try again later.";
    }
  }
};
