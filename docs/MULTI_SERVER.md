# Multi-Instance Cluster & Nginx Load Balancer Architecture

This document describes the production multi-instance architecture for the Employee Management System (EMS), incorporating PM2 multi-process execution, Nginx reverse proxy / load balancer, Redis-backed Socket.io pub/sub, Redis-backed distributed rate limiting, and automated zero-downtime deployment pipelines.

---

## 🏗️ 1. Architecture Overview

```mermaid
flowchart TD
    Client[Web Clients & Mobile Browsers] -->|HTTPS :443| Nginx[Nginx Reverse Proxy & Load Balancer]
    
    subgraph Edge & Security
        Nginx -->|Rate Limiting: 100r/s| ApiLimit[Zone: api_limit]
        Nginx -->|Rate Limiting: 5r/s| AuthLimit[Zone: auth_limit]
        Nginx -->|Rate Limiting: 3r/s| OtpLimit[Zone: otp_limit]
    end

    subgraph Load Balancer Clusters
        Nginx -->|least_conn| BackendCluster[Upstream: backend_cluster]
        Nginx -->|ip_hash| WSCluster[Upstream: websocket_cluster]
    end

    subgraph PM2 Multi-Instance Backend
        BackendCluster --> B1[ems-backend-1 :5000]
        BackendCluster --> B2[ems-backend-2 :5001]
        BackendCluster --> B3[ems-backend-3 :5002]
        BackendCluster --> B4[ems-backend-4 :5003]

        WSCluster -.-> B1
        WSCluster -.-> B2
        WSCluster -.-> B3
        WSCluster -.-> B4
    end

    subgraph Background Async Workers
        W1[ems-worker-1: BullMQ Worker]
        W2[ems-worker-2: BullMQ Worker]
    end

    subgraph Shared Data Layer
        B1 & B2 & B3 & B4 <-->|Redis Adapter Pub/Sub + Rate Limit Store| Redis[(Redis 7)]
        B1 & B2 & B3 & B4 & W1 & W2 <-->|Connection Pool| Postgres[(PostgreSQL Database)]
        W1 & W2 <-->|Job Queues| Redis
    end
```

---

## 📋 2. Multi-Server Setup & Provisioning

### Step 1: Initial Server Setup (Ubuntu / Debian)
Run the automated server initialization script:
```bash
bash scripts/setup-server.sh
```

### Step 2: Configure Environment Variables
Copy and configure production `.env` in `backend/`:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://ems_user:password@127.0.0.1:5432/ems_db?schema=public&connection_limit=50
REDIS_URL=redis://127.0.0.1:6379
JWT_ACCESS_SECRET=your_production_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_production_refresh_key_minimum_32_characters
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

### Step 3: SSL Certificate Provisioning
Obtain free SSL certificates via Let's Encrypt:
```bash
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### Step 4: Start PM2 Application Cluster
```bash
cd backend
npm run start:prod
# Or: pm2 start ecosystem.config.cjs
pm2 save
```

### Step 5: Start & Verify Nginx
```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

## ⚡ 3. PM2 Process Manager Cheat Sheet

| Command | Description |
| :--- | :--- |
| `pm2 start ecosystem.config.cjs` | Launch all 4 backend instances + 2 workers |
| `pm2 status` | Inspect running processes, CPU, memory, and restart counts |
| `pm2 reload ecosystem.config.cjs` | Zero-downtime rolling reload of all processes |
| `pm2 restart ecosystem.config.cjs` | Hard restart of all processes |
| `pm2 stop ecosystem.config.cjs` | Stop all EMS processes |
| `pm2 delete ecosystem.config.cjs` | Delete EMS processes from PM2 state |
| `pm2 logs` | Live stream logs from all instances |
| `pm2 logs ems-backend-1` | Live stream logs for a specific instance |
| `pm2 monit` | Terminal dashboard monitoring CPU and memory usage |
| `pm2 save` | Persist current process list to restart across server reboots |

---

## 🌐 4. Nginx Commands Cheat Sheet

| Command | Description |
| :--- | :--- |
| `sudo nginx -t` | Validate Nginx syntax and test configuration |
| `sudo systemctl reload nginx` | Zero-downtime reload of configuration |
| `sudo systemctl restart nginx` | Full restart of Nginx service |
| `sudo systemctl status nginx` | Check Nginx service health and uptime |
| `tail -f /var/log/nginx/access.log` | Real-time traffic log (with upstream latencies) |
| `tail -f /var/log/nginx/error.log` | Real-time Nginx error log |

---

## 📈 5. Horizontal & Vertical Scaling Instructions

### 1. Scaling Backend HTTP Instances on the Same Server
Edit `backend/ecosystem.config.cjs` to append additional instances (e.g., `ems-backend-5` on PORT 5004), and update `nginx/nginx.conf` under `upstream backend_cluster` and `upstream websocket_cluster`:
```nginx
upstream backend_cluster {
    least_conn;
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5002 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5003 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5004 max_fails=3 fail_timeout=30s; # New instance
    keepalive 64;
}
```
Reload PM2 and Nginx:
```bash
pm2 start ecosystem.config.cjs
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Scaling Background Workers
To scale background workers (e.g., handling high email/payroll volumes), duplicate the worker entry in `ecosystem.config.cjs` (e.g. `ems-worker-3`, `ems-worker-4`) and reload PM2.

---

## 🩺 6. Health Check Instructions

Run the automated multi-instance health check script:
```bash
bash scripts/health-check.sh
```

Individual direct checks:
```bash
# Direct instance checks
curl -i http://127.0.0.1:5000/api/v1/health
curl -i http://127.0.0.1:5001/api/v1/health
curl -i http://127.0.0.1:5002/api/v1/health
curl -i http://127.0.0.1:5003/api/v1/health

# Public gateway check
curl -i https://api.yourdomain.com/api/v1/health
```

---

## ⏪ 7. Emergency Rollback Instructions

If an issue occurs post-deployment, execute:
```bash
bash scripts/rollback.sh
```
The script will display recent commits, prompt for the target commit hash, re-install dependencies, re-generate Prisma, build frontend, and perform a rolling reload with zero downtime.

---

## 🔧 8. Troubleshooting Guide

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **502 Bad Gateway on Nginx** | Backend instances down or not bound to expected ports. | Check `pm2 status`. Check `pm2 logs`. Verify ports 5000-5003 are listening with `netstat -tlpn`. |
| **Socket.io connection drops / session errors** | IP hash missing or Redis adapter not connected. | Verify Redis connection with `redis-cli ping`. Ensure `ip_hash` is configured in `upstream websocket_cluster`. |
| **Rate limit 429 triggered too early** | Nginx `limit_req` burst exceeded or client IP forwarded incorrectly. | Ensure `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` is present in Nginx. |
| **PM2 process memory high / restart loop** | Memory leak or unhandled exception. | Inspect `logs/ems-backend-*-error.log`. Adjust `max_memory_restart: '1.5G'` if necessary. |
