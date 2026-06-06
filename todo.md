# NovaPlus Social Pro - TODO

## Authentication & Pages
- [x] Fix Sign Up page blank screen issue
- [x] Create Sign Up component with OAuth integration
- [x] Add Sign Up route to App.tsx
- [x] Update Home page with Sign Up button and navigation
- [x] Create Feed page UI with post creation form and feed display
- [x] Create Explore page UI with trending topics and suggestions
- [x] Create Messages page UI with chat interface
- [x] Add Feed, Explore, Messages routes to App.tsx
- [ ] Create Login page (separate from OAuth redirect)
- [ ] Create Profile page
- [ ] Create Marketplace page

## Core Features - UI Complete
- [x] Feed page UI with post creation and display
- [x] Explore page UI with search and discovery
- [x] Messages page UI with chat interface
- [ ] User profile management
- [ ] Marketplace integration (SSLCommerz)
- [ ] Creator Fund
- [ ] Analytics dashboard
- [ ] Multi-language support

## Core Features - Backend Integration Complete
- [x] Feed API: fetch posts, create posts, like/unlike
- [x] Messages API: fetch conversations, send messages
- [x] User profile API endpoints: follow, unfollow, search
- [ ] Explore API: search, trending topics, suggested users
- [ ] Marketplace endpoints

## Backend API - In Progress
- [x] User management endpoints (OAuth)
- [x] Feed/Post endpoints (create, read, like, unlike)
- [x] Message endpoints (send, fetch, conversations)
- [x] User profile endpoints (follow, unfollow, search)
- [ ] Explore endpoints (search, trending, suggestions)
- [ ] Marketplace endpoints
- [ ] Analytics endpoints

## Database Schema
- [x] User model
- [x] Post model
- [x] Message model
- [x] Conversation model
- [x] Like model
- [x] Follow model
- [ ] Marketplace transaction model
- [ ] Analytics model

## Frontend-Backend Integration
- [ ] Wire Feed.tsx to trpc.feed API (getFeed, createPost, likePost, unlikePost)
- [ ] Wire Explore.tsx to trpc.users search API
- [ ] Wire Messages.tsx to trpc.messages API (getConversations, sendMessage)
- [ ] Add authorization checks to messages endpoints
- [ ] Add loading and error states to all pages
- [ ] Implement real-time updates for messages (WebSocket)

## Testing
- [ ] Unit tests for auth flow
- [ ] Integration tests for feed router
- [ ] Integration tests for messages router
- [ ] Integration tests for users router
- [ ] E2E tests for user flows

## Deployment
- [ ] Configure environment variables
- [ ] Setup CI/CD pipeline
- [ ] Deploy to production
