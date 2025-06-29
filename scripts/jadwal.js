const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    tampilkanHeaderTanggal();
    muatJadwalHariIni();
});

function tampilkanHeaderTanggal() {
    const sekarang = new Date();
    const namaHari = sekarang.toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggalLengkap = sekarang.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('headerHari').textContent = `Jadwal Hari ${namaHari}`;
    document.getElementById('headerTanggal').textContent = tanggalLengkap;
}

async function muatJadwalHariIni() {
    const container = document.getElementById('jadwal-container');
    const viewKosong = document.getElementById('jadwal-kosong');
    container.innerHTML = '<p class="text-center text-gray-500">Mencari jadwal...</p>';

    const namaHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

    try {
        const { data, error } = await supa
            .from('Jadwal')
            .select(`*, RencanaAjar(Topik_Bahasan)`)
            .eq('Hari', namaHariIni)
            .order('Jam_Mulai');

        if (error) throw error;

        if (data.length === 0) {
            container.innerHTML = '';
            viewKosong.classList.remove('hidden');
            return;
        }

        container.innerHTML = '';
        viewKosong.classList.add('hidden');

        data.forEach(jadwal => {
            const card = document.createElement('div');
            card.className = 'schedule-card rounded-lg shadow-lg p-6 flex items-center space-x-6';
            
            const jamMulai = jadwal.Jam_Mulai.substring(0, 5);
            const jamSelesai = jadwal.Jam_Selesai.substring(0, 5);
            const topikBahasan = jadwal.RencanaAjar ? jadwal.RencanaAjar.Topik_Bahasan : 'Topik Telah Dihapus';

            card.innerHTML = `
                <div class="text-center flex-shrink-0">
                    <p class="text-2xl font-bold">${jamMulai}</p>
                    <p class="text-sm opacity-80">sampai</p>
                    <p class="text-lg font-medium">${jamSelesai}</p>
                </div>
                <div class="border-l-2 border-white/50 pl-6">
                    <p class="text-2xl font-bold">${topikBahasan}</p>
                    <p class="text-lg font-light opacity-90">Kelas ${jadwal.Kelas}</p>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        container.innerHTML = `<p class="text-center text-red-500">Gagal memuat jadwal: ${e.message}</p>`;
    }
}

// Untuk sementara, kita belum buat fungsi tambah/edit jadwal.
// Lo bisa isi datanya langsung dari Supabase Table Editor dulu untuk tes.
// Cukup isi kolom: Hari (e.g., 'Senin'), Jam_Mulai (e.g., '07:00'), Jam_Selesai (e.g., '08:30'),
// ID_Topik (pilih dari RencanaAjar), dan Kelas (e.g., '7A').