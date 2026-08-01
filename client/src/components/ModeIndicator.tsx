import React from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Zap } from "lucide-react";

interface ModeIndicatorProps {
  mode: "social" | "creator";
  size?: "sm" | "md" | "lg";
}

/**
 * ModeIndicator Component
 * Shows the current account mode with an icon and label
 */
export const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  mode,
  size = "md",
}) => {
  const isSocial = mode === "social";

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <Badge
      className={`gap-2 font-semibold transition-all ${sizeClasses[size]} ${
        isSocial
          ? "bg-purple-100 text-purple-700 border border-purple-300"
          : "bg-red-100 text-red-700 border border-red-300"
      }`}
    >
      {isSocial ? (
        <>
          <Users className="w-4 h-4" />
          Social Mode
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          Creator Mode
        </>
      )}
    </Badge>
  );
};

export default ModeIndicator;
