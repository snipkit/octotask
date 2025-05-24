import { Redis } from "@upstash/redis"

// Create a Redis client using the environment variables
const redis = new Redis({
  url: process.env.REDIS_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

export default redis
