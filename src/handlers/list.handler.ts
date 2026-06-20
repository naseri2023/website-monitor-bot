import TelegramBot from "node-telegram-bot-api";
import { WebsiteModel } from "../models/website.model";

export async function handleList(
    chatId: number,
    bot: TelegramBot
) {
    const sites = await WebsiteModel.find({ chatId });

    if (!sites.length) {
        return bot.sendMessage(
            chatId,
            "No websites added yet."
        );
    }

    const list = sites
        .map((site, index) => {
            const status = site.isDown
                ? "🔴 DOWN"
                : "🟢 UP";

            const notification =
                site.telegramEnabled
                    ? "📱 Telegram"
                    : "📧 Email";

            return `${index + 1}. ${site.url}
            ${status}
            ${notification}`;
        })
        .join("\n\n");

    return bot.sendMessage(
        chatId,
        `📋 Your websites:\n\n${list}`
    );
}