FROM node:18
WORKDIR /app
COPY ../package.json .
COPY ../yarn.lock .
RUN yarn install
COPY ../ .
RUN yarn build:jobs
CMD ["yarn", "start:jobs:uba-state"]
