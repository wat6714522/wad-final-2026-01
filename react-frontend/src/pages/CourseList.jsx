//src/pages/CourseList.jsx

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Alert, StatusBadge } from "../components/ui";

export default function CourseList({ mine = false }) {
    const { user, api } = useUser();
    const isTeacher = user.role === "Teacher";
    const [courses, setCourses] = useState([]);
    const [q, setQ] = useState("");
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (search = "") => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (mine) params.set("enrolled", "true");
            if (search.trim()) params.set("q", search.trim());
            const qs = params.toString();
            setCourses(await api(`/api/course${qs ? `?${qs}` : ""}`));
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    }, [api, mine]);

    useEffect(() => {
        load();
    }, [load]);

    async function enroll(id) {
        setMsg(null);
        try {
            const r = await api(`/api/enroll/${id}`, { method: "POST" });
            setMsg({ type: "ok", text: r.message });
            load(q);
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        }
    }

    async function remove(c) {
        if (!window.confirm(`Delete "${c.name}"?`)) return;
        setMsg(null);
        try {
            const r = await api(`/api/course/${c._id}`, { method: "DELETE" });
            setMsg({ type: "ok", text: r.message });
            load();
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        }
    }

    const title = isTeacher ? "My courses" : mine ? "My enrolled courses" : "All courses";

    return (
        <div>
            <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
            <Alert msg={msg} />

            {!isTeacher && !mine && (
                <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="mb-4 flex gap-2">
                    <input className="flex-1 rounded border px-3 py-2" placeholder="Search by course name or teacher name"
                           value={q} onChange={(e) => setQ(e.target.value)} />
                    <button className="rounded bg-blue-600 px-4 text-white">Search</button>
                    <button type="button" className="rounded border px-4" onClick={() => { setQ(""); load(); }}>
                        Clear
                    </button>
                </form>
            )}

            {loading ? (
                <p>Loading...</p>
            ) : courses.length === 0 ? (
                <p className="text-gray-500">No courses found.</p>
            ) : (
                <table className="w-full border bg-white text-sm">
                    <thead className="bg-gray-100 text-left">
                    <tr>
                        <th className="p-2">Name</th>
                        {!isTeacher && <th className="p-2">Teacher</th>}
                        <th className="p-2">Days</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Seats</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {courses.map((c) => {
                        const full = c.enrolledCount >= c.maxStudent;
                        return (
                            <tr key={c._id} className="border-t">
                                <td className="p-2">{c.name}</td>
                                {!isTeacher && <td className="p-2">{c.teacherName}</td>}
                                <td className="p-2">{c.duration}</td>
                                <td className="p-2">{c.price}</td>
                                <td className="p-2">{c.enrolledCount} / {c.maxStudent}</td>
                                <td className="p-2"><StatusBadge status={c.status} /></td>
                                <td className="space-x-2 p-2">
                                    <Link to={`/courses/${c._id}`} className="text-blue-600">View</Link>
                                    {isTeacher ? (
                                        <>
                                            <Link to={`/courses/${c._id}/edit`} className="text-blue-600">Edit</Link>
                                            <button onClick={() => remove(c)} disabled={c.enrolledCount > 0}
                                                    title={c.enrolledCount > 0 ? "Students already enrolled" : ""}
                                                    className="text-red-600 disabled:text-gray-400">
                                                Delete
                                            </button>
                                        </>
                                    ) : c.isEnrolled ? (
                                        <span className="text-green-700">Enrolled</span>
                                    ) : c.status !== "Open" ? (
                                        <span className="text-gray-500">Not open</span>
                                    ) : full ? (
                                        <span className="text-gray-500">Full</span>
                                    ) : (
                                        <button onClick={() => enroll(c._id)} className="rounded bg-green-600 px-2 py-0.5 text-white">
                                            Enroll
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            )}
        </div>
    );
}