export type AdsListState = "loading" | "error" | "empty" | "ready";

export function adsListState(input: { isLoading: boolean; hasError: boolean; count?: number }): AdsListState {
  if (input.isLoading) return "loading";
  if (input.hasError) return "error";
  return (input.count ?? 0) > 0 ? "ready" : "empty";
}

export function shouldRefreshAdsAfterMutation(action: "create" | "update" | "delete") {
  return action === "create" || action === "update" || action === "delete";
}
