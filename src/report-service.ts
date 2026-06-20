// import axios from "axios";
// import { WebsiteModel } from "../db/database";
//
// export async function generateReport(chatId: number) {
//         const sites = await WebsiteModel.find({ chatId });
//
//         if (!sites.length) {
//                 return "📭 No websites to check.";
//         }
//
//         const results = await Promise.all(
//             sites.map(async (site) => {
//                     try {
//                             const res = await axios.get(site.url, { timeout: 5000 });
//
//                             return `✅ ${site.url} → UP (${res.status})`;
//                     } catch {
//                             return `❌ ${site.url} → DOWN`;
//                     }
//             })
//         );
//
//         return results.join("\n");
// }
