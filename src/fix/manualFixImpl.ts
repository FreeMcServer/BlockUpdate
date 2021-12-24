export type Variant = "paper" | "purpur" | "spigot" | "waterfall";

export interface Rerun {
    variant: Variant;
    version: string;
}

const reruns: Rerun[] = [];

export function rerun(variant: Variant, version: string) {
    reruns.push({
        variant,
        version
    });
}

export function getReruns(): Rerun[] {
    return reruns;
}

export function shouldManuallyRerun(variant: string, version: string) {
    for (const rerun of reruns) {
        if (rerun.variant == variant && rerun.version == version) {
            return true;
        }
    }
    return false;
}