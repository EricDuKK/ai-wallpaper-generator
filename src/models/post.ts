import { posts } from "@/db/schema";
import { db, resetDbConnection } from "@/db";
import { and, desc, eq } from "drizzle-orm";

export enum PostStatus {
  Created = "created",
  Deleted = "deleted",
  Online = "online",
  Offline = "offline",
}

export async function insertPost(
  data: typeof posts.$inferInsert
): Promise<typeof posts.$inferSelect | undefined> {
  try {
    const [post] = await db().insert(posts).values(data).returning();
    return post;
  } catch (error: any) {
    console.error("Failed to insert post:", error);
    
    // If connection is closed, reset and retry once
    if (error?.code === "CONNECTION_CLOSED" || error?.message?.includes("CONNECTION_CLOSED")) {
      resetDbConnection();
      try {
        const [retryPost] = await db().insert(posts).values(data).returning();
        return retryPost;
      } catch (retryError) {
        console.error("Retry failed to insert post:", retryError);
        throw new Error(`Failed to insert post after retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
      }
    }
    
    throw new Error(`Failed to insert post: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function updatePost(
  uuid: string,
  data: Partial<typeof posts.$inferInsert>
): Promise<typeof posts.$inferSelect | undefined> {
  try {
    const [post] = await db()
      .update(posts)
      .set(data)
      .where(eq(posts.uuid, uuid))
      .returning();

    return post;
  } catch (error: any) {
    console.error("Failed to update post:", error);
    
    // If connection is closed, reset and retry once
    if (error?.code === "CONNECTION_CLOSED" || error?.message?.includes("CONNECTION_CLOSED")) {
      resetDbConnection();
      try {
        const [retryPost] = await db()
          .update(posts)
          .set(data)
          .where(eq(posts.uuid, uuid))
          .returning();
        return retryPost;
      } catch (retryError) {
        console.error("Retry failed to update post:", retryError);
        throw new Error(`Failed to update post after retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
      }
    }
    
    // Re-throw other errors
    throw new Error(`Failed to update post: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function findPostByUuid(
  uuid: string
): Promise<typeof posts.$inferSelect | undefined> {
  try {
    const [post] = await db()
      .select()
      .from(posts)
      .where(eq(posts.uuid, uuid))
      .limit(1);

    return post;
  } catch (error: any) {
    console.error("Failed to find post by uuid:", error);
    
    // If connection is closed, reset and retry once
    if (error?.code === "CONNECTION_CLOSED" || error?.message?.includes("CONNECTION_CLOSED")) {
      resetDbConnection();
      try {
        const [retryPost] = await db()
          .select()
          .from(posts)
          .where(eq(posts.uuid, uuid))
          .limit(1);
        return retryPost;
      } catch (retryError) {
        console.error("Retry failed to find post by uuid:", retryError);
        return undefined;
      }
    }
    
    return undefined;
  }
}

export async function findPostBySlug(
  slug: string,
  locale: string
): Promise<typeof posts.$inferSelect | undefined> {
  const [post] = await db()
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.locale, locale)))
    .limit(1);

  return post;
}

export async function getAllPosts(
  page: number = 1,
  limit: number = 50
): Promise<(typeof posts.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(posts)
    .orderBy(desc(posts.created_at))
    .limit(limit)
    .offset(offset);

  return data;
}

export async function getPostsByLocale(
  locale: string,
  page: number = 1,
  limit: number = 50
): Promise<(typeof posts.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(posts)
    .where(and(eq(posts.locale, locale), eq(posts.status, PostStatus.Online)))
    .orderBy(desc(posts.created_at))
    .limit(limit)
    .offset(offset);

  return data;
}

export async function getPostsTotal(): Promise<number> {
  try {
    const total = await db().$count(posts);
    return total;
  } catch (error: any) {
    console.error("Failed to get posts total:", error);
    
    // If connection is closed, reset and retry once
    if (error?.code === "CONNECTION_CLOSED" || error?.message?.includes("CONNECTION_CLOSED")) {
      resetDbConnection();
      try {
        const retryTotal = await db().$count(posts);
        return retryTotal;
      } catch (retryError) {
        console.error("Retry failed to get posts total:", retryError);
        return 0;
      }
    }
    
    // Return 0 as fallback instead of throwing to prevent UI errors
    return 0;
  }
}
