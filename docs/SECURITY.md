# EMS Platform Security Architecture & Audit Report

## 1. Authentication & Session Security
- **Algorithm**: JWT with HMAC SHA-256 (`HS256`).
- **Secret Rotation**: Distinct secrets for access and refresh tokens.
- **Session Tracking**: Active sessions stored with device fingerprinting and IP validation.
- **Password Hashing**: Bcrypt with 12 salt rounds.

## 2. Authorization & Tenant Isolation
- **Role-Based Access Control (RBAC)**: Support for `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`, `CLIENT`.
- **Multi-Tenant Data Isolation**: Every tenant query enforces mandatory `companyId` scoping.

## 3. Defense-in-Depth Protections
- **SQL / NoSQL Injection Prevention**: Prisma ORM parameterized queries with strict Joi input validation.
- **XSS & HTML Sanitization**: Automatic stripping of script tags, event handlers, and javascript pseudo-protocols.
- **Rate Limiting**: Multi-tiered rate limiters for Global requests, Auth endpoints, and OTP generation.
- **Security Headers**: Helmet integration with strict CSP, HSTS, X-Content-Type-Options, and Frame-Options.
- **Audit Logging**: Comprehensive logging of mutations, administrative actions, and security events.
