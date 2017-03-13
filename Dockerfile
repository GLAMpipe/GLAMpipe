FROM node:6.9.4
RUN apt-get update && apt-get install -y vim build-essential python-pip && pip install pdfx 
RUN mkdir -p /src/app

# Install app dependencies
COPY package.json /src/app
WORKDIR /src/app
RUN npm install 

# Bundle app source
COPY . /src/app/


EXPOSE 3000
CMD [ "node", "glampipe.js" ]
