# TRILLIONER LINK API Documentation

## Overview

TRILLIONER LINK is a comprehensive social media platform API built with Node.js, Express, and MongoDB. This documentation covers all available endpoints, authentication methods, and usage examples.

**Base URL:** `http://localhost:5000/api`

---

## Authentication

### Firebase Google OAuth

All authenticated endpoints require a valid Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

### Public Endpoints

Some endpoints are publicly accessible and do not require authentication.

---

## API Endpoints

### 1. Authentication (`/auth`)

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}

Response: 201 Created
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2. Users (`/users`)

#### Get User Profile
```
GET /users/:userId

Response: 200 OK
{
  "id": "user_id",
  "username": "username",
  "email": "user@example.com",
  "profilePicture": "url",
  "bio": "bio text",
  "followers": 100,
  "following": 50,
  ...
}
```

#### Update Profile
```
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new_username",
  "bio": "new bio",
  "profilePicture": "image_url"
}

Response: 200 OK
{
  "success": true,
  "user": { ... }
}
```

#### Follow User
```
POST /users/:userId/follow
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "User followed"
}
```

#### Unfollow User
```
POST /users/:userId/unfollow
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "User unfollowed"
}
```

#### Get Followers
```
GET /users/:userId/followers?page=1&limit=20

Response: 200 OK
{
  "followers": [ ... ],
  "pagination": { ... }
}
```

#### Get Following
```
GET /users/:userId/following?page=1&limit=20

Response: 200 OK
{
  "following": [ ... ],
  "pagination": { ... }
}
```

---

### 3. Posts (`/posts`)

#### Get Feed
```
GET /posts?page=1&limit=20

Response: 200 OK
{
  "posts": [ ... ],
  "pagination": { ... }
}
```

#### Create Post
```
POST /posts/create
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "content": "Post content",
  "images": [file1, file2],
  "videos": [file3]
}

Response: 201 Created
{
  "success": true,
  "post": { ... }
}
```

#### Like Post
```
POST /posts/:postId/like
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "post": { ... }
}
```

#### Unlike Post
```
POST /posts/:postId/unlike
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "post": { ... }
}
```

#### Comment on Post
```
POST /posts/:postId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "Comment text"
}

Response: 201 Created
{
  "success": true,
  "comment": { ... }
}
```

---

### 4. Messages (`/messages`)

#### Get Conversations
```
GET /messages/conversations?page=1&limit=20
Authorization: Bearer <token>

Response: 200 OK
{
  "conversations": [ ... ],
  "pagination": { ... }
}
```

#### Get Messages
```
GET /messages/:conversationId?page=1&limit=50
Authorization: Bearer <token>

Response: 200 OK
{
  "messages": [ ... ],
  "pagination": { ... }
}
```

#### Send Message
```
POST /messages/:conversationId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Message text",
  "mediaUrl": "optional_media_url"
}

Response: 201 Created
{
  "success": true,
  "message": { ... }
}
```

---

### 5. Marketplace (`/marketplace`)

#### Get Products
```
GET /marketplace/products?page=1&limit=20&category=electronics&sortBy=price_asc

Response: 200 OK
{
  "products": [ ... ],
  "pagination": { ... }
}
```

#### Create Product
```
POST /marketplace/products/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Product Title",
  "description": "Product description",
  "price": 99.99,
  "category": "electronics",
  "images": ["url1", "url2"],
  "stock": 10
}

Response: 201 Created
{
  "success": true,
  "product": { ... }
}
```

#### Create Order
```
POST /marketplace/orders/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "postalCode": "12345",
    "country": "Country"
  }
}

Response: 201 Created
{
  "success": true,
  "order": { ... }
}
```

#### Create Review
```
POST /marketplace/reviews/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id",
  "orderId": "order_id",
  "rating": 5,
  "title": "Great product!",
  "comment": "Very satisfied with this purchase"
}

Response: 201 Created
{
  "success": true,
  "review": { ... }
}
```

---

### 6. Creator Fund (`/creator-fund`)

#### Get Creator Fund Details
```
GET /creator-fund/details
Authorization: Bearer <token>

Response: 200 OK
{
  "creatorId": "user_id",
  "totalEarnings": 1000.00,
  "monthlyEarnings": 250.00,
  "pendingEarnings": 50.00,
  "tier": "gold",
  ...
}
```

#### Get Earnings Report
```
GET /creator-fund/earnings-report?period=monthly
Authorization: Bearer <token>

Response: 200 OK
{
  "period": "monthly",
  "totalEarnings": 1000.00,
  "earningsBreakdown": { ... },
  "payouts": [ ... ]
}
```

#### Request Payout
```
POST /creator-fund/request-payout
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500.00
}

Response: 200 OK
{
  "success": true,
  "payout": { ... }
}
```

---

### 7. Analytics (`/creator-fund/analytics`)

#### Track View
```
POST /creator-fund/analytics/track-view
Content-Type: application/json

{
  "creatorId": "user_id",
  "contentId": "content_id",
  "contentType": "post",
  "viewerData": {
    "country": "US",
    "ageGroup": "25-34",
    "device": "mobile"
  }
}

Response: 200 OK
{
  "success": true,
  "analytics": { ... }
}
```

#### Get Creator Analytics
```
GET /creator-fund/analytics/creator?period=monthly
Authorization: Bearer <token>

Response: 200 OK
{
  "aggregated": { ... },
  "detailedAnalytics": [ ... ]
}
```

#### Generate Performance Report
```
POST /creator-fund/analytics/performance-report
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}

Response: 200 OK
{
  "period": { ... },
  "summary": { ... },
  "contentBreakdown": { ... },
  "recommendations": [ ... ]
}
```

---

### 8. Privacy (`/privacy`)

#### Block User
```
POST /privacy/block/:userId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "privacy": { ... }
}
```

#### Unblock User
```
POST /privacy/unblock/:userId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "privacy": { ... }
}
```

#### Get Blocked Users
```
GET /privacy/blocked-users
Authorization: Bearer <token>

Response: 200 OK
{
  "blockedUsers": [ ... ]
}
```

#### Enable Two-Factor Authentication
```
POST /privacy/2fa/enable
Authorization: Bearer <token>
Content-Type: application/json

{
  "method": "sms",
  "phoneNumber": "+1234567890"
}

Response: 200 OK
{
  "success": true,
  "backupCodes": [ ... ]
}
```

#### Request Data Export
```
POST /privacy/data-export/request
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Data export requested"
}
```

#### Request Account Deletion
```
POST /privacy/account-deletion/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "No longer using the platform"
}

Response: 200 OK
{
  "success": true,
  "message": "Account deletion scheduled"
}
```

---

### 9. Community (`/community`)

#### Create Group
```
POST /community/groups/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Group Name",
  "description": "Group description",
  "privacy": "public"
}

Response: 201 Created
{
  "success": true,
  "group": { ... }
}
```

#### Get Trending Hashtags
```
GET /community/hashtags/trending

Response: 200 OK
{
  "hashtags": [ ... ]
}
```

#### Create Bookmark
```
POST /community/bookmarks/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "itemId": "post_id",
  "itemType": "post"
}

Response: 201 Created
{
  "success": true,
  "bookmark": { ... }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request parameters
- **401 Unauthorized** - Authentication required or invalid token
- **403 Forbidden** - Access denied
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default:** 100 requests per 15 minutes
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Pagination

List endpoints support pagination with the following parameters:

- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes pagination metadata:

```json
{
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## Webhooks

### Stripe Payment Webhook

```
POST /marketplace/webhooks/stripe
Content-Type: application/json

Triggers on:
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
- charge.dispute.created
```

---

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** - Never expose in client-side code
3. **Implement exponential backoff** for retries
4. **Cache responses** where appropriate
5. **Monitor rate limits** and adjust requests accordingly
6. **Validate input** on the client side before sending
7. **Handle errors gracefully** with proper error messages

---

## Support

For API support and issues, please contact: `support@novaplus.social`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial release |

