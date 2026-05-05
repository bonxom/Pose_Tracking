FROM node:22-bookworm-slim

WORKDIR /app

ENV EXPO_NO_TELEMETRY=1

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npm", "run", "web:docker"]
