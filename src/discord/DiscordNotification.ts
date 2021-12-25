/*
 * BlockUpdate
 * Copyright (c) 2021. FreeMCServer
 */

export default class DiscordNotification {
    public readonly title: string;
    public readonly message: string;

    constructor(title: string, message: string) {
        this.title = title;
        this.message = message;
    }
}