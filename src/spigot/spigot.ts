import BuildTools from "./buildtools";
import * as fs from "fs";
import axios from "axios";
import Utils from "../utils";
import Version from "./version";


// Spigot and Craftbukkit getter
class Spigot {
    private bt: BuildTools;
    public versions: Array<Version>;
    private utils: Utils;

    constructor() {
        this.utils = new Utils;
        this.bt = new BuildTools();
        this.versions = Spigot.getLocalVersions();
        this.updateVersions()

    }

    private async updateVersions() {
        await axios.get("https://hub.spigotmc.org/versions/").then(async res => {
            let latestVersions: Array<string> = res.data.split("\n").filter((line: string) => line.startsWith("<a href=\"1.")).map((line: string) => line.split("\"")[1]).map((line: string) => line.replace('.json', '')).sort((a: string, b: string) => Utils.sortVersions(a, b) ? 1 : -1);
            for (const versionName of latestVersions) {
                if (!this.versions.find((v: Version) => v.version === versionName)) {
                    await axios.get("https://hub.spigotmc.org/versions/" + versionName + ".json").then(async res => {
                        let json = res.data;
                        let javaVersionName;
                        let javaVersions: Array<number>;
                        try {
                            javaVersions = json.javaVersions.map((javaVersion: string) => parseInt(javaVersion));
                            javaVersionName = this.utils.getJavaVersion(javaVersions[0]);
                        } catch (e) {
                            javaVersions = [52];
                            javaVersionName = "1.8.0";
                        }

                        //create tmp dir
                        if (!fs.existsSync('./tmp')) {
                            fs.mkdirSync('./tmp');
                        }

                        let dir = fs.mkdtempSync('./tmp/', 'utf-8');
                        //java path
                        let javaPath = '/usr/lib/jvm/java-' + javaVersionName + '/bin/java';

                        if (!fs.existsSync(javaPath)) {
                            javaPath = '/usr/lib/jvm/openjdk-' + javaVersionName + '/bin/java';
                            if (!fs.existsSync(javaPath)) {
                                console.log("Java not found");
                            }
                        }
                        //let exec = await execSync('cd ' + dir + ' && ' + javaPath + ' -jar ../../out/buildtools/BuildTools.jar --rev ' + versionName + ' --output-dir ../../out/spigot/' + versionName);
                        let isSnapshot = !this.utils.isRelease(versionName);
                        let version = new Version(versionName, isSnapshot, json.name, javaVersions, json.refs.Spigot);
                        this.versions.push(version);
                    });

                }
            }

        })
        fs.writeFileSync('./out/spigot/versions.json', JSON.stringify(this.versions));
    }

    private static getLocalVersions(): Array<Version> {
        let exists = fs.existsSync('out/spigot/versions.json');

        if (exists) {
            let versions = fs.readFileSync('out/spigot/versions.json', 'utf8');
            return JSON.parse(versions);
        } else {
            return [];
        }
    }

}
export default Spigot;
