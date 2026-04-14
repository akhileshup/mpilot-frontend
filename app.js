// 🔥 API BASE
const API_BASE = window.location.hostname.includes("localhost")
    ? "http://localhost:8000"
    : "https://mpilot-backend.onrender.com";

console.log("API BASE:", API_BASE);

// ─────────────────────────────────────────────
// 🔹 GLOBAL STATE
// ─────────────────────────────────────────────
let TOKEN = localStorage.getItem("token") || null;
let CURRENT_BIZ = null;

// ─────────────────────────────────────────────
// 🔹 FETCH WRAPPER
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

        if (!res.ok) {
            console.error("API ERROR:", endpoint, res.status);
            return null;
        }

        return await res.json();
    } catch (err) {
        console.error("API FAIL:", err);
        return null;
    }
}

// ─────────────────────────────────────────────
// 🔹 AUTH MODAL (FIXED)
// ─────────────────────────────────────────────
function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "block";
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "none";
}

// 🔹 LOGIN
async function login() {
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;

    const res = await apiRequest("/api/auth/login", "POST", {
        email,
        password
    });

    if (res && res.access_token) {
        TOKEN = res.access_token;
        localStorage.setItem("token", TOKEN);
        alert("Login successful");
        closeAuthModal();
        initApp();
    } else {
        alert("Login failed");
    }
}

// 🔹 SIGNUP
async function signup() {
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;

    const res = await apiRequest("/api/auth/signup", "POST", {
        email,
        password
    });

    if (res) {
        alert("Signup successful. Please login.");
    } else {
        alert("Signup failed");
    }
}

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

    if (!data) return;

    select.innerHTML = '<option value="">Select Business</option>';

    data.forEach(biz => {
        const option = document.createElement("option");
        option.value = biz.id;
        option.textContent = biz.name;
        select.appendChild(option);
    });

    select.onchange = () => {
        CURRENT_BIZ = select.value;
        loadDashboard();
    };
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
// 🔹 SAFE DOM SETTER
// ─────────────────────────────────────────────
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value ?? "—";
}

// ─────────────────────────────────────────────
// 🔹 INIT
// ─────────────────────────────────────────────
async function initApp() {
    console.log("🚀 MPilot Loaded");

    await loadBusinesses();

    if (CURRENT_BIZ) {
        await loadDashboard();
    }
}

document.addEventListener("DOMContentLoaded", initApp);