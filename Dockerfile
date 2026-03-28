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

# Create dist directory and copy files using a different approach
RUN mkdir -p /app/dist /app/public

# Copy built backend - use cp -r to copy contents
COPY --from=backend-builder /app/backend/dist /tmp/backend-dist
RUN cp -r /tmp/backend-dist/* /app/dist/ 2>/dev/null || cp -r /tmp/backend-dist /app/dist-tmp && mv /app/dist-tmp/* /app/dist/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /tmp/frontend-dist
RUN cp -r /tmp/frontend-dist/* /app/public/ 2>/dev/null || cp -r /tmp/frontend-dist /app/public-tmp && mv /app/public-tmp/* /app/public/

# Debug: Verify files after copy
RUN echo "=== Verifying files after copy ===" && \
    ls -la /app/ && \
    ls -la /app/dist/ && \
    head -5 /app/dist/index.js

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
