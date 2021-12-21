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

// Waterfall Proxy
export default class Waterfall {
    public waterfallVersions?: Version[];
    private utils: Utils;
    private hasChanged = false;

    constructor() {
        if (!fs.existsSync("/root/app/out/waterfall")) {
            fs.mkdirSync("/root/app/out/waterfall");
        }
        this.utils = new Utils();
    }

    private static async getLocalVersions(): Promise<{ waterfall: Version[] }> {
        let existsWaterfall = fs.existsSync('/root/app/out/waterfall/versions.json');
        let waterfallVersions: Version[] = [];


        if (existsWaterfall) {
            waterfallVersions = JSON.parse(fs.readFileSync('/root/app/out/waterfall/versions.json', 'utf8'));
        } else {
            if (process.env.S3_UPLOAD === "true") {
                try {
                    let rx = await axios.get(process.env.S3_PULL_BASE + '/waterfall/versions.json');
                    fs.writeFileSync('/root/app/out/waterfall/versions.json', JSON.stringify(rx.data));
                    waterfallVersions = JSON.parse(fs.readFileSync('/root/app/out/waterfall/versions.json', 'utf8'));
                    console.log('Updated waterfall versions from remote server');
                } catch (e) {
                    console.warn("Failed to download waterfall versions.json", e);
                }
            }
        }
        return { waterfall: waterfallVersions };

    }

    public async init() {

        const versions = await Waterfall.getLocalVersions();
        this.waterfallVersions = versions.waterfall;
        await this.updateVersions();
        console.log("Waterfall versions updated");
    }

    private async updateVersions() {
        const res = await axios.get("https://papermc.io/api/v2/projects/waterfall");
        for (const versionName of res.data.versions) {
            console.log("Checking version " + versionName);
            const res = await axios.get("https://papermc.io/api/v2/projects/waterfall/versions/" + versionName);
            let json = res.data;
            let latestVersion = -1;
            for (const build of json.builds) {
                if (build > latestVersion) {
                    latestVersion = build;
                }
            }
            let dataDir = "/root/app/out/waterfall/" + versionName + "/"
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }
            const buildLabelPath = '/root/app/out/waterfall/' + versionName + '/build.txt';
            if (fs.existsSync(buildLabelPath)) {
                fs.unlinkSync(buildLabelPath);
            }
            fs.writeFileSync(buildLabelPath, latestVersion.toString());
            if (!this.waterfallVersions!.find(v => v.build === latestVersion)) {
                // @ts-ignore
                this.waterfallVersions = this.waterfallVersions!.filter((v: WaterfallVersion) => v.version !== versionName)
                Utils.pendingMessages.push(new DiscordNotification(`waterfallMC ${versionName} updated!`, `waterfallMC ${versionName} updated to build \`${latestVersion}\`!`));
                //create tmp dir
                if (!fs.existsSync('/root/app/tmp')) {
                    fs.mkdirSync('/root/app/tmp');
                    console.log("Created tmp dir");
                }

                fs.mkdtempSync('/root/app/tmp/', 'utf-8');
                console.log("Updating version: " + versionName + " build: " + latestVersion);

                // if debug mode, don't download, otherwise do.
                if (this.utils.isDebug()) {
                    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
                    fs.writeFileSync(dataDir + "waterfall-" + versionName + ".jar", 'This is not a real JAR, don\'t use it for anything.');
                } else {
                    try {
                        await Utils.downloadFile('https://papermc.io/api/v2/projects/waterfall/versions/' + versionName + '/builds/' + latestVersion + '/downloads/waterfall-' + versionName + '-' + latestVersion + '.jar', dataDir + "waterfall-" + versionName + ".jar");
                        this.hasChanged = true;
                    } catch (e) {
                        console.log(e);
                    }

                }
                let isSnapshot = !this.utils.isRelease(versionName);
                let waterfallVersion = new Version(versionName, isSnapshot, latestVersion, '', []);
                this.waterfallVersions!.push(waterfallVersion);
            }
        }

        fs.writeFileSync("/root/app/out/waterfall/versions.json", JSON.stringify(this.waterfallVersions));
        console.log("Waterfall versions updated");
        if (this.hasChanged) {
            console.log("Uploading Waterfall");
            let uploader = new S3Uploader()
            await uploader.syncS3Storage('/root/app/out/waterfall/', 'jar/waterfall');
        }

    }
}