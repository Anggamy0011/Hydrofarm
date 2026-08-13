// ==========================================================================
// HydroFarm Admin Panel Script
// API Integration & Google OAuth Auth Handler
// ==========================================================================

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api/v1' 
  : '/api/v1';

let adminProducts = [];
let adminOrders = [];

document.addEventListener("DOMContentLoaded", () => {
  initGoogleAuth();
  fetchProductsFromAPI();
  fetchOrdersFromAPI();
  renderDashboard();
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
// Navigation, Sidebar & Section Switcher
// --------------------------------------------------------------------------
function toggleMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && overlay) {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }
}

function switchSection(sectionId) {
  const sections = ['dashboard', 'products', 'orders', 'coupons'];
  const titles = {
    dashboard: 'Dashboard Overview',
    products: 'Manajemen Katalog Produk',
    orders: 'Kelola Pesanan Masuk',
    coupons: 'Kelola Kupon Diskon'
  };

  sections.forEach(id => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.style.display = (id === sectionId) ? 'block' : 'none';
  });

  const pageTitle = document.getElementById('page-title');
  if (pageTitle && titles[sectionId]) pageTitle.textContent = titles[sectionId];

  // Highlight menu item
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => item.classList.remove('active'));
  const activeItem = document.querySelector(`.menu-item[onclick*="${sectionId}"]`);
  if (activeItem) activeItem.classList.add('active');

  // Auto close mobile drawer
  closeMobileSidebar();
}

// --------------------------------------------------------------------------
// Google OAuth Sign-In Integration
// --------------------------------------------------------------------------
let googleClientId = "333270177238-u252ha7h7pmbdr9fn538anrhgn6nal8n.apps.googleusercontent.com";

async function initGoogleAuth() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/config`);
    if (res.ok) {
      const config = await res.json();
      if (config.success && config.data && config.data.googleClientId) {
        googleClientId = config.data.googleClientId;
      }
    }
  } catch (e) {}

  const setupGIS = () => {
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false
      });

      const googleContainer = document.getElementById("google-btn-container");
      const customBtn = document.getElementById("btn-custom-google");

      if (googleContainer) {
        googleContainer.style.display = "block";
        googleContainer.innerHTML = ""; // Clear existing
        google.accounts.id.renderButton(googleContainer, {
          theme: "outline",
          size: "medium",
          text: "signin_with",
          shape: "rectangular"
        });
        if (customBtn) customBtn.style.display = "none";
      }
    } else {
      // Retry in 500ms if GIS SDK is still downloading
      setTimeout(setupGIS, 500);
    }
  };

  setupGIS();

  // Enforce strict authentication session check
  const savedUser = localStorage.getItem("hydrofarm_user");

  if (!savedUser) {
    alert("Akses Admin Panel terbatas. Silakan login terlebih dahulu melalui Toko Utama.");
    window.location.href = "../main/index.html";
    return;
  }

  try {
    const user = JSON.parse(savedUser);
    if (!user || user.role !== 'ADMIN') {
      alert("Akun Anda terdaftar sebagai Pelanggan (Customer). Mengalihkan ke Halaman Utama...");
      window.location.href = "../main/index.html";
      return;
    }
    updateAdminProfileUI(user);
  } catch (e) {
    localStorage.removeItem("hydrofarm_user");
    window.location.href = "../main/index.html";
  }
}

function updateAdminProfileUI(user) {
  const adminName = document.getElementById("admin-name");
  const adminRole = document.getElementById("admin-role");
  const adminAvatar = document.getElementById("admin-avatar");
  const logoutBtn = document.querySelector(".btn-logout");

  if (adminName) adminName.textContent = user.name || user.email;
  if (adminRole) adminRole.textContent = user.role || 'ADMIN';
  
  if (adminAvatar) {
    if (user.avatarUrl) {
      adminAvatar.innerHTML = `<img src="${user.avatarUrl}" alt="${user.name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
      const initial = (user.name || user.email || 'A').charAt(0).toUpperCase();
      adminAvatar.innerHTML = `<span style="font-weight:800; font-size:16px; color:#ffffff;">${initial}</span>`;
    }
  }

  if (logoutBtn) logoutBtn.style.display = "inline-flex";
}

function logoutAdmin() {
  localStorage.removeItem("hydrofarm_token");
  localStorage.removeItem("hydrofarm_user");
  alert("Anda telah keluar dari Admin Panel.");
  window.location.href = "../main/index.html";
}

async function handleGoogleCredentialResponse(response) {
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

        if (user.role === 'CUSTOMER') {
          alert(`Selamat datang ${user.name}! Akun Anda adalah Pelanggan (Customer). Mengalihkan ke Toko Utama...`);
          window.location.href = "../main/index.html";
        } else {
          updateAdminProfileUI(user);
          alert(`Selamat datang kembali Admin ${user.name}! (Logged in with Google)`);
        }
      }
    }
  } catch (err) {
    console.log("ℹ️ Error during Google authentication backend verification", err);
  }
}


// --------------------------------------------------------------------------
// API Fetching & Render Logic
// --------------------------------------------------------------------------
async function fetchProductsFromAPI() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        adminProducts = data.data;
      }
    }
  } catch (e) {
    console.log("ℹ️ Server offline, using default mock products");
  }
  renderProductsTable();
}

async function fetchOrdersFromAPI() {
  const token = localStorage.getItem("hydrofarm_token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        adminOrders = data.data;
      }
    }
  } catch (e) {}
  renderDashboard();
  renderOrdersTable();
}

function renderDashboard() {
  const revEl = document.getElementById('stat-revenue');
  const prodEl = document.getElementById('stat-products-count');
  const ordEl = document.getElementById('stat-orders-count');
  const pendEl = document.getElementById('stat-pending-count');

  if (prodEl) prodEl.textContent = `${adminProducts.length} Sayur`;
  if (ordEl) ordEl.textContent = `${adminOrders.length} Pesanan`;
  
  const pendingOrders = adminOrders.filter(o => o.status === 'PENDING').length;
  if (pendEl) pendEl.textContent = `${pendingOrders} Pesanan`;

  const totalRev = adminOrders
    .filter(o => o.status === 'PAID' || o.status === 'COMPLETED' || o.status === 'SHIPPED')
    .reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0);

  if (revEl) revEl.textContent = formatRupiah(totalRev);

  // Render recent orders table
  const recentBody = document.getElementById('recent-orders-body');
  if (recentBody) {
    if (adminOrders.length === 0) {
      recentBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--admin-text-sub);">Belum ada pesanan masuk.</td></tr>`;
    } else {
      recentBody.innerHTML = adminOrders.slice(0, 5).map(o => `
        <tr>
          <td><strong>${o.orderNumber || o.id}</strong></td>
          <td>${o.customer || o.recipientName || 'Pelanggan'}</td>
          <td>${formatRupiah(o.total || o.totalAmount || 0)}</td>
          <td><span class="badge-status status-${(o.status || 'PENDING').toLowerCase()}">${o.status}</span></td>
          <td>
            <button class="btn-icon" title="Lihat Detail" onclick="switchSection('orders')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  if (adminProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--admin-text-sub);">Belum ada data produk sayuran. Klik <strong>"+ Tambah Produk Baru"</strong> di atas untuk menambahkan produk pertama Anda.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminProducts.map(p => `
    <tr>
      <td><img src="${p.image}" alt="${p.name}" class="product-row-img"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category || 'Selada'}</td>
      <td>${formatRupiah(p.price)}</td>
      <td><span style="font-weight:700; color:var(--admin-text-main);">${p.stock} pack</span></td>
      <td><span class="badge-status status-paid">${p.badge || 'Segar'}</span></td>
      <td>
        <div class="action-btn-group">
          <button class="btn-icon" title="Edit Produk" onclick="openEditProductModal(${p.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-icon-danger" title="Hapus Produk" onclick="deleteProduct(${p.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderOrdersTable() {
  const tbody = document.getElementById('all-orders-table-body');
  if (!tbody) return;

  if (adminOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--admin-text-sub);">Belum ada pesanan masuk dari pelanggan.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminOrders.map(o => `
    <tr>
      <td><strong>${o.orderNumber || o.id}</strong></td>
      <td>
        <div style="font-weight:700; color:var(--admin-text-main);">${o.customer || o.recipientName || 'Pelanggan'}</div>
        <div style="font-size:12px; color:var(--admin-text-sub);">${o.address || o.shippingAddress || '-'}</div>
      </td>
      <td>${o.date || new Date().toLocaleDateString('id-ID')}</td>
      <td>${formatRupiah(o.total || o.totalAmount || 0)}</td>
      <td><span class="badge-status status-${(o.status || 'PENDING').toLowerCase()}">${o.status}</span></td>
      <td>
        <select style="padding:6px 10px; background:#ffffff; color:var(--admin-text-main); border:1px solid #cbd5e1; border-radius:6px; font-size:12px;" onchange="updateOrderStatus('${o.id}', this.value)">
          <option value="PENDING" ${o.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
          <option value="PAID" ${o.status === 'PAID' ? 'selected' : ''}>PAID</option>
          <option value="PROCESSING" ${o.status === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
          <option value="SHIPPED" ${o.status === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
          <option value="COMPLETED" ${o.status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
          <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
        </select>
      </td>
    </tr>
  `).join('');
}

// --------------------------------------------------------------------------
// Modal & Product CRUD Operations
// --------------------------------------------------------------------------
function openAddProductModal() {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('modal-product-title');
  const form = document.getElementById('product-form');

  if (form) form.reset();
  document.getElementById('product-id').value = '';
  if (title) title.textContent = 'Tambah Produk Baru';
  if (modal) modal.classList.add('active');
}

function openEditProductModal(productId) {
  const product = adminProducts.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-badge').value = product.badge || 'Panen';
  document.getElementById('product-image').value = product.image;

  const title = document.getElementById('modal-product-title');
  if (title) title.textContent = 'Edit Produk Sayur';

  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.add('active');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('active');
}

async function saveProduct(event) {
  event.preventDefault();
  const idVal = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value;
  const price = Number(document.getElementById('product-price').value);
  const stock = Number(document.getElementById('product-stock').value);
  const badge = document.getElementById('product-badge').value;
  const image = document.getElementById('product-image').value;
  const categoryId = document.getElementById('product-category').value;

  const token = localStorage.getItem('hydrofarm_token');

  if (idVal) {
    // Edit Product
    const pIndex = adminProducts.findIndex(p => p.id == idVal);
    if (pIndex > -1) {
      adminProducts[pIndex] = { ...adminProducts[pIndex], name, price, stock, badge, image };
    }
    // Attempt backend update
    if (token) {
      fetch(`${API_BASE_URL}/products/${idVal}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, price, stock, badge, image })
      }).catch(() => {});
    }
    alert('Produk berhasil diperbarui!');
  } else {
    // Create New Product
    const newId = adminProducts.length + 1;
    const newP = { id: newId, name, price, stock, badge, image, category: 'Selada', categoryId };
    adminProducts.push(newP);

    // Attempt backend create
    if (token) {
      fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newP)
      }).catch(() => {});
    }
    alert('Produk baru berhasil ditambahkan!');
  }

  closeProductModal();
  renderProductsTable();
  renderDashboard();
}

function deleteProduct(productId) {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
    adminProducts = adminProducts.filter(p => p.id !== productId);
    renderProductsTable();
    renderDashboard();

    const token = localStorage.getItem('hydrofarm_token');
    if (token) {
      fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
  }
}

function updateOrderStatus(orderId, newStatus) {
  const order = adminOrders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    renderDashboard();
    renderOrdersTable();

    const token = localStorage.getItem('hydrofarm_token');
    if (token) {
      fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      }).catch(() => {});
    }
    alert(`Status pesanan ${order.orderNumber || orderId} diperbarui menjadi ${newStatus}`);
  }
}
