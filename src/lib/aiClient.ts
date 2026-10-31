// Browser-side AI client. Calls the server's /api/ai endpoints so the Gemini
// API key stays on the server — the browser used to import src/lib/gemini
// directly with the key inlined into the bundle by vite.config's define.
// Names and signatures match the old client-side module.

async function postAi(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  return res.json();
}

export async function getBookRecommendations(history: string[], currentBooks: string[], liked: string[] = [], disliked: string[] = []) {
  return postAi('/api/ai/recommendations', { history, currentBooks, liked, disliked });
}

export async function chatWithAssistant(message: string, history: { role: string, parts: { text: string }[] }[]): Promise<string> {
  const data = await postAi('/api/ai/chat', { message, history });
  return data.text as string;
}

export async function deepLiteraryAnalysis(query: string): Promise<string> {
  const data = await postAi('/api/ai/analysis', { query });
  return data.text as string;
}
