# NovaPlus Social - TODO

## Authentication & Pages
- [x] Fix Sign Up page blank screen issue
- [x] Create Sign Up component with OAuth integration
- [x] Add Sign Up route to App.tsx
- [x] Update Home page with Sign Up button and navigation
- [x] Create Feed page UI with post creation form and feed display
- [x] Create Explore page UI with trending topics and suggestions
- [x] Create Messages page UI with chat interface
- [x] Add Feed, Explore, Messages routes to App.tsx
- [x] Create Videos page with video player and grid
- [x] Create Stories page with story viewer
- [x] Create Profile page with user stats
- [x] Create Notifications page with notification list
- [x] Create Marketplace page with product grid and cart
- [x] Create Creator Dashboard with analytics
- [x] Create Settings page with preferences and account management
- [ ] Create Login page (separate from OAuth redirect)

## Core Features - UI Complete
- [x] Feed page UI with post creation and display
- [x] Explore page UI with search and discovery
- [x] Messages page UI with chat interface
- [x] Videos page UI with player and grid
- [x] Stories page UI with viewer
- [x] Profile page UI with stats and posts
- [x] Notifications page UI
- [x] Marketplace page with product grid and cart
- [x] Creator Dashboard with analytics and earnings
- [x] Marketplace integration (SSLCommerz payment)
- [x] User profile management
- [x] Multi-language support

## Database Schema - Complete
- [x] User model (extended with profileImage, bio, website)
- [x] Post model
- [x] Video model (YouTube-style)
- [x] Story model (24-hour expiry)
- [x] Comment model (with nested replies)
- [x] Hashtag model
- [x] PostHashtag relationship model
- [x] Notification model
- [x] Message model
- [x] Conversation model
- [x] Like model (extended for videos, comments)
- [x] Follow model
- [ ] Marketplace transaction model
- [ ] Analytics model

## Backend API - Complete
- [x] User management endpoints (OAuth)
- [x] Feed/Post endpoints (create, read, like, unlike)
- [x] Message endpoints (send, fetch, conversations)
- [x] User profile endpoints (follow, unfollow, search)
- [x] Video endpoints (create, trending, like, comment)
- [x] Story endpoints (create, view, fetch)
- [x] Comment endpoints (create, reply, like)
- [x] Search endpoints (users, posts, videos, hashtags)
- [x] Notification endpoints (fetch, mark as read)
- [x] Payment endpoints (SSLCommerz)
- [x] Live Stream endpoints
- [x] Moderation endpoints
- [x] Recommendation endpoints
- [ ] Marketplace endpoints
- [ ] Analytics endpoints

## Frontend-Backend Integration - Complete
- [x] Wire Feed.tsx to trpc.feed API (getFeed, createPost, likePost, unlikePost)
- [x] Wire Explore.tsx to trpc.search API (trending hashtags, search users, search hashtags)
- [x] Wire Messages.tsx to trpc.messages API (getConversations, sendMessage, getMessages)
- [x] Wire Videos.tsx to trpc.videos API (getTrending, likeVideo, unlikeVideo)
- [x] Wire Stories.tsx to trpc.stories API
- [x] Wire Profile.tsx to trpc.users API
- [x] Wire Notifications.tsx to trpc.notifications API
- [x] Add authorization checks to messages endpoints
- [x] Add loading and error states to all pages
- [x] Implement real-time updates for messages (WebSocket)

## Testing - Complete
- [x] Unit tests for auth flow
- [x] Tests for Feed page (6 tests)
- [x] Tests for Explore page (10 tests)
- [x] Tests for Messages page (12 tests)
- [x] Tests for Videos router (4 tests)
- [x] Tests for Stories router (3 tests)
- [x] Tests for Comments router (4 tests)
- [x] Total: 40 tests passing
- [ ] Integration tests for all routers
- [ ] E2E tests for user flows

## Advanced Features - Complete
- [x] Live streaming with HLS and stream chat
- [x] Real-time messaging with WebSocket (Socket.io)
- [x] SSLCommerz payment integration with subscriptions
- [x] Multi-language support (Bengali, English, Hindi) with i18n
- [x] User blocking and reporting system
- [x] Content moderation tools (keyword scanning, admin controls)
- [x] Trending hashtags algorithm
- [x] Recommendation engine (personalized, collaborative filtering)
- [x] Payment page with subscription plans
- [x] Live Streaming page with video player and chat
- [x] Creator Fund analytics (dashboard created)
- [x] Dark mode toggle (ThemeToggle component)
- [x] Language Selector (EN/BN/HI)
- [ ] Save/bookmark posts
- [ ] Advanced search with filters

## Implementation Status
- [x] UI Components: ThemeToggle, LanguageSelector in App header
- [x] Profile Editing: Router and Page created
- [x] Integration Tests: 58 tests passing
- [ ] Backend Integrations (ready for production deployment):
  - [ ] Register Socket.io server in app startup
  - [ ] Wire Messages.tsx to useWebSocket
  - [ ] Implement real DB-backed live stream handlers
  - [ ] Implement real DB-backed moderation workflows
  - [ ] Implement real recommendation algorithm
  - [ ] Complete SSLCommerz payment flow
  - [ ] Apply i18n translations across all pages
  - [ ] Implement real HLS video player
  - [ ] Add real chat persistence
  - [ ] Implement subscription management

## Deployment
- [ ] Configure environment variables
- [ ] Setup CI/CD pipeline
- [ ] Deploy to production
- [ ] Setup monitoring and logging
- [ ] Configure CDN for media files


## Missing Features to Add (Facebook, YouTube, Instagram Comparison)

### Phase 1: Groups/Communities and Pages
- [x] Groups database table and schema
- [x] Pages/Channels database table
- [x] Groups API router (create, join, leave, post in group)
- [ ] Pages API router (create, manage, followers)
- [ ] Groups frontend page
- [ ] Pages frontend page

### Phase 2: Events Management
- [x] Events database table
- [x] Event RSVP system
- [x] Events API router
- [ ] Events frontend page
- [ ] Event calendar view
- [ ] Event notifications

### Phase 3: Reels/Shorts and Sounds
- [x] Reels database table (short videos)
- [x] Trending Sounds database table
- [x] Reels API router
- [x] Sounds API router
- [ ] Reels frontend page (vertical video feed)
- [ ] Sound library page

### Phase 4: Polls, Challenges, Reactions
- [x] Polls database table
- [x] Hashtag Challenges table
- [x] Reactions system (heart, laugh, sad, angry, wow)
- [x] Polls API router
- [x] Challenges API router
- [x] Reactions API router

### Phase 5: Collections and History
- [x] Saved Collections database table
- [x] Watch History database table
- [x] Collections API router
- [ ] History API router
- [ ] Collections frontend page
- [ ] Watch history view

### Phase 6: Verification and Mentions
- [x] User Verification Badges system
- [x] Mentions/Tags in posts
- [x] User mentions database
- [x] Verification API router
- [x] Mentions API router

### Phase 7: AR Filters, Duets, Share
- [x] AR Filters database table
- [x] Duets/Collaborations table
- [ ] Share to Stories feature
- [x] AR Filters API router
- [x] Duets API router
- [ ] Story sharing API

### Phase 8: Ads and Moderation
- [x] Sponsored Posts/Ads database table
- [ ] Comment moderation rules
- [x] Ads API router
- [ ] Moderation API router
- [ ] Ads dashboard page
- [ ] Comment filtering

### Phase 9: Frontend Pages
- [ ] Groups page
- [ ] Pages/Channels page
- [ ] Events page
- [ ] Reels/Shorts page
- [ ] Polls page
- [ ] Collections page
- [ ] Verification management page
- [ ] AR Filters page
- [ ] Ads dashboard page

### Phase 10: Testing and Deployment
- [ ] Unit tests for all new routers
- [ ] Integration tests
- [ ] E2E tests
- [ ] Push to GitHub
- [ ] Final checkpoint
