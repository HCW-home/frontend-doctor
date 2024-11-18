FROM node:18 AS builder
ENV VERSION=0.5.3
WORKDIR /usr/src/app
COPY package*.json ./
COPY yarn.lock ./
RUN npx yarn install
COPY . .
#RUN npx ng build --configuration=production --build-optimizer --aot --output-hashing=all --vendor-chunk
RUN make

FROM docker.io/nginxinc/nginx-unprivileged:latest
COPY --from=builder /usr/src/app/dist/hug-at-home/ /usr/share/nginx/html/
COPY nginx-docker.conf.template /etc/nginx/templates/default.conf.template
COPY nginx.conf /etc/nginx/nginx.conf
COPY .version /usr/share/nginx/html/version
#RUN sed -i  's/\(default_type.*\)/\1\n    proxy_headers_hash_bucket_size 128;/g' /etc/nginx/nginx.conf
