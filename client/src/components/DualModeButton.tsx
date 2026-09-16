import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Bell, BellOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface DualModeButtonProps {
  targetUserId: number;
  currentMode: "social" | "creator";
  onActionComplete?: () => void;
}

/**
 * DualModeButton Component
 * Displays either "Follow/Unfollow" button (Social Mode)
 * or "Subscribe/Unsubscribe" button (Creator Mode)
 */
export const DualModeButton: React.FC<DualModeButtonProps> = ({
  targetUserId,
  currentMode,
  onActionComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useUtils();

  // Social Mode queries/mutations
  const { data: isFollowingData } = trpc.dualMode.isFollowing.useQuery(
    { targetUserId },
    { enabled: currentMode === "social" }
  );
  const followMutation = trpc.dualMode.followUser.useMutation({
    onMutate: async () => {
      await utils.dualMode.isFollowing.cancel({ targetUserId });
      const previous = utils.dualMode.isFollowing.getData({ targetUserId });
      utils.dualMode.isFollowing.setData({ targetUserId }, { isFollowing: true });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) utils.dualMode.isFollowing.setData({ targetUserId }, context.previous);
    },
    onSettled: () => { void utils.dualMode.isFollowing.invalidate({ targetUserId }); },
  });
  const unfollowMutation = trpc.dualMode.unfollowUser.useMutation({
    onMutate: async () => {
      await utils.dualMode.isFollowing.cancel({ targetUserId });
      const previous = utils.dualMode.isFollowing.getData({ targetUserId });
      utils.dualMode.isFollowing.setData({ targetUserId }, { isFollowing: false });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) utils.dualMode.isFollowing.setData({ targetUserId }, context.previous);
    },
    onSettled: () => { void utils.dualMode.isFollowing.invalidate({ targetUserId }); },
  });

  // Creator Mode queries/mutations
  const { data: isSubscribedData } = trpc.dualMode.isSubscribed.useQuery(
    { creatorId: targetUserId },
    { enabled: currentMode === "creator" }
  );
  const subscribeMutation = trpc.dualMode.subscribeToCreator.useMutation({
    onMutate: async () => {
      await utils.dualMode.isSubscribed.cancel({ creatorId: targetUserId });
      const previous = utils.dualMode.isSubscribed.getData({ creatorId: targetUserId });
      utils.dualMode.isSubscribed.setData({ creatorId: targetUserId }, { isSubscribed: true, tier: previous?.tier ?? "free" });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) utils.dualMode.isSubscribed.setData({ creatorId: targetUserId }, context.previous);
    },
    onSettled: () => { void utils.dualMode.isSubscribed.invalidate({ creatorId: targetUserId }); },
  });
  const unsubscribeMutation = trpc.dualMode.unsubscribeFromCreator.useMutation({
    onMutate: async () => {
      await utils.dualMode.isSubscribed.cancel({ creatorId: targetUserId });
      const previous = utils.dualMode.isSubscribed.getData({ creatorId: targetUserId });
      utils.dualMode.isSubscribed.setData({ creatorId: targetUserId }, { isSubscribed: false, tier: previous?.tier ?? "free" });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) utils.dualMode.isSubscribed.setData({ creatorId: targetUserId }, context.previous);
    },
    onSettled: () => { void utils.dualMode.isSubscribed.invalidate({ creatorId: targetUserId }); },
  });

  const isFollowing = isFollowingData?.isFollowing || false;
  const isSubscribed = isSubscribedData?.isSubscribed || false;

  const handleFollowClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync({ targetUserId });
      } else {
        await followMutation.mutateAsync({ targetUserId });
      }
      onActionComplete?.();
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeClick = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeMutation.mutateAsync({ creatorId: targetUserId });
      } else {
        await subscribeMutation.mutateAsync({
          creatorId: targetUserId,
          tier: "free",
        });
      }
      onActionComplete?.();
    } catch (error) {
      console.error("Error toggling subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Social Mode Button
  if (currentMode === "social") {
    return (
      <Button
        onClick={handleFollowClick}
        disabled={isLoading}
        variant={isFollowing ? "outline" : "default"}
        className={`gap-2 transition-all ${
          isFollowing
            ? "bg-transparent border-purple-500 text-purple-500 hover:bg-purple-50"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        }`}
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-4 h-4" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Follow
          </>
        )}
      </Button>
    );
  }

  // Creator Mode Button
  return (
    <Button
      onClick={handleSubscribeClick}
      disabled={isLoading}
      variant={isSubscribed ? "outline" : "default"}
      className={`gap-2 transition-all ${
        isSubscribed
          ? "bg-transparent border-red-500 text-red-500 hover:bg-red-50"
          : "bg-red-600 hover:bg-red-700 text-white"
      }`}
    >
      {isSubscribed ? (
        <>
          <BellOff className="w-4 h-4" />
          Subscribed
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          Subscribe
        </>
      )}
    </Button>
  );
};

export default DualModeButton;
