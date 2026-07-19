import type {
  ApiErrorBody,
  ChatRequest,
  ChatResponse,
  StreakResponse,
  Todo,
  TodoCreate,
  TodoUpdate,
  UsageResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type GetToken = () => Promise<string | null>;

async function request<T>(
  getToken: GetToken,
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(res.status, body?.error?.message ?? res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// One method per backend route (backend/app/routers/*.py) - this is the only
// file that knows the API's URL shapes; everything else calls these methods.
export function createApiClient(getToken: GetToken) {
  return {
    syncUser: () => request<{ id: number }>(getToken, "/users/sync", { method: "POST" }),

    listTodos: () => request<Todo[]>(getToken, "/todos"),
    createTodo: (payload: TodoCreate) =>
      request<Todo>(getToken, "/todos", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    updateTodo: (id: number, payload: TodoUpdate) =>
      request<Todo>(getToken, `/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteTodo: (id: number) =>
      request<void>(getToken, `/todos/${id}`, { method: "DELETE" }),

    chat: (payload: ChatRequest) =>
      request<ChatResponse>(getToken, "/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getUsage: () => request<UsageResponse>(getToken, "/usage"),

    getStreak: () => request<StreakResponse>(getToken, "/streak"),
    markPublished: () =>
      request<StreakResponse>(getToken, "/publish", { method: "POST" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
