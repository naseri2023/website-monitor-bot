import mongoose from "mongoose";

export async function connectDB() {
    try {
        await mongoose.connect(
            "mongodb://127.0.0.1:27017/website-monitor"
        );

        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
