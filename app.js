// 🔥 Detect environment (local vs production)
const API_BASE = window.location.hostname.includes("localhost")
    ? "http://localhost:8000"
    : "https://mpilot-backend.onrender.com";

console.log("API BASE:", API_BASE);

// ─────────────────────────────────────────────
// 🔹 Utility: Fetch Wrapper (with auth)
// ─────────────────────────────────────────────
async function apiGet(endpoint) {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: token ? {
                "Authorization": `Bearer ${token}`
            } : {}
        });

        if (!res.ok) throw new Error("API error");
        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        return null;
    }
}

// ─────────────────────────────────────────────
// 🔹 Dashboard
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
// 🔹 Businesses
// ─────────────────────────────────────────────
async function loadBusinesses() {
    const data = await apiGet("/api/businesses");

    const select = document.getElementById("businessSelect");
    if (!select || !data || !Array.isArray(data)) return;

    select.innerHTML = '<option value="">— Select business —</option>';

    data.forEach(biz => {
        const option = document.createElement("option");
        option.value = biz.id || biz.business_id;
        option.textContent = biz.name;
        select.appendChild(option);
    });
}

// ─────────────────────────────────────────────
// 🔹 Other APIs
// ─────────────────────────────────────────────
async function loadCustomers() {
    const data = await apiGet("/api/customers");
    console.log("Customers:", data);
}

async function loadCampaigns() {
    const data = await apiGet("/api/campaigns");
    console.log("Campaigns:", data);
}

async function loadReviews() {
    const data = await apiGet("/api/reviews");
    console.log("Reviews:", data);
}

// ─────────────────────────────────────────────
// 🔐 AUTH MODAL (FIXED)
// ─────────────────────────────────────────────
function openAuthModal() {
    console.log("Auth modal opened");

    let modal = document.getElementById("authModal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "authModal";
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.background = "rgba(0,0,0,0.6)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.zIndex = "9999";

        modal.innerHTML = `
            <div style="background:#fff;padding:20px;border-radius:10px;width:320px">
                <h3>Login / Signup</h3>
                <input id="email" placeholder="Email" style="width:100%;margin-bottom:10px;padding:8px"/>
                <input id="password" type="password" placeholder="Password" style="width:100%;margin-bottom:10px;padding:8px"/>
                <button onclick="login()" style="width:100%;padding:10px;margin-bottom:5px">Login</button>
                <button onclick="signup()" style="width:100%;padding:10px">Signup</button>
                <button onclick="closeAuthModal()" style="margin-top:10px;width:100%">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    modal.style.display = "flex";
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "none";
}

// ─────────────────────────────────────────────
// 🔐 AUTH APIs
// ─────────────────────────────────────────────
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("Login:", data);

    if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        alert("Login successful");
        closeAuthModal();
        initApp();
    } else {
        alert("Login failed");
    }
}

async function signup() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("Signup:", data);

    alert("Signup successful. Now login.");
}

// ─────────────────────────────────────────────
// 🔹 INIT
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
// 🔹 START
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initApp);

// 🔥 CRITICAL GLOBAL EXPORTS (THIS FIXES YOUR ERROR)
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.login = login;
window.signup = signup;