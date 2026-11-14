# syntax=docker/dockerfile:1

# Stage 1: Build (install deps + compile TypeScript)
FROM node:18-alpine AS build

WORKDIR /app

# Build tools for native modules (sqlite3)
RUN apk add --no-cache g++ make python3

# Copy dependency files first for layer cache
COPY package.json package-lock.json* ./

# Install deps with BuildKit cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:18-alpine AS runner

WORKDIR /app

# Copy compiled code and pre-built node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/database ./database

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as non-root user for security
USER node

# Start application
CMD ["npm", "start"]
