/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import axios, { AxiosError } from "axios";
import { createHash } from "crypto";
import * as fs from "fs";
import DiscordNotification from "../discord/DiscordNotification";
import { shouldManuallyRerun } from "../fix/manualFixImpl";
import S3Uploader from "../s3/S3Uploader";
import Utils from "../Utils";
import Version from "../Version";

/**
 * A generic class for all variants.
 */
export default abstract class Variant {
    /**
     * An id for this variant. Directories will be named after this.
     * 
     * Ex: paper.
     * */
    public readonly id: string;

    /**
     * A name for the variant.
     * 
     * Ex: Paper.
     */
    public readonly name: string;

    /**
     * All versions already downloaded locally.
     */
    public localVersions: Version[];

    /**
     * Path to the directory of this variant. Ends with a slash.
     */
    public readonly variantPath: string;

    /**
     * Path to the versions.json file for this variant.
     */
    public readonly versionsJsonPath: string;

    /**
     * Whether local versions have been updated.
     */
    public hasChanges = false;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.localVersions = [];

        // Paths
        this.variantPath = Utils.ROOT + `out/${this.id}/`;
        this.versionsJsonPath = this.variantPath + `versions.json`;
    }

    /**
     * Create directories if they don't exist.
     */
    public mkdir() {
        if (!fs.existsSync(this.variantPath)) {
            fs.mkdirSync(this.variantPath);
        }
    }

    /**
     * Get all versions already downloaded locally.
     * 
     * @returns The array of versions.
     */
    public async getLocalVersions(): Promise<Version[]> {
        let versions: Version[] = [];

        if (fs.existsSync(this.versionsJsonPath)) {
            versions = JSON.parse(fs.readFileSync(this.versionsJsonPath, 'utf8'));
        } else {
            // If no local versions exist and S3 uploading is enabled...
            if (process.env.S3_UPLOAD === "true") {
                // ... fetch the versions from S3
                try {
                    let res = await axios.get(`${process.env.S3_PULL_BASE}/${this.id}/versions.json`);
                    fs.writeFileSync(this.versionsJsonPath, JSON.stringify(res.data));
                    versions = res.data as Version[];

                    console.log('Updated '+ this.name +' versions from remote server');
                } catch(e) {
                    const error = e as AxiosError;
                    if (error.response && error.response.status == 404) {
                        console.log("No remote versions.json was found on S3 for " + this.id +". Variant init!");
                    } else {
                        // Unknown error
                        throw error;
                    }
                }
            }
        }

        return versions;
    }

    /**
     * Write the local versions to the versions.json file on disk.
     */
    public writeLocalVersions() {
        fs.writeFileSync(this.versionsJsonPath, JSON.stringify(this.localVersions));
    }

    /**
     * Check if the versions are the same, so if the local version is up to date with
     * the remote one.
     * 
     * Will by default compare the version, build and ref.
     * 
     * @param localVersion The local version to compare.
     * @param remoteVersion The remote version to compare.
     * @returns Whether the local version is up to date.
     */
    public isUpToDate(localVersion: Version, remoteVersion: Version): boolean {
        // Check if a manual rerun has been scheduled for this variant and version
        if (shouldManuallyRerun(this.id, localVersion.version)) {
            // In that case, flag the version as out of date so it gets rebuilt.
            console.log(`Manually rerunning ${this.name} ${localVersion.version}.`);
            return false;
        }
        // Check if the version, build and ref are all equal. In that case the local
        // version is up to date with the remote (latest) one.
        return localVersion.version == remoteVersion.version
        && localVersion.build == remoteVersion.build
        && localVersion.ref == remoteVersion.ref;
    }

    /**
     * Get a list of the latest version names.
     */
    public abstract getLatestVersions(): Promise<string[]>;

    /**
     * Get more detailed information about a version name.
     * 
     * @param versionName The version
     */
    public abstract getLatestBuild(versionName: string): Promise<Version>;
    
    /**
     * Whether this variant uses a download link to update variants.
     */
    public abstract usesDownload(): boolean;

    /**
     * Get the link where the version can be downloaded. This should only be used for
     * variants where {@link #usesDownload()} returns true.
     * 
     * @param version The version to get the download link for.
     */
    public abstract getDownloadLink(version: Version): string;

    /**
     * Check for updates and update the outdated local variants.
     */
    public async update() {
        // Setup
        await this.mkdir();
        this.localVersions = await this.getLocalVersions();

        // Get all versions
        const latestVersionNames = await this.getLatestVersions();
        
        // Loop trough all versions
        for (const versionName of latestVersionNames) {
            const latestVersion = await this.getLatestBuild(versionName);
            
            const localVersion = this.localVersions.find(v => v.version === versionName);

            // If the local version doesn't exist (newly released version), or if
            // the local version is outdated.
            if (!localVersion || !this.isUpToDate(localVersion, latestVersion)) {
                // Console notification
                console.log(`Updating ${this.name} ${versionName} to build ${latestVersion.build}`);

                // The version is not up to date and needs to be updated.
                await this.downloadVersion(latestVersion);

                // Write version.json
                this.writeVersionMeta(latestVersion);

                // Remove the old version from local versions (if it exists).
                const index = this.localVersions.findIndex(v => v.version == versionName);
                if (index != -1) {
                    this.localVersions.splice(index, 1);
                }

                // Add the new version
                this.localVersions.push(latestVersion);

                // Local versions have been updated so update hasChanges
                this.hasChanges = true;

                // Add a discord notification
                Utils.discord.addPendingNotification(
                    new DiscordNotification(
                        `${this.name} ${versionName} updated!`,
                        `${this.name} ${versionName} updated to build ${latestVersion.build}`
                    )
                );
            }
        }

        await this.writeLocalVersions();

        // Upload to S3
        if (Utils.isUsingS3()) {
            this.uploadChanges();
        }

        console.log(`${this.name} versions updated.`);
    }

    /**
     * Downloads the version jar and validates that it has the correct checksum hash
     * if the version provides a hash.
     * 
     * @param version The version to download.
     */
    public async downloadVersion(version: Version) {
        const dir = this.variantPath + version.version;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const path = `${dir}/${this.id}-${version.version}.jar`;
        if (Utils.isDebug()) {
            fs.writeFileSync(path, "This is not a real JAR, don't use it for anything.");
        } else {
            let attempts = 0;
            while (attempts < 3) {
                attempts++;

                // Download
                await this.downloadVersionJar(version, path);

                // Validate hash
                if (version.hash) {
                    const hasher = createHash(version.hash.type);
                    hasher.setEncoding("hex");
                    hasher.write(fs.readFileSync(path));
                    hasher.end();
                    const foundHash = hasher.read();
                    const expectedHash = version.hash.hash;
                    if (foundHash == expectedHash) {
                        console.log(`${this.name} ${version.version} updated successfully. (Hash matches)`);
                        break; // stop while loop
                    } else {
                        console.warn(`Failed to update ${this.name} ${version.version}. Expected the ${version.hash.type} hash to be ${expectedHash} but found ${foundHash}. Attempt ${attempts}/3`);
                        fs.unlinkSync(path);
                    }
                } else {
                    console.log(`${this.name} ${version.version} updated.`);
                    break; // stop while loop
                }
            }
            if (attempts > 3) {
                // Crash the application
                throw new Error(`Failed to download ${this.name} ${version.version} after three attempts.`);
            }
        }
    }

    /**
     * Download the version jar.
     * 
     * @param version The version to download.
     */
    public async downloadVersionJar(version: Version, path: string) {
        if (this.usesDownload()) {
            await Utils.downloadFile(this.getDownloadLink(version), path);
        } else {
            throw new Error("Variant with id "+ this.id + " does not use downloads but has not overriden downloadVersionJar");
        }
    }

    /**
     * Write the version.json and build.txt for the version.
     * 
     * @param version The version.
     */
    public writeVersionMeta(version: Version) {
        fs.writeFileSync(this.variantPath + version.version + "/version.json", JSON.stringify(version));
        fs.writeFileSync(this.variantPath + version.version + "/build.txt", version.ref);
    }

    /**
     * Upload changed files to S3. This should only be called if S3 is enabled and
     * {@link Utils.isUsingS3()} returns true.
     */
    public async uploadChanges() {
        if (this.hasChanges) {
            console.log("Uploading " + this.name);
            let uploader = new S3Uploader();
            await uploader.syncS3Storage(this.variantPath, 'jar/' + this.id);
        }
    }
}
