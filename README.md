# BlockUpdate
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![Pipeline Status](https://git.facha.dev/FreeMCServer/version-updater/badges/master/pipeline.svg)](https://git.facaha.dev/FreeMCServer/version-updater/-/commits/master)

BlockUpdate is a TypeScript app for creating a Minecraft version JAR download API.

## Usage
First Clone the repository and cd into it.

We require docker & docker-compose to use this for simplicity purposes. You can find information on how to download docker for your platform [here](https://docs.docker.com/get-docker/) and docker-compose [here](https://docs.docker.com/compose/install/).

Once you have all the tools installed, you can copy the .env.sample file and call it .env, and then add any environment variables needed for you there. One helpful environment variable is the DEBUG=true one.

Once your environment variables are all setup, run the following command to get all jars (Please note this may take a while to run!).
```bash
docker-compose -f docker-compose-dev.yml up
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[GPLv3](https://choosealicense.com/licenses/gpl-3.0/)

## Authors

- [@SpaceQuacker](https://www.git.facha.dev/SpaceQuacker)
- [@facha](https://www.git.facha.dev/facha)
- [@Alvinn8](https://www.git.facha.dev/Alvinn8)
