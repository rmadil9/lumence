// Mirrors backend/app/models.py request/response schemas - keep in sync by hand,
// there is no shared codegen between the two apps.

export type TodoStatus = "todo" | "done";

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: TodoStatus;
  created_at: string;
  completed_at: string | null;
}

export interface TodoCreate {
  title: string;
  description?: string | null;
}

export interface TodoUpdate {
  title?: string;
  description?: string | null;
  status?: TodoStatus;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}

export interface UsageResponse {
  used_today: number;
  limit: number;
}

export interface StreakResponse {
  streak: number;
  already_published_today: boolean;
}

export interface ApiErrorBody {
  error: {
    message: string;
  };
}
