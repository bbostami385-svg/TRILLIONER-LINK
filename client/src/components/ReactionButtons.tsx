import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const REACTIONS = ["❤️", "😘", "🤔", "🤣", "😡", "😱", "🥵", "🥶", "🤢"];

interface ReactionButtonsProps {
  postId: string;
  onReactionChange?: () => void;
}

export function ReactionButtons({ postId, onReactionChange }: ReactionButtonsProps) {
  const [showReactions, setShowReactions] = useState(false);
  const { data: reactions } = trpc.reactions.getPostReactions.useQuery({ postId });
  const { data: userReaction } = trpc.reactions.getUserReaction.useQuery({ postId });
  const addReactionMutation = trpc.reactions.addReaction.useMutation();
  const removeReactionMutation = trpc.reactions.removeReaction.useMutation();

  const handleReaction = (emoji: string) => {
    if (userReaction?.emoji === emoji) {
      removeReactionMutation.mutate(
        { postId, emoji },
        {
          onSuccess: () => {
            setShowReactions(false);
            onReactionChange?.();
          },
        }
      );
    } else {
      addReactionMutation.mutate(
        { postId, emoji },
        {
          onSuccess: () => {
            setShowReactions(false);
            onReactionChange?.();
          },
        }
      );
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowReactions(!showReactions)}
        className="text-gray-600 hover:text-blue-500 transition"
      >
        {userReaction ? userReaction.emoji : "👍"} React
      </Button>

      {showReactions && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg p-2 flex gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`text-2xl hover:scale-125 transition transform ${
                userReaction?.emoji === emoji ? "scale-125" : ""
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Show reaction counts */}
      {reactions && reactions.length > 0 && (
        <div className="flex gap-2 mt-2 text-sm text-gray-600">
          {reactions.map(({ emoji, count }) => (
            <span key={emoji} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
              {emoji} <span className="font-semibold">{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
