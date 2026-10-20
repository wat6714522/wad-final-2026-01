//src/app/api/course/route.js
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";
import {
    DB_NAME,
    ROLE_STUDENT,
    ROLE_TEACHER,
    courseView,
    escapeRegex,
    getUser,
    validateCourse,
} from "@/lib/course";

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * GET /api/course
 *  Teacher: own courses only
 *  Student: all courses except Cancel
 *    ?name=xxx      partial course name
 *    ?teacher=xxx   partial teacher name
 *    ?q=xxx         matches name OR teacher name
 *    ?enrolled=true only my enrolled courses
 */
export async function GET(req) {
    try {
        const user = getUser(req);
        const client = await getClientPromise();
        const courses = client.db(DB_NAME).collection("courses");

        if (user.role === ROLE_TEACHER) {
            const list = await courses
                .find({ teacherId: user.id })
                .sort({ _id: -1 })
                .toArray();
            return successResponse(list.map((c) => courseView(c, user)), 200);
        }

        if (user.role === ROLE_STUDENT) {
            const sp = req.nextUrl.searchParams;
            const filter = { status: { $ne: "Cancel" } };

            const name = sp.get("name")?.trim();
            const teacher = sp.get("teacher")?.trim();
            const q = sp.get("q")?.trim();

            if (name) filter.name = { $regex: escapeRegex(name), $options: "i" };
            if (teacher)
                filter.teacherName = { $regex: escapeRegex(teacher), $options: "i" };
            if (q) {
                const rx = { $regex: escapeRegex(q), $options: "i" };
                filter.$or = [{ name: rx }, { teacherName: rx }];
            }
            if (sp.get("enrolled") === "true") filter["students.id"] = user.id;

            const list = await courses.find(filter).sort({ _id: -1 }).toArray();
            return successResponse(list.map((c) => courseView(c, user)), 200);
        }

        return errorResponse("Forbidden", 403);
    } catch (error) {
        printExceptionLog("GET /api/course", error);
        return errorResponse("Internal server error", 500);
    }
}

/**
 * POST /api/course  (Teacher only)
 * body: { name, duration, topics: [], price, maxStudent, status }
 */
export async function POST(req) {
    try {
        const user = getUser(req);
        if (user.role !== ROLE_TEACHER) {
            return errorResponse("Only teachers can create courses", 403);
        }

        const body = await req.json().catch(() => null);
        if (!body) return errorResponse("Invalid JSON body", 400);

        const { errors, data } = validateCourse(body);
        if (errors.length) return errorResponse(errors.join(", "), 400);

        const doc = {
            ...data,
            teacherId: user.id,
            teacherName: user.username,
            students: [],
            createdAt: new Date(),
        };

        const client = await getClientPromise();
        const result = await client
            .db(DB_NAME)
            .collection("courses")
            .insertOne(doc);

        return successResponse({ ...doc, _id: result.insertedId }, 201);
    } catch (error) {
        printExceptionLog("POST /api/course", error);
        return errorResponse("Internal server error", 500);
    }
}