import React, { useEffect } from "react";
import { useNavigate } from "wouter";
import { ModeSelector } from "@/components/ModeSelector";
import { trpc } from "@/lib/trpc";

/**
 * WelcomeScreen Page
 * Shown to users on first login to choose between Social and Creator modes
 */
export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { data: currentMode, isLoading } = trpc.dualMode.getCurrentMode.useQuery();

  // If user has already selected a mode, redirect to home
  useEffect(() => {
    if (!isLoading && currentMode?.modeSelected) {
      navigate("/");
    }
  }, [currentMode, isLoading, navigate]);

  const handleModeSelected = (mode: "social" | "creator") => {
    // Redirect to home after mode selection
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-pulse">
          <div className="h-12 w-48 bg-gray-300 rounded-lg mb-4" />
          <div className="h-6 w-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
              TRILLIONER LINK
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            The all-in-one platform for creators and communities
          </p>
        </div>

        {/* Mode Selector */}
        <ModeSelector onModeSelected={handleModeSelected} isInitialSetup={true} />

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600 text-sm">
          <p>
            By choosing a mode, you agree to our{" "}
            <a href="#" className="text-purple-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-purple-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
