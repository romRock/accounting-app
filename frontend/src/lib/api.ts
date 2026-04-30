// Centralized API configuration with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const LIVE_API_URL = "https://accounting-app-ttqe.onrender.com";

export { LIVE_API_URL };
export default API_BASE_URL;
