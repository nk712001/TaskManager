# ----------- Development Stage -----------
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.* ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ----------- Production Build Stage -----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.* ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

# ----------- Production Runtime Stage -----------
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
