import BuildTools from "./buildtools";
import * as fs from "fs";
import axios from "axios";
import Utils from "../utils";
import Version from "./version";
import {execSync} from "child_process";

class Spigot {
    private bt: BuildTools;
    public versions: Array<Version>;

    constructor() {
        this.bt = new BuildTools();
        this.versions = Spigot.getLocalVersions();
        this.updateVersions()

    }

    private updateVersions() {
        axios.get("https://hub.spigotmc.org/versions/").then(res => {
            let latestVersions: Array<string> = res.data.split("\n").filter((line: string) => line.startsWith("<a href=\"1.")).map((line: string) => line.split("\"")[1]).map((line: string) => line.replace('.json', '')).sort((a: string, b: string) => Utils.sortVersions(a, b) ? 1 : -1);
            latestVersions.forEach((version: string) => {
                if (!this.versions.find((v: Version) => v.version === version)) {
                    //create tmp dir
                    if (!fs.existsSync('./tmp')){
                        fs.mkdirSync('./tmp');
                    }

                    let dir = fs.mkdtempSync('./tmp/', 'utf-8');
                    let exec = execSync('cd '+dir+' && java -jar ../../out/buildtools/BuildTools.jar --rev ' + version + ' --output-dir ../../out/spigot/'+version);
                    process.exit();
                }
            });
        });
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
