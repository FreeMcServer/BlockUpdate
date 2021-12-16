import * as fs from "fs";
import Paper from "./spigot/paper";
import Spigot from "./spigot/spigot";

async function start() {
    if (!fs.existsSync("./out")) {
        fs.mkdirSync("./out");
    }

    let spigot = new Spigot();
    await spigot.init();

    let paper = new Paper();
    await paper.init();

    console.log("Done!");
}

// console.log(execSync("update-alternatives --display java").toString());
// console.log(execSync("ls /usr/lib/jvm/").toString());
start();

// let versions = ['1.17.1'];
// for (let i = 0; i < versions.length; i++) {
//     let version = versions[i];
//     exec('java -jar ./buildtools/BuildTools.jar --rev '+version, (err, stdout, stderr) => {
//         // your callback
//         console.log(stdout);
//         console.log('READY for '+version);
//     });
// }
