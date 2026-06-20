import mongoose from "mongoose";

const CheckLogSchema = new mongoose.Schema({
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website" },
    status: { type: String, enum: ["UP", "DOWN"] },
    checkedAt: { type: Date, default: Date.now },
    responseTime: Number,
});

export const CheckLogModel = mongoose.model("CheckLog", CheckLogSchema);