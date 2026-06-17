import axios from "axios";
import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";

import { WebsiteModel } from "../mongoDB/database";

const CheckLogSchema = new mongoose.Schema({
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Website",
        required: true,
    },
    status: {
        type: String,
        enum: ["UP", "DOWN"],
        required: true,
    },
    checkedAt: {
        type: Date,
        default: Date.now,
    },
    responseTime: Number,
});

export const CheckLogModel =
    mongoose.model("CheckLog", CheckLogSchema);


async function checkResponseTime(url: string) {
    const start = performance.now();

    try {
        const response = await axios.get(url, {
            timeout: 5000,
        });

        const end = performance.now();

        return {
            status: "UP",
            responseTime: Math.round(end - start),
        };
    } catch {
        const end = performance.now();

        return {
            status: "DOWN",
            responseTime: Math.round(end - start),
        };
    }
}

export async function checkAllWebsites(bot: TelegramBot) {
    const websites = await WebsiteModel.find();

    for (const site of websites) {
        const result = await checkResponseTime(site.url);

        // Save monitoring log
        await CheckLogModel.create({
            websiteId: site._id,
            status: result.status,
            responseTime: result.responseTime,
        });
        console.log("Log saved");
        // Send alert only if it changed from UP → DOWN
        if (result.status === "DOWN" && !site.isDown) {
            await bot.sendMessage(
                site.chatId,
                `🚨 ALERT!\n\n${site.url} is DOWN.`
            );
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