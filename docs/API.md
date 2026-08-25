# TRILLIONER LINK API Notes

## Marketplace listings

The `marketplace.listProducts` query returns active, public listing rows and accepts a category and bounded limit. Authenticated sellers can use `marketplace.listMyProducts`, `marketplace.createProduct`, `marketplace.updateProduct`, and `marketplace.archiveProduct`. Ownership is enforced by the server for seller mutations.

Marketplace checkout accepts product IDs and quantities in `payment.createMarketplaceTransaction`. The server re-reads the current listing prices, status, and stock before creating a transaction intent. Client-submitted totals are treated as untrusted and are rejected when they differ from the live catalog calculation.

## Human liveness

Authenticated users begin a challenge with `humanVerification.startLivenessChallenge`. The server returns a short, randomized, expiring movement sequence. The client submits the ordered sequence through `humanVerification.verifyLiveness`, including one recording payload for each requested step.

The server verifies challenge ownership, expiry, one-time completion state, exact step ordering, and the account attempt limit before persisting verification media. A valid submission is placed into `pending` review; it does not approve the account from client-side signals. Admin reviewers approve or reject records through the existing review procedures.

## Repository and security notes

The only external GitHub synchronization target for this project is `bbostami385-svg/TRILLIONER-LINK`. Media bytes should continue to use the server storage helpers, while database tables retain metadata and references. Government identity verification remains separate from human-presence verification and is required only for the monetization or payout workflows that enforce it.

## Dual Mode

The `dualMode.initializeModePreferences` mutation stores a user's first selected profile mode, while `dualMode.switchMode` changes the default between `social` and `creator` without deleting account content or relationships. `dualMode.getCurrentMode` returns the active mode and `dualMode.getModeStatistics` returns mode-aware labels and counts. Social relationships use `dualMode.followUser`, `unfollowUser`, `getFollowers`, `getFollowing`, and `isFollowing`; creator relationships use `subscribeToCreator`, `unsubscribeFromCreator`, `getSubscribers`, `isSubscribed`, and `getSubscriptions`.

## Levels and leaderboard

The `levels.getUserLevel` query returns the authenticated user's current level, threshold, follower count, and progress. `levels.updateUserLevel` recalculates the level from the current relationship count and preserves monotonic progression. `levels.getLevelStats` exposes the threshold and progress metadata, while `levels.getTopUsersByLevel` and `levels.getLeaderboard` provide authenticated leaderboard views with supported mode filtering. Level thresholds are evaluated from follower or subscriber audience totals according to the account mode; level-up presentation is a UI celebration and does not replace server-side recalculation.
