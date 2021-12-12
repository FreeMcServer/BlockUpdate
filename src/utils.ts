class Utils {
    // sort minecraft versions
    public static sortVersions(a: string, b: string): number {
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
}

export default Utils;
