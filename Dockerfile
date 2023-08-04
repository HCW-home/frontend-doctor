FROM node:16 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i
COPY . .
RUN sed -i 's/native/web/g' src/environments/environment.prod.ts
RUN npx ionic cap build browser --prod --no-open

FROM nginx:latest
COPY --from=builder /usr/src/app/www/ /usr/share/nginx/html/
COPY nginx-docker.conf.template /etc/nginx/templates/default.conf.template