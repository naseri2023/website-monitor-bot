import { Queue } from "bullmq";
import { redis } from "./redis";

export const checkQueue = new Queue("check-queue", {
    connection: redis,
});