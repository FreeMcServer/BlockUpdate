/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import * as fs from "fs";
import Purpur from "./purpur/Purpur";
import Spigot from "./spigot/Spigot";
import Paper from "./paper/Paper";
import Mohist from "./mohist/Mohist";
import Magma from "./magma/Magma";
import Utils from "./Utils";
import Waterfall from "./waterfall/Waterfall";
import { getReruns } from "./fix/manualFixImpl";
import "./ManualFix";

console.log("<BlockUpdate>  Copyright (C) 2021  FreeMCServer");

if (Utils.isDebug()) {
    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
}

async function start() {
    if (!fs.existsSync("./out")) {
        fs.mkdirSync("./out");
    }

    const paper = new Paper();
    await paper.update();

    const waterfall = new Waterfall();
    await waterfall.update();

    const purpur = new Purpur();
    await purpur.update();

    const spigot = new Spigot();
    await spigot.update();

    const mohist = new Mohist();
    await mohist.update();

    const magma = new Magma();
    await magma.update();

    if (process.env.DISCORD_WEBHOOK_ENABLE == 'true' && Utils.discord.hasPendingMessages()) {
        if (getReruns().length > 0) {
            console.log("Manual reruns have ran, skipping to send discord notifications.");
            console.log("The following messages were skipped:");
            Utils.discord.sendToConsole();
        } else {
            // Send pending messages
            Utils.discord.send();
        }
    }

    console.log("Done!");
}

start();
