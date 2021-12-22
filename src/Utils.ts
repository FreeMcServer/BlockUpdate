/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import axios from "axios";
import fs from "fs";
import Discord from "./Discord";
import DiscordNotification from "./DiscordNotification";

namespace Utils {
    /**
     * The root directory where all variants are placed. Ends with a slash.
     */
    export const ROOT = "/root/app/";

    export const discord = new Discord();

    // sort minecraft versions TODO: this doesnt work
    export function sortVersions(a: string, b: string): number {
        const aSplit: Array<string> = a.split('.');
        const bSplit: Array<string> = b.split('.');
        for (let i = 0; i < aSplit.length; i++) {
            const aPart = parseInt(aSplit[i], 10);
            const bPart = parseInt(bSplit[i], 10);

            // check for prereleases
            if (aSplit[i].includes('-') && !bSplit[i].includes('-')) {
                return -1;
            } else if (!aSplit[i].includes('-') && bSplit[i].includes('-')) {
                return 1;
            } else if (aSplit[i].includes('-') && bSplit[i].includes('-')) {
                //check if rc
                if (aSplit[i].includes('rc') && !bSplit[i].includes('rc')) {
                    return -1;
                } else if (!aSplit[i].includes('rc') && bSplit[i].includes('rc')) {
                    return 1;
                }


                // compare 2 prereleases/release candidates
                let aNum: number = parseInt(aSplit[i].slice(-1), 10);
                let bNum: number = parseInt(bSplit[i].slice(-1), 10);
                if (aNum > bNum) {
                    return 1;
                } else if (aNum < bNum) {
                    return -1;
                }
            }
            if (aPart > bPart) {
                return 1;
            } else if (aPart < bPart) {
                return -1;
            }
        }
        return 0;
    }

    export function downloadFile(fileUrl: string, destPath: string) {

        if (!fileUrl) return Promise.reject(new Error('Invalid fileUrl'));
        if (!destPath) return Promise.reject(new Error('Invalid destPath'));

        return new Promise<void>(async function (resolve, reject) {
            await axios({
                url: fileUrl,
                method: 'GET',
                responseType: 'stream'
            }).then(function (response) {
                response.data.pipe(fs.createWriteStream(destPath));
                response.data.on('end', function () {
                    console.log('File downloaded to ' + destPath);
                    resolve();
                });
            }).catch(reject);
        });
    }

    // class version to java version
    export function getJavaVersion(classVersion: number): string {
        switch (classVersion) {
            case 46: return '1.2.0';
            case 47: return '1.3.0';
            case 48: return '1.4.0';
            case 49: return '1.5.0';
            case 50: return '1.6.0';
            case 51: return '1.7.0'; // Everything 7 and below doesnt matter.
            case 52: return '8';
            case 53: return '9';
            case 54: return '10';
            case 55: return '11';
            case 56: return '12';
            case 57: return '13';
            case 58: return '14';
            case 59: return '15';
            case 60: return '16';
            case 61: return '17';
            default: return "Unknown Java Version";
        }
    }

    // check if version is release
    export function isRelease(version: string): boolean {
        // If version doesnt incluide a "-" then true, and then if it has any dots in it, then true
        return !version.includes('-') && version.split('.').length > 0;
    }

    export function isSnapshot(version: string): boolean {
        return !Utils.isRelease(version);
    }

    // check if debug mode
    export function isDebug(): boolean {
        return process.env.DEBUG === 'true';
    }

    export function isUsingS3(): boolean {
        return process.env.S3_UPLOAD === 'true';
    }

    export function getS3Endpoint(): string {
        if (isUsingS3()) {
            if (process.env.S3_ENDPOINT) {
                return process.env.S3_ENDPOINT
            } else {
                throw Error("S3 Endpoint is undefined. Please set the S3 endpoint in the '.env' file.")
            }
        } else {
            throw Error("Getting S3 Endpoint without having S3 enabled. Somethings gone wrong...");
        }
    }
}

export default Utils;
