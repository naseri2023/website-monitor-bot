import axios from "axios";

export async function checkResponseTime(url: string) {
    const start = performance.now();

    try {
        const response = await axios.get(url, {
            timeout: 5000,
        });

        const end = performance.now();

        return {
            status: "UP",
            responseTime: Math.round(end - start),
        };
    } catch {
        const end = performance.now();

        return {
            status: "DOWN",
            responseTime: Math.round(end - start),
        };
    }
}
