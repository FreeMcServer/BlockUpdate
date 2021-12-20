/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

class WaterfallVersion {
    public version: string;
    public snapshot: boolean;
    public build: number;
    public ref: string;
    public javaVersions: Array<number>;

    constructor(version: string, snapshot: boolean, build: number, javaVersions: Array<number>, ref: string) {
        this.version = version;
        this.snapshot = snapshot;
        this.build = build;
        this.ref = ref;
        this.javaVersions = javaVersions;
    }
}

export default WaterfallVersion;
