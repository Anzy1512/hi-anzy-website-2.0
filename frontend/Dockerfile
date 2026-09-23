# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --global npm@11 && npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=http://localhost:8080
ARG REACT_APP_BACKEND_URL=http://localhost:8010
ARG VITE_AUTH_LOGIN_URL=
ENV SITE_URL=$SITE_URL REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL VITE_AUTH_LOGIN_URL=$VITE_AUTH_LOGIN_URL CI=true
RUN npm run build

FROM nginx:1.27-alpine AS serve
ARG REACT_APP_BACKEND_URL=http://localhost:8010
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV CSP_CONNECT_SRC=$REACT_APP_BACKEND_URL
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
