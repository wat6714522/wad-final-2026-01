//src/app/api/course/[course_id]/route.js
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";
import {
    DB_NAME,
    ROLE_STUDENT,
    ROLE_TEACHER,
    courseView,
    getUser,
    toObjectId,
    validateCourse,
} from "@/lib/course";

async function getCollection() {
    const client = await getClientPromise();
    return client.db(DB_NAME).collection("courses");
}

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * GET /api/course/:id
 *  Teacher: own course only, includes enrolled students
 *  Student: any course except Cancel
 */
export async function GET(req, { params }) {
    try {
        const { course_id } = await params;
        const _id = toObjectId(course_id);
        if (!_id) return errorResponse("Invalid course id", 400);

        const user = getUser(req);
        const courses = await getCollection();
        const course = await courses.findOne({ _id });

        if (user.role === ROLE_TEACHER) {
            if (!course) return errorResponse("Course not found", 404);
            if (course.teacherId !== user.id)
                return errorResponse("You can only view your own courses", 403);
            return successResponse(courseView(course, user), 200);
        }

        if (user.role === ROLE_STUDENT) {
            if (!course || course.status === "Cancel")
                return errorResponse("Course not found", 404);
            return successResponse(courseView(course, user), 200);
        }

        return errorResponse("Forbidden", 403);
    } catch (error) {
        printExceptionLog("GET /api/course/[course_id]", error);
        return errorResponse("Internal server error", 500);
    }
}

/**
 * PUT /api/course/:id  (Teacher, own course only)
 * Send any subset of: name, duration, topics, price, maxStudent, status
 */
export async function PUT(req, { params }) {
    try {
        const { course_id } = await params;
        const _id = toObjectId(course_id);
        if (!_id) return errorResponse("Invalid course id", 400);

        const user = getUser(req);
        if (user.role !== ROLE_TEACHER)
            return errorResponse("Only teachers can update courses", 403);

        const body = await req.json().catch(() => null);
        if (!body) return errorResponse("Invalid JSON body", 400);

        const courses = await getCollection();
        const course = await courses.findOne({ _id });
        if (!course) return errorResponse("Course not found", 404);
        if (course.teacherId !== user.id)
            return errorResponse("You can only update your own courses", 403);

        const { errors, data } = validateCourse(body, true);
        if (errors.length) return errorResponse(errors.join(", "), 400);
        if (Object.keys(data).length === 0)
            return errorResponse("No valid fields to update", 400);

        const filter = { _id, teacherId: user.id };
        if (data.maxStudent !== undefined) {
            if (data.maxStudent < course.students.length) {
                return errorResponse(
                    `maxStudent cannot be less than enrolled students (${course.students.length})`,
                    400,
                );
            }
            // guard against an enrollment sneaking in at the same time
            filter.$expr = { $lte: [{ $size: "$students" }, data.maxStudent] };
        }

        const result = await courses.updateOne(filter, {
            $set: { ...data, updatedAt: new Date() },
        });
        if (result.matchedCount === 0)
            return errorResponse("Course changed, please try again", 409);

        const updated = await courses.findOne({ _id });
        return successResponse(courseView(updated, user), 200);
    } catch (error) {
        printExceptionLog("PUT /api/course/[course_id]", error);
        return errorResponse("Internal server error", 500);
    }
}

export const PATCH = PUT;

/**
 * DELETE /api/course/:id  (Teacher, own course, nobody enrolled)
 */
export async function DELETE(req, { params }) {
    try {
        const { course_id } = await params;
        const _id = toObjectId(course_id);
        if (!_id) return errorResponse("Invalid course id", 400);

        const user = getUser(req);
        if (user.role !== ROLE_TEACHER)
            return errorResponse("Only teachers can delete courses", 403);

        const courses = await getCollection();
        const course = await courses.findOne({ _id });
        if (!course) return errorResponse("Course not found", 404);
        if (course.teacherId !== user.id)
            return errorResponse("You can only delete your own courses", 403);
        if (course.students.length > 0)
            return errorResponse("Cannot delete a course that has enrolled students", 409);

        // atomic: only deletes if still empty
        const result = await courses.deleteOne({
            _id,
            teacherId: user.id,
            students: { $size: 0 },
        });
        if (result.deletedCount === 0)
            return errorResponse("Cannot delete a course that has enrolled students", 409);

        return successResponse({ message: "Course deleted" }, 200);
    } catch (error) {
        printExceptionLog("DELETE /api/course/[course_id]", error);
        return errorResponse("Internal server error", 500);
    }
}