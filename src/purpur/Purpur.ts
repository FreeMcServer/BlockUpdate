/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import axios from "axios";
import Utils from "../Utils";
import Version from "../Version";
import Variant from "../variant/Variant";

// Purpur
export default class Purpur extends Variant {
    constructor() {
        super("purpur", "Purpur");
    }

    public async getLatestVersions(): Promise<string[]> {
        const res = await axios.get("https://api.purpurmc.org/v2/purpur/");
        return res.data.versions;
    }

    public async getLatestBuild(versionName: string): Promise<Version> {
        const res = await axios.get("https://api.purpurmc.org/v2/purpur/" + versionName);
        let json = res.data;
        
        const latestBuild = json.builds.latest;

        const buildRes = await axios.get("https://api.purpurmc.org/v2/purpur/" + versionName + "/" + latestBuild);

        const isSnapshot = Utils.isSnapshot(versionName);
        const ref = buildRes.data.commits[0].hash;
        const javaVersions: number[] = []; // TODO
        return {
            version: versionName,
            snapshot: isSnapshot,
            build: latestBuild,
            ref: ref,
            javaVersions: javaVersions,
            hash: {
                type: "md5",
                hash: buildRes.data.md5
            }
        };
    }

    public usesDownload(): boolean {
        return true;
    }

    public getDownloadLink(version: Version): string {
        return `https://api.purpurmc.org/v2/purpur/${version.version}/${version.build}/download`;
    }
}