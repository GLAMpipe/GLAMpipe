FROM node:lts-alpine

WORKDIR /src/app

# Bundle app source
COPY ./node_modules ./node_modules/
COPY . /src/app/


EXPOSE 3000
CMD [ "node", "index.js" ]
