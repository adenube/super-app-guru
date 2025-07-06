const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- PENJAGA HALAMAN ---
// Cek apakah ada user yang login. Jika tidak, tendang ke halaman login.
// Pengecualian: jangan jalankan ini di halaman login itu sendiri.
if (!window.location.pathname.endsWith('login.html')) {
    const user = supa.auth.getUser().then(response => {
        if (!response.data.user) {
            window.location.href = 'login.html';
        }
    });
}


// --- LOGIKA UNTUK HALAMAN LOGIN ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    const errorMessage = document.getElementById('error-message');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const { data, error } = await supa.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.href = 'index.html';
        } catch (error) {
            errorMessage.textContent = 'Login gagal: ' + error.message;
        }
    });
}

// --- LOGIKA UNTUK TOMBOL LOGOUT ---
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        const { error } = await supa.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        } else {
            // Arahkan ke halaman login setelah berhasil logout
            window.location.href = 'login.html';
        }
    });
}