/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

export default class Version {
    /** The game version. */
    public readonly version: string;
    /** Whether this version is a snapshot, pre release or release candidate. */
    public readonly snapshot: boolean;
    /** The build number for this build. */
    public readonly build: number;
    /** The git hash for this build. */
    public readonly ref: string;
    /** A list of compatible java versions. */
    public readonly javaVersions: number[];

    constructor(version: string, snapshot: boolean, build: number, ref: string, javaVersions: number[]) {
        this.version = version;
        this.snapshot = snapshot;
        this.build = build;
        this.ref = ref;
        this.javaVersions = javaVersions;
    }
}