//src/app/api/auth/login/route.js

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";
import { TOKEN_COOKIE_OPTIONS } from "@/lib/auth";

const TOKEN_AGE = 60 * 60 * 24 * 7; // 7 days

export async function OPTIONS() {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req) {
    try {
        const { username, password } = await req.json();
        if (!username || !password) {
            return errorResponse("Username and password are required", 400);
        }

        const client = await getClientPromise();
        const user = await client
            .db(process.env.DB_NAME)
            .collection("users")
            .findOne({ $or: [{ username }, { email: username }] });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return errorResponse("Invalid username or password", 401);
        }

        const payload = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: TOKEN_AGE,
        });

        const res = successResponse({ message: "Login successful", user: payload }, 200);
        res.cookies.set("token", token, { ...TOKEN_COOKIE_OPTIONS, maxAge: TOKEN_AGE });
        return res;
    } catch (error) {
        printExceptionLog("POST /api/auth/login", error);
        return errorResponse("Internal server error", 500);
    }
}