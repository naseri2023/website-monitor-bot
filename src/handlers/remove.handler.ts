import TelegramBot from "node-telegram-bot-api";
import { WebsiteModel } from "../models/website.model";
import { checkQueue } from "../queue/check.queue";

export async function handleRemove(
    chatId: number,
    url: string,
    bot: TelegramBot
) {
    try {
        const deleted =
            await WebsiteModel.findOneAndDelete({
                url,
                chatId,
            });

        if (!deleted) {
            return bot.sendMessage(
                chatId,
                "⚠️ Website not found."
            );
        }

        const job = await checkQueue.getJob(
            deleted._id.toString()
        );

        if (job) {
            await job.remove();
        }

        return bot.sendMessage(
            chatId,
            "🗑️ Website removed successfully!"
        );

    } catch (error) {
        console.error(error);

        return bot.sendMessage(
            chatId,
            "❌ Failed to remove website."
        );
    }
}