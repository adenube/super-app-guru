// scripts/main.js

document.addEventListener('DOMContentLoaded', function() {
    // --- Logika untuk Tombol Hamburger ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
	
	// --- Logika untuk menandai menu aktif ---
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('text-blue-600', 'border-b-2', 'border-blue-600', 'font-semibold');
        } else {
            link.classList.add('text-gray-700', 'hover:text-blue-600');
        }
    });

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
            await supa.auth.signOut();
            window.location.href = 'login.html';
        }
    };

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    if (logoutButtonMobile) {
        logoutButtonMobile.addEventListener('click', handleLogout);
    }
});