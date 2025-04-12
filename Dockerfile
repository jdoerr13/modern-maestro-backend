# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port Fly.io expects
EXPOSE 8080

# Start the app
CMD ["node", "server.js"]
