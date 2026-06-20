import TelegramBot from "node-telegram-bot-api";
import { WebsiteModel } from "../models/website.model";
import { checkQueue } from "../queue/check.queue";

export async function handleAdd(
    chatId: number,
    url: string,
    bot: TelegramBot,
    options?: {
        email?: string;
        telegramEnabled: boolean;
        emailEnabled: boolean;
    }
) {

    const exists = await WebsiteModel.findOne({
        url,
        chatId,
    });

    if (exists) {
        return bot.sendMessage(
            chatId,
            "⚠️ Already monitoring this website."
        );
    }

    const website = await WebsiteModel.create({
        url,
        chatId,
        email: options?.email,
        telegramEnabled: options?.telegramEnabled ?? true,
        emailEnabled: options?.emailEnabled ?? false,
        isDown: false,
        nextCheck: new Date()
    });

    await checkQueue.add(
        "check-site",
        {
            websiteId: website._id.toString(),
            url: website.url,
        },
        {
            jobId: website._id.toString(),
            repeat: {
                every: 60_000,
            },
        }
    );

    return bot.sendMessage(
        chatId,
        "✅ Website added for monitoring!"
    );
}