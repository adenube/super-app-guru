// --- Variabel Global ---
let semuaSiswaCache = [];
let currentPage = 1;
const rowsPerPage = 5;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('tombolTambahSiswa').addEventListener('click', tampilkanFormTambah);
    document.getElementById('formTambahMurid').addEventListener('submit', handleSimpanSiswa);
    document.getElementById('tombolBatalSiswa').addEventListener('click', resetFormSiswa);
    document.getElementById('tabelSiswaBody').addEventListener('click', handleAksiTabel);
    document.getElementById('paginationControls').addEventListener('click', handlePaginasi);
    document.getElementById('tombolImportSiswa').addEventListener('click', handleImportSiswa);
    document.getElementById('downloadContohSiswa').addEventListener('click', handleDownloadContoh);
    muatDataSiswa();
});

async function muatDataSiswa(forceReload = false) {
    const emptyState = document.getElementById('emptyState');
    emptyState.innerHTML = `<p>Memuat data...</p>`;
    emptyState.classList.remove('hidden');
    try {
        const { data, error } = await supa.from('Siswa').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        semuaSiswaCache = data;
        if (forceReload) currentPage = 1;
        tampilkanHalaman(currentPage);
    } catch (error) {
        tampilkanNotifikasi('Gagal memuat data: ' + error.message, 'error');
        emptyState.innerHTML = `<p class="text-red-500">Gagal memuat data.</p>`;
    }
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

function tambahBarisKeTabel(siswa) {
    const tabelBody = document.getElementById('tabelSiswaBody');
    const row = document.createElement('tr');
    row.id = `siswa-${siswa.id}`;
    row.className = 'border-t hover:bg-gray-50';

    // --- INI LOGIKA YANG DIPERBAIKI ---
    const tombolAkun = siswa.auth_user_id 
        ? `<button class="lihat-akun-btn bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-md text-xs" data-id="${siswa.id}" data-authid="${siswa.auth_user_id}" data-nama="${siswa.Nama_Lengkap}">Lihat Akun</button>`
        : `<button class="buat-akun-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs" data-id="${siswa.id}">Buat Akun</button>`;

    row.innerHTML = `
      <td class="py-3 px-4">${siswa.Nomor_Induk}</td>
      <td class="py-3 px-4">${siswa.Nama_Lengkap}</td>
      <td class="py-3 px-4">${siswa.Kelas}</td>
      <td class="py-3 px-4">${siswa.Jenis_Kelamin}</td>
      <td class="py-3 px-4"><div class="flex space-x-2">
        <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-sm" data-id="${siswa.id}">Edit</button>
        <button class="hapus-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-sm" data-id="${siswa.id}">Hapus</button>
        ${tombolAkun}
      </div></td>`;
    tabelBody.appendChild(row);
}

function gambarTombolPaginasi() {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = '';
    const totalRows = semuaSiswaCache.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    if (totalPages <= 1) return;
    // ... (Your complete pagination logic here)
}

function handlePaginasi(e) {
    if (e.target.dataset.page) {
        const page = parseInt(e.target.dataset.page, 10);
        if (page > 0 && page <= Math.ceil(semuaSiswaCache.length / rowsPerPage)) {
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
        Nomor_Induk: document.getElementById('Nomor_Induk').value,
        Nama_Lengkap: document.getElementById('Nama_Lengkap').value,
        Kelas: document.getElementById('Kelas').value,
        Jenis_Kelamin: document.querySelector('input[name="Jenis_Kelamin"]:checked').value
    };
    try {
        let response;
        if (idSiswa) {
            response = await supa.from('Siswa').update(dataForm).eq('id', idSiswa);
        } else {
            response = await supa.from('Siswa').insert([dataForm]);
        }
        if (response.error) throw response.error;
        tampilkanNotifikasi('Sukses! Data siswa berhasil diproses.', 'success');
        resetFormSiswa();
        muatDataSiswa();
    } catch (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
    } finally {
        tombolSimpan.disabled = false;
        resetFormSiswa();
    }
}

function handleAksiTabel(e) {
    if (!e.target.dataset.id) return;
    const id = e.target.dataset.id;
    if (e.target.classList.contains('edit-btn')) {
        isiFormUntukEdit(id);
    } else if (e.target.classList.contains('hapus-btn')) {
        if (confirm('Yakin ingin menghapus siswa ini?')) {
            hapusDataSiswa(id);
        }
    }
}

function isiFormUntukEdit(id) {
    const siswa = semuaSiswaCache.find(s => s.id === id);
    if (siswa) {
        document.getElementById('form-container-siswa').classList.remove('hidden');
        document.getElementById('formSiswaTitle').textContent = "Edit Data Murid";
        document.getElementById('ID_Siswa').value = siswa.id;
        document.getElementById('Nomor_Induk').value = siswa.Nomor_Induk;
        document.getElementById('Nama_Lengkap').value = siswa.Nama_Lengkap;
        document.getElementById('Kelas').value = siswa.Kelas;
        document.querySelector(`input[name="Jenis_Kelamin"][value="${siswa.Jenis_Kelamin}"]`).checked = true;
        document.getElementById('tombolSimpanSiswa').textContent = 'Update Data';
        document.getElementById('tombolBatalSiswa').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function hapusDataSiswa(id) {
    try {
        const { error } = await supa.from('Siswa').delete().eq('id', id);
        if (error) throw error;
        tampilkanNotifikasi('Siswa berhasil dihapus.', 'warning');
        muatDataSiswa(true);
    } catch (error) {
        tampilkanNotifikasi('Gagal menghapus siswa: ' + error.message, 'error');
    }
}

function tampilkanFormTambah() {
    document.getElementById('form-container-siswa').classList.remove('hidden');
    document.getElementById('formSiswaTitle').textContent = 'Form Tambah Murid Baru';
    document.getElementById('tombolBatalSiswa').classList.remove('hidden');
    resetFormSiswa(false);
}

function resetFormSiswa(hide = true) {
    document.getElementById('formTambahMurid').reset();
    document.getElementById('ID_Siswa').value = '';
    document.getElementById('tombolSimpanSiswa').textContent = 'Simpan Siswa Baru';
    if (hide) {
        document.getElementById('form-container-siswa').classList.add('hidden');
    }
}

function handleDownloadContoh(e) {
    e.preventDefault();
    const csvContent = "Nomor_Induk,Nama_Lengkap,Kelas,Jenis_Kelamin\n12345,Ahmad Luthfi,7A,Laki-laki";
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "contoh_import_siswa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function handleImportSiswa() {
    const fileInput = document.getElementById('fileInputSiswa');
    if (fileInput.files.length === 0) {
        tampilkanNotifikasi('Silakan pilih file CSV.', 'warning'); return;
    }
    const file = fileInput.files[0];
    const tombolImport = document.getElementById('tombolImportSiswa');
    tombolImport.disabled = true;
    tombolImport.innerHTML = "Memproses...";
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
            const dataValid = results.data.filter(row => row.Nomor_Induk && row.Nama_Lengkap);
            if (dataValid.length > 0) {
                try {
                    const { error } = await supa.from('Siswa').insert(dataValid);
                    if (error) throw error;
                    tampilkanNotifikasi(`${dataValid.length} siswa berhasil di-import!`, 'success');
                    muatDataSiswa(true);
                } catch (e) {
                    tampilkanNotifikasi('Error saat import: ' + e.message, 'error');
                }
            }
            tombolImport.disabled = false;
            tombolImport.innerHTML = "Import";
            fileInput.value = '';
        }
    });
}

function tampilkanNotifikasi(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-yellow-500');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-md shadow-lg text-white z-50 ${bgColor}`;
    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 3000);
}