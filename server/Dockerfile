# NOTE: It'd be nice to use Alpine, but Chrome is a chonky boi with lots of deps, so we're going with a chonky image
FROM node:18

ENV PROD 1

# Install prerequisites
# From: https://github.com/puppeteer/puppeteer/blob/main/docker/Dockerfile
RUN apt-get update \
    && apt-get install -y wget gnupg vim \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r pptruser && useradd -rm -g pptruser -G audio,video pptruser

WORKDIR /usr/src/app

# Configure the base npm application
# Instead of a simple command like COPY ./server ./server/, we split this into multiple commands in
# order to ignore the node_modules library (for some reason .dockerignore is being ignored).
COPY ./server/.env ./server/tsconfig.json ./server/package.json ./server/package-lock.json ./server/
COPY ./server/lib ./server/lib

COPY ./shared ./shared/

# TODO(acorn1010): Figure out why COPY isn't copying as pptruser.
RUN chown -R pptruser:pptruser /usr/src/app
RUN chown -R pptruser:pptruser /usr/local/lib/node_modules
USER pptruser

WORKDIR /usr/src/app/server
RUN npm ci

#CMD ["sleep", "6000000"]
ENTRYPOINT ["npm", "start"]

# Expose Ports.
EXPOSE 3000
