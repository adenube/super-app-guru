// ==========================================================
// PASTE URL WEB APP DARI APPS SCRIPT YANG KAMU SIMPAN DI SINI
// ==========================================================
const API_URL = "https://script.google.com/macros/s/AKfycbwoymFxlkZKVnFQxSCd-e6JKzuEnmJndGEBMPb1s7AUpH69diV-vSh2RVubw15_UKzD/exec";
// ==========================================================

const rowsPerPage = 8;
let siswaKelasCache = [];
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('tanggalPresensi').valueAsDate = new Date();
    muatDaftarKelas();
    document.getElementById('tampilkanSiswaBtn').addEventListener('click', handleTampilkanSiswa);
    document.getElementById('simpanPresensiBtn').addEventListener('click', handleSimpanPresensi);
    document.getElementById('paginationControlsPresensi').addEventListener('click', handlePaginasi);
});

function muatDaftarKelas() {
    fetch(`${API_URL}?action=getDaftarKelas`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                const filterDropdown = document.getElementById('filterKelasPresensi');
                if (!filterDropdown) return;
                while (filterDropdown.options.length > 1) { filterDropdown.remove(1); }
                result.data.forEach(kelas => {
                    const option = document.createElement('option');
                    option.value = kelas;
                    option.textContent = kelas;
                    filterDropdown.appendChild(option);
                });
            } else { throw new Error(result.message); }
        })
        .catch(error => {
            console.error('Gagal memuat daftar kelas:', error);
            tampilkanNotifikasi('Gagal memuat daftar kelas.', 'error');
        });
}

function handleTampilkanSiswa() {
    const tanggal = document.getElementById('tanggalPresensi').value;
    const kelas = document.getElementById('filterKelasPresensi').value;
    if (!tanggal) {
        tampilkanNotifikasi('Silakan pilih tanggal terlebih dahulu.', 'error');
        return;
    }
    const btn = document.getElementById('tampilkanSiswaBtn');
    btn.disabled = true;
    btn.innerHTML = "Memuat...";

    fetch(`${API_URL}?action=getInitialPresensiData&tanggal=${tanggal}&kelas=${kelas}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                const data = result.data;
                siswaKelasCache = data.siswaDiKelas.filter(siswa => !data.siswaSudahAbsen.includes(siswa[0]));
                currentPage = 1;
                tampilkanHalaman(currentPage);
            } else { throw new Error(result.message); }
            btn.disabled = false;
            btn.innerHTML = "Tampilkan Siswa";
        })
        .catch(err => {
            tampilkanNotifikasi('Gagal memuat data: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = "Tampilkan Siswa";
        });
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
            const [idSiswa, , namaSiswa, kelasSiswa] = siswa;
            const divSiswa = document.createElement('div');
            divSiswa.className = 'siswa-row p-4 border rounded-lg flex flex-col md:flex-row items-center gap-4';
            divSiswa.dataset.id = idSiswa;
            divSiswa.innerHTML = `
                <div class="flex-grow"><p class="font-semibold text-gray-800">${namaSiswa}</p><p class="text-sm text-gray-500">${kelasSiswa}</p></div>
                <div class="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
                    <div class="radio-item"><input type="radio" id="h-${idSiswa}" name="status-${idSiswa}" value="Hadir" checked><label for="h-${idSiswa}">H</label></div>
                    <div class="radio-item"><input type="radio" id="s-${idSiswa}" name="status-${idSiswa}" value="Sakit"><label for="s-${idSiswa}">S</label></div>
                    <div class="radio-item"><input type="radio" id="i-${idSiswa}" name="status-${idSiswa}" value="Izin"><label for="i-${idSiswa}">I</label></div>
                    <div class="radio-item"><input type="radio" id="a-${idSiswa}" name="status-${idSiswa}" value="Alpha"><label for="a-${idSiswa}">A</label></div>
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
    // Logika pembuatan tombol paginasi (Prev, 1, 2, 3, Next)
}

function handlePaginasi(e) {
    if (e.target.dataset.page) {
        const page = parseInt(e.target.dataset.page, 10);
        if (page > 0) tampilkanHalaman(page);
    }
}

function handleSimpanPresensi() {
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = "Menyimpan...";
    const dataPresensi = { tanggal: document.getElementById('tanggalPresensi').value, status: {}, catatan: {} };
    document.querySelectorAll('.siswa-row').forEach(baris => {
        const idSiswa = baris.dataset.id;
        const statusTerpilih = baris.querySelector(`input[name="status-${idSiswa}"]:checked`);
        if (statusTerpilih) {
            dataPresensi.status[idSiswa] = statusTerpilih.value;
            dataPresensi.catatan[idSiswa] = baris.querySelector('.catatan-presensi').value;
        }
    });
    
    const payload = { action: 'simpanPresensi', payload: dataPresensi };
    fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) })
        .then(response => response.json())
        .then(result => {
            if(result.status === 'success') {
                tampilkanNotifikasi(result.data, 'success');
                btn.disabled = false;
                btn.innerHTML = "Simpan Presensi";
                document.getElementById('daftarSiswaContainer').innerHTML = '<p class="text-center text-green-600 font-semibold">Presensi sudah disimpan.</p>';
                btn.classList.add('hidden');
                const paginationControls = document.getElementById('paginationControlsPresensi');
                if(paginationControls) paginationControls.innerHTML = '';
            } else { throw new Error(result.message); }
        })
        .catch(err => {
            tampilkanNotifikasi('Error: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = "Simpan Presensi";
        });
}

function tampilkanNotifikasi(message, type) {
    // ... kode sama persis ...
}