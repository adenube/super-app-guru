const API_URL = "https://script.google.com/macros/s/AKfycbywvwaI_1D1JqGpMl4VDE1wur7VpLGWLusufuzKuAqwu0UMF5sm_bE0SrhO48X4_xeW/exec";
let semuaSiswaCache = [];
let currentPage = 1;
const rowsPerPage = 5;

async function callApi(action, payload = {}) {
    document.body.style.cursor = 'wait';
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, payload })
        });
        const result = await response.json();
        if (result.status === 'success') {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
        throw error;
    } finally {
        document.body.style.cursor = 'default';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    renderLayout();
    muatDataSiswa();
});

function renderLayout() {
    const container = document.getElementById('content-container');
    if (!container) return;
    container.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8"><div class="lg:col-span-2 bg-white rounded-lg shadow-lg p-6"><h2 class="text-xl font-semibold text-blue-700 mb-6 border-b pb-2" id="formSiswaTitle">Form Tambah Murid Baru</h2><form id="formTambahMurid" class="space-y-4"><input type="hidden" id="ID_Siswa"><div><label for="Nomor_Induk" class="block text-sm font-medium text-gray-700 mb-1">Nomor Induk</label><input type="text" id="Nomor_Induk" required class="w-full px-4 py-2 border border-gray-300 rounded-md"></div><div><label for="Nama_Lengkap" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" id="Nama_Lengkap" required class="w-full px-4 py-2 border border-gray-300 rounded-md"></div><div><label for="Kelas" class="block text-sm font-medium text-gray-700 mb-1">Kelas</label><input type="text" id="Kelas" required class="w-full px-4 py-2 border border-gray-300 rounded-md"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label><div class="flex gap-4"><div class="radio-item"><input type="radio" id="jk_laki" name="Jenis_Kelamin" value="Laki-laki" required><label for="jk_laki">Laki-laki</label></div><div class="radio-item"><input type="radio" id="jk_perempuan" name="Jenis_Kelamin" value="Perempuan"><label for="jk_perempuan">Perempuan</label></div></div></div><div class="pt-2 flex justify-end gap-4"><button type="button" id="tombolBatalSiswa" class="hidden bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md">Batal</button><button type="submit" id="tombolSimpanSiswa" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">Simpan Siswa Baru</button></div></form></div><div class="lg:col-span-3 bg-white rounded-lg shadow-lg p-6"><h2 class="text-xl font-semibold text-blue-700 mb-4 border-b pb-2">Daftar Murid Terdaftar</h2><div class="overflow-x-auto"><table class="min-w-full bg-white"><thead class="bg-gray-100"><tr><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">No. Induk</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nama</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Kelas</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Jenis Kelamin</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Aksi</th></tr></thead><tbody id="tabelSiswaBody"></tbody></table></div><div id="emptyState" class="text-center py-8 text-gray-500"><p>Memuat data...</p></div><div id="paginationControls" class="flex justify-center items-center space-x-1 mt-6"></div></div></div>`;
    document.getElementById('formTambahMurid').addEventListener('submit', handleSimpanSiswa);
    document.getElementById('tombolBatalSiswa').addEventListener('click', resetFormSiswa);
    document.getElementById('tabelSiswaBody').addEventListener('click', handleAksiTabel);
    document.getElementById('paginationControls').addEventListener('click', handlePaginasi);
}

async function muatDataSiswa() {
    const emptyState = document.getElementById('emptyState');
    if(emptyState) emptyState.innerHTML = `<p>Memuat data...</p>`;
    try {
        const data = await callApi('getSemuaSiswa');
        semuaSiswaCache = data;
        currentPage = 1;
        tampilkanHalaman(currentPage);
    } catch (error) {
        if(emptyState) emptyState.innerHTML = `<p class="text-red-500">Gagal memuat data.</p>`;
    }
}

function tampilkanHalaman(page) {
    currentPage = page;
    const tabelBody = document.getElementById('tabelSiswaBody');
    const emptyState = document.getElementById('emptyState');
    tabelBody.innerHTML = '';
    if (!semuaSiswaCache || semuaSiswaCache.length === 0) {
        if(emptyState) emptyState.classList.remove('hidden');
        if(emptyState) emptyState.innerHTML = `<p>Belum ada data murid.</p>`;
    } else {
        if(emptyState) emptyState.classList.add('hidden');
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
    row.innerHTML = `<td class="py-3 px-4">${nomorInduk}</td><td class="py-3 px-4">${nama}</td><td class="py-3 px-4">${kelas}</td><td class="py-3 px-4">${jenisKelamin}</td><td class="py-3 px-4"><div class="flex space-x-2"><button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-sm" data-id="${id}">Edit</button><button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-sm" data-id="${id}">Hapus</button></div></td>`;
    tabelBody.appendChild(row);
}

function gambarTombolPaginasi() {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = '';
    const totalRows = semuaSiswaCache.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    if (totalPages <= 1) return;
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.className = 'px-3 py-1 rounded-md border bg-white text-gray-600 hover:bg-gray-100';
    prevButton.dataset.page = currentPage - 1;
    if (currentPage === 1) { prevButton.disabled = true; prevButton.classList.add('opacity-50'); }
    paginationControls.appendChild(prevButton);
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.dataset.page = i;
        pageButton.className = 'px-3 py-1 rounded-md border ' + (i === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-100');
        paginationControls.appendChild(pageButton);
    }
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.className = 'px-3 py-1 rounded-md border bg-white text-gray-600 hover:bg-gray-100';
    nextButton.dataset.page = currentPage + 1;
    if (currentPage === totalPages) { nextButton.disabled = true; nextButton.classList.add('opacity-50'); }
    paginationControls.appendChild(nextButton);
}

function handlePaginasi(e) {
    if (e.target.dataset.page) {
        const page = parseInt(e.target.dataset.page, 10);
        if(page > 0 && page <= Math.ceil(semuaSiswaCache.length / rowsPerPage)) {
            tampilkanHalaman(page);
        }
    }
}

async function handleSimpanSiswa(e) {
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
    const action = idSiswa ? 'editSiswa' : 'tambahSiswaBaru';
    if (idSiswa) {
        dataForm.id = idSiswa;
        tombolSimpan.innerHTML = "Mengupdate...";
    } else {
        tombolSimpan.innerHTML = "Menyimpan...";
    }
    try {
        const result = await callApi(action, dataForm);
        tampilkanNotifikasi(result.pesan || result, 'success');
        resetFormSiswa();
        muatDataSiswa();
    } catch (error) {
        resetFormSiswa();
    }
}

function handleAksiTabel(e) {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('edit-btn')) {
        const siswa = semuaSiswaCache.find(s => s[0] === id);
        if(siswa) {
            document.getElementById('formSiswaTitle').textContent = "Edit Data Murid";
            document.getElementById('ID_Siswa').value = siswa[0];
            document.getElementById('Nomor_Induk').value = siswa[1];
            document.getElementById('Nama_Lengkap').value = siswa[2];
            document.getElementById('Kelas').value = siswa[3];
            document.querySelector(`input[name="Jenis_Kelamin"][value="${siswa[4]}"]`).checked = true;
            document.getElementById('tombolSimpanSiswa').textContent = 'Update Data';
            document.getElementById('tombolBatalSiswa').classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else if (e.target.classList.contains('delete-btn')) {
        if (confirm('Yakin ingin menghapus siswa ini?')) {
            callApi('hapusSiswa', id)
                .then(result => {
                    tampilkanNotifikasi(result, 'warning');
                    muatDataSiswa();
                });
        }
    }
}

function resetFormSiswa() {
    document.getElementById('formSiswaTitle').textContent = "Form Tambah Murid Baru";
    document.getElementById('formTambahMurid').reset();
    document.getElementById('ID_Siswa').value = '';
    const tombolSimpan = document.getElementById('tombolSimpanSiswa');
    tombolSimpan.textContent = 'Simpan Siswa Baru';
    tombolSimpan.disabled = false;
    document.getElementById('tombolBatalSiswa').classList.add('hidden');
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