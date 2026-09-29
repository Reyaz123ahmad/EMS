# # ---------- Base ----------
# FROM node:20-alpine AS base
# WORKDIR /app
# RUN apk add --no-cache openssl
# COPY package*.json ./
# RUN npm ci --only=production

# # ---------- Development ----------
# FROM base AS development
# RUN npm install --include=dev
# COPY . .
# EXPOSE 5000
# CMD ["npm", "run", "dev"]

# # ---------- Production ----------
# FROM base AS production
# COPY . .
# RUN npx prisma generate
# EXPOSE 5000
# CMD ["npm", "start"]



# ---------- Base ----------
# FROM node:20-alpine AS base
# WORKDIR /app
# RUN apk add --no-cache openssl
# COPY package*.json ./
# RUN npm install --omit=dev

# # ---------- Development ----------
# FROM base AS development
# RUN npm install --include=dev
# COPY . .
# EXPOSE 5000
# CMD ["npm", "run", "dev"]

# # ---------- Production ----------
# FROM base AS production
# COPY . .
# RUN npm install prisma --no-save && npx prisma generate
# EXPOSE 5000
# CMD ["npm", "start"]





# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache \
    openssl \
    python3 \
    make \
    g++ \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev \
    librsvg-dev \
    build-base
COPY package*.json ./
RUN npm install --omit=dev

# ---------- Development ----------
FROM base AS development
RUN npm install --include=dev
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---------- Production ----------
FROM base AS production
COPY . .
RUN npm install prisma --no-save && npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]