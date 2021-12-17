import * as fs from "fs";
import Purpur from "./purpur/Purpur";
import Spigot from "./spigot/Spigot";
import Paper from "./paper/Paper";

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


start();
