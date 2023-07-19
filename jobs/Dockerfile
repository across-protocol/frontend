FROM node:18
WORKDIR /app
COPY /workspace/package.json .
COPY /workspace/yarn.lock .
RUN yarn install
COPY ../ .
RUN yarn build:jobs
CMD ["yarn", "start:jobs:uba-state"]
