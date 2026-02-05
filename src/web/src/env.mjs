import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        DO_INFERENCE_API_KEY: z.string().optional(),
        OPENAI_DIRECT_API_KEY: z.string().optional(),
        AUTH_SECRET: z.string().optional(),
    },
    client: {
        VITE_API_URL: z.string().url(),
    },
    experimental__runtimeEnv: {
        VITE_API_URL: import.meta.env.VITE_API_URL,
    },
});
