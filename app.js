// 🔥 API BASE
const API_BASE = window.location.hostname.includes("localhost")
    ? "http://localhost:8000"
    : "https://mpilot-backend.onrender.com";

console.log("API BASE:", API_BASE);

// ─────────────────────────────
// 🔹 AUTH MODAL (FIXED)
// ─────────────────────────────
function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "block";
    console.log("Auth modal opened");
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "none";
}

// ─────────────────────────────
// 🔹 FETCH HELPERS
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

        if (!res.ok) throw new Error("API error");

        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
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

        return await res.json();
    } catch (err) {
        console.error("POST Error:", err);
        return null;
    }
}

// ─────────────────────────────
// 🔹 AUTH
// ─────────────────────────────
async function login() {
    const email = document.getElementById("authEmail")?.value;
    const password = document.getElementById("authPassword")?.value;

    const data = await apiPost("/api/auth/login", { email, password });

    console.log("Login:", data);

    if (data && data.access_token) {
        localStorage.setItem("token", data.access_token);
        alert("Login successful");
        location.reload();
    } else {
        alert("Login failed");
    }
}

async function signup() {
    const email = document.getElementById("authEmail")?.value;
    const password = document.getElementById("authPassword")?.value;

    const data = await apiPost("/api/auth/signup", { email, password });

    console.log("Signup:", data);

    if (data && data.id) {
        alert("Signup successful. Please login.");
    } else {
        alert("Signup failed");
    }
}

// ─────────────────────────────
// 🔹 BUSINESS
// ─────────────────────────────
let selectedBusinessId = null;

async function loadBusinesses() {
    const select = document.getElementById("businessSelect");

    if (!select) {
        console.warn("businessSelect not found in DOM");
        return;
    }

    const data = await apiGet("/api/businesses/");

    if (!data) return;

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
// 🔹 DASHBOARD
// ─────────────────────────────
async function loadDashboard() {
    if (!selectedBusinessId) return;

    const data = await apiGet(`/api/dashboard/stats/${selectedBusinessId}`);

    if (!data) return;

    document.getElementById("totalLeads")?.innerText = data.total_leads || "—";
    document.getElementById("whatsappOptIn")?.innerText = data.whatsapp_opt_in || "—";
    document.getElementById("qrScans")?.innerText = data.qr_scans || "—";
    document.getElementById("churnRisk")?.innerText = data.churn_risk || "—";
    document.getElementById("campaignsSent")?.innerText = data.campaigns_sent || "—";
    document.getElementById("googleRating")?.innerText = data.google_rating || "—";
    document.getElementById("vipCustomers")?.innerText = data.vip_customers || "—";
    document.getElementById("revenueTracked")?.innerText = data.revenue_tracked || "—";
}

// ─────────────────────────────
// 🔹 INIT
// ─────────────────────────────
async function initApp() {
    console.log("🚀 MPilot Frontend Loaded");

    await loadBusinesses();
}

document.addEventListener("DOMContentLoaded", initApp);