FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_PRODUCT_URL=http://localhost:8080
ARG VITE_CART_URL=http://localhost:8080
ARG VITE_REVIEW_URL=http://localhost:8080
ARG VITE_ORDER_URL=http://localhost:8080

ENV VITE_PRODUCT_URL=$VITE_PRODUCT_URL
ENV VITE_CART_URL=$VITE_CART_URL
ENV VITE_REVIEW_URL=$VITE_REVIEW_URL
ENV VITE_ORDER_URL=$VITE_ORDER_URL

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
