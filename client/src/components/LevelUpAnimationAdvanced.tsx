import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "./LevelBadge";
import { getLevelEmoji, getLevelDescription, getLevelColor } from "@/lib/levelUtils";
import { X, Share2, Trophy } from "lucide-react";

interface LevelUpAnimationAdvancedProps {
  isOpen: boolean;
  newLevel: number;
  previousLevel: number;
  onClose: () => void;
  followers?: number;
  userName?: string;
}

/**
 * Advanced Level Up Animation Component
 * Features:
 * - Confetti animation effect
 * - Congratulatory modal with level details
 * - Achievement description
 * - Share functionality
 * - Sound effect notification
 */
export const LevelUpAnimationAdvanced: React.FC<LevelUpAnimationAdvancedProps> = ({
  isOpen,
  newLevel,
  previousLevel,
  onClose,
  followers = 0,
  userName = "Creator",
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Generate confetti pieces
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setConfetti(pieces);

      // Play sound effect
      playLevelUpSound();

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const playLevelUpSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn("Could not play sound:", error);
    }
  };

  const handleShare = () => {
    const text = `🎉 I just reached Level ${newLevel} on TRILLIONER LINK! 🚀 With ${followers.toLocaleString()} followers, I'm now a ${getLevelDescription(newLevel)}! Join me on the platform! #TrillionerLink #LevelUp`;

    if (navigator.share) {
      navigator.share({
        title: "Level Up Achievement",
        text: text,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert("Achievement copied to clipboard!");
    }
  };

  if (!isOpen) return null;

  const levelColor = getLevelColor(newLevel);
  const levelEmoji = getLevelEmoji(newLevel);
  const levelDescription = getLevelDescription(newLevel);

  return (
    <>
      {/* Confetti Container */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-2 h-2 animate-pulse"
              style={{
                left: `${piece.left}%`,
                top: "-10px",
                backgroundColor: [
                  "#FFD700",
                  "#FFA500",
                  "#FF6B6B",
                  "#4ECDC4",
                  "#45B7D1",
                  "#96CEB4",
                ][Math.floor(Math.random() * 6)],
                animation: `fall ${2 + Math.random() * 2}s linear ${piece.delay}s forwards`,
              }}
            />
          ))}
          <style>{`
            @keyframes fall {
              to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className={`w-full max-w-md overflow-hidden border-2 ${levelColor.border}`}>
          {/* Header with gradient */}
          <div
            className={`${levelColor.gradient} p-8 text-center relative overflow-hidden`}
          >
            {/* Animated background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${100 + i * 50}px`,
                      height: `${100 + i * 50}px`,
                      border: "2px solid white",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      animation: `pulse ${2 + i * 0.5}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="text-6xl mb-4 animate-bounce">{levelEmoji}</div>
              <h2 className="text-3xl font-bold text-white mb-2">Level Up!</h2>
              <p className="text-white/90 text-lg">
                Congratulations, {userName}!
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            {/* Level Display */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-sm text-gray-600 mb-2">Previous</div>
                <LevelBadge level={previousLevel} size="md" />
              </div>

              <div className="text-2xl text-gray-400 mx-4">→</div>

              <div className="text-center flex-1">
                <div className="text-sm text-gray-600 mb-2">New Level</div>
                <LevelBadge level={newLevel} size="md" />
              </div>
            </div>

            {/* Achievement Info */}
            <div className={`${levelColor.bg} ${levelColor.text} p-4 rounded-lg`}>
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Achievement Unlocked</h3>
                  <p className="text-sm opacity-90">{levelDescription}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{newLevel}</div>
                <div className="text-xs text-gray-600">Current Level</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {followers.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Followers</div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center text-sm text-gray-600">
              <p>You've unlocked new features and special privileges!</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                onClick={onClose}
                className={`flex-1 ${levelColor.button} text-white`}
              >
                Awesome!
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </Card>
      </div>
    </>
  );
};

export default LevelUpAnimationAdvanced;
