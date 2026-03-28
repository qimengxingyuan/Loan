# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++
# Copy shared directory first
COPY shared/ ./shared/
# Copy backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY backend/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install runtime dependencies for SQLite
RUN apk add --no-cache libstdc++

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --production --no-audit && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built backend - note the trailing slash to copy contents
COPY --from=backend-builder /app/backend/dist/ ./dist/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist/ ./public/

# Create data directory
RUN mkdir -p /app/data

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app/data /app/dist /app/public
USER nodejs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/loan.db
ENV STATIC_PATH=/app/public

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
