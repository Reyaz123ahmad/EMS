# EMS Enterprise API Documentation

## Base URL
- Development: `http://localhost:5000/api/v1`
- Production: `https://api.yourdomain.com/api/v1`

---

## 1. Authentication & Security
- **Header**: `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Token Expiry**: Access Token (7d), Refresh Token (30d)

### Core Endpoints:
- `POST /auth/login`: Authenticate user and receive tokens
- `POST /auth/register`: Register user
- `POST /auth/refresh`: Refresh access token
- `POST /auth/logout`: Invalidate session

---

## 2. Organization & Unique IDs
- `GET /companies`: List companies (supports `?companyCode=...`, `?search=...`)
- `GET /companies/:idOrCode`: Fetch company by UUID or Custom Code (`COMP-2026-0001`)
- `GET /employees`: List employees (supports `?employeeCode=...`, `?departmentId=...`)
- `GET /employees/:idOrCode`: Fetch employee by UUID or Custom Code (`EMP001`)
- `GET /branches`: List branches
- `GET /branches/:idOrCode`: Fetch branch by UUID or Custom Code
- `GET /departments`: List departments
- `GET /designations`: List designations

---

## 3. Refunds & Payments
- `GET /refunds/stats`: Total refund metrics and statuses
- `GET /refunds`: Company refund requests
- `GET /refunds/all`: Super admin global refund requests
- `POST /refunds/request`: Request refund (`{ paymentId, amount, reason, description }`)
- `POST /refunds/system-issue`: Super admin system issue refund
- `POST /refunds/:id/retry`: Retry failed refund
- `POST /payments/failure`: Log payment failure
- `POST /payments/retry`: Retry transaction
- `GET /payments/history`: Payment history
- `POST /payments/webhook`: Public Razorpay webhook endpoint

---

## 4. Subscriptions, Trials & Proration
- `POST /subscriptions/trial/start`: Start 14-day free trial (`{ companyId, planId }`)
- `POST /subscriptions/trial/extend`: Extend trial days (`{ companyId, days }`)
- `POST /subscriptions/proration/calculate`: Calculate prorated difference on upgrade/downgrade
- `POST /subscriptions/proration/apply`: Execute instantaneous plan switch with prorated charge/credit

---

## 5. Invoices & GST Tax
- `GET /invoices`: List company invoices with GST breakdown
- `GET /invoices/:id/download`: Download auto-generated PDF invoice
- `POST /invoices/:id/send-email`: Queue invoice PDF delivery via BullMQ email worker

---

## 6. Payment Analytics
- `GET /payment-analytics/revenue`: Revenue metrics & transaction count
- `GET /payment-analytics/mrr`: Monthly Recurring Revenue
- `GET /payment-analytics/arr`: Annual Recurring Revenue
- `GET /payment-analytics/churn`: Customer and subscription churn metrics
- `GET /payment-analytics/success-rate`: Gateway success rate %
- `GET /payment-analytics/refund-rate`: Refund rate %
- `GET /payment-analytics/payment-methods`: Payment method breakdown
- `GET /payment-analytics/revenue-by-plan`: Revenue distribution across tiers

---

## 7. Coupons & Discounts
- `POST /coupons`: Create coupon code (`{ code, discountType, discountValue, maxUses, validTo }`)
- `GET /coupons`: List promotional coupon codes
- `POST /coupons/validate`: Validate coupon against subscription plan
- `POST /coupons/apply`: Apply coupon to billing checkout
- `GET /coupons/stats`: Coupon redemption stats

---

## 8. Client Portal
- `GET /client-portal/dashboard`: Client summary dashboard
- `GET /client-portal/projects`: Projects list with milestone progress
- `GET /client-portal/projects/:id`: Single project detail with members and tasks
- `POST /client-portal/requirements`: Submit feature requirement
- `POST /client-portal/comments`: Add discussion comment to project
- `GET /client-portal/invoices`: View client invoices
- `GET /client-portal/payments`: View payment history

---

## 9. Health & System Monitoring
- `GET /health`: Complete system health overview
- `GET /health/db`: PostgreSQL database connectivity & latency
- `GET /health/redis`: Upstash / Redis cache status & latency
- `GET /health/queues`: BullMQ background queues stats
- `GET /health/storage`: Cloudinary asset storage status
- `GET /health/email`: SMTP email gateway status
- `GET /metrics`: Prometheus-compatible exposition metrics
