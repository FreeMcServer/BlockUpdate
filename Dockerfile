FROM ubuntu:21.10
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && apt-get install -y curl software-properties-common python3 python3-pip openjdk-8-jdk openjdk-11-jdk openjdk-16-jdk openjdk-17-jdk openjdk-18-jdk build-essential nodejs maven git && rm -rf /var/lib/apt/lists/*
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get update -y && apt-get install nodejs -y && rm -rf /var/lib/apt/lists/*
RUN pip3 install s3cmd
RUN echo -e '/usr/lib/jvm/java-8-openjdk-amd64/bin/java "$@"' > /usr/bin/java8 && \
    chmod +x /usr/bin/java8
RUN echo -e '/usr/lib/jvm/java-11-openjdk-amd64/bin/java "$@"' > /usr/bin/java11 && \
    chmod +x /usr/bin/java11
RUN echo -e '/usr/lib/jvm/java-16-openjdk-amd64/bin/java "$@"' > /usr/bin/java16 && \
    chmod +x /usr/bin/java16
RUN echo -e '/usr/lib/jvm/java-17-openjdk-amd64/bin/java "$@"' > /usr/bin/java17 && \
    chmod +x /usr/bin/java17
RUN echo -e '/usr/lib/jvm/java-18-openjdk-amd64/bin/java "$@"' > /usr/bin/java18 && \
    chmod +x /usr/bin/java18
COPY . /root/app
WORKDIR /root/app
RUN rm -rf dist/* && rm -rf out/*
RUN npm install
CMD ["npm", "run", "run"]
