# Stage 1: Build packages and server
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy packages and sources
COPY packages/types ./packages/types
COPY apps/server ./apps/server

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter @collab/server exec prisma generate

# Build TypeScript to Javascript
RUN pnpm --filter @collab/server build

# Stage 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

WORKDIR /app/apps/server

# Run prisma migration and boot backend server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]
