/*
 * BlockUpdate
 * Copyright (c) 2022. FreeMCServer
 */

import axios from "axios";
import Utils from "../Utils";
import Version from "../Version";
import Variant from "../variant/Variant";

interface MagmaVersion extends Version {
        downloadUrl: string;}

// Magma Foundation
export default class Magma extends Variant {
    constructor() {
        super("magma", "Magma");
    }

    public async getLatestVersions(): Promise<string[]> {
        const res = ["1.16.5","1.12.2", "1.18.2"];
        return res
    }
    public async getLatestBuild(versionName: string): Promise<MagmaVersion | null> {
        const res = await axios.get("https://api.magmafoundation.org/api/v2/"+ versionName + "/latest");
        const json = res.data;

        const latestBuild = json.name;

        const isSnapshot = Utils.isSnapshot(versionName);
        const ref = this.id + "-" + versionName + "-" + latestBuild;
        const javaVersions: number[] = []; // TODO
        return {
            version: versionName,
            snapshot: isSnapshot,
            build: latestBuild,
            ref: ref,
            javaVersions: javaVersions,
            downloadUrl: json.link,
        };
    }

    public usesDownload(): boolean {
        return true;
    }

    public getDownloadLink(version: Version): string {
        const magmaVersion = version as MagmaVersion;
        return magmaVersion.downloadUrl;
    }
}
