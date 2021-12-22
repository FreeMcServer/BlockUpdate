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
import Variant from "../variant/Variant";

// PaperMC
export default class Paper extends Variant {
    constructor() {
        super("paper", "Paper");
    }

    public async getLatestVersions(): Promise<string[]> {
        const res = await axios.get("https://papermc.io/api/v2/projects/paper/");
        return res.data.versions as string[];
    }

    public async getLatestBuild(versionName: string): Promise<Version> {
        const res = await axios.get("https://papermc.io/api/v2/projects/paper/versions/" + versionName);
        let json = res.data;

        let latestBuild = -1;
        for (const build of json.builds) {
            if (build > latestBuild) {
                latestBuild = build;
            }
        }

        const buildRes = await axios.get("https://papermc.io/api/v2/projects/paper/versions/" + versionName + "/builds/" + latestBuild);

        const isSnapshot = Utils.isSnapshot(versionName);
        const ref = buildRes.data.changes[0].commit;
        const javaVersions: number[] = []; // TODO
        return new Version(versionName, isSnapshot, latestBuild, ref, javaVersions);
    }

    public usesDownload(): boolean {
        return true;
    }

    public getDownloadLink(version: Version): string {
        return `https://papermc.io/api/v2/projects/paper/versions/${version.version}/builds/${version.build}/downloads/paper-${version.version}-${version.build}.jar`;
    }
}
