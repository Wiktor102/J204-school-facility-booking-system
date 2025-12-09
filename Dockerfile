FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Build SCSS
RUN npm run sass

# Expose the app port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
