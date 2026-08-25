import { count, gte } from "drizzle-orm";
import { videos } from "../../drizzle/schema";
import { getRequiredDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const adminMediaRouter = router({
  uploadSummary: adminProcedure.query(async () => {
    const db = await getRequiredDb();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - 13);
    const [[total], [todayTotal], daily] = await Promise.all([
      db.select({ value: count() }).from(videos),
      db.select({ value: count() }).from(videos).where(gte(videos.createdAt, today)),
      db.select({ createdAt: videos.createdAt }).from(videos).where(gte(videos.createdAt, start)),
    ]);
    const dailyMap = new Map<string, number>();
    daily.forEach((row) => { const key = new Date(row.createdAt).toISOString().slice(0, 10); dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1); });
    const dailyUploads = Array.from({ length: 14 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); const key = date.toISOString().slice(0, 10); return { date: key, uploads: dailyMap.get(key) ?? 0 }; });
    return { totalUploads: Number(total?.value ?? 0), uploadsToday: Number(todayTotal?.value ?? 0), dailyUploads };
  }),
});
