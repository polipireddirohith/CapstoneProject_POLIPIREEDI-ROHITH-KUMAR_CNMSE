# Lightweight Node.js Alpine base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first for efficient Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy service source code
COPY . .

# Expose microservice port
EXPOSE 3001

# Start microservice
CMD ["npm", "start"]
