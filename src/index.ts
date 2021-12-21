/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

import * as fs from "fs";
import Purpur from "./purpur/Purpur";
import Spigot from "./spigot/Spigot";
import Paper from "./paper/Paper";
import { MessageBuilder, Webhook } from "discord-webhook-node";
import Utils from "./Utils";
import Waterfall from "./waterfall/Waterfall";
console.log("<BlockUpdate>  Copyright (C) 2021  FreeMCServer")

async function start() {

    if (!fs.existsSync("./out")) {
        fs.mkdirSync("./out");
    }

    let spigot = new Spigot();
    await spigot.init();

    let paper = new Paper();
    await paper.init();

    let waterfall = new Waterfall();
    await waterfall.init();

    let purpur = new Purpur();
    await purpur.init();
    if (process.env.DISCORD_WEBHOOK_ENABLE == 'true') {
        const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL ?? '');
        for (let msg in Utils.pendingMessages) {
            const n = Utils.pendingMessages[msg];
            const embed = new MessageBuilder()
                .setTitle(n.title)
                .setColor(2621184)
                .setDescription(n.message)
                .setTimestamp();
            hook.send(embed).then(r => console.log(r)).catch(e => console.log(e));
        }
    }
    console.log("Done!");
}


start();
