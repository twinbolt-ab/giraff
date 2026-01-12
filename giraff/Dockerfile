ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js and git
RUN apk add --no-cache nodejs npm git

# Set working directory
WORKDIR /app

# Clone the repository
RUN git clone --depth 1 https://github.com/twinbolt-ab/giraff.git .

# Install all dependencies (including dev for build)
RUN npm ci

# Build the Next.js application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Copy run script from add-on folder
COPY run.sh /run.sh
RUN chmod a+x /run.sh

# Expose the port
EXPOSE 3000

CMD [ "/run.sh" ]
