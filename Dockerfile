FROM node:6.9.4
RUN apt-get update && apt-get install -y vim build-essential ruby-dev rubygems python-pip && pip install pdfx && gem install specific_install &&  gem specific_install https://github.com/EbookGlue/libsvm-ruby-swig.git && gem install pdf-extract
RUN mkdir -p /src/app

# Install app dependencies
COPY package.json /src/app
WORKDIR /src/app
RUN npm install 

# Bundle app source
COPY . /src/app


EXPOSE 3000
#CMD [ "node", "glampipe.js" ]
