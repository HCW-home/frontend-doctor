FROM node:18 AS builder
ENV VERSION=0.5.34
WORKDIR /usr/src/app
COPY package*.json ./
COPY yarn.lock ./
RUN npx yarn install
COPY . .
RUN make

FROM docker.io/nginxinc/nginx-unprivileged:1.28-alpine-slim
COPY --from=builder /usr/src/app/dist/hug-at-home/ /usr/share/nginx/html/
COPY nginx-docker.conf.template /etc/nginx/templates/default.conf.template
COPY nginx.conf /etc/nginx/nginx.conf
COPY .version /usr/share/nginx/html/version
RUN mkdir /etc/nginx/ssl/ && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /etc/nginx/ssl/ssl-cert-snakeoil.key -out /etc/nginx/ssl/ssl-cert-snakeoil.pem -subj "/C=US/ST=California/L=San Francisco/O=My Company/OU=IT/CN=example.com"
