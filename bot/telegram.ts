import TelegramBot from "node-telegram-bot-api";
import { WebsiteModel, connectDB } from "../mongoDB/database";
import { checkAllWebsites } from "../src/monitor";
import {CheckLogModel} from "../src/monitor";
import dotenv from "dotenv";

dotenv.config();

function normalizeUrl(url: string): string {
    const normalized = new URL(url);

    // remove trailing slash
    return normalized.href.replace(/\/$/, "");
}

const BOT_TOKEN = process.env.BOT_TOKEN!;

async function start() {

    await connectDB();

    const userState = new Map<number, string>();

    const bot = new TelegramBot(BOT_TOKEN, {
        polling: true,
    });

    setInterval(() => {
        checkAllWebsites(bot);
    }, 60 * 1000);

    console.log("🤖 Bot started");

    const mainMenu = {
        reply_markup: {
            keyboard: [
                ["➕ Add", "📊 Report"],
                ["❌ Remove", "📋 Lists"],
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
        },
    };

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(
            msg.chat.id,
            "👋 Welcome to Website Monitor Bot!\n\nSend me a URL like:\nhttps://google.com",
            mainMenu
        );
    });

    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!text) return;

        if (text === "➕ Add") {
            return bot.sendMessage(chatId, "Send me a URL to add 👇");
        }

        if (text === "📋 Lists") {
            const sites = await WebsiteModel.find({ chatId });

            if (!sites.length) {
                return bot.sendMessage(chatId, "No websites added yet.");
            }

            const list = sites.map((s, i) => `${i + 1}. ${s.url}`).join("\n");

            return bot.sendMessage(chatId, `📋 Your websites:\n\n${list}`);
        }

        if (text === "❌ Remove") {

            userState.set(chatId, "REMOVING");

            setTimeout(async () => {

                if (userState.get(chatId) === "REMOVING") {

                    userState.delete(chatId);

                    await bot.sendMessage(
                        chatId,
                        "⌛ Remove operation timed out."
                    );
                }

            }, 60000);

            return bot.sendMessage(
                chatId,
                "Send the URL you want to remove ❌"
            );
        }

        if (text === "📊 Report") {

            userState.set(chatId, "REPORTING");

            setTimeout(() => {
                if (userState.get(chatId) === "REPORTING") {
                    userState.delete(chatId);
                }
            }, 60000);

            return bot.sendMessage(
                chatId,
                "📊 Send me the URL you want a report for."
            );
        }

        if (text.startsWith("/")) return;

        if (text.startsWith("http")) {

            const normalizedUrl = normalizeUrl(text);

            const state = userState.get(chatId);

            if (state === "REPORTING") {

                const site = await WebsiteModel.findOne({
                    url: normalizedUrl,
                    chatId,
                });

                // to remove the last memory
                userState.delete(chatId);

                if (!site) {
                    return bot.sendMessage(
                        chatId,
                        "⚠️ Website not found."
                    );
                }

                // descending order

                const logs = await CheckLogModel.find({
                    websiteId: site._id,
                }).sort({ checkedAt: -1 });

                if (!logs.length) {
                    return bot.sendMessage(
                        chatId,
                        "📭 No monitoring logs found yet."
                    );
                }

                const report = logs.map((log) => {

                    const date = new Date(
                        log.checkedAt
                    ).toLocaleString();

                    return (
                        `${log.status === "UP" ? "✅" : "❌"} ` +
                        `${log.status} | ` +
                        `${log.responseTime ?? 0} ms | ` +
                        `${date}`
                    );

                }).join("\n");

                return bot.sendMessage(
                    chatId,
                    `📊 Logs for ${site.url}\n\n${report}`
                );
            }

            if (state === "REMOVING") {
                const deleted = await WebsiteModel.findOneAndDelete({
                    url: normalizedUrl,
                    chatId,
                });

                userState.delete(chatId);

                if (!deleted) {
                    return bot.sendMessage(chatId, "⚠️ Website not found in your list.");
                }

                return bot.sendMessage(chatId, "🗑️ Website removed successfully!");
            }

            const exists = await WebsiteModel.findOne({
                url: normalizedUrl,
                chatId,
            });

            if (exists) {
                return bot.sendMessage(chatId, "⚠️ Already monitoring this website.");
            }

            await WebsiteModel.create({
                url: normalizedUrl,
                chatId,
                isDown: false,
            });

            return bot.sendMessage(chatId, "✅ Website added for monitoring!");
        }

        return bot.sendMessage(chatId, "❌ Send a valid URL starting with http/https");
    });
}

start();
