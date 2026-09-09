import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getLevelEmoji, LEVEL_DESCRIPTIONS } from "@/lib/levelUtils";
import { Sparkles, Trophy } from "lucide-react";

interface LevelUpAnimationProps {
  isOpen: boolean;
  newLevel: number;
  previousLevel: number;
  onClose: () => void;
}

/**
 * LevelUpAnimation Component
 * Shows a celebration dialog when user levels up
 * Includes confetti animation and congratulations message
 */
export const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({
  isOpen,
  newLevel,
  previousLevel,
  onClose,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Play sound effect (optional)
      playLevelUpSound();
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
    } catch (e) {
      // Audio context not available
    }
  };

  const renderConfetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10px`,
              animation: `fall ${2 + Math.random() * 1}s linear forwards`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          >
            <span className="text-2xl">
              {["🎉", "🎊", "⭐", "✨", "🌟", "💫"][Math.floor(Math.random() * 6)]}
            </span>
          </div>
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
    );
  };

  return (
    <>
      {showConfetti && renderConfetti()}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
          <div className="text-center space-y-6 py-8">
            {/* Trophy Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <Trophy className="w-24 h-24 text-yellow-500 animate-bounce" />
                <Sparkles className="w-8 h-8 text-pink-500 absolute -top-2 -right-2 animate-spin" />
              </div>
            </div>

            {/* Congratulations Message */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                🎉 Congratulations! 🎉
              </h2>
              <p className="text-gray-600">You've reached a new milestone!</p>
            </div>

            {/* Level Display */}
            <div className="space-y-2">
              <div className="text-lg text-gray-700">
                You've advanced from <span className="font-bold">Level {previousLevel}</span> to
              </div>
              <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                Level {newLevel}
              </div>
              <div className="text-2xl">
                {getLevelEmoji(newLevel)} {LEVEL_DESCRIPTIONS[newLevel]}
              </div>
            </div>

            {/* Achievement Description */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-700">
                {getAchievementMessage(newLevel)}
              </p>
            </div>

            {/* Close Button */}
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 rounded-lg transition-all"
            >
              Awesome! Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Get achievement message based on level
 */
const getAchievementMessage = (level: number): string => {
  const messages: Record<number, string> = {
    2: "You're starting to make waves! Keep growing your audience.",
    3: "Your content is resonating with people. Great job!",
    4: "You've established yourself as a creator. Keep it up!",
    5: "You're becoming popular! Your influence is growing.",
    6: "Your content is going viral! Amazing achievement!",
    7: "Celebrity status unlocked! You're a star now.",
    8: "You're a mega star! Your influence is massive.",
    9: "Superstar level reached! You're unstoppable.",
    10: "Icon status! You're one of the platform's elite.",
    11: "Legend! Your name will be remembered.",
    12: "Phenomenon! You've transcended normal success.",
    13: "Titan! You're among the greatest creators.",
    14: "Colossus! Your impact is immeasurable.",
    15: "Immortal! Your legacy will last forever.",
    16: "Cosmic! You've reached universal recognition.",
    17: "Universal! Your influence spans all boundaries.",
    18: "Galactic! You're a force of nature.",
    19: "Omnipotent! You have ultimate power.",
    20: "Supreme! You've reached the pinnacle of success!",
  };

  return messages[level] || "You've reached a new level! Keep creating amazing content.";
};

export default LevelUpAnimation;
