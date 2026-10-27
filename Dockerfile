# Multi-stage production Dockerfile to deploy the complete application (Frontend + Backend)
# Stage 1: Build the React Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Stage 2: Build the Express Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
COPY backend ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma ./backend/node_modules/@prisma
COPY --from=backend-builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma

# Copy compiled frontend SPA bundle into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Secure upload directory
RUN mkdir -p /app/backend/private-uploads

WORKDIR /app/backend

EXPOSE 4000

# Start unified production server (serves API and React SPA)
CMD ["node", "dist/index.js"]
