import { MessageBuilder, Webhook } from "discord-webhook-node";
import DiscordNotification from "./DiscordNotification";

export default class Discord {
    private pendingMessages: DiscordNotification[] = [];

    addPendingNotification(notification: DiscordNotification) {
        this.pendingMessages.push(notification);
    }

    hasPendingMessages(): boolean {
        return this.pendingMessages.length > 0;
    }

    /**
     * Send all pending discord notifications.
     */
    async send() {
        const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL ?? '');

        for (const message of this.pendingMessages) {
            const embed = new MessageBuilder()
                .setTitle(message.title)
                .setColor(0x27ff00)
                .setDescription(message.message)
                .setTimestamp();

            try {
                await hook.send(embed);
            } catch(e) {
                console.error(e);
            }
        }
        this.pendingMessages = [];
    }

    /**
     * Send all pending messages to the console.
     */
    sendToConsole() {
        for (const message of this.pendingMessages) {
            console.log("--- " + message.title + " ---");
            console.log(message.message);
            console.log("------");
        }
    }
}