import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getBookRecommendations = async (history: string[], currentBooks: string[]) => {
  const prompt = `You are a professional librarian and book recommender. 
  Based on this reading history: ${history.join(', ')}
  And these books currently being read: ${currentBooks.join(', ')}
  
  Recommend 5 books that the user might enjoy. For each book, provide:
  1. Title
  2. Author
  3. Why you recommend it (1-2 sentences)
  4. A search query for Google Books
  
  Format the response as a JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const chatWithAssistant = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are Libris AI, a helpful reading assistant. You help users find books, track progress, and stay motivated with their reading goals. You are friendly, knowledgeable about literature, and encouraging.",
      }
    });

    // Note: The SDK handles history slightly differently in some versions, 
    // but we'll use the standard sendMessage approach.
    const response = await chat.sendMessage({
      message: message,
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
