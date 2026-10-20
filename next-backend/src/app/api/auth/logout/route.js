//src/app/api/auth/logout/route.js

import { NextResponse } from "next/server";
import corsHeaders from "@/lib/cors";
import { successResponse } from "@/lib/utils";
import { TOKEN_COOKIE_OPTIONS } from "@/lib/auth";

export async function OPTIONS() {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST() {
    const res = successResponse({ message: "Logout successful" }, 200);
    // Same options as login, otherwise the browser won't clear the cross-site cookie
    res.cookies.set("token", "", { ...TOKEN_COOKIE_OPTIONS, maxAge: 0 });
    return res;
}