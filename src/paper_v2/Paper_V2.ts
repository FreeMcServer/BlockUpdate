import axios from "axios";
import Version from "../Version";
import Variant from "../variant/Variant";
import Utils from "../Utils";

export default class Paper_V2 extends Variant {
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

        const isSnapshot = Utils.isSnapshot(versionName);
        const ref = `paper-${versionName}-${latestBuild}`;
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