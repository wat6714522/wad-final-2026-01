//src/pages/Login.jsx

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Alert } from "../components/ui";

export default function Login() {
    const { user, login } = useUser();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to="/courses" replace />;

    async function handleSubmit(e) {
        e.preventDefault();
        setMsg(null);
        setBusy(true);
        try {
            await login(username, password);
            navigate("/courses");
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-sm rounded border bg-white p-6">
            <h1 className="mb-4 text-xl font-semibold">Login</h1>
            <Alert msg={msg} />
            <label className="mb-3 block">
                <span className="text-sm">Username or email</span>
                <input className="mt-1 w-full rounded border px-3 py-2" value={username}
                       onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </label>
            <label className="mb-4 block">
                <span className="text-sm">Password</span>
                <input type="password" className="mt-1 w-full rounded border px-3 py-2" value={password}
                       onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button disabled={busy} className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50">
                {busy ? "Logging in..." : "Login"}
            </button>
        </form>
    );
}