# Docker Deployment & Orchestration Guide

Mindstocs EMS multi-container containerization setup with Docker and Docker Compose.

---

## 🛠️ Development Environment

To start the development stack with live volume-mount reloading:

```bash
docker-compose -f docker-compose.dev.yml up
```

- **Backend (API)**: `http://localhost:5000`
- **Frontend (Vite Dev)**: `http://localhost:3000`
- **Redis Service**: `localhost:6379`

To start in detached background mode:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

---

## 🚀 Production Environment

To build and run the optimized production stack (Node.js API + Nginx SPA + Redis):

```bash
docker-compose up --build -d
```

- **Backend (API)**: `http://localhost:5000`
- **Frontend (Nginx Production)**: `http://localhost:3000`

---

## 📊 Useful Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service (backend/frontend/redis)
docker-compose logs -f backend
```

### Stop Containers
```bash
docker-compose down
```

### Clean Rebuild without Cache
```bash
docker-compose build --no-cache
```
