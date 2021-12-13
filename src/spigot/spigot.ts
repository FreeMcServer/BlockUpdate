import BuildTools from "./buildtools";
import * as fs from "fs";
import axios from "axios";
import Utils from "../utils";
import Version from "./version";
import {execSync} from "child_process";

// Spigot and Craftbukkit getter
class Spigot {
    private bt: BuildTools;
    public spigotVersions: Version[];
    public craftBukkitVersions: Version[];
    private utils: Utils;

    constructor() {
        if (!fs.existsSync("./out/spigot")) {
            fs.mkdirSync("./out/spigot");
        }
        if (!fs.existsSync("./out/craftbukkit")) {
            fs.mkdirSync("./out/craftbukkit");
        }
        this.utils = new Utils();
        this.bt = new BuildTools();
        const versions = Spigot.getLocalVersions();
        this.spigotVersions = versions.spigot;
        this.craftBukkitVersions = versions.craftbukkit;
    }

    async updateVersions() {
        const res = await axios.get("https://hub.spigotmc.org/versions/");
        const data = res.data as string;
        const latestVersions = data.split("\n")
                                   .filter(line => line.startsWith('<a href="1.'))
                                   .map(line => line.split('"')[1])
                                   .map(line => line.replace('.json', ''))
                                   .sort(Utils.sortVersions);

        for (const versionName of latestVersions) {
            if (!this.spigotVersions.find((v: Version) => v.version === versionName)) {
                const res = await axios.get("https://hub.spigotmc.org/versions/" + versionName + ".json");
                let json = res.data;
                let javaVersionName: string;
                let javaVersions: number[];
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
                        if (!finished){
                            javaVersionName = this.utils.getJavaVersion(javaVersion);
                            try {
                                javaPath = execSync("update-alternatives --display java | grep " + javaVersionName).toString().split("\n")[0].split(" - ")[0].replace('  link best version is ', '');
                                console.log(javaPath);
                                console.log("STOP FOR FUCK SAKE");
                                finished = true;
                            } catch (e) {
                                console.log("Java version " + javaVersionName + " not found. Skipping...");
                            }
                        }
                    });
                } catch (e) {
                    console.log("No java versions found for this version. You need to install one of the following java versions: " + javaVersions.join(", "));
                }

                //create tmp dir
                if (!fs.existsSync('./tmp')) {
                    fs.mkdirSync('./tmp');
                    console.log("Created tmp dir");
                }

                let dir = fs.mkdtempSync('./tmp/', 'utf-8');
                //let exec = await execSync('cd ' + dir + ' && ' + javaPath + ' -jar ../../out/buildtools/BuildTools.jar --rev ' + versionName + ' --output-dir ../../out/spigot/' + versionName);
                let isSnapshot = !this.utils.isRelease(versionName);
                let spigotVersion = new Version(versionName, isSnapshot, json.name, javaVersions, json.refs.Spigot);
                this.spigotVersions.push(spigotVersion);

                let craftBukkitVersion = new Version(versionName, isSnapshot, json.name, javaVersions, json.refs.CraftBukkit);
                this.craftBukkitVersions.push(craftBukkitVersion);
                //fs.cpSync('./out/spigot/craftbukkit-'+versionName+'.jar', './out/craftbukkit/craftbukkit-'+versionName+'.jar');
                //fs.unlinkSync('./out/spigot/craftbukkit-'+versionName+'.jar');
            }
        }
    }

    private static getLocalVersions(): { spigot: Array<Version>, craftbukkit: Array<Version> } {
        let exists = fs.existsSync('out/spigot/versions.json');

        if (exists) {
            let spigotVersions = fs.readFileSync('out/spigot/versions.json', 'utf8');
            let craftBukkitVersions = fs.readFileSync('out/craftbukkit/versions.json', 'utf8');
            return {spigot: JSON.parse(spigotVersions), craftbukkit: JSON.parse(craftBukkitVersions)};
        } else {
            return {spigot: [], craftbukkit: []};
        }
    }

}
export default Spigot;
