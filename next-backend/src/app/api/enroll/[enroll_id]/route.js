//src/app/api/enroll/[enroll_id]/route.js
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";
import { DB_NAME, ROLE_STUDENT, getUser, toObjectId } from "@/lib/course";

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/enroll/:enroll_id   (enroll_id = course id, Student only)
 * Enrolls only if: status Open, not already enrolled, seats remain.
 */
export async function POST(req, { params }) {
    try {
        const { enroll_id } = await params;
        const _id = toObjectId(enroll_id);
        if (!_id) return errorResponse("Invalid course id", 400);

        const user = getUser(req);
        if (user.role !== ROLE_STUDENT)
            return errorResponse("Only students can enroll", 403);

        const client = await getClientPromise();
        const courses = client.db(DB_NAME).collection("courses");

        const result = await courses.updateOne(
            {
                _id,
                status: "Open",
                "students.id": { $ne: user.id },
                $expr: { $lt: [{ $size: "$students" }, "$maxStudent"] },
            },
            {
                $push: {
                    students: { id: user.id, username: user.username, enrolledAt: new Date() },
                },
            },
        );

        if (result.modifiedCount === 1) {
            return successResponse({ message: "Enrolled successfully" }, 200);
        }

        // Nothing updated: work out why
        const course = await courses.findOne({ _id });
        if (!course || course.status === "Cancel")
            return errorResponse("Course not found", 404);
        if (course.students.some((s) => s.id === user.id))
            return errorResponse("You are already enrolled in this course", 409);
        if (course.status !== "Open")
            return errorResponse("Course is not open for enrollment", 400);
        return errorResponse("Course is full", 409);
    } catch (error) {
        printExceptionLog("POST /api/enroll/[enroll_id]", error);
        return errorResponse("Internal server error", 500);
    }
}