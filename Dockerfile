# Self-hosted trade journal — single container, SQLite on a volume.
FROM node:22-slim AS builder
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web ./apps/web
COPY tsconfig.base.json ./
RUN pnpm --filter web build

FROM node:22-slim AS runner
ENV NODE_ENV=production
ENV JOURNAL_DATA_DIR=/data
WORKDIR /app
# Next standalone output bundles the server and pruned node_modules.
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public
RUN mkdir -p /data && chown -R node:node /data /app
# Litestream: continuous SQLite backup, used only when LITESTREAM_BUCKET is set.
ARG TARGETARCH=amd64
ADD https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-${TARGETARCH}.tar.gz /tmp/litestream.tar.gz
RUN tar -xzf /tmp/litestream.tar.gz -C /usr/local/bin litestream && rm /tmp/litestream.tar.gz
COPY litestream.yml /etc/litestream.yml
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["sh", "/app/docker-entrypoint.sh"]
