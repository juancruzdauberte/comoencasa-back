FROM node:22.15.0

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ./src ./src
COPY *.env ./
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh

EXPOSE 8080

CMD ["./entrypoint.sh"]
