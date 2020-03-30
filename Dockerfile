FROM node:11
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
# RUN npm i -g newman
COPY . .
EXPOSE 4800
# CMD ["npm", "run", "ci"]
CMD ["npm", "run", "start"]