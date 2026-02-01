FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY package-lock*.json ./
RUN npm ci --silent
COPY . .
EXPOSE 3000
CMD ["npm","run","start:dev"]
# Install Tesseract OCR (French)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-fra \
 && rm -rf /var/lib/apt/lists/*
