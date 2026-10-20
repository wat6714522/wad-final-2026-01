// src/lib/utils.js

import { NextResponse } from "next/server";
import corsHeaders from "./cors";
import { verifyJWT } from "./auth";

export function printExceptionLog(logMessage, error) {
  console.log(`==>${logMessage} Exception`);
  console.log(error);
}

export function errorResponse(message, status) {
  return NextResponse.json(
      {
        message: message,
      },
      {
        status: status,
        headers: corsHeaders,
      },
  );
}

export function successResponse(jsonData, status) {
  return NextResponse.json(jsonData, {
    status: status,
    headers: corsHeaders,
  });
}

// Verifies the token cookie directly (doesn't trust x-user-* headers).
// Returns { id, username, email, role } or null if not logged in / invalid token.
export function getAuthUser(req) {
  const user = verifyJWT(req);
  if (!user?.id) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

// 401 if not logged in, 403 if wrong role, otherwise null
export function requireRole(user, ...roles) {
  if (!user) return errorResponse("Unauthorized Request", 401);
  if (!roles.includes(user.role)) return errorResponse("Forbidden: insufficient role", 403);
  return null;
}