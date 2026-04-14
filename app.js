// 🔥 Detect environment
const API_BASE = window.location.hostname.includes("localhost")
    ? "http://localhost:8000"
    : "https://mpilot-backend.onrender.com";

console.log("API BASE:", API_BASE);

// 🔐 Store auth token
let TOKEN = localStorage.getItem("token") || null;
let CURRENT_BIZ = null;

// ─────────────────────────────────────────────
// 🔹 API Wrapper
// ─────────────────────────────────────────────
async function apiRequest(endpoint, method = "GET", body = null) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(TOKEN && { "Authorization": `Bearer ${TOKEN}` })
            },
            body: body ? JSON.stringify(body) : null
        });

        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        return null;
    }
}

// ─────────────────────────────────────────────
// 🔹 AUTH FUNCTIONS
// ─────────────────────────────────────────────
function openAuthModal() {
    document.getElementById("authModal").style.display = "block";
}

function closeAuthModal() {
    document.getElementById("authModal").style.display = "none";
}

async function signup() {
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;

    const res = await apiRequest("/api/auth/signup", "POST", {
        email,
        password
    });

    if (res?.access_token) {
        TOKEN = res.access_token;
        localStorage.setItem("token", TOKEN);
        alert("Signup success");
        closeAuthModal();
        initApp();
    }
}

async function login() {
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;

    const res = await apiRequest("/api/auth/login", "POST", {
        email,
        password
    });

    if (res?.access_token) {
        TOKEN = res.access_token;
        localStorage.setItem("token", TOKEN);
        alert("Login success");
        closeAuthModal();
        initApp();
    }
}

// expose globally (IMPORTANT)
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.login = login;
window.signup = signup;

// ─────────────────────────────────────────────
// 🔹 LOAD BUSINESSES
// ─────────────────────────────────────────────
async function loadBusinesses() {
    const select = document.getElementById("businessSelect");

    if (!select) {
        console.warn("businessSelect not found");
        return;
    }

    const data = await apiRequest("/api/businesses/");

    if (!data || !Array.isArray(data)) return;

    select.innerHTML = '<option value="">— Select business —</option>';

    data.forEach(biz => {
        const option = document.createElement("option");
        option.value = biz.id;
        option.textContent = biz.name;
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        CURRENT_BIZ = select.value;
        loadDashboard();
    });
}

// ─────────────────────────────────────────────
// 🔹 DASHBOARD
// ─────────────────────────────────────────────
async function loadDashboard() {
    if (!CURRENT_BIZ) return;

    const data = await apiRequest(`/api/dashboard/stats/${CURRENT_BIZ}`);

    if (!data) return;

    setText("totalLeads", data.total_leads);
    setText("whatsappOptIn", data.whatsapp_opt_in);
    setText("qrScans", data.qr_scans);
    setText("churnRisk", data.churn_risk);
    setText("campaignsSent", data.campaigns_sent);
    setText("googleRating", data.google_rating);
    setText("vipCustomers", data.vip_customers);
    setText("revenueTracked", data.revenue_tracked);
}

// ─────────────────────────────────────────────
// 🔹 HELPERS
// ─────────────────────────────────────────────
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value ?? "—";
}

// ─────────────────────────────────────────────
// 🔹 INIT
// ─────────────────────────────────────────────
async function initApp() {
    console.log("🚀 MPilot Frontend Loaded");

    if (!TOKEN) {
        console.log("User not logged in");
        return;
    }

    await loadBusinesses();
}

// ─────────────────────────────────────────────
// 🔹 START
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initApp);