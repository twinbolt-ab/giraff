ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js and git
RUN apk add --no-cache nodejs npm git

# Set working directory
WORKDIR /app

# Clone the repository
RUN git clone --depth 1 https://github.com/twinbolt-ab/giraff.git .

# Install dependencies
RUN npm ci --omit=dev

# Build the Next.js application
RUN npm run build

# Copy run script from add-on folder
COPY run.sh /run.sh
RUN chmod a+x /run.sh

# Expose the port
EXPOSE 3000

CMD [ "/run.sh" ]
