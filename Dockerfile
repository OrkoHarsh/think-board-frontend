# --- STAGE 1: BUILD THE REACT APP ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# --- STAGE 2: SERVE WITH NGINX ---
FROM nginx:alpine
# Copy the built files from Stage 1 into the Nginx web folder
COPY --from=build /app/dist /usr/share/nginx/html

# Custom Nginx config is needed for React Router to work
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
