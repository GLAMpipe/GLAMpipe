FROM node:6.9.4
RUN apt-get update && apt-get install -y vim build-essential imagemagick ghostscript poppler-utils 

# Install app dependencies
COPY package.json /tmp
RUN cd /tmp && npm install
RUN useradd -ms /bin/bash glampipe
RUN mkdir -p /src/app && cp -a /tmp/node_modules /src/app/
WORKDIR /src/app

# Bundle app source
COPY . /src/app/

# set permissions
RUN chown -R glampipe:glampipe /src/app && \
    mkdir /glampipe-data && \
    chown -R glampipe:glampipe /glampipe-data

# change user
USER glampipe

EXPOSE 3000
CMD [ "node", "glampipe.js" ]
