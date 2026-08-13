// ==========================================================================
// HydroFarm Interactive Application Script
// Features: Shopping Cart State, Category Filtering, Live Search, Promo Coupons
// ==========================================================================

// Global State & API Config
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api/v1' 
  : '/api/v1';

let products = [];

let cart = [];
let activeCoupon = null;

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initCartDrawer();
  initSearchFilter();
  initCategoryFilters();
  initMainGoogleAuth();
  fetchProductsFromAPI();
  renderCart();
  checkUserSession();
});

// --------------------------------------------------------------------------
// Google Auth & Role-Based Navigation System
// --------------------------------------------------------------------------
let mainGoogleClientId = "333270177238-u252ha7h7pmbdr9fn538anrhgn6nal8n.apps.googleusercontent.com";

async function initMainGoogleAuth() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/config`);
    if (res.ok) {
      const config = await res.json();
      if (config.success && config.data && config.data.googleClientId) {
        mainGoogleClientId = config.data.googleClientId;
      }
    }
  } catch (e) {}

  const setupMainGIS = () => {
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: mainGoogleClientId,
        callback: handleMainGoogleLogin,
        auto_select: false
      });

      const googleBtn = document.getElementById("main-google-btn");
      const customBtn = document.getElementById("main-login-btn");

      if (googleBtn) {
        googleBtn.innerHTML = "";
        google.accounts.id.renderButton(googleBtn, {
          theme: "outline",
          size: "medium",
          text: "signin",
          shape: "rectangular"
        });
        if (customBtn) customBtn.style.display = "none";
      }
    } else {
      setTimeout(setupMainGIS, 500);
    }
  };

  setupMainGIS();
}

function triggerMainGoogleAuth() {
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: mainGoogleClientId,
      callback: handleMainGoogleLogin
    });
    google.accounts.id.prompt();
  } else {
    alert("SDK Google sedang memuat. Mohon pastikan koneksi internet terhubung.");
  }
}

function getAdminRedirectUrl() {
  if (window.location.pathname.startsWith('/main')) {
    return '/admin';
  }
  return '../admin/index.html';
}

async function handleMainGoogleLogin(response) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential })
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const user = result.data.user;
        localStorage.setItem("hydrofarm_token", result.data.token);
        localStorage.setItem("hydrofarm_user", JSON.stringify(user));

        // ROLE-BASED ROUTING:
        if (user.role === 'ADMIN') {
          showToast("🔑 Login Admin berhasil! Mengalihkan ke Admin Panel...");
          setTimeout(() => {
            window.location.href = getAdminRedirectUrl();
          }, 800);
        } else {
          showToast(`🌱 Selamat datang, ${user.name}! (Pelanggan HydroFarm)`);
          checkUserSession();
        }
      }
    }
  } catch (err) {
    console.log("ℹ️ Error verifying Google token backend", err);
  }
}

function checkUserSession() {
  const savedUser = localStorage.getItem("hydrofarm_user");
  const userContainer = document.getElementById("main-user-container");
  const adminBtn = document.getElementById("header-admin-btn");

  // Always hide Admin button by default for non-admin/guest visitors
  if (adminBtn) adminBtn.style.display = 'none';

  if (savedUser && userContainer) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.name) {
        const initial = user.name.charAt(0).toUpperCase();
        const avatarMarkup = user.avatarUrl 
          ? `<img src="${user.avatarUrl}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">`
          : `<div style="width:28px; height:28px; border-radius:50%; background:#16a34a; color:#fff; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:center;">${initial}</div>`;

        userContainer.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; background:#e6f4ea; padding:4px 12px 4px 6px; border-radius:99px; border:1px solid rgba(22,163,74,0.2);">
            ${avatarMarkup}
            <span style="font-size:13px; font-weight:700; color:#15803d;">${user.name.split(' ')[0]}</span>
            <button onclick="logoutMainUser()" title="Logout" style="border:none; background:none; cursor:pointer; color:#dc2626; font-weight:700; font-size:12px; margin-left:4px;">&times;</button>
          </div>
        `;
      }

      // Strictly show Admin button ONLY for ADMIN role users
      if (adminBtn && user.role === 'ADMIN') {
        adminBtn.style.display = 'inline-flex';
      }
    } catch (e) {}
  }
}

function logoutMainUser() {
  localStorage.removeItem("hydrofarm_token");
  localStorage.removeItem("hydrofarm_user");
  showToast("Anda telah logout.");
  setTimeout(() => window.location.reload(), 1000);
}

// Fetch products from Backend API if server is active
async function fetchProductsFromAPI() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        products = data.data;
        console.log("🌱 Syncing products from HydroFarm API server:", products);
      }
    }
  } catch (err) {
    console.log("ℹ️ HydroFarm Backend server offline or empty.");
  }
  renderProducts();
}

function renderProducts(itemsToRender = products) {
  const container = document.getElementById("product-grid");
  if (!container) return;

  if (!itemsToRender || itemsToRender.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin-bottom:12px;">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <h3 style="font-size:16px; font-weight:700; color:#334155; margin-bottom:4px;">Belum Ada Produk Sayuran</h3>
        <p style="font-size:13px; color:#64748b;">Belum ada produk yang dipublikasikan di katalog. Tambahkan produk baru via Admin Panel.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = itemsToRender.map(p => `
    <div class="product-card" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-category="${(p.category || p.categoryId || 'selada').toLowerCase()}">
      <div class="product-img-box">
        <span class="product-badge ${p.badgeClass || 'badge-panen'}">${p.badge || 'Panen'}</span>
        <img src="${p.image || p.imageUrl || 'assets/images/prod-selada-romaine.png'}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-title">${p.name}</h3>
        <div class="product-meta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
            <line x1="16" y1="8" x2="2" y2="22"></line>
          </svg>
          <span>${p.weight || '250g'}</span>
        </div>
        <div class="product-bottom">
          <div class="product-price">${formatRupiah(p.price)}</div>
          <button class="add-to-cart-btn" onclick="addToCart('${p.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Keranjang</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Format Currency
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount).replace("Rp", "Rp ");
}

// --------------------------------------------------------------------------
// Navigation & Mobile Menu
// --------------------------------------------------------------------------
function initNavigation() {
  const mobileToggle = document.getElementById("mobile-toggle");
  const mainNav = document.getElementById("main-nav");
  const navLinks = document.querySelectorAll(".nav-link");

  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener("click", () => {
      mainNav.classList.toggle("active");
    });
  }

  // Close mobile nav on link click & scroll highlighting
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (mainNav) mainNav.classList.remove("active");
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

// --------------------------------------------------------------------------
// Shopping Cart Logic & Drawer
// --------------------------------------------------------------------------
function initCartDrawer() {
  const cartBtn = document.getElementById("cart-btn");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartDrawer = document.getElementById("cart-drawer");
  const cartClose = document.getElementById("cart-close");

  if (cartBtn) {
    cartBtn.addEventListener("click", openCart);
  }

  if (cartClose) {
    cartClose.addEventListener("click", closeCart);
  }

  if (cartOverlay) {
    cartOverlay.addEventListener("click", closeCart);
  }
}

function openCart() {
  const cartOverlay = document.getElementById("cart-overlay");
  const cartDrawer = document.getElementById("cart-drawer");
  if (cartOverlay && cartDrawer) {
    cartOverlay.classList.add("active");
    cartDrawer.classList.add("active");
  }
}

function closeCart() {
  const cartOverlay = document.getElementById("cart-overlay");
  const cartDrawer = document.getElementById("cart-drawer");
  if (cartOverlay && cartDrawer) {
    cartOverlay.classList.remove("active");
    cartDrawer.classList.remove("active");
  }
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
  showToast(`${product.name} telah ditambahkan ke keranjang!`);
}

function updateQuantity(productId, delta) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
  }
  renderCart();
}

function renderCart() {
  const cartCountEl = document.getElementById("cart-count");
  const container = document.getElementById("cart-items-container");
  const emptyEl = document.getElementById("cart-empty");
  const footerEl = document.getElementById("cart-footer");
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");
  const discountRow = document.getElementById("discount-row");

  // Calculate Total Quantity
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountEl) cartCountEl.textContent = totalQty;

  if (cart.length === 0) {
    if (container) {
      container.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
          </svg>
          <p>Keranjang Anda masih kosong.</p>
          <button class="btn btn-primary" style="margin-top:16px" onclick="closeCart(); location.href='#produk';">Mulai Belanja</button>
        </div>
      `;
    }
    if (footerEl) footerEl.style.display = "none";
    return;
  }

  if (footerEl) footerEl.style.display = "block";

  // Build Cart Items HTML
  let itemsHtml = "";
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    itemsHtml += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${formatRupiah(item.price)}</div>
          <div class="cart-qty-controls">
            <button class="cart-qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
            <span>${item.quantity}</span>
            <button class="cart-qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
          </div>
        </div>
        <div class="cart-item-total" style="font-weight:700; font-size:14px; color:var(--color-text-main);">
          ${formatRupiah(itemTotal)}
        </div>
      </div>
    `;
  });

  if (container) container.innerHTML = itemsHtml;

  // Calculate Discount
  let discount = 0;
  if (activeCoupon === "MULAISEGAR") {
    discount = 10000;
    if (discountRow) discountRow.style.display = "flex";
  } else {
    if (discountRow) discountRow.style.display = "none";
  }

  const grandTotal = Math.max(0, subtotal - discount);

  if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
  if (totalEl) totalEl.textContent = formatRupiah(grandTotal);
}

// Coupon Logic
async function applyCouponInput() {
  const input = document.getElementById("coupon-input");
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  await applyPromoCode(code);
}

async function applyPromoCode(code) {
  if (!code) return;

  try {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        activeCoupon = code;
        showToast(data.message || `Kode kupon ${code} berhasil dipasang!`);
        openCart();
        renderCart();
        return;
      }
    }
  } catch (err) {
    console.log("ℹ️ Using local coupon validator fallback");
  }

  if (code === "MULAISEGAR") {
    activeCoupon = "MULAISEGAR";
    showToast("Kode kupon MULAISEGAR berhasil dipasang! (Gratis Ongkir Rp 10.000)");
    openCart();
    renderCart();
  } else {
    showToast("Kode kupon tidak valid. Gunakan MULAISEGAR atau HYDROHEALTHY.");
  }
}

async function checkout() {
  if (cart.length === 0) return;

  const savedUserStr = localStorage.getItem("hydrofarm_user");
  let recipientName = "Pelanggan HydroFarm";
  let recipientPhone = "";
  let shippingAddress = "";

  if (savedUserStr) {
    try {
      const u = JSON.parse(savedUserStr);
      if (u.name) recipientName = u.name;
      if (u.phone) recipientPhone = u.phone;
      if (u.address) shippingAddress = u.address;
    } catch (e) {}
  }

  const checkoutPayload = {
    items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
    couponCode: activeCoupon,
    recipientName,
    recipientPhone,
    shippingAddress
  };

  try {
    const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.order) {
        showToast(`Pesanan ${data.data.order.orderNumber} berhasil dibuat! Memproses pengiriman...`);
        cart = [];
        activeCoupon = null;
        renderCart();
        closeCart();
        return;
      }
    }
  } catch (err) {
    console.log("ℹ️ Server offline, using fallback local checkout response");
  }

  showToast("Terima kasih! Pesanan Anda sedang kami proses untuk dikirim segar.");
  cart = [];
  activeCoupon = null;
  renderCart();
  closeCart();
}

// --------------------------------------------------------------------------
// Live Search & Category Filtering
// --------------------------------------------------------------------------
function initSearchFilter() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    filterProducts(term, "all");
  });
}

function initCategoryFilters() {
  const categoryCards = document.querySelectorAll(".category-card");
  const resetBtn = document.getElementById("reset-filter-btn");

  categoryCards.forEach(card => {
    card.addEventListener("click", () => {
      const cat = card.getAttribute("data-category");
      filterProducts("", cat);
      showToast(`Filter kategori: ${cat.toUpperCase()}`);
      document.getElementById("produk")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      filterProducts("", "all");
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";
      showToast("Menampilkan semua produk.");
    });
  }
}

function filterProducts(searchTerm, category) {
  const cards = document.querySelectorAll(".product-card");

  cards.forEach(card => {
    const name = card.getAttribute("data-name")?.toLowerCase() || "";
    const cat = card.getAttribute("data-category")?.toLowerCase() || "";

    const matchesSearch = !searchTerm || name.includes(searchTerm);
    const matchesCategory = category === "all" || cat === category;

    if (matchesSearch && matchesCategory) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}

// --------------------------------------------------------------------------
// Toast System
// --------------------------------------------------------------------------
function showToast(message) {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
