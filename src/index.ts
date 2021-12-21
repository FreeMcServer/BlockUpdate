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

console.log("<BlockUpdate>  Copyright (C) 2021  FreeMCServer");

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
        const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL ?? '');

        for (const message of Utils.pendingMessages) {
            const embed = new MessageBuilder()
                .setTitle(message.title)
                .setColor(0x27ff00)
                .setDescription(message.message)
                .setTimestamp();

            try {
                await hook.send(embed);
            } catch(e) {
                console.error(e);
            }
        }
    }

    console.log("Done!");
}

start();