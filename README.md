# 🏢 EMS - Enterprise Workforce & Employee Management SaaS Platform

An enterprise-grade, multi-tenant Employee Management SaaS platform engineered with **Node.js, Express, PostgreSQL, Prisma ORM, BullMQ, Redis, React 18, Vite, Tailwind CSS v4, Zustand, and React Query**.

---

## 🚀 Key Features

- **Multi-Tenant Architecture**: Complete data isolation per organization with custom codes (`COMP-2026-0001`, `EMP001`).
- **Biometric & Facial Verification**: Geofencing, device fingerprinting, liveness detection, and offline punch synchronization.
- **Leave & Payroll Engine**: Multi-tier approvals, dynamic salary structures, tax computation (GST/CGST/SGST/IGST), and PDF salary slip generation.
- **Billing & Subscriptions**: 14-day trials, proration calculation on upgrade/downgrade, automated dunning cron, and coupon discounts.
- **Refunds & Payments**: End-to-end refund workflow with Razorpay webhook integration and automated failure recovery.
- **Client Portal**: Dedicated workspace for external clients to track milestones, submit feature requirements, and view invoices.
- **Payment Analytics**: Real-time MRR, ARR, Churn, Success Rate, and Tier-wise revenue breakdown.
- **Monitoring & Health**: Prometheus metrics endpoint (`/api/v1/metrics`), comprehensive subsystem health checks (`/api/v1/health/*`), and BullMQ queue monitoring.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js, Express.js (v5), Prisma ORM (v6), PostgreSQL, Redis, BullMQ, Socket.io |
| **Frontend** | React 18, Vite, Tailwind CSS v4, Zustand, TanStack React Query, Lucide Icons |
| **Testing** | Vitest, React Testing Library, Custom Integration Test Suites, Load & Security Suites |
| **DevOps & Deploy** | Docker, Nginx, GitHub Actions CI/CD, Railway, Vercel |

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js >= 20.x
- PostgreSQL >= 14
- Redis >= 6

### 2. Running Locally

```bash
# Clone the repository
git clone https://github.com/Reyaz123ahmad/Edudibon.git
cd Edudibon

# Start Backend
cd backend
npm install
npx prisma db push
npm run dev

# Start Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

### 3. Running with Docker Compose (Production)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🧪 Testing

```bash
# Run complete Backend Test Suite (Security + Load + Integration)
cd backend
npm test

# Run Frontend Vitest Suite
cd frontend
npm test
```

---

## 📚 Documentation
- [API Reference](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Security & Auditing](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Testing Guide](docs/TESTING.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Changelog](docs/CHANGELOG.md)

---

## 📄 License
Private and Proprietary. All rights reserved.
