FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y \
    && apt-get install -y \
        curl \
        software-properties-common \
        python3 \
        python3-pip \
        openjdk-8-jdk \
        openjdk-11-jdk \
        openjdk-17-jdk \
        openjdk-21-jdk \
        build-essential \
        git \
        maven \
    && pip3 install s3cmd \
    && curl -sL https://deb.nodesource.com/setup_21.x | bash - \
    && apt autoremove -y \
    && apt install -y nodejs

RUN update-alternatives --install /usr/bin/java8 java8 /usr/lib/jvm/java-8-openjdk-amd64/bin/java 1 \
    && update-alternatives --install /usr/bin/java11 java11 /usr/lib/jvm/java-11-openjdk-amd64/bin/java 2 \
    && update-alternatives --install /usr/bin/java17 java17 /usr/lib/jvm/java-17-openjdk-amd64/bin/java 3 \
    && update-alternatives --install /usr/bin/java21 java21 /usr/lib/jvm/java-21-openjdk-amd64/bin/java 4

COPY . /root/app
WORKDIR /root/app

RUN rm -rf dist/* out/* \
    && npm install
CMD ["npm", "run", "run"]
