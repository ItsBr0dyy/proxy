FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

ARG GIT_COMMIT=unknown

ENV GIT_COMMIT=$GIT_COMMIT

RUN bun run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "run", "start"]