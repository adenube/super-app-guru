document.addEventListener('DOMContentLoaded', function() {
    // --- Logika untuk Tombol Hamburger ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Logika untuk Tombol Logout (Desktop & Mobile) ---
    const logoutButton = document.getElementById('logout-button');
    const logoutButtonMobile = document.getElementById('logout-button-mobile');

    const handleLogout = async () => {
        if (confirm("Apakah Anda yakin ingin keluar?")) {
            // Pastikan 'supa' bisa diakses dari sini (dideklarasikan di auth.js)
            if (typeof supa !== 'undefined') {
                await supa.auth.signOut();
                window.location.href = 'login.html';
            } else {
                console.error("Koneksi Supabase (supa) tidak ditemukan.");
            }
        }
    };

    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (logoutButtonMobile) logoutButtonMobile.addEventListener('click', handleLogout);


    // --- Logika untuk menandai menu aktif ---
    // Dapatkan nama file saat ini, misal: "dashboard.html"
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'; 
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        // Dapatkan href dari link, misal: "dashboard.html"
        const linkPage = link.getAttribute('href');
        
        if (linkPage === currentPage) {
            link.classList.add('text-blue-600', 'border-b-2', 'border-blue-600', 'font-semibold');
        } else {
            link.classList.add('text-gray-700', 'hover:text-blue-600');
        }
    });
});