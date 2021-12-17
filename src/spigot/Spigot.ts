import BuildTools from "./BuildTools";
import * as fs from "fs";
import axios from "axios";
import Utils from "../Utils";
import SpigotVersion from "./SpigotVersion";
import {execSync} from "child_process";
import S3Uploader from "../s3/S3Uploader";

// Spigot and Craftbukkit getter
class Spigot {
    public spigotVersions?: SpigotVersion[];
    public craftBukkitVersions?: SpigotVersion[];
    private bt?: BuildTools;
    private utils: Utils;
    private hasChanged = false;

    constructor() {
        if (!fs.existsSync("/root/app/out/spigot")) {
            fs.mkdirSync("/root/app/out/spigot");
        }
        if (!fs.existsSync("/root/app/out/craftbukkit")) {
            fs.mkdirSync("/root/app/out/craftbukkit");
        }
        this.utils = new Utils();
    }

    private static async getLocalVersions(): Promise<{ spigot: Array<SpigotVersion>, craftbukkit: Array<SpigotVersion> }> {
        let existsSpigot = fs.existsSync('/root/app/out/spigot/versions.json');
        let existsCraftbukkit = fs.existsSync('/root/app/out/craftbukkit/versions.json');
        let spigotVersions: Array<SpigotVersion> = [];
        let craftBukkitVersions: Array<SpigotVersion> = [];


        if (existsSpigot) {
            spigotVersions = JSON.parse(fs.readFileSync('/root/app/out/spigot/versions.json', 'utf8'));
        } else {
            if (process.env.S3_UPLOAD === "true") {
                let rx = await axios.get(process.env.S3_PULL_BASE + '/spigot/versions.json');
                fs.writeFileSync('/root/app/out/spigot/versions.json', JSON.stringify(rx.data));
                spigotVersions = JSON.parse(fs.readFileSync('/root/app/out/spigot/versions.json', 'utf8'));
                console.log('Updated spigot versions from remote server');
            }
        }
        if (existsCraftbukkit) {
            craftBukkitVersions = JSON.parse(fs.readFileSync('/root/app/out/craftbukkit/versions.json', 'utf8'));
        }
        return {spigot: spigotVersions, craftbukkit: craftBukkitVersions};

    }

    public async init() {
        this.bt = new BuildTools();
        await this.bt.init();

        const versions = await Spigot.getLocalVersions();
        this.spigotVersions = versions.spigot;
        this.craftBukkitVersions = versions.craftbukkit;
        await this.updateVersions();
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
            const res = await axios.get("https://hub.spigotmc.org/versions/" + versionName + ".json");
            let json = res.data;
            if (!this.spigotVersions!.find((v: SpigotVersion) => v.ref === json.refs.Spigot)) {
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
                if (!fs.existsSync('/root/app/tmp')) {
                    fs.mkdirSync('/root/app/tmp');
                    console.log("Created tmp dir");
                }

                let tmpDir = fs.mkdtempSync('/root/app/tmp/', 'utf-8');
                let spigotDir = "/root/app/out/spigot/" + versionName + "/"
                if (!fs.existsSync(spigotDir)) {
                    fs.mkdirSync(spigotDir);
                }
                let craftbukkitDir = "/root/app/out/craftbukkit/" + versionName + "/"
                if (!fs.existsSync(craftbukkitDir)) {
                    fs.mkdirSync(craftbukkitDir);
                }
                console.log("Updating version: " + versionName);

                // if debug mode, don't download, otherwise do.
                if (this.utils.isDebug()) {
                    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
                    fs.writeFileSync(spigotDir + "spigot-" + versionName + ".jar", 'This is not a real JAR, don\'t use it for anything.');
                    fs.writeFileSync(craftbukkitDir + "craftbukkit-" + versionName + ".jar", 'This is not a real JAR, don\'t use it for anything.');
                } else {
                    try {
                        await execSync('cd ' + tmpDir + ' && /usr/lib/jvm/java-' + javaVersionName + '-openjdk-amd64/bin/java -jar /root/app/out/buildtools/BuildTools.jar --rev ' + versionName + ' --output-dir ' + spigotDir + ' && rm -rf ' + tmpDir, {stdio: 'ignore'});
                        if (fs.existsSync(spigotDir + 'craftbukkit-' + versionName + '.jar')) {
                            fs.cpSync(spigotDir + 'craftbukkit-' + versionName + '.jar', '/root/app/out/craftbukkit/craftbukkit-' + versionName + '.jar');
                        }
                        // fs.unlinkSync(tmpDir);
                        this.hasChanged = true;
                        fs.writeFileSync("/root/app/out/spigot/versions.json", JSON.stringify(this.spigotVersions));
                        fs.writeFileSync("/root/app/out/craftbukkit/versions.json", JSON.stringify(this.craftBukkitVersions));
                    } catch (e) {
                        console.log(e);
                        console.log("Well, it crashed");
                        let a = await execSync('cd ' + tmpDir + ' tail -n 20 /root/app/out/buildtools/BuildTools.log.txt');
                        console.log(a.toString());
                    }

                }
                let isSnapshot = !this.utils.isRelease(versionName);
                let spigotVersion = new SpigotVersion(versionName, isSnapshot, json.name, javaVersions, json.refs.Spigot);
                this.spigotVersions!.push(spigotVersion);

                let craftBukkitVersion = new SpigotVersion(versionName, isSnapshot, json.name, javaVersions, json.refs.CraftBukkit);
                this.craftBukkitVersions!.push(craftBukkitVersion);
            }
        }

        fs.writeFileSync("/root/app/out/spigot/versions.json", JSON.stringify(this.spigotVersions));
        fs.writeFileSync("/root/app/out/craftbukkit/versions.json", JSON.stringify(this.craftBukkitVersions));
        console.log("Spigot and Craftbukkit versions updated");
        if (this.hasChanged) {
            console.log("Uploading Spigot");
            let uploader = new S3Uploader()
            await uploader.syncS3Storage('/root/app/out/spigot/', 'jar/spigot');
        }
    }

}

export default Spigot;
