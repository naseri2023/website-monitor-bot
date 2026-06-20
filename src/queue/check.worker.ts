import { Worker } from "bullmq";
import { redis } from "./redis";
import { WebsiteModel } from "../models/website.model";
import { checkResponseTime } from "../monitor/monitor.service";
import { CheckLogModel } from "../models/checkLog.model";
import { sendEmail } from "../services/email.service";

export const checkWorker = new Worker(
    "check-queue",
    async (job) => {
        const { websiteId, url } = job.data;

        const site = await WebsiteModel.findById(websiteId);
        if (!site) return;

        const result = await checkResponseTime(url);

        await CheckLogModel.create({
            websiteId: site._id,
            status: result.status,
            responseTime: result.responseTime,
        });

        if (result.status === "DOWN" && !site.isDown) {
            if (site.telegramEnabled) {
                await job.data.bot?.sendMessage(
                    site.chatId,
                    `🚨 ${url} is DOWN`
                );
            }

            if (site.emailEnabled && site.email) {
                try {
                    await sendEmail(
                        site.email,
                        "Website Down",
                        `${url} is DOWN`
                    );
                } catch (err) {
                    console.error(err);
                }
            }
        }

        // فقط state update
        await WebsiteModel.updateOne(
            { _id: websiteId },
            {
                $set: {
                    isDown: result.status === "DOWN",
                }
            }
        );
    },
    {
        connection: redis,
        concurrency: 10,
    }
);