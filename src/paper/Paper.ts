/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import * as fs from "fs";
import axios from "axios";
import Utils from "../Utils";
import S3Uploader from "../s3/S3Uploader";
import DiscordNotification from "../DiscordNotification";
import Version from "../Version";

// PaperMC
class Paper {
    public paperVersions?: Version[];
    private hasChanged = false;

    constructor() {
        if (!fs.existsSync("/root/app/out/paper")) {
            fs.mkdirSync("/root/app/out/paper");
        }
    }

    private static async getLocalVersions(): Promise<{ paper: Array<Version> }> {
        let existsPaper = fs.existsSync('/root/app/out/paper/versions.json');
        let paperVersions: Array<Version> = [];


        if (existsPaper) {
            paperVersions = JSON.parse(fs.readFileSync('/root/app/out/paper/versions.json', 'utf8'));
        } else {
            if (process.env.S3_UPLOAD === "true") {
                let rx = await axios.get(process.env.S3_PULL_BASE + '/paper/versions.json');
                fs.writeFileSync('/root/app/out/paper/versions.json', JSON.stringify(rx.data));
                paperVersions = JSON.parse(fs.readFileSync('/root/app/out/paper/versions.json', 'utf8'));
                console.log('Updated paper versions from remote server');
            }
        }
        return { paper: paperVersions };

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
            let latestVersion = -1;
            for (const build of json.builds) {
                if (build > latestVersion) {
                    latestVersion = build;
                }
            }
            let dataDir = "/root/app/out/paper/" + versionName + "/"
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }
            const buildLabelPath = '/root/app/out/paper/' + versionName + '/build.txt';
            if (fs.existsSync(buildLabelPath)) {
                fs.unlinkSync(buildLabelPath);
            }
            fs.writeFileSync(buildLabelPath, latestVersion.toString());
            if (!this.paperVersions!.find(v => v.build === latestVersion)) {
                // @ts-ignore
                this.paperVersions = this.paperVersions!.filter(v => v.version !== versionName)
                Utils.discord.addPendingNotification(new DiscordNotification(`PaperMC ${versionName} updated!`, `PaperMC ${versionName} updated to build \`${latestVersion}\`!`));
                //create tmp dir
                if (!fs.existsSync('/root/app/tmp')) {
                    fs.mkdirSync('/root/app/tmp');
                    console.log("Created tmp dir");
                }

                fs.mkdtempSync('/root/app/tmp/', 'utf-8');
                console.log("Updating version: " + versionName + " build: " + latestVersion);

                // if debug mode, don't download, otherwise do.
                if (Utils.isDebug()) {
                    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
                    fs.writeFileSync(dataDir + "paper-" + versionName + ".jar", 'This is not a real JAR, don\'t use it for anything.');
                } else {
                    try {
                        await Utils.downloadFile('https://papermc.io/api/v2/projects/paper/versions/' + versionName + '/builds/' + latestVersion + '/downloads/paper-' + versionName + '-' + latestVersion + '.jar', dataDir + "paper-" + versionName + ".jar");
                        this.hasChanged = true;
                    } catch (e) {
                        console.log(e);
                    }

                }
                let isSnapshot = !Utils.isRelease(versionName);
                let paperVersion = new Version(versionName, isSnapshot, latestVersion, '', []);
                this.paperVersions!.push(paperVersion);
            }
        }

        fs.writeFileSync("/root/app/out/paper/versions.json", JSON.stringify(this.paperVersions));
        console.log("Paper versions updated");
        if (this.hasChanged) {
            console.log("Uploading Paper");
            let uploader = new S3Uploader()
            await uploader.syncS3Storage('/root/app/out/paper/', 'jar/paper');
        }

    }


}

export default Paper;
