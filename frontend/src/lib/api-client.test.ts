import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, createApiClient } from "./api-client";

const getToken = vi.fn(async () => "test-token");

afterEach(() => {
  vi.unstubAllGlobals();
  getToken.mockClear();
});

describe("createApiClient", () => {
  it("attaches the Clerk token as a bearer header", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify([]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient(getToken);
    await client.listTodos();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-token",
    );
  });

  it("throws ApiError with the backend's error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { message: "todo not found" } }), {
            status: 404,
          }),
      ),
    );

    const client = createApiClient(getToken);
    await expect(client.deleteTodo(999)).rejects.toMatchObject({
      message: "todo not found",
      status: 404,
    });
    await expect(client.deleteTodo(999)).rejects.toBeInstanceOf(ApiError);
  });

  it("returns undefined for 204 No Content responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    const client = createApiClient(getToken);
    await expect(client.deleteTodo(1)).resolves.toBeUndefined();
  });
});
