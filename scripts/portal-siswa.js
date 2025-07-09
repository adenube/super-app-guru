// Koneksi Supabase sudah dibuat oleh auth.js
document.addEventListener('DOMContentLoaded', muatDataPortal);

async function muatDataPortal() {
    try {
        const { data: { user } } = await supa.auth.getUser();
        if (!user) { window.location.href = 'login.html'; return; }

        // Panggil "jurus sakti" di Supabase
        const { data: portalData, error } = await supa.rpc('get_portal_data_siswa', { auth_id: user.id });

        if (error) throw error;
        if (!portalData) {
            document.querySelector('main').innerHTML = '<p class="text-center text-red-500">Data siswa tidak tertaut dengan akun ini.</p>';
            return;
        }

        // Tampilkan semua data
        document.getElementById('nama-siswa').textContent = portalData.siswa.Nama_Lengkap;
        tampilkanBadge(portalData);
        tampilkanRiwayatNilai(portalData.riwayat);

    } catch (e) {
        console.error("Gagal memuat data portal:", e);
        document.querySelector('main').innerHTML = `<p class="text-center text-red-500">Terjadi kesalahan: ${e.message}</p>`;
    }
}

function tampilkanBadge(data) {
    const container = document.getElementById('galeri-badge');
    container.innerHTML = ''; // Kosongkan
    
    const rekapPresensi = data.presensi;
    const rekapKarakter = data.karakter;

    // Aturan 1: Badge Rajin Masuk
    if (rekapPresensi.hadir >= 10) { // Contoh: jika sudah hadir 10x
        container.innerHTML += createBadgeHTML('Rajin Masuk', 'Hadir 10+ kali', 'bg-blue-100 text-blue-800');
    }
    // Aturan 2: Badge Sikap Teladan
    if (rekapKarakter.sangat_baik >= 5) { // Contoh: jika dapat 5+ nilai "Sangat Baik"
        container.innerHTML += createBadgeHTML('Sikap Teladan', '5+ Penilaian Sangat Baik', 'bg-green-100 text-green-800');
    }
    // Aturan 3: Badge Tepat Waktu
    if (rekapPresensi.hadir > 0 && rekapPresensi.alpha === 0) {
        container.innerHTML += createBadgeHTML('Anti Alpha', 'Tidak pernah Alpha', 'bg-yellow-100 text-yellow-800');
    }
    
    if(container.innerHTML === '') {
        document.getElementById('loading-badge').textContent = 'Belum ada badge yang diraih. Semangat!';
    } else {
         document.getElementById('loading-badge').classList.add('hidden');
    }
}

function createBadgeHTML(nama, deskripsi, warna) {
    return `
        <div class="badge p-4 rounded-lg shadow-sm text-center ${warna}">
            <p class="font-bold">${nama}</p>
            <p class="text-xs mt-1">${deskripsi}</p>
        </div>
    `;
}

function tampilkanRiwayatNilai(riwayat) {
    const container = document.getElementById('riwayat-nilai-container');
    container.innerHTML = '';
    if (!riwayat || riwayat.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Belum ada riwayat penilaian.</p>';
        return;
    }

    riwayat.forEach(nilai => {
        const card = document.createElement('div');
        card.className = `border rounded-lg p-4 ${nilai.Jenis_Nilai === 'Kognitif' ? 'bg-blue-50' : 'bg-green-50'}`;
        const nilaiTampil = nilai.Jenis_Nilai === 'Kognitif' ? `<p class="text-2xl font-bold text-blue-700">${nilai.Nilai_Skor}</p>` : `<p class="text-xl font-bold text-green-700">${nilai.Nilai_Deskriptif}</p>`;
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div><p class="font-semibold text-gray-800">${nilai.Aspek_Yang_Dinilai}</p><p class="text-sm text-gray-500">${nilai.Topik_Bahasan || 'Kegiatan Umum'}</p></div>
                <p class="text-xs text-gray-500">${new Date(nilai.Tanggal_Penilaian).toLocaleDateString('id-ID')}</p>
            </div>
            <div class="flex justify-between items-end mt-3 pt-3 border-t">
                <div><p class="text-xs font-semibold text-gray-500">Umpan Balik Guru:</p><p class="text-sm italic text-indigo-800">"${nilai.Umpan_Balik_Siswa || 'Terus tingkatkan!'}"</p></div>
                ${nilaiTampil}
            </div>
        `;
        container.appendChild(card);
    });
}