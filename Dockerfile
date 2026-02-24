# Dockerfile
# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Ensure storage and keys directories exist
RUN mkdir -p storage keys db

# Expose the Express port
EXPOSE 3000

# Generate a fresh set of RSA keys and start the server
CMD node keys/generate.js && node src/server.js