/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import axios from "axios";
import Utils from "../Utils";
import Version from "../Version";
import Variant from "../variant/Variant";

// MohistMC
export default class Mohist extends Variant {
    constructor() {
        super("mohist", "Mohist");
    }

    public async getLatestVersions(): Promise<string[]> {
        const res = ["1.16.5","1.12.2", "1.7.10"]
        return res
    }

    public async getLatestBuild(versionName: string): Promise<Version | null> {
        const res = await axios.get("https://mohistmc.com/api/"+ versionName + "/latest");
        const json = res.data;

        const latestBuild = json.number;

        const isSnapshot = Utils.isSnapshot(versionName);
        const ref = this.id + "-" + versionName + "-" + latestBuild;
        const javaVersions: number[] = []; // TODO
        return {
            version: versionName,
            snapshot: isSnapshot,
            build: latestBuild,
            ref: ref,
            javaVersions: javaVersions,
            hash: {
                type: "md5",
                hash: json.md5
            }
        };
    }

    public usesDownload(): boolean {
        return true;
    }

    public getDownloadLink(version: Version): string {
        const res = axios.get("https://mohistmc.com/api/"+ version + "/latest");
        const download = res.data;
        return download.url
    }
}