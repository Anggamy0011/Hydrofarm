// ==========================================================================
// HydroFarm Interactive Application Script
// Features: Shopping Cart State, Category Filtering, Live Search, Promo Coupons
// ==========================================================================

// Global State
const products = [
  {
    id: 1,
    name: "Selada Romaine Premium",
    price: 18000,
    category: "selada",
    weight: "250g",
    badge: "Panen",
    badgeClass: "badge-panen",
    image: "assets/images/prod-selada-romaine-exact.png"
  },
  {
    id: 2,
    name: "Bayam Hijau Super",
    price: 14500,
    category: "bayam",
    weight: "200g",
    badge: "Organik",
    badgeClass: "badge-organik",
    image: "assets/images/prod-bayam-super-exact.png"
  },
  {
    id: 3,
    name: "Kangkung Hidroponik",
    price: 12000,
    category: "kangkung",
    weight: "300g",
    badge: "Hidroponik",
    badgeClass: "badge-hidroponik",
    image: "assets/images/prod-kangkung-hidroponik-exact.png"
  },
  {
    id: 4,
    name: "Pakcoy Baby Renyah",
    price: 15000,
    category: "pakcoy",
    weight: "250g",
    badge: "Laris Manis",
    badgeClass: "badge-laris",
    image: "assets/images/prod-pakcoy-baby-exact.png"
  }
];

let cart = [];
let activeCoupon = null;

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initCartDrawer();
  initSearchFilter();
  initCategoryFilters();
  renderCart();
});

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
function applyCouponInput() {
  const input = document.getElementById("coupon-input");
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  applyPromoCode(code);
}

function applyPromoCode(code) {
  if (code === "MULAISEGAR") {
    activeCoupon = "MULAISEGAR";
    showToast("Kode kupon MULAISEGAR berhasil dipasang! (Gratis Ongkir Rp 10.000)");
    openCart();
    renderCart();
  } else {
    showToast("Kode kupon tidak valid. Gunakan MULAISEGAR.");
  }
}

function checkout() {
  if (cart.length === 0) return;
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
