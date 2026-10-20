//src/app/api/user/route.js
import { ObjectId } from "mongodb";
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";
import { errorResponse, successResponse, getAuthUser, printExceptionLog } from "@/lib/utils";

export async function OPTIONS() {
    return new Response(null, { status: 200, headers: corsHeaders });
}

// GET /api/user -> current logged-in user
export async function GET(req) {
    try {
        const auth = getAuthUser(req);
        if (!auth) return errorResponse("Unauthorized Request", 401);

        const client = await getClientPromise();
        const user = await client.db(process.env.DB_NAME).collection("users").findOne(
            { _id: new ObjectId(auth.id) },
            { projection: { password: 0 } },
        );
        if (!user) return errorResponse("User not found", 404);
        return successResponse(user, 200);
    } catch (err) {
        printExceptionLog("GET /api/user", err);
        return errorResponse("Internal server error", 500);
    }
}