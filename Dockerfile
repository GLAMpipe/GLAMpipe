FROM node:argon
RUN apt-get update && apt-get install -y vim
RUN mkdir -p /usr/src
WORKDIR /usr/src

# Install app dependencies
COPY package.json /usr/src/
RUN npm install -g

# Bundle app source
#COPY . /usr/src/app


EXPOSE 3000
#CMD [ "npm", "start" ]
