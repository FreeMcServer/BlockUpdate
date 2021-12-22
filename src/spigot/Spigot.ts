/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import BuildTools from "./BuildTools";
import * as fs from "fs";
import axios from "axios";
import Utils from "../Utils";
import Version from "../Version";
import { execSync } from "child_process";
import S3Uploader from "../s3/S3Uploader";
import DiscordNotification from "../discord/DiscordNotification";
import SpigotVersionJson from "./SpigotVersionJson";
import Variant from "../variant/Variant";
import CraftBukkit from "./CraftBukkit";

interface SpigotLocalVersions {
    spigot: Version[];
    craftbukkit: Version[];
}

/**
 * Version updater for Spigot and CraftBukkit.
 */
export default class Spigot extends Variant {
    private craftBukkit: CraftBukkit;

    constructor() {
        super("spigot", "Spigot");

        this.craftBukkit = new CraftBukkit();
    }

    public async getLatestVersions(): Promise<string[]> {
        // Get versions by reading the html.
        // Versions will have the following format:
        //
        // <a href="1.8.json">1.8.json</a>
        //
        // There are also builds so they have to be filtered out by
        // only finding versions that start with "1.".
        //
        const res = await axios.get("https://hub.spigotmc.org/versions/");
        const data = res.data as string;
        const latestVersions = data.split("\n")
            .filter(line => line.startsWith('<a href="1.'))
            .map(line => line.split('"')[1])
            .map(line => line.replace('.json', ''))
            .sort(Utils.sortVersions);

        return latestVersions;
    }

    public async getLatestBuild(versionName: string): Promise<Version> {
        const res = await axios.get("https://hub.spigotmc.org/versions/" + versionName + ".json");
        const json = res.data as SpigotVersionJson;

        // Find Java version
        let javaVersionName: string;
        let javaVersions: number[];
        if (!json.javaVersions) {
            // Default to Java 8 if nothing is specified.
            javaVersions = [52];
            javaVersionName = "8";
        } else {
            javaVersions = json.javaVersions;
            const minJavaVersion = Utils.getLowestNumber(javaVersions);
            javaVersionName = Utils.getJavaVersion(minJavaVersion);
        }

        const isSnapshot = Utils.isSnapshot(versionName);
        const build = Number.parseInt(json.name);
        return new Version(versionName, isSnapshot, build, json.refs.Spigot, javaVersions);
    }

    public isUpToDate(localVersion: Version, remoteVersion: Version): boolean {
        return localVersion.version == remoteVersion.version
        && localVersion.ref == remoteVersion.ref;
    }

    public usesDownload(): boolean {
        return false;
    }

    public getDownloadLink(version: Version): string {
        throw new Error("Method not implemented.");
    }

    public async downloadVersion(version: Version): Promise<void> {
        // Create tmp dir
        if (!fs.existsSync(Utils.ROOT + 'tmp')) {
            fs.mkdirSync(Utils.ROOT + 'tmp');
            console.log("Created tmp dir");
        }

        // Create spigot dir
        const spigotDir = this.variantPath + version.version + "/";
        if (!fs.existsSync(spigotDir)) {
            fs.mkdirSync(spigotDir);
        }

        // Create craftbukkit dir
        const craftbukkitDir = this.craftBukkit.variantPath + version.version + "/";
        if (!fs.existsSync(craftbukkitDir)) {
            fs.mkdirSync(craftbukkitDir);
        }

        const tmpDir = fs.mkdtempSync(Utils.ROOT + 'tmp/', 'utf-8');
        const javaVersionName = Utils.getJavaVersion(version.javaVersions[0]);

        try {
            // Run BuildTools to build the jar
            await execSync(`cd ${tmpDir} ` +
                `&& /usr/lib/jvm/java-${javaVersionName}-openjdk-amd64/bin/java ` +
                    '-jar /root/app/out/buildtools/BuildTools.jar ' +
                    `--rev ${version.version} ` +
                    `--output-dir ${spigotDir} ` +
                '&& rm -rf ' + tmpDir,
                { stdio: 'ignore' });

            const craftBukkitJar = spigotDir + 'craftbukkit-' + version.version + '.jar';
            if (fs.existsSync(craftBukkitJar)) {
                fs.cpSync(craftBukkitJar, this.craftBukkit.variantPath + version.version + '/craftbukkit-' + version.version + '.jar');
            }

            this.hasChanged = true;
        } catch (e) {
            console.error(e);
            console.error("BuildTools failed to build " + version.version);
            const buildToolsLog = await execSync('cd ' + tmpDir + ' tail -n 20 /root/app/out/buildtools/BuildTools.log.txt');
            console.error(buildToolsLog.toString());
        }
    }






//
// OLD CODE
//








    public spigotVersions?: Version[];
    public craftBukkitVersions?: Version[];
    private buildTools?: BuildTools;
    private hasChanged = false;

    private async getLocalVersions(): Promise<SpigotLocalVersions> {
        let spigotVersions: Version[] = [];
        let craftBukkitVersions: Version[] = [];

        if (fs.existsSync('/root/app/out/spigot/versions.json')) {
            spigotVersions = JSON.parse(fs.readFileSync('/root/app/out/spigot/versions.json', 'utf8'));
        } else {
            // If no local spigot versions exist and S3 uploading is enabled...
            if (process.env.S3_UPLOAD === "true") {
                // ... fetch the versions from S3
                let rx = await axios.get(process.env.S3_PULL_BASE + '/spigot/versions.json');
                fs.writeFileSync('/root/app/out/spigot/versions.json', JSON.stringify(rx.data));
                spigotVersions = JSON.parse(fs.readFileSync('/root/app/out/spigot/versions.json', 'utf8'));

                console.log('Updated spigot versions from remote server');
            }
        }

        if (fs.existsSync('/root/app/out/craftbukkit/versions.json')) {
            craftBukkitVersions = JSON.parse(fs.readFileSync('/root/app/out/craftbukkit/versions.json', 'utf8'));
        }

        return {
            spigot: spigotVersions,
            craftbukkit: craftBukkitVersions
        };
    }

    /**
     * Run the updator. Checks for updates and updates jars and metadata if necesary.
     */
    public async run() {
        // Create directories
        if (!fs.existsSync("/root/app/out/spigot")) {
            fs.mkdirSync("/root/app/out/spigot");
        }
        if (!fs.existsSync("/root/app/out/craftbukkit")) {
            fs.mkdirSync("/root/app/out/craftbukkit");
        }

        // Ensure BuildTools is up to date.
        this.buildTools = new BuildTools();
        await this.buildTools.update();

        const versions = await this.getLocalVersions();
        this.spigotVersions = versions.spigot;
        this.craftBukkitVersions = versions.craftbukkit;

        await this.updateVersions();
        console.log("Spigot and Craftbukkit versions updated");
    }

    private async updateVersions() {
        // Get versions by reading the html.
        // Versions will have the following format:
        //
        // <a href="1.8.json">1.8.json</a>
        //
        // There are also builds so they have to be filtered out by
        // only finding versions that start with "1.".
        //
        const res = await axios.get("https://hub.spigotmc.org/versions/");
        const data = res.data as string;
        const latestVersions = data.split("\n")
            .filter(line => line.startsWith('<a href="1.'))
            .map(line => line.split('"')[1])
            .map(line => line.replace('.json', ''))
            .sort(Utils.sortVersions);

        // Loop trough all versions...
        for (const versionName of latestVersions) {
            // ... and ensure they are up to date.
            const res = await axios.get("https://hub.spigotmc.org/versions/" + versionName + ".json");
            const json = res.data as SpigotVersionJson;
            const spigotDir = "/root/app/out/spigot/" + versionName + "/";
            if (!fs.existsSync(spigotDir)) {
                fs.mkdirSync(spigotDir);
            }

            const buildLabelPath = '/root/app/out/spigot/' + versionName + '/build.txt';
            if (fs.existsSync(buildLabelPath)) {
                fs.unlinkSync(buildLabelPath);
            }

            fs.writeFileSync(buildLabelPath, json.refs.Spigot);

            // Check if the hash is up to date with the local version
            if (!this.spigotVersions!.find(v => v.version == versionName && v.ref === json.refs.Spigot)) {
                // If not, it needs to be updated.

                // Remove the current version being updated as an updated version will later
                // be pushed to the array.
                this.spigotVersions = this.spigotVersions!.filter(v => v.version !== versionName);

                Utils.discord.addPendingNotification(new DiscordNotification(`Spigot ${versionName} updated!`, `Spigot ${versionName} updated to build \`${json.refs.Spigot}\`!`));

                // Find Java version
                let javaVersionName: string;
                let javaVersions: number[];
                if (!json.javaVersions) {
                    // Default to Java 8 if nothing is specified.
                    javaVersions = [52];
                    javaVersionName = "8";
                } else {
                    javaVersions = json.javaVersions;
                    let highestJavaVersion = -1;
                    for (const javaVersion of javaVersions) {
                        if (javaVersion > highestJavaVersion) {
                            highestJavaVersion = javaVersion;
                        }
                    }
                    javaVersionName = Utils.getJavaVersion(highestJavaVersion);
                }

                // Create tmp dir
                if (!fs.existsSync('/root/app/tmp')) {
                    fs.mkdirSync('/root/app/tmp');
                    console.log("Created tmp dir");
                }

                // Create spigot dir
                const spigotDir = "/root/app/out/spigot/" + versionName + "/";
                if (!fs.existsSync(spigotDir)) {
                    fs.mkdirSync(spigotDir);
                }

                // Create craftbukkit dit
                const craftbukkitDir = "/root/app/out/craftbukkit/" + versionName + "/";
                if (!fs.existsSync(craftbukkitDir)) {
                    fs.mkdirSync(craftbukkitDir);
                }

                console.log("Updating Spigot version: " + versionName);

                const tmpDir = fs.mkdtempSync('/root/app/tmp/', 'utf-8');

                // if debug mode, don't download, otherwise do.
                if (Utils.isDebug()) {
                    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
                    fs.writeFileSync(spigotDir + "spigot-" + versionName + ".jar", 'This is not a real JAR, don\'t use it for anything.');
                    fs.writeFileSync(craftbukkitDir + "craftbukkit-" + versionName + ".jar", 'This is not a real JAR, don\'t use it for anything.');
                } else {
                    try {
                        // Run BuildTools to build the jar
                        await execSync(`cd ${tmpDir} ` +
                            `&& /usr/lib/jvm/java-${javaVersionName}-openjdk-amd64/bin/java ` +
                                '-jar /root/app/out/buildtools/BuildTools.jar ' +
                                `--rev ${versionName} ` +
                                `--output-dir ${spigotDir} ` +
                            '&& rm -rf ' + tmpDir,
                            { stdio: 'ignore' });

                        if (fs.existsSync(spigotDir + 'craftbukkit-' + versionName + '.jar')) {
                            fs.cpSync(spigotDir + 'craftbukkit-' + versionName + '.jar', '/root/app/out/craftbukkit/craftbukkit-' + versionName + '.jar');
                        }

                        this.hasChanged = true;
                    } catch (e) {
                        console.error(e);
                        console.error("BuildTools failed to build " + versionName);
                        const buildToolsLog = await execSync('cd ' + tmpDir + ' tail -n 20 /root/app/out/buildtools/BuildTools.log.txt');
                        console.error(buildToolsLog.toString());
                    }
                }

                const isSnapshot = !Utils.isRelease(versionName);
                const spigotBuild = Number.parseInt(json.name);
                const spigotVersion = new Version(versionName, isSnapshot, spigotBuild, json.refs.Spigot, javaVersions);
                this.spigotVersions!.push(spigotVersion);

                let craftBukkitVersion = new Version(versionName, isSnapshot, spigotBuild, json.refs.CraftBukkit, javaVersions);
                this.craftBukkitVersions!.push(craftBukkitVersion);
            }
        }

        fs.writeFileSync("/root/app/out/spigot/versions.json", JSON.stringify(this.spigotVersions));
        fs.writeFileSync("/root/app/out/craftbukkit/versions.json", JSON.stringify(this.craftBukkitVersions));

        console.log("Spigot and Craftbukkit versions updated");

        if (this.hasChanged) {
            //TODO: Upload craftbukkit too
            console.log("Uploading Spigot");
            let uploader = new S3Uploader();
            await uploader.syncS3Storage('/root/app/out/spigot/', 'jar/spigot');
        }
    }

}