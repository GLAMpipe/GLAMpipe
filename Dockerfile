FROM node:argon
RUN apt-get update && apt-get install -y vim 
RUN mkdir -p /src/app

# Install app dependencies
COPY package.json /src/app
WORKDIR /src/app
RUN npm install 

# Bundle app source
COPY . /src/app


EXPOSE 3000
#CMD [ "npm", "start" ]
