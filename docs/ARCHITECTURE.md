# System Architecture & High-Level Design

```mermaid
graph TD
    Client[Web Browser / React SPA] -->|HTTPS / WSS| Nginx[Nginx Reverse Proxy]
    Nginx -->|Proxy HTTP :5000| Express[Node.js / Express Backend API]
    Nginx -->|Proxy Static Assets| Dist[Static Frontend SPA Build]
    
    Express -->|ORM Queries| Postgres[(PostgreSQL Database)]
    Express -->|Cache & Session TTL| Redis[(Redis / Upstash)]
    Express -->|Queue Jobs| BullMQ[BullMQ Job Queues]
    
    BullMQ --> Workers[Background Worker Process]
    Workers -->|Send Emails| SMTP[Email Gateway / SendGrid]
    Workers -->|Process Async| Postgres
```

## Key Architectural Highlights
1. **Modular Domain Structure**: 28 decoupled feature modules in `backend/src/modules/`.
2. **Asynchronous Task Architecture**: 6 dedicated BullMQ queues handling email dispatch, notification delivery, biometric hardware synchronization, reports generation, payroll execution, and subscription dunning.
3. **Multi-Tenant Scoping**: All database operations are partitioned by `companyId`.
4. **Resilient Cache Layer**: Intelligent Redis response caching with automatic invalidation.
