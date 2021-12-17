import * as fs from "fs";
import axios from "axios";

class BuildTools {
    private buildToolsApi: string = "https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/api/json";
    private readonly buildToolsVersion: string;

    constructor() {
        this.buildToolsVersion = BuildTools.getBuildToolsVersion();
    }

    private static getBuildToolsVersion(): string {
        let exists: boolean = fs.existsSync(`/root/app/out/buildtools/.version`);
        if (exists) {
            return fs.readFileSync(`/root/app/out/buildtools/.version`, "utf8");
        } else {
            return "0";
        }
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

    private async downloadBuildTools(version: string): Promise<void> {
        let buildToolsUrl = `https://hub.spigotmc.org/jenkins/job/BuildTools/${version}/artifact/target/BuildTools.jar`;
        let buildToolsPath = `/root/app/out/buildtools/BuildTools.jar`;
        let buildToolsDir = `/root/app/out/buildtools`;

        if (!fs.existsSync(buildToolsDir)) {
            fs.mkdirSync(buildToolsDir);
        }

        if (fs.existsSync(buildToolsPath)) {
            fs.unlinkSync(buildToolsPath);
        }

        const response = await axios.get(buildToolsUrl, {
            responseType: 'stream'
        });
        const promise = new Promise<void>(function (resolve) {
            response.data.pipe(fs.createWriteStream(buildToolsPath));
            response.data.on('end', () => {
                console.log("BuildTools downloaded");
                fs.writeSync(fs.openSync(`/root/app/out/buildtools/.version`, 'w'), version);
                resolve();
            });
        });

        // Wait for the download
        await promise;
    }
}

export default BuildTools;
