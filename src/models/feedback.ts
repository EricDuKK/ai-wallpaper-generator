import { feedbacks } from "@/db/schema";
import { db, resetDbConnection } from "@/db";
import { getUsersByUuids } from "./user";
import { desc, eq } from "drizzle-orm";

export async function insertFeedback(
  data: typeof feedbacks.$inferInsert
): Promise<typeof feedbacks.$inferSelect | undefined> {
  const [feedback] = await db().insert(feedbacks).values(data).returning();

  return feedback;
}

export async function findFeedbackById(
  id: number
): Promise<typeof feedbacks.$inferSelect | undefined> {
  const [feedback] = await db()
    .select()
    .from(feedbacks)
    .where(eq(feedbacks.id, id))
    .limit(1);

  return feedback;
}

export async function getFeedbacks(
  page: number = 1,
  limit: number = 50
): Promise<(typeof feedbacks.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(feedbacks)
    .orderBy(desc(feedbacks.created_at))
    .limit(limit)
    .offset(offset);

  if (!data || data.length === 0) {
    return [];
  }

  const user_uuids = Array.from(new Set(data.map((item) => item.user_uuid)));
  const users = await getUsersByUuids(user_uuids as string[]);

  return data.map((item) => {
    const user = users?.find((user) => user.uuid === item.user_uuid);
    return { ...item, user };
  });
}

export async function getFeedbacksTotal(): Promise<number | undefined> {
  try {
    const total = await db().$count(feedbacks);
    return total;
  } catch (error: any) {
    console.error("Failed to get feedbacks total:", error);
    
    // If connection is closed, reset and retry once
    if (error?.code === "CONNECTION_CLOSED" || error?.message?.includes("CONNECTION_CLOSED")) {
      resetDbConnection();
      try {
        const retryTotal = await db().$count(feedbacks);
        return retryTotal;
      } catch (retryError) {
        console.error("Retry failed to get feedbacks total:", retryError);
        return 0;
      }
    }
    
    // Return 0 as fallback instead of undefined to prevent UI errors
    return 0;
  }
}
