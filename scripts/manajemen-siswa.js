// ==========================================================
//  PASTE URL WEB APP DARI APPS SCRIPT YANG KAMU SIMPAN DI SINI
// ==========================================================
const API_URL = "https://script.google.com/macros/s/AKfycbwoymFxlkZKVnFQxSCd-e6JKzuEnmJndGEBMPb1s7AUpH69diV-vSh2RVubw15_UKzD/exec"; 
// ==========================================================

// --- Variabel Global ---
let semuaSiswaCache = [];
let currentPage = 1;
const rowsPerPage = 5;

// --- Event Listener Utama ---
document.addEventListener('DOMContentLoaded', function() {
    renderLayout(); // Render kerangka HTML dulu
    muatDataSiswa(); // Lalu langsung muat datanya
});

// --- Fungsi-fungsi ---

function renderLayout() {
    const container = document.getElementById('content-container');
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-xl font-semibold text-blue-700 mb-6 border-b pb-2" id="formSiswaTitle">Form Tambah Murid Baru</h2>
                <form id="formTambahMurid" class="space-y-4">
                    <input type="hidden" id="ID_Siswa">
                    <div><label for="Nomor_Induk" class="block text-sm font-medium text-gray-700 mb-1">Nomor Induk</label><input type="text" id="Nomor_Induk" required class="w-full px-4 py-2 border border-gray-300 rounded-md"></div>
                    <div><label for="Nama_Lengkap" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" id="Nama_Lengkap" required class="w-full px-4 py-2 border border-gray-300 rounded-md"></div>
                    <div><label for="Kelas" class="block text-sm font-medium text-gray-700 mb-1">Kelas</label><input type="text" id="Kelas" required class="w-full px-4 py-2 border border-gray-300 rounded-md"></div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label><div class="flex gap-4"><div class="radio-item"><input type="radio" id="jk_laki" name="Jenis_Kelamin" value="Laki-laki" required><label for="jk_laki">Laki-laki</label></div><div class="radio-item"><input type="radio" id="jk_perempuan" name="Jenis_Kelamin" value="Perempuan"><label for="jk_perempuan">Perempuan</label></div></div></div>
                    <div class="pt-2 flex justify-end gap-4"><button type="button" id="tombolBatalSiswa" class="hidden bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md">Batal</button><button type="submit" id="tombolSimpanSiswa" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">Simpan Siswa Baru</button></div>
                </form>
            </div>
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-xl font-semibold text-blue-700 mb-4 border-b pb-2">Daftar Murid Terdaftar</h2>
                <div class="overflow-x-auto"><table class="min-w-full bg-white"><thead class="bg-gray-100"><tr><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">No. Induk</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nama</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Kelas</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Jenis Kelamin</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Aksi</th></tr></thead><tbody id="tabelSiswaBody"></tbody></table></div>
                <div id="emptyState" class="text-center py-8 text-gray-500"><p>Memuat data...</p></div>
                <div id="paginationControls" class="flex justify-center items-center space-x-1 mt-6"></div>
            </div>
        </div>
    `;
    // Attach event listeners setelah layout dirender
    document.getElementById('formTambahMurid').addEventListener('submit', handleSimpanSiswa);
    document.getElementById('tombolBatalSiswa').addEventListener('click', resetFormSiswa);
    document.getElementById('tabelSiswaBody').addEventListener('click', handleAksiTabel);
    document.getElementById('paginationControls').addEventListener('click', handlePaginasi);
}

function muatDataSiswa() {
    document.getElementById('emptyState').innerHTML = `<p>Memuat data...</p>`;
    fetch(`${API_URL}?action=getSemuaSiswa`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                semuaSiswaCache = result.data;
                currentPage = 1;
                tampilkanHalaman(currentPage);
            } else { throw new Error(result.message); }
        })
        .catch(error => {
            console.error('Error saat memuat data siswa:', error);
            document.getElementById('emptyState').innerHTML = `<p class="text-red-500">Gagal memuat data: ${error.message}</p>`;
        });
}

function tampilkanHalaman(page) {
    currentPage = page;
    const tabelBody = document.getElementById('tabelSiswaBody');
    const emptyState = document.getElementById('emptyState');
    tabelBody.innerHTML = '';
    if (!semuaSiswaCache || semuaSiswaCache.length === 0) {
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `<p>Belum ada data murid.</p>`;
    } else {
        emptyState.classList.add('hidden');
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const dataHalamanIni = semuaSiswaCache.slice(startIndex, endIndex);
        dataHalamanIni.forEach(siswa => tambahBarisKeTabel(siswa));
    }
    gambarTombolPaginasi();
}

function tambahBarisKeTabel(dataSiswaArray) {
    const tabelBody = document.getElementById('tabelSiswaBody');
    const [id, nomorInduk, nama, kelas, jenisKelamin] = dataSiswaArray;
    const row = document.createElement('tr');
    row.id = `siswa-${id}`;
    row.className = 'border-t hover:bg-gray-50';
    row.innerHTML = `
      <td class="py-3 px-4">${nomorInduk}</td><td class="py-3 px-4">${nama}</td>
      <td class="py-3 px-4">${kelas}</td><td class="py-3 px-4">${jenisKelamin}</td>
      <td class="py-3 px-4"><div class="flex space-x-2">
        <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-sm" data-id="${id}">Edit</button>
        <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-sm" data-id="${id}">Hapus</button>
      </div></td>`;
    tabelBody.appendChild(row);
}

function gambarTombolPaginasi() {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = '';
    const totalRows = semuaSiswaCache.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    if (totalPages <= 1) return;
    
    // Logika untuk membuat tombol paginasi (Prev, 1, 2, 3, Next)
    // ... (kode ini sama persis dengan yang sudah kita buat sebelumnya)
}

function handlePaginasi(e) {
    if (e.target.dataset.page) {
        const page = parseInt(e.target.dataset.page, 10);
        tampilkanHalaman(page);
    }
}


function handleSimpanSiswa(e) {
    e.preventDefault();
    const tombolSimpan = document.getElementById('tombolSimpanSiswa');
    tombolSimpan.disabled = true;

    const idSiswa = document.getElementById('ID_Siswa').value;
    const dataForm = {
        nomorInduk: document.getElementById('Nomor_Induk').value,
        namaLengkap: document.getElementById('Nama_Lengkap').value,
        kelas: document.getElementById('Kelas').value,
        jenisKelamin: document.querySelector('input[name="Jenis_Kelamin"]:checked').value
    };

    let action = 'tambahSiswaBaru';
    if (idSiswa) {
        action = 'editSiswa';
        dataForm.id = idSiswa;
        tombolSimpan.innerHTML = "Mengupdate...";
    } else {
        tombolSimpan.innerHTML = "Menyimpan...";
    }
    
    const payload = { action: action, payload: dataForm };

    fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert(result.data.pesan || result.data); // Notifikasi sementara
            muatDataSiswa();
            resetFormSiswa();
        } else { throw new Error(result.message); }
    })
    .catch(error => {
        alert('Error: ' + error.message);
        resetFormSiswa();
    });
}

function handleAksiTabel(e) {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('edit-btn')) {
        // ... Logika untuk mengisi form saat edit
    } else if (e.target.classList.contains('delete-btn')) {
        if (confirm('Yakin ingin menghapus siswa ini?')) {
            const payload = { action: 'hapusSiswa', payload: id };
            fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) })
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'success') {
                        alert(res.data);
                        muatDataSiswa();
                    } else { throw new Error(res.message); }
                })
                .catch(err => alert('Error: ' + err.message));
        }
    }
}

function resetFormSiswa() {
    // ... Logika untuk reset form
}