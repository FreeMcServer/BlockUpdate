FROM ubuntu:21.10
RUN apt-get update -y && apt-get install -y curl software-properties-common
RUN apt-get update -y
RUN apt-get install openjdk-8-jdk -y
RUN apt-get install openjdk-11-jdk -y
RUN apt-get install openjdk-16-jdk -y
RUN apt-get install openjdk-17-jdk -y
RUN apt-get install openjdk-18-jdk -y
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install build-essential nodejs -y
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
RUN apt-get install -y maven git # pretty sure these are needed for building spigot


COPY . /root/app
WORKDIR /root/app
RUN npm install
RUN npm run build
CMD ["npm", "run", "run"]
