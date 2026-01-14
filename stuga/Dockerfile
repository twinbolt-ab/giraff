ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js, git, and nginx (no Node.js needed at runtime for static serving)
RUN apk add --no-cache nodejs npm git nginx

# Set working directory
WORKDIR /app

# Clone the repository
RUN git clone --depth 1 https://github.com/twinbolt-ab/stuga.git .

# Install dependencies and build
RUN npm ci
RUN npm run build

# Copy run script and nginx config
COPY run.sh /run.sh
COPY nginx.conf /etc/nginx/nginx.conf
RUN chmod a+x /run.sh

# Create nginx directories and copy static files
RUN mkdir -p /run/nginx /var/log/nginx /var/www/html
RUN cp -r dist/* /var/www/html/

# Expose the port
EXPOSE 3001

CMD [ "/run.sh" ]
