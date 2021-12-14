import BuildTools from "./buildtools";
import * as fs from "fs";
import axios from "axios";
import Utils from "../utils";
import Version from "./version";
import {execSync} from "child_process";
import S3Uploader from "../s3/S3Uploader";

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
        this.bt = new BuildTools(); //TODO: This doesnt finish before we start building... Lovely async...
        const versions = Spigot.getLocalVersions();
        this.spigotVersions = versions.spigot;
        this.craftBukkitVersions = versions.craftbukkit;
        this.updateVersions();
        console.log("Spigot and Craftbukkit versions updated");
    }

    private async updateVersions() {
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
                if (!json.javaVersions) {
                    javaVersions = [52];
                    javaVersionName = "8";
                } else {
                    javaVersions = json.javaVersions.map((javaVersion: string) => parseInt(javaVersion));
                    javaVersionName = this.utils.getJavaVersion(javaVersions.sort((a, b) => a > b ? a : b)[0]);
                }

                //create tmp dir
                if (!fs.existsSync('./tmp')) {
                    fs.mkdirSync('./tmp');
                    console.log("Created tmp dir");
                }

                let tmpDir = fs.mkdtempSync('./tmp/', 'utf-8');
                let spigotDir = "./out/spigot/"+versionName+"/"
                if (!fs.existsSync(spigotDir)) {
                    fs.mkdirSync(spigotDir);
                }
                let craftbukkitDir = "./out/craftbukkit/"+versionName+"/"
                if (!fs.existsSync(craftbukkitDir)) {
                    fs.mkdirSync(craftbukkitDir);
                }

                // if debug mode, don't download, otherwise do.
                if(this.utils.isDebug()) {
                    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
                    fs.writeFileSync(spigotDir+"spigot-"+versionName+".jar", 'This is not a real JAR, don\'t use it for anything.');
                    fs.writeFileSync(craftbukkitDir+"craftbukkit-"+versionName+".jar", 'This is not a real JAR, don\'t use it for anything.');
                } else {
                    let exec = await execSync('cd ' + tmpDir + ' && java' + javaVersionName + ' -jar ../../out/buildtools/BuildTools.jar --rev ' + versionName + ' --output-dir ../../'+spigotDir);
                    fs.cpSync(spigotDir+'craftbukkit-'+versionName+'.jar', './out/craftbukkit/craftbukkit-'+versionName+'.jar');
                    fs.unlinkSync(craftbukkitDir+'craftbukkit-'+versionName+'.jar');
                }
                let isSnapshot = !this.utils.isRelease(versionName);
                let spigotVersion = new Version(versionName, isSnapshot, json.name, javaVersions, json.refs.Spigot);
                this.spigotVersions.push(spigotVersion);

                let craftBukkitVersion = new Version(versionName, isSnapshot, json.name, javaVersions, json.refs.CraftBukkit);
                this.craftBukkitVersions.push(craftBukkitVersion);
            }
        }

        fs.writeFileSync("./out/spigot/versions.json", JSON.stringify(this.spigotVersions));
        fs.writeFileSync("./out/craftbukkit/versions.json", JSON.stringify(this.craftBukkitVersions));
        console.log("Spigot and Craftbukkit versions updated, ready to upload");
        let uploader = new S3Uploader()
        let rx = await uploader.syncS3Storage('/root/app/out/spigot/', 'jar/spigot');
    }

    private static getLocalVersions(): { spigot: Array<Version>, craftbukkit: Array<Version> } {
        let existsSpigot = fs.existsSync('out/spigot/versions.json');
        let existsCraftbukkit = fs.existsSync('out/craftbukkit/versions.json');
        let spigotVersions: Array<Version> = [];
        let craftBukkitVersions: Array<Version> = [];


        if (existsSpigot) {
            spigotVersions = JSON.parse(fs.readFileSync('./out/spigot/versions.json', 'utf8'));
        }
        if (existsCraftbukkit) {
            craftBukkitVersions = JSON.parse(fs.readFileSync('./out/craftbukkit/versions.json', 'utf8'));
        }
        return {spigot: spigotVersions, craftbukkit: craftBukkitVersions};

    }

}
export default Spigot;
