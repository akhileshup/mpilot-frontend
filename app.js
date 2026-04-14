// 🔥 API BASE
const API_BASE = window.location.hostname.includes("localhost")
    ? "http://localhost:8000"
    : "https://mpilot-backend.onrender.com";

console.log("API BASE:", API_BASE);

// ─────────────────────────────
// 🔹 AUTH MODAL
// ─────────────────────────────
function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) {
        modal.style.display = "block";
    }
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// ─────────────────────────────
// 🔹 API HELPERS
// ─────────────────────────────
async function apiGet(endpoint) {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` })
            }
        });

        if (!res.ok) throw new Error(`GET ${endpoint} failed`);

        return await res.json();
    } catch (err) {
        console.error("API GET Error:", err);
        return null;
    }
}

async function apiPost(endpoint, body) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`POST ${endpoint} failed`);

        return await res.json();
    } catch (err) {
        console.error("API POST Error:", err);
        return null;
    }
}

// ─────────────────────────────
// 🔹 AUTH
// ─────────────────────────────
async function login() {
    const email = document.getElementById("authEmail")?.value;
    const password = document.getElementById("authPassword")?.value;

    if (!email || !password) {
        alert("Enter email & password");
        return;
    }

    const data = await apiPost("/api/auth/login", {
        email,
        password
    });

    console.log("Login Response:", data);

    if (data && data.access_token) {
        localStorage.setItem("token", data.access_token);
        alert("Login successful ✅");
        location.reload();
    } else {
        alert("Login failed ❌");
    }
}

async function signup() {
    const email = document.getElementById("authEmail")?.value;
    const password = document.getElementById("authPassword")?.value;

    if (!email || !password) {
        alert("Enter email & password");
        return;
    }

    const data = await apiPost("/api/auth/signup", {
        email,
        password
    });

    console.log("Signup Response:", data);

    if (data && data.id) {
        alert("Signup successful 🎉 Please login.");
    } else {
        alert("Signup failed ❌");
    }
}

// ─────────────────────────────
// 🔹 BUSINESS
// ─────────────────────────────
let selectedBusinessId = null;

async function loadBusinesses() {
    const select = document.getElementById("businessSelect");

    if (!select) {
        console.warn("businessSelect not found");
        return;
    }

    const data = await apiGet("/api/businesses/");

    if (!data || !Array.isArray(data)) {
        console.warn("No businesses found");
        return;
    }

    select.innerHTML = '<option value="">— Select business —</option>';

    data.forEach(biz => {
        const option = document.createElement("option");
        option.value = biz.id;
        option.textContent = biz.name;
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        selectedBusinessId = select.value;
        loadDashboard();
    });
}

// ─────────────────────────────
// 🔹 DASHBOARD (FIXED SYNTAX)
// ─────────────────────────────
async function loadDashboard() {
    if (!selectedBusinessId) return;

    const data = await apiGet(`/api/dashboard/stats/${selectedBusinessId}`);

    if (!data) return;

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value || "—";
    };

    set("totalLeads", data.total_leads);
    set("whatsappOptIn", data.whatsapp_opt_in);
    set("qrScans", data.qr_scans);
    set("churnRisk", data.churn_risk);
    set("campaignsSent", data.campaigns_sent);
    set("googleRating", data.google_rating);
    set("vipCustomers", data.vip_customers);
    set("revenueTracked", data.revenue_tracked);
}

// ─────────────────────────────
// 🔹 INIT
// ─────────────────────────────
async function initApp() {
    console.log("🚀 MPilot Frontend Loaded");

    await loadBusinesses();
}

document.addEventListener("DOMContentLoaded", initApp);