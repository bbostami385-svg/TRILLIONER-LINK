import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/verify", "/welcome", "/mode-selection", "/settings"]);

export function VerificationGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const isPublicPath = PUBLIC_PATHS.has(location) || location.startsWith("/api/");
  const canReviewWithoutVerification = user?.role === "admin";
  const ageStatus = trpc.ageVerification.getAgeVerificationStatus.useQuery(undefined, {
    enabled: Boolean(isAuthenticated && user && !isPublicPath),
    retry: false,
  });
  const humanStatus = trpc.humanVerification.isHumanVerified.useQuery(undefined, {
    enabled: Boolean(isAuthenticated && user && !isPublicPath),
    retry: false,
  });

  useEffect(() => {
    if (authLoading || isPublicPath || canReviewWithoutVerification || !isAuthenticated || !user || ageStatus.isLoading || humanStatus.isLoading) return;
    const verified = Boolean(ageStatus.data?.ageVerified && humanStatus.data?.isVerified);
    if (!verified && location !== "/verify") setLocation("/verify");
  }, [ageStatus.data, ageStatus.isLoading, authLoading, canReviewWithoutVerification, humanStatus.data, humanStatus.isLoading, isAuthenticated, isPublicPath, location, setLocation, user]);

  return <>{children}</>;
}
