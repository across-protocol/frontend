FROM node:18
WORKDIR /workspace
COPY /workspace .

RUN yarn install

RUN yarn build:jobs
CMD ["yarn", "start:jobs:uba-state"]
