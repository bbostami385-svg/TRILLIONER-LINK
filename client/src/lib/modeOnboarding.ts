export type PlatformMode = "social" | "creator";

export function shouldRedirectToWelcome(input: { isAuthenticated: boolean; location: string; modeSelected?: boolean }) {
  const onboardingPaths = ["/login", "/signup", "/verify", "/welcome", "/mode-selection"];
  return input.isAuthenticated && !onboardingPaths.includes(input.location) && input.modeSelected === false;
}

export function selectModeStatistics<T extends { mode: PlatformMode }>(preferences: T[] | undefined, mode: PlatformMode) {
  return preferences?.find((preference) => preference.mode === mode) ?? null;
}
