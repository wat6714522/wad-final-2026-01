//src/App.jsx

import { HashRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { useUser } from "./context/UserContext";
import Login from "./pages/Login";
import CourseList from "./pages/CourseList";
import CourseDetail from "./pages/CourseDetail";
import CourseForm from "./pages/CourseForm";

function NavBar() {
    const { user, logout } = useUser();
    if (!user) return null;
    return (
        <nav className="flex items-center gap-4 border-b bg-white px-6 py-3">
            <Link to="/courses" className="font-semibold">Online Course Service</Link>
            {user.role === "Teacher" ? (
                <Link to="/courses/new" className="text-blue-600">+ New course</Link>
            ) : (
                <Link to="/my-courses" className="text-blue-600">My enrolled courses</Link>
            )}
            <span className="ml-auto text-sm text-gray-600">
        {user.username} ({user.role})
      </span>
            <button onClick={logout} className="rounded border px-3 py-1 text-sm">
                Logout
            </button>
        </nav>
    );
}

function RequireAuth({ role, children }) {
    const { user, loading } = useUser();
    if (loading) return <p>Loading...</p>;
    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/courses" replace />;
    return children;
}

export default function App() {
    return (
        <HashRouter>
            <NavBar />
            <main className="mx-auto max-w-5xl p-6">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/courses" element={<RequireAuth><CourseList key="all" /></RequireAuth>} />
                    <Route path="/my-courses" element={<RequireAuth role="Student"><CourseList key="mine" mine /></RequireAuth>} />
                    <Route path="/courses/new" element={<RequireAuth role="Teacher"><CourseForm /></RequireAuth>} />
                    <Route path="/courses/:id" element={<RequireAuth><CourseDetail /></RequireAuth>} />
                    <Route path="/courses/:id/edit" element={<RequireAuth role="Teacher"><CourseForm /></RequireAuth>} />
                    <Route path="*" element={<Navigate to="/courses" replace />} />
                </Routes>
            </main>
        </HashRouter>
    );
}