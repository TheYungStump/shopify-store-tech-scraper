FROM apify/actor-node:20
COPY package*.json ./
RUN npm --quiet set progress=false \
    && npm install --omit=dev \
    && echo "Installed NPM packages:" \
    && npm list || true
COPY . ./
ENV NODE_ENV=production
CMD npm start