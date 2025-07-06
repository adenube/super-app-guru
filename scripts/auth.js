const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const { data, error } = await supa.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Jika berhasil login, arahkan ke halaman utama
        console.log('Login berhasil!', data);
        window.location.href = 'jadwal.html'; // Arahkan ke halaman Manajemen Siswa,Jadwal

    } catch (error) {
        console.error('Error login:', error);
        errorMessage.textContent = 'Login gagal: ' + error.message;
    }
});