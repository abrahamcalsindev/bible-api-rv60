# ============================================
# Stage 1: Dependencies (cached aggressively)
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

# Copy only dependency files for maximum cache efficiency
COPY package.json package-lock.json* ./

# Install dependencies with clean install
# This layer is cached unless package.json or lockfile changes
RUN npm ci

# ============================================
# Stage 2: Build (only runs if source changes)
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript (typically < 2s for this project)
RUN npm run build

# ============================================
# Stage 3: Production runtime (minimal image)
# ============================================
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only production dependencies
COPY --from=deps /app/package.json ./
COPY --from=deps /app/package-lock.json* ./

# Install ONLY production dependencies (no devDependencies)
RUN npm ci --only=production

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Copy database (required for SQLite)
COPY --from=builder /app/database ./database

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as non-root user for security
USER node

# Start application
CMD ["npm", "start"]
