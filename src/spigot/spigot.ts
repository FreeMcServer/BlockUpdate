import BuildTools from "./buildtools";
import * as fs from "fs";
import axios from "axios";

class Spigot {
    private bt: BuildTools;
    public versions: Array<string>;

    constructor() {
        this.bt = new BuildTools();
        this.versions = Spigot.getLocalVersions();
        this.updateVersions()

    }

    private updateVersions() {
        axios.get("https://hub.spigotmc.org/versions/").then(res => {
            let versions = res.data.split("\n");
            let newVersions = versions.filter((v: any) => !this.versions.includes(v));
            if (newVersions.length > 0) {
                this.versions = this.versions.concat(newVersions);
                this.versions.sort();
                this.versions.reverse();
                this.versions = this.versions.slice(0, 10);
                //fs.writeFileSync("./versions.json", JSON.stringify(this.versions));
                console.log(JSON.stringify(this.versions));
            }
        });
    }

    private static getLocalVersions(): Array<string> {
        let exists = fs.existsSync('out/spigot/versions.json');

        if (exists) {
            let versions = fs.readFileSync('out/spigot/versions.json', 'utf8');
            return JSON.parse(versions);
        } else {
            return [];
        }
    }

}
export default Spigot;
