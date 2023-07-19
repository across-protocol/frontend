FROM node:18
WORKDIR /app
COPY /workspace/build/package.json .
COPY /workspace/build/yarn.lock .
RUN yarn install
COPY ../ .
RUN yarn build:jobs
CMD ["yarn", "start:jobs:uba-state"]
