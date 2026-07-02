# TRILLIONER LINK - Payment System Guide

## Overview

TRILLIONER LINK uses a **modular, scalable payment architecture** designed for:
- ✅ **Bangladesh Launch:** SSLCommerz (bKash, Nagad, Rocket, Card)
- ✅ **Global Expansion:** Stripe-ready (future implementation)
- ✅ **Easy Switching:** Abstract payment gateway interface

---

## Architecture

### Payment Gateway Abstraction

```
┌─────────────────────────────────────────────────────────┐
│                   PaymentService (Main)                  │
│              - Initiates payments                         │
│              - Verifies transactions                      │
│              - Manages refunds                            │
│              - Switches gateways                          │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼──────────┐      ┌──────▼────────┐
    │ SSLCommerz   │      │  Stripe       │
    │ (Active)     │      │  (Stub)       │
    └──────────────┘      └───────────────┘
```

### Data Models

| Model | Purpose |
|-------|---------|
| **Transaction** | Records all payment transactions |
| **Wallet** | User balance and wallet management |
| **Refund** | Tracks refund requests and status |

---

## Environment Setup

### 1. SSLCommerz Configuration

Create `.env` with SSLCommerz credentials:

```env
# SSLCommerz Configuration
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
DEFAULT_PAYMENT_GATEWAY=sslcommerz

# Frontend URLs for callbacks
FRONTEND_URL=https://yourdomain.com
SUCCESS_URL=https://yourdomain.com/payment/success
FAIL_URL=https://yourdomain.com/payment/fail
CANCEL_URL=https://yourdomain.com/payment/cancel

# Stripe (for future)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Database Setup

MongoDB collections will be auto-created:
- `transactions`
- `wallets`
- `refunds`

---

## Payment Flow

### 1. Initiate Payment

**Request:**
```bash
POST /api/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "currency": "BDT",
  "paymentMethod": "bkash",
  "purpose": "product_purchase",
  "relatedItemId": "product_123",
  "relatedItemType": "Product",
  "customerEmail": "user@example.com",
  "customerPhone": "+8801700000000",
  "customerName": "John Doe",
  "successUrl": "https://yourdomain.com/payment/success",
  "failUrl": "https://yourdomain.com/payment/fail",
  "cancelUrl": "https://yourdomain.com/payment/cancel",
  "metadata": {
    "city": "Dhaka",
    "country": "Bangladesh"
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN-1705324800000-a1b2c3d4",
  "sessionKey": "sslcommerz_session_key",
  "redirectUrl": "https://securepay.sslcommerz.com/customer/pay/session_key",
  "gateway": "sslcommerz"
}
```

### 2. User Completes Payment

User is redirected to SSLCommerz hosted payment page where they select payment method:
- bKash
- Nagad
- Rocket
- Visa/MasterCard

### 3. Payment Callback

SSLCommerz sends IPN (Instant Payment Notification) to:
```
POST /api/webhooks/sslcommerz/ipn
```

User is also redirected to:
- **Success:** `GET /api/webhooks/sslcommerz/success?tran_id=...&val_id=...`
- **Fail:** `GET /api/webhooks/sslcommerz/fail?tran_id=...&error_reason=...`
- **Cancel:** `GET /api/webhooks/sslcommerz/cancel?tran_id=...`

### 4. Verify Payment

**Request:**
```bash
POST /api/payments/verify
Content-Type: application/json

{
  "tran_id": "TXN-1705324800000-a1b2c3d4",
  "val_id": "sslcommerz_validation_id",
  "status": "VALID"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "transaction": {
    "transactionId": "TXN-1705324800000-a1b2c3d4",
    "status": "success",
    "amount": 5000,
    "currency": "BDT",
    "completedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## API Endpoints

### Payment Initiation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/initiate` | ✅ | Initiate payment |
| POST | `/api/payments/verify` | ❌ | Verify payment |
| GET | `/api/payments/:transactionId/status` | ❌ | Get payment status |

### Transaction History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/payments/history` | ✅ | Get user transactions |
| GET | `/api/payments/transaction/:transactionId` | ✅ | Get transaction details |

### Refunds

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/:transactionId/refund` | ✅ | Request refund |
| GET | `/api/payments/refunds/history` | ✅ | Get refund history |
| GET | `/api/payments/refund/:refundId` | ✅ | Get refund details |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/admin/refund/:refundId/process` | ✅ Admin | Process refund |
| GET | `/api/payments/admin/transactions` | ✅ Admin | Get all transactions |
| GET | `/api/payments/gateway/status` | ❌ | Get gateway health |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/sslcommerz/ipn` | IPN notification |
| GET | `/api/webhooks/sslcommerz/success` | Success callback |
| GET | `/api/webhooks/sslcommerz/fail` | Failure callback |
| GET | `/api/webhooks/sslcommerz/cancel` | Cancellation callback |

---

## Payment Purposes

The system supports different payment purposes:

| Purpose | Description | Action |
|---------|-------------|--------|
| `product_purchase` | Buying products | Order created, inventory updated |
| `wallet_topup` | Adding to wallet | Wallet balance increased |
| `creator_fund` | Creator monetization | Creator earnings updated |
| `subscription` | Subscription payment | Subscription activated |
| `gift` | Sending gift | Gift transferred to recipient |

---

## Refund System

### Request Refund

```bash
POST /api/payments/:transactionId/refund
Authorization: Bearer <token>

{
  "reason": "product_damaged",
  "reasonDescription": "Product arrived damaged",
  "refundAmount": 5000
}
```

### Refund Reasons

- `customer_request` - Customer requested refund
- `product_not_received` - Product not received
- `product_damaged` - Product damaged
- `product_not_as_described` - Product not as described
- `duplicate_charge` - Duplicate charge
- `unauthorized_transaction` - Unauthorized transaction
- `technical_error` - Technical error
- `other` - Other reason

### Refund Status Flow

```
requested → approved → processing → completed
                    ↓
                  rejected
```

---

## Wallet System

### Add to Wallet

```bash
POST /api/payments/initiate
{
  "amount": 1000,
  "purpose": "wallet_topup",
  ...
}
```

### Wallet Features

- **Balance Tracking:** Current balance and transaction history
- **Limits:** Daily and monthly spending limits
- **Auto-topup:** Automatic topup when balance falls below threshold
- **Linked Methods:** Multiple payment methods
- **Status:** Active, frozen, or suspended

---

## Transaction Status

| Status | Description |
|--------|-------------|
| `pending` | Payment initiated, awaiting completion |
| `processing` | Payment being processed |
| `success` | Payment successful |
| `failed` | Payment failed |
| `cancelled` | Payment cancelled by user |
| `refunded` | Payment refunded |

---

## Error Handling

### Common Errors

```json
{
  "error": "Missing required fields",
  "details": "customerEmail and customerPhone are required"
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Admin access required |
| 404 | Not Found - Transaction not found |
| 500 | Server Error - Internal error |

---

## Testing

### Test Mode (Sandbox)

SSLCommerz automatically uses sandbox when `NODE_ENV !== 'production'`

**Test Credentials:**
- Store ID: `testbox`
- Store Password: `@1234`

**Test Cards:**
- Visa: `4111111111111111`
- MasterCard: `5555555555554444`

### Test Payment Flow

1. Initiate payment with test amount
2. SSLCommerz redirects to sandbox payment page
3. Use test card credentials
4. Verify payment was recorded

---

## Switching to Stripe (Future)

### Step 1: Implement Stripe Gateway

```javascript
// backend/services/payment/StripeGateway.js
// Implement all abstract methods from PaymentGateway
```

### Step 2: Update Environment

```env
DEFAULT_PAYMENT_GATEWAY=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Step 3: No Code Changes Required

The PaymentService will automatically use Stripe instead of SSLCommerz!

---

## Security Best Practices

1. **Never expose API keys** in frontend code
2. **Always validate** webhook signatures
3. **Use HTTPS** for all payment endpoints
4. **Store sensitive data** encrypted in database
5. **Implement rate limiting** on payment endpoints
6. **Log all transactions** for audit trail
7. **Use PCI-DSS compliant** payment gateways
8. **Implement 3D Secure** for card payments

---

## Monitoring & Debugging

### Check Gateway Status

```bash
GET /api/payments/gateway/status
```

### View Transaction Logs

```bash
# Check MongoDB
db.transactions.find({ status: "failed" }).limit(10)
```

### Enable Debug Logging

```env
DEBUG=payment:*
LOG_LEVEL=debug
```

---

## Support & Resources

- **SSLCommerz Docs:** https://developer.sslcommerz.com
- **Stripe Docs:** https://stripe.com/docs
- **Payment PCI Compliance:** https://www.pcisecuritystandards.org

---

## Troubleshooting

### Payment Stuck in Pending

1. Check IPN webhook delivery
2. Verify SSLCommerz credentials
3. Check server logs for errors
4. Manually verify payment with gateway

### Refund Not Processing

1. Ensure transaction is successful
2. Check refund is within 90-day window
3. Verify gateway refund API is working
4. Check admin has correct permissions

### Webhook Not Received

1. Verify webhook URL is correct
2. Check firewall/security groups allow inbound
3. Verify webhook signature validation
4. Check SSLCommerz webhook settings

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial release with SSLCommerz |
| 1.1.0 | TBD | Stripe integration |
| 2.0.0 | TBD | Multi-currency support |

