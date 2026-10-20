import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyJWT(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return null;
    }
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.log(err);
    return null;
  }
}


const isProd = process.env.NODE_ENV === "production";

export const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};