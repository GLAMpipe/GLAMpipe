# Build image
FROM node:lts-alpine

RUN apk add --no-cache \
    git \
    python \
    py-pip \
    build-base \
    libc6-compat

RUN mkdir -p /src/app
RUN chown node:node /src/app
USER node
WORKDIR /src/app/
COPY --chown=node *.json ./
RUN npm install
COPY --chown=node . ./

CMD [ "node", "index.js" ]
