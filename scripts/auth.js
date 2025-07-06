const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Penjaga halaman
(async () => {
    const { data: { session } } = await supa.auth.getSession();
    const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname === '/';
    
    if (!session && !isLoginPage) {
        window.location.href = 'login.html';
    } else if (session && isLoginPage) {
        // Jika sudah login dan masih di halaman login, arahkan sesuai role
        const role = session.user.user_metadata.role || 'siswa';
        if (role === 'guru') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'portal-siswa.html'; // Nanti kita buat halaman ini
        }
    }
})();


// Logika form login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';
        
        try {
            const { data, error } = await supa.auth.signInWithPassword({ email, password });
            if (error) throw error;

            // Cek role setelah berhasil login
            const role = data.user.user_metadata.role || 'siswa';
            if (role === 'guru') {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'portal-siswa.html'; // Halaman untuk siswa
            }
        } catch (error) {
            errorMessage.textContent = 'Login gagal: ' + error.message;
        }
    });
}

// Logika tombol logout
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await supa.auth.signOut();
        window.location.href = 'login.html';
    });
}