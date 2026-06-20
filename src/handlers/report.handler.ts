import TelegramBot from "node-telegram-bot-api";
import { WebsiteModel } from "../models/website.model";
import { CheckLogModel } from "../models/checkLog.model";

export async function handleReport(
    chatId: number,
    url: string,
    bot: TelegramBot
) {
    const site = await WebsiteModel.findOne({
        url,
        chatId,
    });

    if (!site) {
        return bot.sendMessage(
            chatId,
            "⚠️ Website not found."
        );
    }

    const logs =
        await CheckLogModel.find({
            websiteId: site._id,
        },{
            status: 1,
            checkedAt: 1,
            responseTime: 1,
        });

    if (!logs.length) {
        return bot.sendMessage(
            chatId,
            "📭 No monitoring logs found."
        );
    }

    const report = logs
        .map((log) => {
            const date = new Date(
                log.checkedAt
            ).toLocaleString();

            return (
                `${log.status === "UP" ? "✅" : "❌"} ` +
                `${log.status} | ` +
                `${log.responseTime ?? 0} ms | ` +
                `${date}`
            );
        })
        .join("\n");

    return bot.sendMessage(
        chatId,
        `📊 Logs for ${site.url}\n\n${report}`
    );
}