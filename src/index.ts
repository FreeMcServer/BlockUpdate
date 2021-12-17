import * as fs from "fs";
import Purpur from "./purpur/Purpur";
import Spigot from "./spigot/Spigot";
import Paper from "./paper/Paper";
import {MessageBuilder, Webhook} from "discord-webhook-node";
import Utils from "./Utils";

async function start() {
    if (!fs.existsSync("./out")) {
        fs.mkdirSync("./out");
    }

    let spigot = new Spigot();
    await spigot.init();

    let paper = new Paper();
    await paper.init();

    let purpur = new Purpur();
    await purpur.init();

    console.log("Done!");
}


start().then(() => {
    if (process.env.DISCORD_WEBHOOK_ENABLE == 'true') {
        const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL ?? '');
        for (let msg in Utils.pendingMessages) {
            const embed = new MessageBuilder()
                .setTitle('Version Updated')
                .setColor(2621184)
                .setDescription(msg)
                .setTimestamp();
            hook.send(embed).then(r => console.log(r)).catch(e => console.log(e));
        }
    }

    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
