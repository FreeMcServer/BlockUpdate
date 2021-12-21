/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

export default interface SpigotVersionJson {
    name: string;
    description: string;
    information?: string;
    warning?: string;
    refs: Refs;
    toolsVersion?: number;
    javaVersions?: number[];
}

export interface Refs {
    BuildData: string;
    Bukkit: string;
    CraftBukkit: string;
    Spigot: string;
}