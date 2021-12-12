class Utils {
    // sort minecraft versions TODO: this doesnt work
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

    // class version to java version
    public getJavaVersion(classVersion: number): string {
        let javaMap: { [key:number] : string } = {
            46: '1.2.0',
            47: '1.3.0',
            48: '1.4.0',
            49: '1.5.0',
            50: '1.6.0',
            51: '1.7.0',
            52: '1.8.0',
            53: '9.0.4',
            54: '10',
            55: '11',
            56: '12',
            57: '13',
            58: '14',
            59: '15',
            60: '16',
            61: '17',
        };
        return javaMap[classVersion];
    }

    // check if version is release
    public isRelease(version: string): boolean {
        return !version.includes('-') || version.split('.').length !== 0;
    }
}

export default Utils;
