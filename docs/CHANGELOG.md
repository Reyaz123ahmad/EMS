# Changelog

All notable changes to the EMS Platform are documented in this file.

## [2.0.0] - 2026-09-26 (Phase 6A Production Ready)
### Added
- Comprehensive test suite with 49/49 backend integration tests, security tests, load simulation (>2500 RPS), and 73 frontend Vitest specs.
- Prometheus `/metrics` endpoint and dedicated `/health/*` subsystem routes (db, redis, queues, storage, email).
- Redis caching middleware with automated invalidation.
- Security hardening: Helmet CSP, XSS sanitization, multi-tier rate limiting, audit logging.
- Multi-stage production Dockerfiles and `docker-compose.prod.yml` with Nginx reverse proxy.
- CI/CD workflows for Backend, Frontend, Deployment, Security audit, and Docker releases.
- Full platform documentation in `docs/` and root `README.md`.

## [1.5.0] - 2026-09-25 (Phase 5B Platform Completion)
### Added
- Custom Unique ID system across all entities (`Company`, `Employee`, `Branch`, `Department`, `Designation`).
- Complete Refund Lifecycle, Razorpay integration, and Payment Failure/Retry flows.
- Subscriptions, 14-day Trials, Proration Engine, and Dunning Cron.
- Invoices PDF generation and GST / Tax engine.
- Payment Analytics Engine (MRR, ARR, Churn, Success & Refund Rates).
- Coupons & Discount system.
- Full-featured Client Portal.
