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
import SpigotVersionJson from "./SpigotVersionJson";
import Variant from "../variant/Variant";

interface SpigotLocalVersions {
    spigot: Version[];
    craftbukkit: Version[];
}

/**
 * Version updater for Spigot and CraftBukkit.
 */
export default class Spigot extends Variant {
    constructor() {
        super("spigot", "Spigot");
    }

    public async update() {
        // Ensure buildtools is up to date before updating the variant
        const buildTools = new BuildTools();
        await buildTools.update();

        // Update variant
        await super.update();
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
        return {
            version: versionName,
            snapshot: isSnapshot,
            build: build,
            ref: json.refs.Spigot,
            javaVersions: javaVersions
        };
    }

    public isUpToDate(localVersion: Version, remoteVersion: Version): boolean {
        return localVersion.version == remoteVersion.version
        && localVersion.ref == remoteVersion.ref;
    }

    public usesDownload(): boolean {
        return false;
    }

    public getDownloadLink(version: Version): string {
        // Spigot uses buildtools instead of downloads via a URL
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

        const tmpDir = fs.mkdtempSync(Utils.ROOT + 'tmp/', 'utf-8');
        const javaVersionName = Utils.getJavaVersion(version.javaVersions[0]);

        console.log("Running BuildTools for Spigot version " + version.version + ". This might take a while.");

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
                fs.unlinkSync(craftBukkitJar);
            }

            this.hasChanges = true;
        } catch (e) {
            console.error(e);
            console.error("BuildTools failed to build " + version.version);
            const buildToolsLog = await execSync('cd ' + tmpDir + ' tail -n 20 /root/app/out/buildtools/BuildTools.log.txt');
            console.error(buildToolsLog.toString());
        }
    }
}