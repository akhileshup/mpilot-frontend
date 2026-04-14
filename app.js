// 🔥 Detect environment (local vs production)
const API_BASE = window.location.hostname.includes("localhost")
    ? "http://localhost:8000"
    : "https://mpilot-backend.onrender.com";

console.log("API BASE:", API_BASE);

// ─────────────────────────────────────────────
// 🔹 Utility: Fetch Wrapper
// ─────────────────────────────────────────────
async function apiGet(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error("API error");
        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        return null;
    }
}

// ─────────────────────────────────────────────
// 🔹 Load Dashboard
// ─────────────────────────────────────────────
async function loadDashboard() {
    const data = await apiGet("/api/dashboard/");

    if (!data) return;

    document.getElementById("totalLeads").innerText = data.total_leads || "—";
    document.getElementById("whatsappOptIn").innerText = data.whatsapp_opt_in || "—";
    document.getElementById("qrScans").innerText = data.qr_scans || "—";
    document.getElementById("churnRisk").innerText = data.churn_risk || "—";
    document.getElementById("campaignsSent").innerText = data.campaigns_sent || "—";
    document.getElementById("googleRating").innerText = data.google_rating || "—";
    document.getElementById("vipCustomers").innerText = data.vip_customers || "—";
    document.getElementById("revenueTracked").innerText = data.revenue_tracked || "—";
}

// ─────────────────────────────────────────────
// 🔹 Load Businesses Dropdown
// ─────────────────────────────────────────────
async function loadBusinesses() {
    const data = await apiGet("/api/businesses");

    const select = document.getElementById("businessSelect");

    if (!data || !Array.isArray(data)) return;

    select.innerHTML = '<option value="">— Select business —</option>';

    data.forEach(biz => {
        const option = document.createElement("option");
        option.value = biz.id;
        option.textContent = biz.name;
        select.appendChild(option);
    });
}

// ─────────────────────────────────────────────
// 🔹 Load Customers
// ─────────────────────────────────────────────
async function loadCustomers() {
    const data = await apiGet("/api/customers");

    console.log("Customers:", data);
}

// ─────────────────────────────────────────────
// 🔹 Load Campaigns
// ─────────────────────────────────────────────
async function loadCampaigns() {
    const data = await apiGet("/api/campaigns");

    console.log("Campaigns:", data);
}

// ─────────────────────────────────────────────
// 🔹 Load Reviews
// ─────────────────────────────────────────────
async function loadReviews() {
    const data = await apiGet("/api/reviews");

    console.log("Reviews:", data);
}

// ─────────────────────────────────────────────
// 🔹 Init App
// ─────────────────────────────────────────────
async function initApp() {
    console.log("🚀 MPilot Frontend Loaded");

    await loadBusinesses();
    await loadDashboard();
    await loadCustomers();
    await loadCampaigns();
    await loadReviews();
}

// ─────────────────────────────────────────────
// 🔹 Start
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initApp);