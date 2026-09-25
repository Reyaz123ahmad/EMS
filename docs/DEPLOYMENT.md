# Production Deployment Guide

## 1. Docker Compose (Self-Hosted / VPS)

```bash
# 1. Clone repository
git clone https://github.com/Reyaz123ahmad/Edudibon.git
cd Edudibon

# 2. Configure environment
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env

# 3. Build and launch all production containers
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 2. Cloud Platforms (Railway / Render / Vercel)

### Backend (Railway / Render):
1. Connect GitHub repository and specify root directory `backend/`.
2. Add environment variables from `backend/.env.production.example`.
3. Build Command: `npm ci && npx prisma generate`
4. Start Command: `npm start`
5. Health Check Path: `/api/v1/health`

### Frontend (Vercel / Netlify):
1. Connect GitHub repository and select `frontend/` directory.
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables: `VITE_API_BASE_URL`
