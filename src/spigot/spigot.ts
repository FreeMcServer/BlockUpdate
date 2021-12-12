import BuildTools from "./buildtools";
import * as fs from "fs";
import axios from "axios";
import Utils from "../utils";
import Version from "./version";
import {execSync} from "child_process";


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
        fs.writeFileSync('./out/spigot/versions.json', JSON.stringify(this.versions));

    }

    private updateVersions() {
         axios.get("https://hub.spigotmc.org/versions/").then(res => {
            let latestVersions: Array<string> = res.data.split("\n").filter((line: string) => line.startsWith("<a href=\"1.")).map((line: string) => line.split("\"")[1]).map((line: string) => line.replace('.json', '')).sort((a: string, b: string) => Utils.sortVersions(a, b) ? 1 : -1);
            for (const versionName of latestVersions) {
                if (!this.versions.find((v: Version) => v.version === versionName)) {
                    axios.get("https://hub.spigotmc.org/versions/" + versionName + ".json").then(res => {
                        let json = res.data;
                        let javaVersionName;
                        let javaVersions: Array<number>;
                        let javaPath: string;
                        let finished: boolean = false;
                        if (!json.javaVersions) {
                            javaVersions = [52];
                            javaVersionName = "1.8.0";
                            finished = true;
                        } else {
                            javaVersions = json.javaVersions.map((javaVersion: string) => parseInt(javaVersion));
                        }
                        try {
                            javaVersions.forEach((javaVersion: number) => {
                                if (finished) return;

                                javaVersionName = this.utils.getJavaVersion(javaVersion);
                                try {
                                    javaPath = execSync("update-alternatives --display java | grep "+javaVersionName).toString().split("\n")[0].split(" - ")[0];
                                    finished = true;
                                } catch (e) {
                                    console.log("Java version " + javaVersionName + " not found. Skipping...");
                                }
                            });
                        } catch (e) {
                            console.log("No java versions found for this version. You need to install one of the following java versions: " + javaVersions.join(", "));
                        }

                        //create tmp dir
                        if (!fs.existsSync('./tmp')) {
                            fs.mkdirSync('./tmp');
                        }

                        let dir = fs.mkdtempSync('./tmp/', 'utf-8');
                        //let exec = await execSync('cd ' + dir + ' && ' + javaPath + ' -jar ../../out/buildtools/BuildTools.jar --rev ' + versionName + ' --output-dir ../../out/spigot/' + versionName);
                        let isSnapshot = !this.utils.isRelease(versionName);
                        let version = new Version(versionName, isSnapshot, json.name, javaVersions, json.refs.Spigot);
                        this.versions.push(version);
                    });

                }
            }

        })
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
