// Centralized API configuration
// Single backend source of truth (VPS in production, localhost in development).
// Both environments talk to the same backend/database via NEXT_PUBLIC_API_URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default API_BASE_URL;
