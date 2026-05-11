/*
 * @author Sam ASTY                                                            *
 * @company H2V Solutions                                                      *
 * @created_at 2026-05-Th 03:38:49                                             *
 * @updated_by Sam ASTY                                                        *
 * @updated_at 2026-05-Mo 09:50:40                                             *
 */

import { createAuthClient } from "better-auth/react";
import { API_BASE } from "./api";

console.log("[auth-client] Initialising — baseURL:", API_BASE);

export const authClient = createAuthClient({
  // Point to your Worker URL (update for production)
  baseURL: API_BASE,
  fetchOptions: {
    onRequest(ctx) {
      console.log("[auth-client] → request", ctx);
    },
    onResponse(ctx) {
      console.log(
        "[auth-client] ← response",
        ctx.response.status,
        ctx.response.url,
      );
    },
    onError(ctx) {
      console.error("[auth-client] ✖ fetch error", ctx.error);
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
