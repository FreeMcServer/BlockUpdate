import BuildTools from "./buildtools";
import * as fs from "fs";
import axios from "axios";
import Utils from "../utils";
import Version from "./version";
import S3Uploader from "../s3/S3Uploader";

// PaperMC
class Paper {
    public paperVersions?: Version[];
    public craftBukkitVersions?: Version[];
    private bt?: BuildTools;
    private utils: Utils;

    constructor() {
        if (!fs.existsSync("/root/app/out/paper")) {
            fs.mkdirSync("/root/app/out/paper");
        }
        this.utils = new Utils();
    }

    private static async getLocalVersions(): Promise<{ paper: Array<Version> }> {
        let existsPaper = fs.existsSync('/root/app/out/paper/versions.json');
        let paperVersions: Array<Version> = [];


        if (existsPaper) {
            paperVersions = JSON.parse(fs.readFileSync('/root/app/out/paper/versions.json', 'utf8'));
        } else {
            if (process.env.S3_UPLOAD === "true") {
                let rx = await axios.get('https://download.freemcserver.net/jar/paper/versions.json');
                fs.writeFileSync('/root/app/out/paper/versions.json', JSON.stringify(rx.data));
                paperVersions = JSON.parse(fs.readFileSync('/root/app/out/paper/versions.json', 'utf8'));
                console.log('Updated paper versions from remote server');
            }
        }
        return {paper: paperVersions};

    }

    public async init() {

        const versions = await Paper.getLocalVersions();
        this.paperVersions = versions.paper;
        await this.updateVersions();
        console.log("Paper versions updated");
    }

    private async updateVersions() {
        const res = await axios.get("https://papermc.io/api/v2/projects/paper/");
        for (const versionName of res.data.versions) {
            const res = await axios.get("https://papermc.io/api/v2/projects/paper/versions/" + versionName);
            let json = res.data;
            const latestVersion = json.builds.sort().reverse()[0];
            if (!this.paperVersions!.find((v: Version) => v.spigotBuild === latestVersion)) {
                const build = await axios.get("https://papermc.io/api/v2/projects/paper/versions/" + versionName + "/builds/" + latestVersion);
                //create tmp dir
                if (!fs.existsSync('/root/app/tmp')) {
                    fs.mkdirSync('/root/app/tmp');
                    console.log("Created tmp dir");
                }

                let tmpDir = fs.mkdtempSync('/root/app/tmp/', 'utf-8');
                let spigotDir = "/root/app/out/paper/" + versionName + "/"
                if (!fs.existsSync(spigotDir)) {
                    fs.mkdirSync(spigotDir);
                }
                console.log("Updating version: " + versionName + " build: " + latestVersion);

                // if debug mode, don't download, otherwise do.
                if (this.utils.isDebug()) {
                    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
                    fs.writeFileSync(spigotDir + "paper-" + versionName + ".jar", 'This is not a real JAR, don\'t use it for anything.');
                } else {
                    try {
                        await this.downloadFile('https://papermc.io/api/v2/projects/paper/versions/' + versionName + '/builds/' + latestVersion + '/downloads/paper-' + versionName + '-' + latestVersion + '.jar', spigotDir + "paper-" + versionName + ".jar");
                    } catch (e) {
                        console.log(e);
                    }

                }
                let isSnapshot = !this.utils.isRelease(versionName);
                let spigotVersion = new Version(versionName, isSnapshot, latestVersion, [], '');
                this.paperVersions!.push(spigotVersion);
            }
        }

        fs.writeFileSync("/root/app/out/paper/versions.json", JSON.stringify(this.paperVersions));
        console.log("Paper versions updated, ready to upload");
        let uploader = new S3Uploader()
        let rx = await uploader.syncS3Storage('/root/app/out/paper/', 'jar/paper');
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

export default Paper;
