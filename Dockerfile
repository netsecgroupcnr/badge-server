FROM ubuntu:latest

ENV LC_CTYPE en_US.UTF-8
ENV LANG en_US.UTF-8
ENV PYTHONIOENCODING utf-8
ENV DEBIAN_FRONTEND noninteractive

COPY . /app
WORKDIR /app

RUN apt-get update
RUN apt-get install -y nodejs npm
RUN npm install

CMD [ "node", "/app/program.js" ]

