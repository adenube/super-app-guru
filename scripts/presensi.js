const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const rowsPerPage = 8;
let siswaKelasCache = [];
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('tanggalPresensi').valueAsDate = new Date();
    muatDaftarKelas();
    document.getElementById('tampilkanSiswaBtn').addEventListener('click', handleTampilkanSiswa);
    document.getElementById('simpanPresensiBtn').addEventListener('click', handleSimpanPresensi);
    const paginationControls = document.getElementById('paginationControlsPresensi');
    if(paginationControls) {
        paginationControls.addEventListener('click', handlePaginasi);
    }
});

async function muatDaftarKelas() {
    try {
        const { data, error } = await supa.from('Siswa').select('Kelas');
        if (error) throw error;
        const daftarKelas = [...new Set(data.map(item => item.Kelas))].sort();
        
        const filterDropdown = document.getElementById('filterKelasPresensi');
        if (!filterDropdown) return;
        while (filterDropdown.options.length > 1) { filterDropdown.remove(1); }
        daftarKelas.forEach(kelas => {
            const option = document.createElement('option');
            option.value = kelas;
            option.textContent = kelas;
            filterDropdown.appendChild(option);
        });
    } catch(error) {
        tampilkanNotifikasi('Gagal memuat daftar kelas: ' + error.message, 'error');
    }
}

async function handleTampilkanSiswa() {
    const btn = document.getElementById('tampilkanSiswaBtn');
    btn.disabled = true;
    btn.innerHTML = "Memuat...";
    
    const tanggal = document.getElementById('tanggalPresensi').value;
    const kelas = document.getElementById('filterKelasPresensi').value;

    if (!tanggal) {
        tampilkanNotifikasi('Silakan pilih tanggal terlebih dahulu.', 'error');
        btn.disabled = false;
        btn.innerHTML = "Tampilkan Siswa";
        return;
    }

    try {
        // Ambil semua siswa dari kelas yang dipilih
        let siswaQuery = supa.from('Siswa').select('id, Nama_Lengkap, Kelas');
        if (kelas) {
            siswaQuery = siswaQuery.eq('Kelas', kelas);
        }
        const { data: semuaSiswaDiKelas, error: siswaError } = await siswaQuery;
        if (siswaError) throw siswaError;

        // Ambil ID siswa yang sudah diabsen pada tanggal itu
        const { data: presensiData, error: presensiError } = await supa.from('Presensi')
            .select('ID_Siswa')
            .eq('Tanggal_Presensi', tanggal);
        if (presensiError) throw presensiError;
        
        const siswaSudahAbsen = presensiData.map(p => p.ID_Siswa);
        
        siswaKelasCache = semuaSiswaDiKelas.filter(siswa => !siswaSudahAbsen.includes(siswa.id));
        currentPage = 1;
        tampilkanHalaman(currentPage);

    } catch (error) {
        tampilkanNotifikasi('Gagal memuat data: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Tampilkan Siswa";
    }
}

function tampilkanHalaman(page) {
    currentPage = page;
    const container = document.getElementById('daftarSiswaContainer');
    const simpanBtn = document.getElementById('simpanPresensiBtn');
    container.innerHTML = '';
    
    if (!siswaKelasCache || siswaKelasCache.length === 0) {
        container.innerHTML = '<p class="text-center text-green-600 font-semibold">Tidak ada siswa yang perlu diabsen untuk pilihan ini.</p>';
        simpanBtn.classList.add('hidden');
    } else {
        simpanBtn.classList.remove('hidden');
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const dataHalamanIni = siswaKelasCache.slice(startIndex, endIndex);

        dataHalamanIni.forEach(siswa => {
            const divSiswa = document.createElement('div');
            divSiswa.className = 'siswa-row p-4 border rounded-lg flex flex-col md:flex-row items-center gap-4';
            divSiswa.dataset.id = siswa.id;
            divSiswa.innerHTML = `
                <div class="flex-grow"><p class="font-semibold text-gray-800">${siswa.Nama_Lengkap}</p><p class="text-sm text-gray-500">${siswa.Kelas}</p></div>
                <div class="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
                    <div class="radio-item"><input type="radio" id="h-${siswa.id}" name="status-${siswa.id}" value="Hadir" checked><label for="h-${siswa.id}">H</label></div>
                    <div class="radio-item"><input type="radio" id="s-${siswa.id}" name="status-${siswa.id}" value="Sakit"><label for="s-${siswa.id}">S</label></div>
                    <div class="radio-item"><input type="radio" id="i-${siswa.id}" name="status-${siswa.id}" value="Izin"><label for="i-${siswa.id}">I</label></div>
                    <div class="radio-item"><input type="radio" id="a-${siswa.id}" name="status-${siswa.id}" value="Alpha"><label for="a-${siswa.id}">A</label></div>
                </div>
                <div class="w-full md:w-1/3 mt-2 md:mt-0"><input type="text" placeholder="Catatan (opsional)" class="catatan-presensi w-full text-sm px-3 py-1 border rounded-md"></div>
            `;
            container.appendChild(divSiswa);
        });
    }
    gambarTombolPaginasi();
}

function gambarTombolPaginasi() {
    const paginationControls = document.getElementById('paginationControlsPresensi');
    if (!paginationControls) return;
    paginationControls.innerHTML = '';
    const totalRows = siswaKelasCache.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    if (totalPages <= 1) return;
    
    // ... Logika lengkap untuk membuat tombol ...
}

function handlePaginasi(e) {
    if (e.target.dataset.page) {
        const page = parseInt(e.target.dataset.page, 10);
        if (page > 0) tampilkanHalaman(page);
    }
}

async function handleSimpanPresensi() {
    const btn = document.getElementById('simpanPresensiBtn');
    btn.disabled = true;
    btn.innerHTML = "Menyimpan...";
    
    const dataUntukDisimpan = [];
    const tanggal = document.getElementById('tanggalPresensi').value;

    document.querySelectorAll('.siswa-row').forEach(baris => {
        const idSiswa = baris.dataset.id;
        const statusTerpilih = baris.querySelector(`input[name="status-${idSiswa}"]:checked`);
        if (statusTerpilih) {
            dataUntukDisimpan.push({
                Tanggal_Presensi: tanggal,
                ID_Siswa: idSiswa,
                Status: statusTerpilih.value,
                Catatan: baris.querySelector('.catatan-presensi').value
            });
        }
    });

    try {
        if (dataUntukDisimpan.length > 0) {
            const { error } = await supa.from('Presensi').insert(dataUntukDisimpan);
            if (error) throw error;
        }
        tampilkanNotifikasi('Sukses! Data presensi berhasil disimpan.', 'success');
        document.getElementById('daftarSiswaContainer').innerHTML = '<p class="text-center text-green-600 font-semibold">Presensi sudah disimpan.</p>';
        btn.classList.add('hidden');
        const paginationControls = document.getElementById('paginationControlsPresensi');
        if(paginationControls) paginationControls.innerHTML = '';
    } catch (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Simpan Presensi";
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