// ISI DENGAN KUNCI SUPABASE-MU
const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', function() {
    console.log("Halaman Penilaian Siap!");
    loadDropdowns();
    // Nanti kita tambahkan event listener untuk form dan tabel
});

async function loadDropdowns() {
    try {
        // Ambil data siswa untuk dropdown
        const { data: siswaData, error: siswaError } = await supa.from('Siswa').select('id, Nama_Lengkap');
        if (siswaError) throw siswaError;
        
        const siswaSelect = document.getElementById('pilihSiswa');
        siswaSelect.innerHTML = '<option value="">Pilih Siswa</option>';
        siswaData.forEach(siswa => {
            siswaSelect.innerHTML += `<option value="${siswa.id}">${siswa.Nama_Lengkap}</option>`;
        });

        // Ambil data topik untuk dropdown
        const { data: topikData, error: topikError } = await supa.from('RencanaAjar').select('id, Topik_Bahasan');
        if (topikError) throw topikError;

        const topikSelect = document.getElementById('pilihTopik');
        topikSelect.innerHTML = '<option value="">Pilih Topik</option>';
        topikData.forEach(topik => {
            topikSelect.innerHTML += `<option value="${topik.id}">${topik.Topik_Bahasan}</option>`;
        });

    } catch (error) {
        alert("Gagal memuat data dropdown: " + error.message);
    }
}