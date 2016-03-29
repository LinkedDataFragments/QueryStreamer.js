FROM node:4.2.2

# Install some basic tools
RUN apt-get update && apt-get install -y gawk bc

# Install location
ENV dir /home/tpfqs-client

# Copy the server files
ADD . ${dir}

# Install the node module
RUN cd ${dir} && npm install

# Run base binary
WORKDIR ${dir}
ENTRYPOINT ["node", "bin/querymeta"]

# Default command
CMD ["--help"]
