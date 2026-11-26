FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=3001 UPLOAD_DIR=/data/uploads
VOLUME /data
EXPOSE 3001
CMD ["npm", "start"]
