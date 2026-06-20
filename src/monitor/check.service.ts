import TelegramBot from "node-telegram-bot-api";
import {WebsiteModel} from "../models/website.model";
import {CheckLogModel} from "../models/checkLog.model";
import {checkResponseTime} from "./monitor.service";
import {sendEmail} from "../services/email.service";

export async function checkAllWebsites(bot: TelegramBot) {
    const websites = await WebsiteModel.find();

    for (const site of websites) {
        const result = await checkResponseTime(site.url);

        await CheckLogModel.create({
            websiteId: site._id,
            status: result.status,
            responseTime: result.responseTime,
        });

        if (result.status === "DOWN" && !site.isDown) {

            if (site.telegramEnabled) {
                await bot.sendMessage(
                    site.chatId,
                    `🚨 ${site.url} is DOWN`
                );
            }

            if (site.emailEnabled && site.email) {
                try {
                    await sendEmail(
                        site.email,
                        "Website Down",
                        `${site.url} is DOWN`
                    );
                } catch (error) {
                    console.error("Email failed:", error);
                }
            }
        }

        // Update current status
        await WebsiteModel.updateOne(
            { _id: site._id },
            {
                isDown: result.status === "DOWN",
            }
        );

        console.log(
            `${site.url} → ${result.status} (${result.responseTime} ms)`
        );
    }
}