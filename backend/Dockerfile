# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --only=production

# ---------- Development ----------
FROM base AS development
RUN npm install --include=dev
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---------- Production ----------
FROM base AS production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
