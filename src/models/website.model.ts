import mongoose from "mongoose";

const WebsiteSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    chatId: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        default: null,
    },
    telegramEnabled: {
        type: Boolean,
        default: true,
    },
    emailEnabled: {
        type: Boolean,
        default: false,
    },
    isDown: {
        type: Boolean,
        default: false
    },
    nextCheck: {
        type: Date,
        default: Date.now
    },

    interval: {
        type: Number,
        default: 60 * 1000 // 1 min
    }
});

export const WebsiteModel =
    mongoose.model(
        "Website",
        WebsiteSchema
    );