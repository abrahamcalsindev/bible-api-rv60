# syntax=docker/dockerfile:1

# Stage 1: Build (install all deps + compile TypeScript)
FROM node:18-alpine AS build

WORKDIR /app

# Build tools for native modules (sqlite3)
RUN apk add --no-cache g++ make python3

# Copy dependency files first for layer cache
COPY package.json package-lock.json* ./

# Install ALL deps (needed for TypeScript compilation) with BuildKit cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:18-alpine AS runner

WORKDIR /app

# Build tools for native modules (sqlite3 needs them at install time too)
RUN apk add --no-cache g++ make python3

# Copy only production package files
COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy compiled code and database
COPY --from=build /app/dist ./dist
COPY --from=build /app/database ./database

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as non-root user for security
USER node

# Start application directly with node (no npm overhead)
CMD ["node", "dist/src/app.js"]
