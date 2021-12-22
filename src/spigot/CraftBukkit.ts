import Variant from "../variant/Variant";
import Version from "../Version";

export default class CraftBukkit extends Variant {
    constructor() {
        super("craftbukkit", "CraftBukkit");
    }

    //
    // The CraftBukkit variant is special as all the updating is done trough
    // the Spigot class. Methods are therefore not implemented.
    //
    public getLatestVersions(): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    public getLatestBuild(versionName: string): Promise<Version> {
        throw new Error("Method not implemented.");
    }
    public usesDownload(): boolean {
        throw new Error("Method not implemented.");
    }
    public getDownloadLink(version: Version): string {
        throw new Error("Method not implemented.");
    }
    public async update() {
        throw new Error("CraftBukkit may not be updated on it's own but is rather updated trough Spigot.");
    }
}