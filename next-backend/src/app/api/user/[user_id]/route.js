//src/app/api/user/[user_id]/route.js
import { ObjectId } from "mongodb";
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";
import { DB_NAME, ROLE_TEACHER } from "@/lib/course";
import { errorResponse, successResponse, getAuthUser, printExceptionLog } from "@/lib/utils";

export async function OPTIONS() {
    return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req, { params }) {
    try {
        const auth = getAuthUser(req);
        if (!auth) return errorResponse("Unauthorized Request", 401);

        const { user_id } = await params;
        if (!ObjectId.isValid(user_id)) return errorResponse("Invalid user id", 400);
        if (auth.id !== user_id && auth.role !== ROLE_TEACHER) {
            return errorResponse("Forbidden", 403);
        }

        const client = await getClientPromise();
        const user = await client.db(DB_NAME).collection("users").findOne(
            { _id: new ObjectId(user_id) },
            { projection: { password: 0 } },
        );
        if (!user) return errorResponse("User not found", 404);
        return successResponse(user, 200);
    } catch (err) {
        printExceptionLog("GET /api/user/[user_id]", err);
        return errorResponse("Internal server error", 500);
    }
}