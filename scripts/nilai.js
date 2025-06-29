const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let riwayatNilaiCache = [];
let riwayatCurrentPage = 1;
const riwayatRowsPerPage = 3;

document.addEventListener('DOMContentLoaded', function() {
    loadDropdowns();
    document.getElementById('filterKelas').addEventListener('change', handleFilterKelasForm);
    document.getElementById('formNilai').addEventListener('submit', handleSimpanNilai);
    document.getElementById('filterKelasRiwayat').addEventListener('change', () => muatRiwayatNilai(true));
    document.getElementById('filterTopikRiwayat').addEventListener('change', () => muatRiwayatNilai(true));
    document.getElementById('riwayatPaginationControls').addEventListener('click', handleRiwayatPaginasi);
    document.getElementById('downloadRiwayatBtn').addEventListener('click', handleDownload);
	document.getElementById('tombolImport').addEventListener('click', handleImport);
    muatRiwayatNilai();
});

async function loadDropdowns() {
    try {
        const [kelasResult, topikResult] = await Promise.all([
            supa.from('Siswa').select('Kelas').order('Kelas'),
            supa.from('RencanaAjar').select('id, Topik_Bahasan').order('Topik_Bahasan')
        ]);

        if (kelasResult.error) throw kelasResult.error;
        const daftarKelas = [...new Set(kelasResult.data.map(item => item.Kelas))].sort();
        const filterDropdownForm = document.getElementById('filterKelas');
        const filterDropdownRiwayat = document.getElementById('filterKelasRiwayat');
        filterDropdownForm.innerHTML = '<option value="">Pilih Kelas</option>';
        filterDropdownRiwayat.innerHTML = '<option value="">Semua Kelas</option>';
        daftarKelas.forEach(kelas => {
            if (kelas) {
                filterDropdownForm.innerHTML += `<option value="${kelas}">${kelas}</option>`;
                filterDropdownRiwayat.innerHTML += `<option value="${kelas}">${kelas}</option>`;
            }
        });

        if (topikResult.error) throw topikResult.error;
        const topikData = topikResult.data;
        const topikSelectForm = document.getElementById('pilihTopik');
        const topikSelectRiwayat = document.getElementById('filterTopikRiwayat');
        topikSelectForm.innerHTML = '<option value="">Pilih Topik/Kegiatan</option>';
        topikSelectRiwayat.innerHTML = '<option value="">Semua Topik</option>';
        if (topikData && topikData.length > 0) {
            topikData.forEach(topik => {
                topikSelectForm.innerHTML += `<option value="${topik.id}">${topik.Topik_Bahasan}</option>`;
                topikSelectRiwayat.innerHTML += `<option value="${topik.id}">${topik.Topik_Bahasan}</option>`;
            });
        } else {
            topikSelectForm.innerHTML += '<option value="" disabled>Buat Rencana Ajar dahulu</option>';
        }
    } catch (error) {
        tampilkanNotifikasi('Gagal memuat data dropdown: ' + error.message, 'error');
    }
}

async function handleFilterKelasForm() {
    const kelasTerpilih = document.getElementById('filterKelas').value;
    const siswaDropdown = document.getElementById('pilihSiswa');
    siswaDropdown.innerHTML = '<option value="">Memuat siswa...</option>';
    if (!kelasTerpilih) {
        siswaDropdown.innerHTML = '<option value="">Pilih Kelas Dulu</option>';
        return;
    }
    try {
        const { data, error } = await supa.from('Siswa').select('id, Nama_Lengkap').eq('Kelas', kelasTerpilih).order('Nama_Lengkap');
        if (error) throw error;
        siswaDropdown.innerHTML = '<option value="">Pilih Siswa</option>';
        data.forEach(siswa => {
            siswaDropdown.innerHTML += `<option value="${siswa.id}">${siswa.Nama_Lengkap}</option>`;
        });
    } catch (error) {
        tampilkanNotifikasi('Gagal memuat daftar siswa: ' + error.message, 'error');
    }
}

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

async function muatRiwayatNilai(dariFilter = false) {
    const container = document.getElementById('riwayatNilaiContainer');
    const kelasTerpilih = document.getElementById('filterKelasRiwayat').value;
    const topikTerpilih = document.getElementById('filterTopikRiwayat').value;
    container.innerHTML = '<p class="text-center text-gray-500">Memuat riwayat...</p>';
    if (dariFilter) riwayatCurrentPage = 1;

    try {
        let query = supa.from('Nilai')
            .select(`id, Tanggal_Penilaian, Aspek_Yang_Dinilai, Nilai_Deskriptif, Umpan_Balik_Siswa, Siswa!inner(Nama_Lengkap, Kelas)`, { count: 'exact' })
            .eq('Jenis_Nilai', 'Karakter');
        
        if (kelasTerpilih) {
            query = query.eq('Siswa.Kelas', kelasTerpilih);
        }
        if (topikTerpilih) {
            query = query.eq('ID_Topik', topikTerpilih);
        }
        
        const startIndex = (riwayatCurrentPage - 1) * riwayatRowsPerPage;
        const { data, error, count } = await query
            .order('Tanggal_Penilaian', { ascending: false })
            .order('created_at', { ascending: false })
            .range(startIndex, startIndex + riwayatRowsPerPage - 1);
        
        if (error) throw error;
        riwayatNilaiCache = data;
        gambarRiwayat(count);
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
    if (e.target && e.target.dataset.page) {
        riwayatCurrentPage = parseInt(e.target.dataset.page, 10);
        muatRiwayatNilai();
    }
}

function handleDownload() {
    tampilkanNotifikasi('Mempersiapkan data unduhan...', 'success');
    const dataToExport = riwayatNilaiCache.map(nilai => {
        return {
            Tanggal: new Date(nilai.Tanggal_Penilaian).toLocaleDateString('id-ID'),
            Nama_Siswa: nilai.Siswa.Nama_Lengkap,
            Kelas: nilai.Siswa.Kelas,
            Aspek_Dinilai: nilai.Aspek_Yang_Dinilai,
            Nilai: nilai.Nilai_Deskriptif,
            Umpan_Balik: `"${(nilai.Umpan_Balik_Siswa || '').replace(/"/g, '""')}"`
        };
    });
    if (dataToExport.length === 0) {
        tampilkanNotifikasi('Tidak ada data untuk di-download.', 'warning');
        return;
    }
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
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

// --- FUNGSI BARU UNTUK IMPORT CSV ---
// GANTI FUNGSI HANDLEIMPORT YANG LAMA DENGAN VERSI BARU INI
function handleImport() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        tampilkanNotifikasi('Silakan pilih file CSV terlebih dahulu.', 'warning');
        return;
    }

    const file = fileInput.files[0];
    const tombolImport = document.getElementById('tombolImport');
    tombolImport.disabled = true;
    tombolImport.innerHTML = "Memproses...";

    // Gunakan PapaParse untuk membaca file CSV
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
			// ===== TAMBAHKAN CCTV DI SINI =====
            console.log("Header dari CSV:", results.meta.fields);
            console.log("Baris data pertama:", results.data[0]);
            // ==================================
            const dataToImport = results.data;
            console.log("Data setelah di-parse oleh PapaParse:", dataToImport); // CCTV untuk lihat hasil parse

            if (!dataToImport || dataToImport.length === 0) {
                tampilkanNotifikasi('File CSV kosong atau formatnya salah.', 'error');
                tombolImport.disabled = false;
                tombolImport.innerHTML = "Import & Simpan Nilai";
                return;
            }

            // Pastikan format header benar
            const barisPertama = dataToImport[0];
            if (!('Nama_Lengkap' in barisPertama && 'Kelas' in barisPertama && 'Topik_Bahasan' in barisPertama && 'Nilai_Skor' in barisPertama)) {
                tampilkanNotifikasi('Format kolom CSV salah!', 'error');
                tombolImport.disabled = false;
                tombolImport.innerHTML = "Import & Simpan Nilai";
                return;
            }

            tampilkanNotifikasi(`Mencoba mengimpor ${dataToImport.length} data...`, 'success');

            try {
                // Panggil fungsi SQL 'import_nilai_massal' di Supabase
                const { data, error } = await supa.rpc('import_nilai_massal', { nilai_batch: dataToImport });
                if (error) throw error;
                
                let pesan = `Proses impor selesai! ${data.sukses} data berhasil disimpan.`;
                if (data.gagal > 0) {
                    pesan += ` ${data.gagal} data gagal (nama/kelas/topik tidak cocok).`;
                    tampilkanNotifikasi(pesan, 'warning');
                    console.warn('Item Gagal:', data.item_gagal);
                } else {
                    tampilkanNotifikasi(pesan, 'success');
                }
                muatRiwayatNilai(true); // Refresh riwayat untuk menampilkan data baru
            } catch(e) {
                tampilkanNotifikasi('Error saat impor: ' + e.message, 'error');
            } finally {
                tombolImport.disabled = false;
                tombolImport.innerHTML = "Import & Simpan Nilai";
                fileInput.value = ''; // Reset input file
            }
        },
        error: function(err) {
            tampilkanNotifikasi('Gagal membaca file CSV: ' + err.message, 'error');
            tombolImport.disabled = false;
            tombolImport.innerHTML = "Import & Simpan Nilai";
        }
    });
}