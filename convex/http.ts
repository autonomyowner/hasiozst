import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

// ---------------------------------------------------------------------------
// HTTP router
// ---------------------------------------------------------------------------
const http = httpRouter();

// Register all better-auth routes (sign-in, sign-up, session, OAuth, etc.)
authComponent.registerRoutes(http, createAuth);

// Allowed CORS origins
const CORS_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://hasio.com",
  "https://www.hasio.com",
];

function getCorsOrigin(request: Request): string {
  const origin = request.headers.get("Origin") ?? "";
  if (CORS_ORIGINS.includes(origin)) return origin;
  // Allow Expo deep-link scheme origins
  if (origin.startsWith("hasio://") || origin.startsWith("exp://")) return origin;
  return CORS_ORIGINS[0]; // Fallback — won't match browser's origin, so CORS blocks it
}

// Handle CORS preflight for /upload-url (legacy — uploads now use Convex storage)
http.route({
  path: "/upload-url",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    const corsOrigin = getCorsOrigin(request);
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }),
});

// POST /upload-url — now returns an error directing to Convex storage
http.route({
  path: "/upload-url",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const corsOrigin = getCorsOrigin(request);
    return new Response(
      JSON.stringify({ error: "R2 uploads deprecated. Use Convex storage (generateUploadUrl)." }),
      {
        status: 410,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }),
});

export default http;
