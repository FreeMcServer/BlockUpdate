class Version {
    public version: string;
    public snapshot: boolean;
    public preRelease: boolean;
    public releaseCandidate: boolean;
    public spigotBuild: number;
    public ref: string;

    constructor (version: string, snapshot: boolean, preRelease: boolean, releaseCandidate: boolean, spigotBuild: string, ref: string) {
        this.version = version;
        this.snapshot = snapshot;
        this.preRelease = preRelease;
        this.releaseCandidate = releaseCandidate;
        this.spigotBuild = Number.parseInt(spigotBuild);
        this.ref = ref;
    }
}

export default Version;
