//src/pages/CourseDetail.jsx

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Alert, StatusBadge } from "../components/ui";

export default function CourseDetail() {
    const { id } = useParams();
    const { user, api } = useUser();
    const navigate = useNavigate();
    const isTeacher = user.role === "Teacher";
    const [course, setCourse] = useState(null);
    const [msg, setMsg] = useState(null);

    const load = useCallback(async () => {
        try {
            setCourse(await api(`/api/course/${id}`));
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        }
    }, [api, id]);

    useEffect(() => {
        load();
    }, [load]);

    async function enroll() {
        setMsg(null);
        try {
            const r = await api(`/api/enroll/${id}`, { method: "POST" });
            setMsg({ type: "ok", text: r.message });
            load();
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        }
    }

    async function remove() {
        if (!window.confirm(`Delete "${course.name}"?`)) return;
        try {
            await api(`/api/course/${id}`, { method: "DELETE" });
            navigate("/courses");
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        }
    }

    if (!course) return msg ? <Alert msg={msg} /> : <p>Loading...</p>;

    const full = course.enrolledCount >= course.maxStudent;
    const canEnroll = !isTeacher && !course.isEnrolled && course.status === "Open" && !full;

    return (
        <div className="rounded border bg-white p-6">
            <Link to="/courses" className="text-sm text-blue-600">&larr; Back</Link>
            <h1 className="mt-2 mb-1 text-2xl font-semibold">{course.name}</h1>
            <p className="mb-4 text-gray-600">by {course.teacherName}</p>
            <Alert msg={msg} />

            <dl className="mb-4 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
                <dt className="font-medium">Status</dt><dd><StatusBadge status={course.status} /></dd>
                <dt className="font-medium">Duration</dt><dd>{course.duration} days</dd>
                <dt className="font-medium">Price</dt><dd>{course.price}</dd>
                <dt className="font-medium">Seats</dt><dd>{course.enrolledCount} / {course.maxStudent}</dd>
                <dt className="font-medium">Topics</dt>
                <dd className="flex flex-wrap gap-1">
                    {course.topics?.map((t) => (
                        <span key={t} className="rounded bg-gray-100 px-2 py-0.5">{t}</span>
                    ))}
                </dd>
            </dl>

            {isTeacher ? (
                <>
                    <h2 className="mb-2 font-semibold">Enrolled students ({course.students?.length ?? 0})</h2>
                    {course.students?.length ? (
                        <ul className="mb-4 list-disc pl-6 text-sm">
                            {course.students.map((s) => <li key={s.id}>{s.username}</li>)}
                        </ul>
                    ) : (
                        <p className="mb-4 text-sm text-gray-500">No students enrolled yet.</p>
                    )}
                    <div className="space-x-2">
                        <Link to={`/courses/${id}/edit`} className="rounded bg-blue-600 px-4 py-2 text-white">Edit</Link>
                        <button onClick={remove} disabled={course.enrolledCount > 0}
                                className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-40">
                            Delete
                        </button>
                        {course.enrolledCount > 0 && (
                            <span className="text-sm text-gray-500">Cannot delete: students have enrolled</span>
                        )}
                    </div>
                </>
            ) : course.isEnrolled ? (
                <p className="font-medium text-green-700">You are enrolled in this course.</p>
            ) : (
                <button onClick={enroll} disabled={!canEnroll}
                        className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-40">
                    {course.status !== "Open" ? "Not open for enrollment" : full ? "Course is full" : "Enroll"}
                </button>
            )}
        </div>
    );
}