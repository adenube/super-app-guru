// Koneksi Supabase sudah dibuat oleh auth.js, jadi kita tidak perlu deklarasi ulang

document.addEventListener('DOMContentLoaded', () => {
    muatDataPortal();
});

async function muatDataPortal() {
    try {
        // 1. Dapatkan data user yang sedang login saat ini
        const { data: { user } } = await supa.auth.getUser();

        if (!user) {
            console.log("Tidak ada user login, diarahkan ke login.");
            return; // Penjaga di auth.js akan menangani redirect
        }

        // 2. Dapatkan data siswa dari tabel 'Siswa' berdasarkan auth_user_id
        const { data: siswaData, error: siswaError } = await supa
            .from('Siswa')
            .select('id, Nama_Lengkap')
            .eq('auth_user_id', user.id)
            .single(); // Ambil hanya satu baris

        if (siswaError) throw siswaError;
        if (!siswaData) {
            document.getElementById('nama-siswa').textContent = 'Siswa Tidak Dikenal';
            throw new Error("Data siswa tidak ditemukan di database.");
        }
        
        document.getElementById('nama-siswa').textContent = siswaData.Nama_Lengkap;

        // 3. Dapatkan semua nilai untuk siswa ini
        const { data: nilaiData, error: nilaiError } = await supa
            .from('Nilai')
            .select(`*, RencanaAjar(Topik_Bahasan)`)
            .eq('ID_Siswa', siswaData.id)
            .order('Tanggal_Penilaian', { ascending: false });

        if (nilaiError) throw nilaiError;

        tampilkanNilai(nilaiData);

    } catch(error) {
        console.error("Gagal memuat data portal:", error);
        document.getElementById('nilai-container').innerHTML = `<p class="text-red-500">Terjadi kesalahan saat memuat data.</p>`;
    }
}

function tampilkanNilai(daftarNilai) {
    const container = document.getElementById('nilai-container');
    container.innerHTML = '';

    if (daftarNilai.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Belum ada penilaian yang dimasukkan.</p>';
        return;
    }

    daftarNilai.forEach(nilai => {
        const card = document.createElement('div');
        card.className = `border rounded-lg p-4 ${nilai.Jenis_Nilai === 'Kognitif' ? 'bg-blue-50' : 'bg-green-50'}`;
        
        const nilaiTampil = nilai.Jenis_Nilai === 'Kognitif' 
            ? `<p class="text-2xl font-bold text-blue-700">${nilai.Nilai_Skor}</p>`
            : `<p class="text-xl font-bold text-green-700">${nilai.Nilai_Deskriptif}</p>`;

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-gray-800">${nilai.Aspek_Yang_Dinilai}</p>
                    <p class="text-sm text-gray-500">${nilai.RencanaAjar ? nilai.RencanaAjar.Topik_Bahasan : 'Kegiatan Umum'}</p>
                </div>
                <p class="text-xs text-gray-500">${new Date(nilai.Tanggal_Penilaian).toLocaleDateString('id-ID')}</p>
            </div>
            <div class="flex justify-between items-end mt-3 pt-3 border-t">
                <div>
                    <p class="text-xs font-semibold text-gray-500">Umpan Balik Guru:</p>
                    <p class="text-sm italic text-indigo-800">"${nilai.Umpan_Balik_Siswa || 'Terus tingkatkan!'}"</p>
                </div>
                ${nilaiTampil}
            </div>
        `;
        container.appendChild(card);
    });
}