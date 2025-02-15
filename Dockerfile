#This Dockerfile is used to construct a docker image for the fragment microservice.
#It defies the steps to create a docker image for the node.js application.

#use the official node.js image as the base image
# Use node version 22.12.0
FROM node:20.18.1

#metadata about the image which includes the author and description
LABEL maintainer="Krutin Polra <kbpolra@myseneca.ca>"
LABEL description="Fragments node.js microservice"

#define environment variables using env instruction 
# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# define the working directory for the application
# Use /app as our working directory
WORKDIR /app

#copy your application's package.json and package-lock.json files into the image
# relative path - Copy the package.json and package-lock.json
# files into the working dir (/app).  NOTE: this requires that we have
# already set our WORKDIR in a previous step.
COPY package*.json ./

# Install the node dependencies
# Install node dependencies defined in package-lock.json
RUN npm install

# Copy the source code into the image
# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# define the command to run in order to start our container
# A Docker container is really a single process, and we need to tell Docker how to start this process
# Start the container by running our server
CMD npm start

# Expose the port that the app runs on
# We run our service on port 8080
EXPOSE 8080
