import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Detect if running in Cloudflare Workers environment
const isCloudflareWorker =
  typeof globalThis !== "undefined" && "Cloudflare" in globalThis;

// Database instance for Node.js environment
let dbInstance: ReturnType<typeof drizzle> | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;

// Reset database connection (call this when connection errors occur)
export function resetDbConnection() {
  if (postgresClient) {
    try {
      // postgres-js end() returns a promise, but we don't wait for it
      // to avoid blocking, just mark for cleanup
      postgresClient.end({ timeout: 5 }).catch(() => {
        // Ignore errors when closing
      });
    } catch (e) {
      // Ignore errors when closing
    }
  }
  dbInstance = null;
  postgresClient = null;
}

export function db() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // In Cloudflare Workers, create new connection each time
  if (isCloudflareWorker) {
    // Workers environment uses minimal configuration
    const client = postgres(databaseUrl, {
      prepare: false,
      max: 1, // Limit to 1 connection in Workers
      idle_timeout: 10, // Shorter timeout for Workers
      connect_timeout: 5,
    });

    return drizzle(client);
  }

  // In Node.js environment, use singleton pattern
  if (dbInstance && postgresClient) {
    return dbInstance;
  }

  // Node.js environment with connection pool configuration
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 10, // Maximum connections in pool
    idle_timeout: 30, // Idle connection timeout (seconds)
    connect_timeout: 10, // Connection timeout (seconds)
    max_lifetime: 60 * 30, // Maximum connection lifetime (30 minutes)
    onnotice: () => {}, // Suppress notices
  });
  
  postgresClient = client;
  dbInstance = drizzle({ client });

  return dbInstance;
}
