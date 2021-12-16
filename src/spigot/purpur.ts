import * as fs from "fs";
import axios from "axios";
import Utils from "../utils";
import Version from "./version";
import S3Uploader from "../s3/S3Uploader";

// Purpur
class Purpur {
    public purpurVersions?: Version[];
    private utils: Utils;

    constructor() {
        if (!fs.existsSync("/root/app/out/purpur")) {
            fs.mkdirSync("/root/app/out/purpur");
        }
        this.utils = new Utils();
    }

    private static async getLocalVersions(): Promise<{ purpur: Array<Version> }> {
        let existsPurpur = fs.existsSync('/root/app/out/purpur/versions.json');
        let purpurVersions: Array<Version> = [];


        if (existsPurpur) {
            purpurVersions = JSON.parse(fs.readFileSync('/root/app/out/purpur/versions.json', 'utf8'));
        } else {
            if (process.env.S3_UPLOAD === "true") {
                let rx = await axios.get('https://download.freemcserver.net/jar/purpur/versions.json');
                fs.writeFileSync('/root/app/out/purpur/versions.json', JSON.stringify(rx.data));
                purpurVersions = JSON.parse(fs.readFileSync('/root/app/out/purpur/versions.json', 'utf8'));
                console.log('Updated purpur versions from remote server');
            }
        }
        return {purpur: purpurVersions};

    }

    public async init() {

        const versions = await Purpur.getLocalVersions();
        this.purpurVersions = versions.purpur;
        await this.updateVersions();
        console.log("Purpur versions updated");
    }

    private async updateVersions() {
        const res = await axios.get("https://api.purpurmc.org/v2/purpur/");
        for (const versionName of res.data.versions) {
            const res = await axios.get("https://api.purpurmc.org/v2/purpur/" + versionName);
            let json = res.data;
            const latestVersion = json.builds.latest;
            if (!this.purpurVersions!.find((v: Version) => v.spigotBuild === latestVersion)) {
                const build = await axios.get("https://api.purpurmc.org/v2/purpur/" + versionName + "/" + latestVersion);
                //create tmp dir
                if (!fs.existsSync('/root/app/tmp')) {
                    fs.mkdirSync('/root/app/tmp');
                    console.log("Created tmp dir");
                }

                let tmpDir = fs.mkdtempSync('/root/app/tmp/', 'utf-8');
                let spigotDir = "/root/app/out/purpur/" + versionName + "/"
                if (!fs.existsSync(spigotDir)) {
                    fs.mkdirSync(spigotDir);
                }
                console.log("Updating version: " + versionName + " build: " + latestVersion);

                // if debug mode, don't download, otherwise do.
                if (this.utils.isDebug()) {
                    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
                    fs.writeFileSync(spigotDir + "purpur-" + versionName + ".jar", 'This is not a real JAR, don\'t use it for anything.');
                } else {
                    try {
                        await this.downloadFile("https://api.purpurmc.org/v2/purpur/" + versionName + "/" + latestVersion + "/download", spigotDir + "purpur-" + versionName + ".jar");
                    } catch (e) {
                        console.log(e);
                    }

                }
                let isSnapshot = !this.utils.isRelease(versionName);
                let spigotVersion = new Version(versionName, isSnapshot, latestVersion, [], '');
                this.purpurVersions!.push(spigotVersion);
            }
        }

        fs.writeFileSync("/root/app/out/purpur/versions.json", JSON.stringify(this.purpurVersions));
        console.log("Purpur versions updated, ready to upload");
        let uploader = new S3Uploader()
        let rx = await uploader.syncS3Storage('/root/app/out/purpur/', 'jar/purpur');
    }

    private downloadFile(fileUrl: string, destPath: string) {

        if (!fileUrl) return Promise.reject(new Error('Invalid fileUrl'));
        if (!destPath) return Promise.reject(new Error('Invalid destPath'));

        return new Promise<void>(async function (resolve, reject) {
            await axios({
                url: fileUrl,
                method: 'GET',
                responseType: 'stream'
            }).then(function (response) {
                response.data.pipe(fs.createWriteStream(destPath));
                response.data.on('end', function () {
                    console.log('File downloaded to ' + destPath);
                    resolve();
                });
            }).catch(function (error) {
                reject(error);
            });
        });
    }
}

export default Purpur;
