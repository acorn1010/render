# NOTE: It'd be nice to use Alpine, but Chrome is a chonky boi with lots of deps, so we're going with a chonky image
FROM mcr.microsoft.com/playwright:v1.30.0-focal

ENV PROD 1

WORKDIR /usr/src/app

# Configure the base npm application
# Instead of a simple command like COPY ./server ./server/, we split this into multiple commands in
# order to ignore the node_modules library (for some reason .dockerignore is being ignored).
COPY ./server/.env ./server/tsconfig.json ./server/package.json ./server/package-lock.json ./server/
COPY ./server/lib ./server/lib

COPY ./shared ./shared/

# TODO(acorn1010): Figure out why COPY isn't copying as pptruser.

WORKDIR /usr/src/app/server
RUN npm ci

#CMD ["sleep", "6000000"]
ENTRYPOINT ["npm", "start"]

# Expose Ports.
EXPOSE 3000
