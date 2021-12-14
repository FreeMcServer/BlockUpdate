import * as fs from "fs";
import Spigot from "./spigot/spigot";

function start() {
    if (!fs.existsSync("./out")) {
        fs.mkdirSync("./out");
    }

    let spigot = new Spigot();

}

start();
console.log('Finished, ready to upload!')

// let versions = ['1.17.1'];
// for (let i = 0; i < versions.length; i++) {
//     let version = versions[i];
//     exec('java -jar ./buildtools/BuildTools.jar --rev '+version, (err, stdout, stderr) => {
//         // your callback
//         console.log(stdout);
//         console.log('READY for '+version);
//     });
// }
