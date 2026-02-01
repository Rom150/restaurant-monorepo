FROM node:18-bullseye-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY package-lock*.json ./
RUN npm install --legacy-peer-deps --silent
COPY . .
EXPOSE 3001
CMD ["sh","-c","PORT=3001 npm start"]
