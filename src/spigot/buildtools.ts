import * as fs from "fs";
import axios from "axios";

class BuildTools {
    private buildToolsApi: string = "https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/api/json";
    private buildToolsVersion: string;

    constructor() {
        this.buildToolsVersion = BuildTools.getBuildToolsVersion();
        this.updateBuildTools();
    }

    private updateBuildTools(): void {

        axios.get(this.buildToolsApi).then(response => {
            let latestVersion = response.data.id!;
            if (latestVersion <= this.buildToolsVersion) {
                console.log("BuildTools is up to date");
            } else {
                console.log("BuildTools is outdated, updating...");
                this.downloadBuildTools(latestVersion);
            }
        });
        return;
    }

    private static getBuildToolsVersion(): string {
        let exists: boolean = fs.existsSync(`./out/buildtools/.version`);
        if (exists) {
            return fs.readFileSync(`./out/buildtools/.version`, "utf8");
        } else {
            return "0";
        }
    }

    private downloadBuildTools(version: string): void {
        let buildToolsUrl = `https://hub.spigotmc.org/jenkins/job/BuildTools/${version}/artifact/target/BuildTools.jar`;
        let buildToolsPath = `./out/buildtools/BuildTools.jar`;
        let buildToolsDir = `./out/buildtools`;

        if (!fs.existsSync(buildToolsDir)) {
            fs.mkdirSync(buildToolsDir);
        }

        if (fs.existsSync(buildToolsPath)) {
            fs.unlinkSync(buildToolsPath);
        }

        axios.get(buildToolsUrl, {
            responseType: 'stream'
        }).then(response => {
            response.data.pipe(fs.createWriteStream(buildToolsPath));
            response.data.on('end', () => {
                console.log("BuildTools downloaded");
                fs.writeSync(fs.openSync(`./out/buildtools/.version`, 'w'), version);

            });
        });
    }
}
export default BuildTools;
