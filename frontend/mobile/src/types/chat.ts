export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatAskResponse {
  response: string;
  source?: string | null;
}
