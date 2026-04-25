FROM node:22-alpine AS zavislosti

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=zavislosti /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://backend:8000/api
ARG NEXT_PUBLIC_APP_URL=https://kliknijdlo.online

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=zavislosti /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
