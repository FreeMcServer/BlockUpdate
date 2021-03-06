/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import axios from "axios";
import Utils from "../Utils";
import Version from "../Version";
import Variant from "../variant/Variant";

export default class Paper extends Variant {
    constructor() {
        super("paper", "Paper");
    }

    public async getLatestVersions(): Promise<string[]> {
        const res = await axios.get("https://api.papermc.io/v2/projects/paper/");
        return res.data.versions;
    }

    public async getLatestBuild(versionName: string): Promise<Version | null> {
        const res = await axios.get("https://api.papermc.io/v2/projects/paper/versions/" + versionName);
        let json = res.data;

        const latestBuild = Utils.getHighestNumber(json.builds);
        if (latestBuild == null) {
            return null;
        }

        const buildRes = await axios.get("https://api.papermc.io/v2/projects/paper/versions/" + versionName + "/builds/" + latestBuild);

        const isSnapshot = Utils.isSnapshot(versionName);
        const ref = buildRes.data.changes[0] ? buildRes.data.changes[0].commit : this.id + "-" + versionName + "-" + latestBuild;
        const javaVersions: number[] = []; // TODO
        return {
            version: versionName,
            snapshot: isSnapshot,
            build: latestBuild,
            ref: ref,
            javaVersions: javaVersions,
            hash: {
                type: "sha256",
                hash: buildRes.data.downloads.application.sha256
            }
        };
    }

    public usesDownload(): boolean {
        return true;
    }

    public getDownloadLink(version: Version): string {
        return `https://api.papermc.io/v2/projects/paper/versions/${version.version}/builds/${version.build}/downloads/paper-${version.version}-${version.build}.jar`;
    }
}
