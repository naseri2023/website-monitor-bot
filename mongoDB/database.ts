import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/website-monitor");

        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection failed", err);

        process.exit(1);
    }
};

const WebsiteSchema = new mongoose.Schema({
    url: { type: String, required: true },
    chatId: { type: Number, required: true },
    isDown: { type: Boolean, default: false }
});

export const WebsiteModel = mongoose.model("Website", WebsiteSchema);