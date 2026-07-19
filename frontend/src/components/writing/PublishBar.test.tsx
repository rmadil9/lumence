import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublishBar } from "./PublishBar";

const api = {
  getStreak: vi.fn(),
  markPublished: vi.fn(),
};

vi.mock("@/hooks/useApiClient", () => ({
  useApiClient: () => api,
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getStreak.mockResolvedValue({ streak: 3, already_published_today: false });
});

describe("PublishBar", () => {
  it("shows the X counter and Post-to-X button by default (X on, LinkedIn off)", async () => {
    renderWithClient(<PublishBar text="hello world" />);

    expect(screen.getByText("11 / 280")).toBeInTheDocument();
    expect(screen.getByText(/Post to X/)).toBeInTheDocument();
    expect(screen.queryByText(/Copy for LinkedIn/)).not.toBeInTheDocument();
  });

  it("hides the counter and Post-to-X button once X is toggled off", () => {
    renderWithClient(<PublishBar text="hello world" />);

    fireEvent.click(screen.getByLabelText("Toggle X as a publish target"));

    expect(screen.queryByText("11 / 280")).not.toBeInTheDocument();
    expect(screen.queryByText(/Post to X/)).not.toBeInTheDocument();
  });

  it("shows Copy for LinkedIn only once LinkedIn is toggled on", () => {
    renderWithClient(<PublishBar text="hello" />);

    expect(screen.queryByText(/Copy for LinkedIn/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Toggle LinkedIn as a publish target"));
    expect(screen.getByText(/Copy for LinkedIn/)).toBeInTheDocument();
  });

  it("turns the counter into the warning color over 280 characters", () => {
    renderWithClient(<PublishBar text={"a".repeat(281)} />);

    const counter = screen.getByText("281 / 280");
    expect(counter.className).toContain("text-warning");
  });

  it("switches from Mark as published to Published today after a successful publish", async () => {
    api.markPublished.mockResolvedValue({ streak: 4, already_published_today: false });
    renderWithClient(<PublishBar text="hello" />);

    await waitFor(() =>
      expect(screen.getByText(/Mark as published/)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText(/Mark as published/));

    await waitFor(() =>
      expect(screen.getByText(/Published today/)).toBeInTheDocument(),
    );
  });
});
