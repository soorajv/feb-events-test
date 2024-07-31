# Use an official Node runtime as a parent image
FROM node:21-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Install nodemon globally for development
RUN npm install -g nodemon

# Bundle the app source inside the Docker image
COPY . .


# Lint the code
RUN npm run lint

# Run tests
RUN npm run unit-test

# Build the TypeScript code
RUN npm run build



# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=development

# Run nodemon for development
CMD ["npm", "run", "dev"]
