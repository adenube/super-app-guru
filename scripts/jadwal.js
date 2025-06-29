const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    tampilkanHeaderTanggal();
    muatJadwalHariIni();
    
    // Kita akan tambahkan event listener untuk form nanti saat form-nya sudah kita buat
    // document.getElementById('tombolTambahJadwal').addEventListener('click', tampilkanFormAturJadwal);
});

function tampilkanHeaderTanggal() {
    const sekarang = new Date();
    const namaHari = sekarang.toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggalLengkap = sekarang.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('headerHari').textContent = `Jadwal Hari Ini: ${namaHari}`;
    document.getElementById('headerTanggal').textContent = tanggalLengkap;
}

async function muatJadwalHariIni() {
    const container = document.getElementById('jadwal-harian-container');
    container.innerHTML = '<p class="text-center text-gray-500">Mencari jadwal...</p>';

    const namaHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

    try {
        const { data, error } = await supa
            .from('Jadwal')
            .select('*')
            .eq('Hari', namaHariIni)
            .order('Jam_Mulai');

        if (error) throw error;
        
        container.innerHTML = ''; // Kosongkan container

        if (data.length === 0) {
            container.innerHTML = `
            <div class="text-center mt-10 p-6 bg-white rounded-lg shadow-md">
                <svg class="mx-auto h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l-3 3m0 0l-3-3m3 3v12a2 2 0 002 2h3a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <h3 class="mt-4 text-xl font-medium text-gray-700">Hore, Santai Dulu!</h3>
                <p class="mt-1 text-gray-500">Tidak ada jadwal mengajar hari ini.</p>
            </div>
            `;
            return;
        }

        data.forEach(jadwal => {
            const card = document.createElement('div');
            const jamSelesai = jadwal.Jam_Selesai;
            const waktuSekarang = new Date().toTimeString().substring(0, 5);
            
            // Cek apakah jadwal sudah lewat
            const isPast = waktuSekarang > jamSelesai;
            
            card.className = `schedule-card-mini rounded-lg shadow p-6 flex items-center space-x-6 ${isPast ? 'is-past' : ''}`;
            
            const jamMulai = jadwal.Jam_Mulai.substring(0, 5);

            card.innerHTML = `
                <div class="text-center flex-shrink-0">
                    <p class="text-2xl font-bold">${jamMulai}</p>
                </div>
                <div class="border-l-2 border-white/30 pl-6 flex-grow">
                    <p class="text-2xl font-bold">${jadwal.Mata_Pelajaran}</p>
                    <p class="text-lg font-light opacity-90">Kelas ${jadwal.Kelas}</p>
                </div>
                ${isPast ? '<span class="text-xs font-semibold bg-white/30 py-1 px-2 rounded-full">SELESAI</span>' : ''}
            `;
            container.appendChild(card);
        });

    } catch(e) {
        container.innerHTML = `<p class="text-center text-red-500">Gagal memuat jadwal hari ini: ${e.message}</p>`;
    }
}

function tampilkanNotifikasi(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-yellow-500');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-md shadow-lg text-white transition-all duration-300 z-50 ${bgColor}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}