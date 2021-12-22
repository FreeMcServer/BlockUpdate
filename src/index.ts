/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import * as fs from "fs";
import Purpur from "./purpur/Purpur";
import Spigot from "./spigot/Spigot";
import Paper from "./paper/Paper";
import Utils from "./Utils";
import Waterfall from "./waterfall/Waterfall";

console.log("<BlockUpdate>  Copyright (C) 2021  FreeMCServer");

if (Utils.isDebug()) {
    console.log("Debug mode, not building. Please note that jars are not real, and are simply for testing.");
}

async function start() {
    if (!fs.existsSync("./out")) {
        fs.mkdirSync("./out");
    }

    const spigot = new Spigot();
    await spigot.run();

    const paper = new Paper();
    await paper.init();

    const waterfall = new Waterfall();
    await waterfall.init();

    const purpur = new Purpur();
    await purpur.init();

    if (process.env.DISCORD_WEBHOOK_ENABLE == 'true') {
        // Send pending messages
        Utils.discord.send();
    }

    console.log("Done!");
}

start();
