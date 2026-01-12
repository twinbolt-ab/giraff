ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js 20
RUN apk add --no-cache nodejs npm

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Build the Next.js application
RUN npm run build

# Copy run script
COPY ha-addon/giraff/run.sh /run.sh
RUN chmod a+x /run.sh

# Expose the port
EXPOSE 3000

CMD [ "/run.sh" ]
