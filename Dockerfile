FROM ubuntu:21.04
RUN apt-get update -y && apt-get install -y software-properties-common
RUN apt-get update -y
RUN apt-get install openjdk-8-jdk -y
RUN apt-get install openjdk-11-jdk -y
RUN apt-get install openjdk-16-jdk -y
RUN apt-get install openjdk-17-jdk -y
RUN apt-get install openjdk-18-jdk -y
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install build-essential nodejs -y
COPY . /root/app
WORKDIR /root/app
RUN npm install
RUN update-alternatives --display java
CMD ["npm", "run", "run"]
