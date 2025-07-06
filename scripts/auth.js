// --- PUSAT KONEKSI & KEAMANAN APLIKASI ---

// 1. Deklarasi koneksi HANYA DI SINI
const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// 2. Penjaga Halaman yang lebih baik
async function checkAuth() {
    const { data: { user } } = await supa.auth.getUser();
    const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/');

    if (!user && !isLoginPage) {
        // Jika tidak ada user dan BUKAN di halaman login, tendang!
        window.location.href = 'login.html';
    } else if (user && isLoginPage) {
        // Jika ada user tapi masih di halaman login, arahkan ke halaman utama
        window.location.href = 'index.html';
    }
}
checkAuth(); // Langsung jalankan penjaga


// 3. Logika untuk form login (jika ada di halaman ini)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        // ... kode login sama persis ...
    });
}

// 4. Logika untuk tombol logout (jika ada di halaman ini)
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await supa.auth.signOut();
        window.location.href = 'login.html';
    });
}