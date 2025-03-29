
#############################################################################################################################
# Stage 0: Install the base dependecies
FROM node:20-alpine3.20@sha256:d4b8042fdb02ab03737ac36b5ebf7f316a595a8350829ef79339ff5f0b33aaa7 AS dependencies

# explicit path - Copy the package.json and package-lock.json files into /app.
COPY package*.json /app/

# Use /app as our working directory
WORKDIR /app

# Install node dependencies defined in package-lock.json (For production)
RUN npm ci --production

#############################################################################################################################
# Stage 1: Copy required files and Deploy the application
#This Dockerfile is used to construct a docker image for the fragment microservice.
#It defies the steps to create a docker image for the node.js application.

#use the official node.js image as the base image
# Use node version 20-alpine3.20
FROM node:20-alpine3.20@sha256:d4b8042fdb02ab03737ac36b5ebf7f316a595a8350829ef79339ff5f0b33aaa7 AS build

#metadata about the image which includes the author and description
LABEL maintainer="Krutin Polra <kbpolra@myseneca.ca>"
LABEL description="Fragments node.js microservice"

#define environment variables using env instruction 
# We default to use port 8080 in our service
ENV PORT=80 \
  NPM_CONFIG_LOGLEVEL=warn \
  NPM_CONFIG_COLOR=false \
  NODE_ENV=production

# define the working directory for the application
# Use /app as our working directory
WORKDIR /app

#Copy the generated dependencies (node_modules/)
COPY --from=dependencies /app /app

# Copy src to /app/src/
COPY --chown=node:node ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Install curl for healthcheck (pin version)
RUN apk add --no-cache curl=8.12.1-r0


# Switch user to node
# USER node

# Start the container by running our server
# fix the warning given by Halolint "warning: Use arguments JSON notation for CMD and ENTRYPOINT arguments"
CMD ["node", "src/index.js"]

# We run our service on port 80
EXPOSE ${PORT}

# Add a healthcheck layer (Querying healthcheck route '/')
HEALTHCHECK --interval=15s --timeout=30s --start-period=10s --retries=3 \
  CMD curl --fail localhost:${PORT} || exit 1
