import { GoogleGenAI } from "@google/genai";

// SERVER-ONLY module: the API key must never reach the browser. The client
// calls these through the /api/ai endpoints (see src/lib/aiClient.ts); this
// file used to be imported by client code with the key inlined into the
// bundle by vite.config's define.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getBookRecommendations = async (history: string[], currentBooks: string[], liked: string[] = [], disliked: string[] = []) => {
  const prompt = `You are a professional librarian and book recommender. 
  
  User Reading Profile:
  - Reading History: ${history.join(', ')}
  - Currently Reading: ${currentBooks.join(', ')}
  - Recommendations User Liked: ${liked.join(', ')}
  - Recommendations User Disliked: ${disliked.join(', ')}
  
  Based on this profile, recommend 5 books that the user might enjoy. Adjust your logic based on what they liked and disliked. For each book, provide:
  1. Title
  2. Author
  3. Why you recommend it (1-2 sentences, mentioning how it relates to their profile or feedback)
  4. A search query for Google Books
  
  Format the response as a JSON array of objects.`;

  // Failures propagate to the caller (previously swallowed into `return []`,
  // which is indistinguishable from "no recommendations" and left the UI on
  // permanent skeleton placeholders).
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });
  return JSON.parse(response.text || '[]');
};

export const chatWithAssistant = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  try {
    // The history parameter used to be accepted and then IGNORED — a fresh
    // chat was created per call, so the assistant had no memory despite the
    // conversational UI. The transcript now goes into the request.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: "You are Libris AI, a helpful reading assistant. You help users find books, track progress, and stay motivated with their reading goals. You are friendly, knowledgeable about literature, and encouraging.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. How else can I help you with your reading?";
  }
};

export const deepLiteraryAnalysis = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Perform a deep literary analysis on the following query: ${query}. 
      Provide profound insights, explore complex themes, and offer a sophisticated perspective.`,
      config: {
        thinkingLevel: "HIGH",
      } as any
    });
    return response.text;
  } catch (error) {
    console.error("Deep Analysis Error:", error);
    return "I encountered an error while performing the deep analysis. Please try again later.";
  }
};
