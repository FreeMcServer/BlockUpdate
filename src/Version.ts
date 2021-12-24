/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

export default interface Version {
    /** The game version. */
    version: string;
    /** Whether this version is a snapshot, pre release or release candidate. */
    snapshot: boolean;
    /** The build number for this build. */
    build: number;
    /** The an identifiable reference for for this build. (For example a git hash) */
    ref: string;
    /** A list of compatible java versions. */
    javaVersions: number[];
    /** A hash of the jar file for this build. */
    hash?: Hash;
}

export type HashType = "md5" | "sha256";

export interface Hash {
    type: HashType;
    hash: string;
}