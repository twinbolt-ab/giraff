ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js, git, and curl
RUN apk add --no-cache nodejs npm git curl

# Set working directory
WORKDIR /app

# Clone the repository
RUN git clone --depth 1 https://github.com/twinbolt-ab/giraff.git .

# Install all dependencies (keep dev deps for runtime rebuild)
RUN npm ci

# Build the Next.js application (initial build, will rebuild at startup with correct basePath)
RUN npm run build

# Copy run script from add-on folder
COPY run.sh /run.sh
RUN chmod a+x /run.sh

# Expose the port
EXPOSE 3001

CMD [ "/run.sh" ]
