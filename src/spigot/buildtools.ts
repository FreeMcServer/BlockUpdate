import * as fs from "fs";
import axios from "axios";
import Spigot from "./spigot";

class BuildTools {
    private buildToolsApi: string = "https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/api/json";
    private buildToolsVersion: string;

    constructor() {
        this.buildToolsVersion = BuildTools.getBuildToolsVersion();
    }

    public async init() {
        await this.updateBuildTools();
    }

    private async updateBuildTools(): Promise<void> {
        const response = await axios.get(this.buildToolsApi);
        let latestVersion = response.data.id as string;
        if (latestVersion <= this.buildToolsVersion) {
            console.log("BuildTools is up to date");
        } else {
            console.log("BuildTools is outdated, updating...");
            await this.downloadBuildTools(latestVersion);
        }
    }

    private static getBuildToolsVersion(): string {
        let exists: boolean = fs.existsSync(`./out/buildtools/.version`);
        if (exists) {
            return fs.readFileSync(`./out/buildtools/.version`, "utf8");
        } else {
            return "0";
        }
    }

    private async downloadBuildTools(version: string): Promise<void> {
        let buildToolsUrl = `https://hub.spigotmc.org/jenkins/job/BuildTools/${version}/artifact/target/BuildTools.jar`;
        let buildToolsPath = `./out/buildtools/BuildTools.jar`;
        let buildToolsDir = `./out/buildtools`;

        if (!fs.existsSync(buildToolsDir)) {
            fs.mkdirSync(buildToolsDir);
        }

        if (fs.existsSync(buildToolsPath)) {
            fs.unlinkSync(buildToolsPath);
        }

        const response = await axios.get(buildToolsUrl, {
            responseType: 'stream'
        });
        const promise = new Promise<void>(function(resolve, reject) {
            response.data.pipe(fs.createWriteStream(buildToolsPath));
            response.data.on('end', () => {
                console.log("BuildTools downloaded");
                fs.writeSync(fs.openSync(`./out/buildtools/.version`, 'w'), version);
                resolve();
            });
        });

        // Wait for the download
        await promise;
    }
}
export default BuildTools;
