const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let riwayatNilaiCache = [];
let riwayatCurrentPage = 1;
const riwayatRowsPerPage = 3;

document.addEventListener('DOMContentLoaded', function() {
    loadDropdowns();
    document.getElementById('formNilai').addEventListener('submit', handleSimpanNilai);
    document.getElementById('filterKelas').addEventListener('change', handleFilterKelasForm);
    
    // Listener untuk filter riwayat
    document.getElementById('filterKelasRiwayat').addEventListener('change', () => muatRiwayatNilai(true));
    document.getElementById('filterTopikRiwayat').addEventListener('change', () => muatRiwayatNilai(true));
    
    // Listener untuk paginasi dan download
    document.getElementById('riwayatPaginationControls').addEventListener('click', handleRiwayatPaginasi);
    document.getElementById('downloadRiwayatBtn').addEventListener('click', handleDownload);

    muatRiwayatNilai();
});

async function loadDropdowns() {
    try {
        const [kelasResult, topikResult] = await Promise.all([
            supa.from('Siswa').select('Kelas').order('Kelas'),
            supa.from('RencanaAjar').select('id, Topik_Bahasan').order('Topik_Bahasan')
        ]);

        if (kelasResult.error) throw kelasResult.error;
        const daftarKelas = [...new Set(kelasResult.data.map(item => item.Kelas))];
        const filterDropdownForm = document.getElementById('filterKelas');
        const filterDropdownRiwayat = document.getElementById('filterKelasRiwayat');
        // ... (logika isi dropdown kelas sama)

        if (topikResult.error) throw topikResult.error;
        const topikData = topikResult.data;
        const topikSelectForm = document.getElementById('pilihTopik');
        const topikSelectRiwayat = document.getElementById('filterTopikRiwayat');
        // ... (logika isi dropdown topik sama untuk form dan riwayat)

    } catch (error) {
        tampilkanNotifikasi('Gagal memuat data dropdown: ' + error.message, 'error');
    }
}

// --- FUNGSI RIWAYAT YANG DI-UPGRADE DENGAN FILTER GANDA ---
async function muatRiwayatNilai(dariFilter = false) {
    const container = document.getElementById('riwayatNilaiContainer');
    const kelasTerpilih = document.getElementById('filterKelasRiwayat').value;
    const topikTerpilih = document.getElementById('filterTopikRiwayat').value; // Filter baru
    container.innerHTML = '<p class="text-center text-gray-500">Memuat riwayat...</p>';
    if (dariFilter) riwayatCurrentPage = 1;

    try {
        let query = supa.from('Nilai')
            .select(`id, Tanggal_Penilaian, Aspek_Yang_Dinilai, Nilai_Deskriptif, Umpan_Balik_Siswa, Siswa ( Nama_Lengkap, Kelas )`, { count: 'exact' })
            .eq('Jenis_Nilai', 'Karakter');

        // Terapkan filter topik jika ada
        if (topikTerpilih) {
            query = query.eq('ID_Topik', topikTerpilih);
        }
        
        // Terapkan filter kelas jika ada (setelah filter topik)
        if (kelasTerpilih) {
            // Ini cara yang lebih baik untuk filter relasi
            const { data: siswaIds, error } = await supa.from('Siswa').select('id').eq('Kelas', kelasTerpilih);
            if (error) throw error;
            query = query.in('ID_Siswa', siswaIds.map(s => s.id));
        }

        query = query.order('Tanggal_Penilaian', { ascending: false }).order('created_at', { ascending: false });
        const startIndex = (riwayatCurrentPage - 1) * riwayatRowsPerPage;
        query = query.range(startIndex, startIndex + riwayatRowsPerPage - 1);

        const { data, error, count } = await query;
        if (error) throw error;
        
        riwayatNilaiCache = data;
        gambarRiwayat(count);

    } catch (error) {
        tampilkanNotifikasi('Gagal memuat riwayat: ' + error.message, 'error');
        container.innerHTML = '<p class="text-center text-red-500">Gagal memuat riwayat.</p>';
    }
}

// --- FUNGSI BARU UNTUK DOWNLOAD CSV ---
function handleDownload() {
    tampilkanNotifikasi('Mempersiapkan data unduhan...', 'success');
    // Ambil data yang sedang ditampilkan di cache
    const dataToExport = riwayatNilaiCache.map(nilai => {
        return {
            Tanggal: new Date(nilai.Tanggal_Penilaian).toLocaleDateString('id-ID'),
            Nama_Siswa: nilai.Siswa.Nama_Lengkap,
            Kelas: nilai.Siswa.Kelas,
            Aspek_Dinilai: nilai.Aspek_Yang_Dinilai,
            Nilai: nilai.Nilai_Deskriptif,
            Umpan_Balik: `"${nilai.Umpan_Balik_Siswa || ''}"` // Bungkus dengan kutip untuk menangani koma
        };
    });

    if (dataToExport.length === 0) {
        tampilkanNotifikasi('Tidak ada data untuk di-download.', 'warning');
        return;
    }

    // Ubah data menjadi format CSV
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    // Buat link download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_nilai_karakter.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- FUNGSI-FUNGSI LAINNYA TIDAK BERUBAH ---
// (handleFilterKelasForm, handleSimpanNilai, gambarRiwayat, gambarRiwayatPaginasi, handleRiwayatPaginasi, tampilkanNotifikasi)

async function handleSimpanNilai(e) {
    e.preventDefault();
    const tombolSimpan = document.getElementById('tombolSimpanNilai');
    tombolSimpan.disabled = true;
    tombolSimpan.innerHTML = "Menyimpan...";
    const nilaiDeskriptifTerpilih = document.querySelector('input[name="nilaiDeskriptif"]:checked');
    const dataForm = {
        ID_Siswa: document.getElementById('pilihSiswa').value,
        ID_Topik: document.getElementById('pilihTopik').value,
        Tanggal_Penilaian: new Date().toISOString().slice(0, 10),
        Jenis_Nilai: 'Karakter',
        Aspek_Yang_Dinilai: document.getElementById('aspekDinilai').value,
        Nilai_Skor: null,
        Nilai_Deskriptif: nilaiDeskriptifTerpilih ? nilaiDeskriptifTerpilih.value : null,
        Umpan_Balik_Siswa: document.getElementById('umpanBalik').value
    };
    if (!dataForm.ID_Siswa || !dataForm.ID_Topik || !dataForm.Aspek_Yang_Dinilai || !dataForm.Nilai_Deskriptif) {
        tampilkanNotifikasi('Siswa, Topik, Aspek, dan Nilai Deskriptif wajib diisi.', 'error');
        tombolSimpan.disabled = false;
        tombolSimpan.innerHTML = "Simpan Nilai";
        return;
    }
    try {
        const { error } = await supa.from('Nilai').insert([dataForm]);
        if (error) throw error;
        tampilkanNotifikasi('Sukses! Nilai karakter berhasil disimpan.', 'success');
        document.getElementById('formNilai').reset();
        document.getElementById('pilihSiswa').innerHTML = '<option value="">Pilih Siswa</option>';
        document.getElementById('filterKelas').value = '';
        muatRiwayatNilai(true);
    } catch (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
    } finally {
        tombolSimpan.disabled = false;
        tombolSimpan.innerHTML = "Simpan Nilai";
    }
}

// GANTI FUNGSI muatRiwayatNilai YANG LAMA DENGAN VERSI BARU INI
async function muatRiwayatNilai(dariFilter = false) {
    const container = document.getElementById('riwayatNilaiContainer');
    const kelasTerpilih = document.getElementById('filterKelasRiwayat').value;
    container.innerHTML = '<p class="text-center text-gray-500">Memuat riwayat...</p>';
    
    if (dariFilter) {
        riwayatCurrentPage = 1; // Jika dipicu oleh filter, selalu kembali ke halaman 1
    }

    try {
        // Kita bangun query-nya langkah demi langkah
        let query = supa.from('Nilai')
            .select(`
                id, Tanggal_Penilaian, Aspek_Yang_Dinilai, Nilai_Deskriptif, Umpan_Balik_Siswa,
                Siswa ( Nama_Lengkap, Kelas )
            `, { count: 'exact' })
            .eq('Jenis_Nilai', 'Karakter')
            .order('Tanggal_Penilaian', { ascending: false })
            .order('created_at', { ascending: false });

        // INI BAGIAN PERBAIKANNYA:
        // Kita tidak bisa memfilter di tabel 'Siswa' secara langsung seperti kemarin.
        // Cara yang benar adalah dengan mengambil dulu ID siswa dari kelas yang dipilih.
        if (kelasTerpilih) {
            // 1. Ambil dulu semua ID siswa yang ada di kelas yang dipilih
            const { data: siswaDiKelas, error: siswaError } = await supa
                .from('Siswa')
                .select('id')
                .eq('Kelas', kelasTerpilih);
            
            if (siswaError) throw siswaError;

            const idSiswaDiKelas = siswaDiKelas.map(s => s.id);

            // 2. Jika tidak ada siswa di kelas itu, tampilkan pesan kosong
            if (idSiswaDiKelas.length === 0) {
                 riwayatNilaiCache = [];
                 gambarRiwayat(0);
                 return;
            }

            // 3. Baru kita filter tabel Nilai berdasarkan daftar ID siswa tersebut
            query = query.in('ID_Siswa', idSiswaDiKelas);
        }
        
        const startIndex = (riwayatCurrentPage - 1) * riwayatRowsPerPage;
        query = query.range(startIndex, startIndex + riwayatRowsPerPage - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        riwayatNilaiCache = data;
        gambarRiwayat(count); // Kirim total data ke fungsi gambar

    } catch (error) {
        tampilkanNotifikasi('Gagal memuat riwayat: ' + error.message, 'error');
        container.innerHTML = '<p class="text-center text-red-500">Gagal memuat riwayat.</p>';
    }
}

function gambarRiwayat(totalRows) {
    const container = document.getElementById('riwayatNilaiContainer');
    container.innerHTML = '';
    if (riwayatNilaiCache.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">Tidak ada riwayat penilaian untuk pilihan ini.</p>';
    } else {
        riwayatNilaiCache.forEach(nilai => {
            const card = document.createElement('div');
            card.className = 'bg-gray-50 border rounded-lg p-4 transition hover:shadow-md';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div><p class="font-bold text-blue-700">${nilai.Siswa.Nama_Lengkap}</p><p class="text-sm text-gray-600">${nilai.Siswa.Kelas}</p></div>
                    <p class="text-xs text-gray-500">${new Date(nilai.Tanggal_Penilaian).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                </div>
                <div class="mt-3 pt-3 border-t">
                    <p class="text-sm"><span class="font-semibold">Aspek:</span> ${nilai.Aspek_Yang_Dinilai}</p>
                    <p class="text-sm"><span class="font-semibold">Nilai:</span> <span class="font-bold text-green-700">${nilai.Nilai_Deskriptif}</span></p>
                    <p class="text-sm mt-2 italic text-indigo-800">"${nilai.Umpan_Balik_Siswa || 'Tidak ada umpan balik.'}"</p>
                </div>`;
            container.appendChild(card);
        });
    }
    gambarRiwayatPaginasi(totalRows);
}

function gambarRiwayatPaginasi(totalRows) {
    const paginationControls = document.getElementById('riwayatPaginationControls');
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(totalRows / riwayatRowsPerPage);
    if (totalPages <= 1) return;
    
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.className = 'px-3 py-1 rounded-md border bg-white text-gray-600 hover:bg-gray-100';
    prevButton.dataset.page = riwayatCurrentPage - 1;
    if (riwayatCurrentPage === 1) { prevButton.disabled = true; prevButton.classList.add('opacity-50'); }
    paginationControls.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.dataset.page = i;
        pageButton.className = 'px-3 py-1 rounded-md border ' + (i === riwayatCurrentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-100');
        paginationControls.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.className = 'px-3 py-1 rounded-md border bg-white text-gray-600 hover:bg-gray-100';
    nextButton.dataset.page = riwayatCurrentPage + 1;
    if (riwayatCurrentPage === totalPages) { nextButton.disabled = true; nextButton.classList.add('opacity-50'); }
    paginationControls.appendChild(nextButton);
}

function handleRiwayatPaginasi(e) {
    if (e.target.dataset.page) {
        riwayatCurrentPage = parseInt(e.target.dataset.page, 10);
        muatRiwayatNilai();
    }
}

function tampilkanNotifikasi(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-yellow-500');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-md shadow-lg text-white transition-all duration-300 z-50 ${bgColor}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => { notification.remove(); }, 300);
    }, 3000);
}