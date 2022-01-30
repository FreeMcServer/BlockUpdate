/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import * as fs from "fs";
import axios from "axios";
import Utils from "../Utils";

export default class BuildTools {
    private getBuildToolsVersion(): number {
        let exists: boolean = fs.existsSync(`/root/app/out/buildtools/.version`);
        if (exists) {
            return Number.parseInt(fs.readFileSync(`/root/app/out/buildtools/.version`, "utf8"));
        } else {
            return 0;
        }
    }

    public async update(): Promise<void> {
        const response = await axios.get("https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/api/json");

        const currentVersion = this.getBuildToolsVersion();
        const latestVersion = Number.parseInt(response.data.id);

        if (latestVersion <= currentVersion) {
            console.log("BuildTools is up to date");
        } else {
            console.log("BuildTools is outdated, updating...");
            await this.downloadBuildTools(latestVersion);
        }
    }

    private async downloadBuildTools(version: number): Promise<void> {
        const buildToolsPath = `/root/app/out/buildtools/BuildTools.jar`;
        const buildToolsDir = `/root/app/out/buildtools`;

        if (!fs.existsSync(buildToolsDir)) {
            fs.mkdirSync(buildToolsDir);
        }

        if (fs.existsSync(buildToolsPath)) {
            fs.unlinkSync(buildToolsPath);
        }

        await Utils.downloadFile(`https://hub.spigotmc.org/jenkins/job/BuildTools/${version}/artifact/target/BuildTools.jar`, buildToolsPath);
        fs.writeFileSync("/root/app/out/buildtools/.version", version.toString());
        console.log("BuildTools downloaded");
    }
}