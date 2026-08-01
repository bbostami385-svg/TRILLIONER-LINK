import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Video, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ModeSelectorProps {
  onModeSelected?: (mode: "social" | "creator") => void;
  isInitialSetup?: boolean;
}

/**
 * ModeSelector Component
 * Allows users to choose between Social Mode and Creator Mode
 * Used during first-time setup and in settings
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onModeSelected,
  isInitialSetup = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<"social" | "creator" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initMutation = trpc.dualMode.initializeModePreferences.useMutation();
  const switchMutation = trpc.dualMode.switchMode.useMutation();

  const handleModeSelect = async (mode: "social" | "creator") => {
    setSelectedMode(mode);
    setIsLoading(true);

    try {
      if (isInitialSetup) {
        await initMutation.mutateAsync({ selectedMode: mode });
      } else {
        await switchMutation.mutateAsync({ newMode: mode });
      }
      onModeSelected?.(mode);
    } catch (error) {
      console.error("Error selecting mode:", error);
      setSelectedMode(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {isInitialSetup && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Platform Mode
          </h2>
          <p className="text-gray-600">
            Select the experience that best fits your needs. You can change this anytime in settings.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Social Mode Card */}
        <Card
          className={`p-8 cursor-pointer transition-all transform hover:scale-105 ${
            selectedMode === "social"
              ? "ring-2 ring-purple-500 bg-purple-50"
              : "hover:shadow-lg"
          }`}
          onClick={() => handleModeSelect("social")}
        >
          <div className="text-center">
            {selectedMode === "social" && (
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            )}
            <Users className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Social Mode</h3>
            <p className="text-gray-600 mb-4">
              Connect with friends and communities
            </p>

            <div className="bg-white rounded-lg p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-purple-500 font-bold">•</span>
                <span className="text-sm text-gray-700">Follow & Followers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500 font-bold">•</span>
                <span className="text-sm text-gray-700">Share Posts & Photos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500 font-bold">•</span>
                <span className="text-sm text-gray-700">Stories & Reels</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500 font-bold">•</span>
                <span className="text-sm text-gray-700">Like & Comment</span>
              </div>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleModeSelect("social");
              }}
              disabled={isLoading}
              className={`w-full ${
                selectedMode === "social"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {selectedMode === "social" && isLoading ? "Setting up..." : "Choose Social Mode"}
            </Button>
          </div>
        </Card>

        {/* Creator Mode Card */}
        <Card
          className={`p-8 cursor-pointer transition-all transform hover:scale-105 ${
            selectedMode === "creator"
              ? "ring-2 ring-red-500 bg-red-50"
              : "hover:shadow-lg"
          }`}
          onClick={() => handleModeSelect("creator")}
        >
          <div className="text-center">
            {selectedMode === "creator" && (
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-red-500" />
              </div>
            )}
            <Video className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Creator Mode</h3>
            <p className="text-gray-600 mb-4">
              Publish videos and build your audience
            </p>

            <div className="bg-white rounded-lg p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span className="text-sm text-gray-700">Subscribe & Subscribers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span className="text-sm text-gray-700">Upload Videos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span className="text-sm text-gray-700">View Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span className="text-sm text-gray-700">Monetization Options</span>
              </div>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleModeSelect("creator");
              }}
              disabled={isLoading}
              className={`w-full ${
                selectedMode === "creator"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {selectedMode === "creator" && isLoading ? "Setting up..." : "Choose Creator Mode"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ModeSelector;
