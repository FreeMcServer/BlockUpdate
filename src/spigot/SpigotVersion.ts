/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

class SpigotVersion {
    public version: string;
    public snapshot: boolean;
    public spigotBuild: number;
    public ref: string;
    public javaVersions: Array<number>;

    constructor(version: string, snapshot: boolean, spigotBuild: string, javaVersions: Array<number>, ref: string) {
        this.version = version;
        this.snapshot = snapshot;
        this.spigotBuild = Number.parseInt(spigotBuild);
        this.ref = ref;
        this.javaVersions = javaVersions;
    }
}

export default SpigotVersion;
