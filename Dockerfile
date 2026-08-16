# Builder Stage
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN pnpm build

# Ensure all files in meriyah dist are copied to standalone build (Next.js standalone tracing misses meriyah.mjs with pnpm)
RUN cp -rf node_modules/.pnpm/meriyah*/node_modules/meriyah/dist/* .next/standalone/node_modules/.pnpm/meriyah*/node_modules/meriyah/dist/ 2>/dev/null || true

# Production Stage
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Set node environment to production
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create the .next/cache directory for image optimization at runtime
# Next.js standalone mode does NOT include this, causing ENOENT errors
RUN mkdir -p /app/.next/cache/images && \
    chown -R nextjs:nodejs /app/.next/cache

# Copy the startup script
COPY startup.sh /app/startup.sh

# Ensure the startup script is executable and writable public dir for env-config
RUN chmod +x /app/startup.sh && \
    chown -R nextjs:nodejs /app/public

USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the startup script
CMD ["/app/startup.sh"]
