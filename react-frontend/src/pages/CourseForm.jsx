//src/pages/CourseForm.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Alert } from "../components/ui";

const EMPTY = { name: "", duration: "", topics: "", price: "", maxStudent: "", status: "Open" };

export default function CourseForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { api } = useUser();
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY);
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        api(`/api/course/${id}`)
            .then((c) =>
                setForm({
                    name: c.name,
                    duration: c.duration,
                    topics: (c.topics || []).join(", "),
                    price: c.price,
                    maxStudent: c.maxStudent,
                    status: c.status,
                }),
            )
            .catch((err) => setMsg({ type: "error", text: err.message }));
    }, [api, id, isEdit]);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setMsg(null);
        setBusy(true);
        const body = {
            ...form,
            duration: Number(form.duration),
            price: Number(form.price),
            maxStudent: Number(form.maxStudent),
            topics: form.topics.split(",").map((t) => t.trim()).filter(Boolean),
        };
        try {
            const saved = isEdit
                ? await api(`/api/course/${id}`, { method: "PUT", body })
                : await api("/api/course", { method: "POST", body });
            navigate(`/courses/${saved._id}`);
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setBusy(false);
        }
    }

    const input = "mt-1 w-full rounded border px-3 py-2";

    return (
        <form onSubmit={handleSubmit} className="max-w-lg rounded border bg-white p-6">
            <h1 className="mb-4 text-2xl font-semibold">{isEdit ? "Edit course" : "New course"}</h1>
            <Alert msg={msg} />

            <label className="mb-3 block">
                <span className="text-sm">Name</span>
                <input className={input} value={form.name} onChange={set("name")} required />
            </label>
            <div className="mb-3 grid grid-cols-3 gap-3">
                <label>
                    <span className="text-sm">Duration (days)</span>
                    <input type="number" min="1" step="1" className={input} value={form.duration} onChange={set("duration")} required />
                </label>
                <label>
                    <span className="text-sm">Price</span>
                    <input type="number" min="0" step="any" className={input} value={form.price} onChange={set("price")} required />
                </label>
                <label>
                    <span className="text-sm">Max students</span>
                    <input type="number" min="1" step="1" className={input} value={form.maxStudent} onChange={set("maxStudent")} required />
                </label>
            </div>
            <label className="mb-3 block">
                <span className="text-sm">Topics (comma separated)</span>
                <input className={input} value={form.topics} onChange={set("topics")} placeholder="HTML, CSS, React" required />
            </label>
            <label className="mb-4 block">
                <span className="text-sm">Status</span>
                <select className={input} value={form.status} onChange={set("status")}>
                    <option>Open</option>
                    <option>Close</option>
                    <option>Cancel</option>
                </select>
            </label>

            <div className="space-x-2">
                <button disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                    {busy ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => navigate(-1)} className="rounded border px-4 py-2">
                    Cancel
                </button>
            </div>
        </form>
    );
}