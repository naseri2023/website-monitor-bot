import dotenv from "dotenv";
import path from "path";
import TelegramBot from "node-telegram-bot-api";

import { connectDB } from "./src/db/connect";
import { handleRemove } from "./src/handlers/remove.handler";
import { handleReport } from "./src/handlers/report.handler";
import { handleList } from "./src/handlers/list.handler";

import { userState } from "./src/state/userState";
import { normalizeUrl } from "./src/utils/normalizeUrl";
import { setStateTimeout } from "./src/state/stateTimeout";
import { WebsiteModel } from "./src/models/website.model";
import { sendEmail } from "./src/services/email.service";
import { checkWorker } from "./src/queue/check.worker";
import {handleAdd} from "./src/handlers/add.handler";

import cron from "node-cron";
import { scheduleDueWebsites } from "./src/services/schedule.service";

cron.schedule("*/10 * * * * *", async () => {
    await scheduleDueWebsites();
});

dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
});

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN is missing");

const pendingWebsite = new Map<number, string>();

async function start() {

    await connectDB();

    void checkWorker;

    const bot = new TelegramBot(BOT_TOKEN, { polling: true });

    const mainMenu = {
        reply_markup: {
            keyboard: [
                ["➕ Add", "📊 Report"],
                ["❌ Remove", "📋 Lists"],
            ],
            resize_keyboard: true,
        },
    };

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(
            msg.chat.id,
            "👋 Welcome to Website Monitor Bot!\nChoose an option:",
            mainMenu
        );
    });

    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        if (!text) return;

        const state = userState.get(chatId);

        // MENU ACTIONS

        if (text === "➕ Add") {
            userState.set(chatId, "ADDING");

            return bot.sendMessage(chatId, "📎 Send me the website URL");
        }

        if (text === "📋 Lists") {
            return handleList(chatId, bot);
        }

        if (text === "❌ Remove") {
            userState.set(chatId, "REMOVING");
            setStateTimeout(chatId, "REMOVING");

            return bot.sendMessage(chatId, "Send URL to remove ❌");
        }

        if (text === "📊 Report") {
            userState.set(chatId, "REPORTING");
            setStateTimeout(chatId, "REPORTING");

            return bot.sendMessage(chatId, "Send URL for report 📊");
        }

          // EMAIL ACTION

        if (state === "WAITING_EMAIL") {
            const url = pendingWebsite.get(chatId);
            if (!url) return;

            userState.delete(chatId);
            pendingWebsite.delete(chatId);

            await handleAdd(
                chatId,
                url,
                bot,
                {
                    email: text,
                    telegramEnabled: false,
                    emailEnabled: true,
                }
            );

            await sendEmail(
                text,
                "Monitoring Activated",
                `We will monitor: ${url}`
            );

            return bot.sendMessage(chatId, "✅ Added with Email notifications");
        }

        //  TELEGRAM ACTION

        if (text === "📱 Telegram") {
            const url = pendingWebsite.get(chatId);
            if (!url) return;

            pendingWebsite.delete(chatId);
            userState.delete(chatId);

            await handleAdd(
                chatId,
                url,
                bot,
                {
                    telegramEnabled: true,
                    emailEnabled: false,
                }
            );

            return bot.sendMessage(
                chatId,
                "✅ Added with Telegram notifications"
                , {
                    reply_markup: {
                        remove_keyboard: true
                    }
                }
            );
        }

          // EMAIL CHOICE (ask email)

        if (text === "📧 Email") {
            const url = pendingWebsite.get(chatId);
            if (!url) return;

            userState.set(chatId, "WAITING_EMAIL");

            return bot.sendMessage(
                chatId,
                "📧 Send your email address"
                , {
                    reply_markup: {
                        remove_keyboard: true
                    }
                }
            );
        }

        if (text.startsWith("/")) return;

          // URL ATHENTICATE

        const normalizedUrl = normalizeUrl(text);
        if (!normalizedUrl) {
            return bot.sendMessage(chatId, "❌ Invalid URL");
        }

         // REPORT ACTION

        if (state === "REPORTING") {
            userState.delete(chatId);
            return handleReport(chatId, normalizedUrl, bot);
        }

         // REMOVE ACTION

        if (state === "REMOVING") {
            userState.delete(chatId);
            return handleRemove(chatId, normalizedUrl, bot);
        }

         // ADD ACTION

        if (state === "ADDING") {
            pendingWebsite.set(chatId, normalizedUrl);

            userState.set(chatId, "CHOOSING_NOTIFICATION");

            return bot.sendMessage(chatId, "📢 Choose notification type:", {
                reply_markup: {
                    keyboard: [
                        ["📱 Telegram"],
                        ["📧 Email"],
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            });
        }

        return bot.sendMessage(chatId, "❌ Send a valid URL starting with http/https");
    });
}

start();