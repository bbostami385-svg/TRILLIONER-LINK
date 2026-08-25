// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdsDashboard } from "./AdsDashboard";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const mocks = vi.hoisted(() => ({
  queryState: { data: [] as any[] | undefined, isLoading: false, error: null as Error | null },
  invalidate: vi.fn(),
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  createOptions: undefined as any,
  updateOptions: undefined as any,
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 4, role: "user" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ ads: { getUserAds: { invalidate: mocks.invalidate } } }),
    ads: {
      getUserAds: { useQuery: () => mocks.queryState },
      createSponsoredPost: { useMutation: (options: any) => { mocks.createOptions = options; return { isPending: false, mutateAsync: mocks.createMutateAsync }; } },
      updateAdStatus: { useMutation: (options: any) => { mocks.updateOptions = options; return { isPending: false, mutateAsync: mocks.updateMutateAsync }; } },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("AdsDashboard component", () => {
  beforeEach(() => {
    mocks.queryState.data = [];
    mocks.queryState.isLoading = false;
    mocks.queryState.error = null;
    mocks.invalidate.mockReset();
    mocks.createMutateAsync.mockReset();
    mocks.updateMutateAsync.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("renders loading, error, and empty campaign states", () => {
    mocks.queryState.isLoading = true;
    const { rerender } = render(<AdsDashboard />);
    expect(screen.getByText("Loading campaigns…")).toBeTruthy();

    mocks.queryState.isLoading = false;
    mocks.queryState.error = new Error("offline");
    rerender(<AdsDashboard />);
    expect(screen.getByText("Could not load campaigns. Please refresh and try again.")).toBeTruthy();

    mocks.queryState.error = null;
    rerender(<AdsDashboard />);
    expect(screen.getByText("You don't have any ads yet")).toBeTruthy();
  });

  it("invalidates the live campaign query and shows success feedback after create and update", async () => {
    render(<AdsDashboard />);
    await mocks.createOptions.onSuccess();
    expect(mocks.invalidate).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Ad campaign created.");

    await mocks.updateOptions.onSuccess();
    expect(mocks.invalidate).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith("Campaign status updated.");
  });

  it("shows mutation errors through the user-facing toast boundary", () => {
    render(<AdsDashboard />);
    mocks.createOptions.onError(new Error("Campaign rejected"));
    mocks.updateOptions.onError(new Error("Status rejected"));
    expect(toast.error).toHaveBeenCalledWith("Campaign rejected");
    expect(toast.error).toHaveBeenCalledWith("Status rejected");
  });
});
