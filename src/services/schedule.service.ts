import { checkQueue } from "../queue/check.queue";
import { WebsiteModel } from "../models/website.model";

export async function scheduleDueWebsites() {
    const now = new Date();

    // 1. فقط بردار
    const websites = await WebsiteModel.find({
        nextCheck: { $lte: now },
        locked: false
    }).limit(1000);

    if (websites.length === 0) return;

    const ids = websites.map(w => w._id);

    // 2. LOCK یکجا (atomic)
    await WebsiteModel.updateMany(
        { _id: { $in: ids } },
        { $set: { locked: true } }
    );

    // 3. enqueue bulk
    await checkQueue.addBulk(
        websites.map(site => ({
            name: "check-site",
            data: {
                websiteId: site._id.toString(),
                url: site.url,
            },
            opts: {
                jobId: site._id.toString(),
            }
        }))
    );
}