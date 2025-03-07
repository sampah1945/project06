/**
 * common.js - Fungsi umum yang digunakan di berbagai halaman aplikasi
 */

// Cek apakah user sudah login
function checkUserLoggedIn() {
    const userString = localStorage.getItem('user');
    if (!userString) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Update nama user di navbar
    const user = JSON.parse(userString);
    const userDisplayEl = document.getElementById('userDisplayName');
    if (userDisplayEl) {
        userDisplayEl.textContent = user.nama_lengkap;
    }
    
    return true;
}

// Handle logout
function setupLogout() {
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
}

// Setup sidebar toggle
function setupSidebar() {
    const sidebarToggle = document.getElementById('sidebarCollapse');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }
}

// Format currency to Rupiah
function formatRupiah(amount) {
    if (amount === null || amount === undefined) return 'Rp 0';
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Format date for display
function formatDateDisplay(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Format date for input
function formatDateInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Create status badge
function createStatusBadge(status) {
    let badgeClass = 'badge ';
    switch (status) {
        case 'terdaftar':
            badgeClass += 'bg-secondary';
            break;
        case 'ditugaskan':
            badgeClass += 'bg-info';
            break;
        case 'dalam perjalanan':
            badgeClass += 'bg-primary';
            break;
        case 'sampai tujuan':
            badgeClass += 'bg-warning';
            break;
        case 'selesai':
            badgeClass += 'bg-success';
            break;
        case 'dibatalkan':
            badgeClass += 'bg-danger';
            break;
        case 'belum dibayar':
            badgeClass += 'bg-danger';
            break;
        case 'dibayar sebagian':
            badgeClass += 'bg-warning';
            break;
        case 'lunas':
            badgeClass += 'bg-success';
            break;
        case 'aktif':
            badgeClass += 'bg-success';
            break;
        case 'tidak aktif':
            badgeClass += 'bg-danger';
            break;
        case 'diajukan':
            badgeClass += 'bg-info';
            break;
        case 'disetujui':
            badgeClass += 'bg-success';
            break;
        case 'ditolak':
            badgeClass += 'bg-danger';
            break;
        default:
            badgeClass += 'bg-secondary';
    }
    return `<span class="${badgeClass}">${formatStatus(status)}</span>`;
}

// Format status text
function formatStatus(status) {
    const statusMap = {
        'terdaftar': 'Terdaftar',
        'ditugaskan': 'Ditugaskan',
        'dalam perjalanan': 'Dalam Perjalanan',
        'sampai tujuan': 'Sampai Tujuan',
        'selesai': 'Selesai',
        'dibatalkan': 'Dibatalkan',
        'belum dibayar': 'Belum Dibayar',
        'dibayar sebagian': 'Dibayar Sebagian',
        'lunas': 'Lunas',
        'aktif': 'Aktif',
        'tidak aktif': 'Tidak Aktif',
        'diajukan': 'Diajukan',
        'disetujui': 'Disetujui',
        'ditolak': 'Ditolak'
    };
    return statusMap[status] || status;
}

// Show alert
function showAlert(type, message, container = '.container-fluid') {
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const containerEl = document.querySelector(container);
    containerEl.insertBefore(alertDiv, containerEl.firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            alertDiv.remove();
        }, 150);
    }, 5000);
}

// Get URL parameter
function getUrlParam(paramName) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(paramName);
}

// Read file as base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Generate random ID
function generateId(prefix = '') {
    return prefix + Math.random().toString(36).substr(2, 9);
}

// Load components
function loadComponents() {
    return new Promise((resolve) => {
        let componentsLoaded = 0;
        
        $("#sidebar-container").load("../components/sidebar.html", function() {
            componentsLoaded++;
            if (componentsLoaded === 2) resolve();
        });
        
        $("#navbar-container").load("../components/navbar.html", function() {
            componentsLoaded++;
            if (componentsLoaded === 2) resolve();
        });
    });
}

// Initialize common elements when document is ready
document.addEventListener('DOMContentLoaded', async () => {
    await loadComponents();
    if (checkUserLoggedIn()) {
        setupLogout();
        setupSidebar();
    }
});