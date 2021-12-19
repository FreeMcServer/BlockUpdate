/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

class PurpurVersion {
    public version: string;
    public snapshot: boolean;
    public build: number;
    public ref: string;
    public javaVersions: Array<number>;

    constructor(version: string, snapshot: boolean, build: string, javaVersions: Array<number>, ref: string) {
        this.version = version;
        this.snapshot = snapshot;
        this.build = Number.parseInt(build);
        this.ref = ref;
        this.javaVersions = javaVersions;
    }
}

export default PurpurVersion;
