// src/lib/course.js
import { ObjectId } from "mongodb";
import {
    X_HEADER_USER_ID,
    X_HEADER_USER_NAME,
    X_HEADER_USER_ROLE,
} from "./constant";

export const DB_NAME = "wad_final"; // use the SAME name in login + seeding
export const ROLE_TEACHER = "Teacher";
export const ROLE_STUDENT = "Student";
export const COURSE_STATUS = ["Open", "Close", "Cancel"];

export function getUser(req) {
    return {
        id: req.headers.get(X_HEADER_USER_ID),
        username: req.headers.get(X_HEADER_USER_NAME),
        role: req.headers.get(X_HEADER_USER_ROLE),
    };
}

export function toObjectId(id) {
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Owner teacher sees the student list; everyone else sees only counts
export function courseView(course, user) {
    const { students = [], ...rest } = course;
    const view = {
        ...rest,
        enrolledCount: students.length,
        isEnrolled: students.some((s) => s.id === user.id),
    };
    if (user.role === ROLE_TEACHER && course.teacherId === user.id) {
        view.students = students;
    }
    return view;
}

// partial = true for update: only validate fields that were sent
export function validateCourse(body, partial = false) {
    const errors = [];
    const data = {};
    const has = (k) => body[k] !== undefined;

    if (!partial || has("name")) {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) errors.push("name is required");
        else data.name = name;
    }

    if (!partial || has("duration")) {
        const d = Number(body.duration);
        if (!Number.isInteger(d) || d <= 0)
            errors.push("duration must be a positive whole number (days)");
        else data.duration = d;
    }

    if (!partial || has("topics")) {
        let t = body.topics;
        if (typeof t === "string") t = t.split(",");
        if (!Array.isArray(t)) t = [];
        t = t.map((x) => String(x).trim()).filter(Boolean);
        if (t.length === 0) errors.push("topics must contain at least one topic");
        else data.topics = t;
    }

    if (!partial || has("price")) {
        const p = Number(body.price);
        if (body.price === "" || body.price === null || !Number.isFinite(p) || p < 0)
            errors.push("price must be a number >= 0");
        else data.price = p;
    }

    if (!partial || has("maxStudent")) {
        const m = Number(body.maxStudent);
        if (!Number.isInteger(m) || m <= 0)
            errors.push("maxStudent must be a positive whole number");
        else data.maxStudent = m;
    }

    if (has("status")) {
        if (!COURSE_STATUS.includes(body.status))
            errors.push("status must be Open, Close or Cancel");
        else data.status = body.status;
    } else if (!partial) {
        data.status = "Open";
    }

    return { errors, data };
}