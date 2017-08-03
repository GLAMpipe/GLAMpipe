FROM node:6.9.4
RUN apt-get update && apt-get install -y vim build-essential imagemagick ghostscript poppler-utils 

# Install app dependencies
COPY package.json /tmp
RUN cd /tmp && npm install
RUN mkdir -p /src/app && cp -a /tmp/node_modules /src/app/
WORKDIR /src/app

# Bundle app source
COPY . /src/app/


EXPOSE 3000
CMD [ "node", "glampipe.js" ]
