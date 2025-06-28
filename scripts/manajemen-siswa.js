// ==========================================================
//          MASUKKAN 3 KUNCI RAHASIA LO DI SINI
// ==========================================================
const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";

// Membuat koneksi ke Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ==========================================================

// --- Variabel Global ---
let semuaSiswaCache = [];
let currentPage = 1;
const rowsPerPage = 5;

// --- Event Listener Utama ---
document.addEventListener('DOMContentLoaded', function() {
    // Event listener dipasang setelah elemennya pasti ada
    // Kita panggil renderLayout dulu untuk memastikan
    renderLayoutAndAttachListeners();
});


// --- Fungsi-fungsi ---

function renderLayoutAndAttachListeners() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    // Render kerangka HTML utama
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            <div class="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 order-2 lg:order-1">
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
            <div class="lg:col-span-3 bg-white rounded-lg shadow-lg p-6 order-1 lg:order-2">
                <h2 class="text-xl font-semibold text-blue-700 mb-4 border-b pb-2">Daftar Murid Terdaftar</h2>
                <div class="overflow-x-auto"><table class="min-w-full bg-white"><thead class="bg-gray-100"><tr><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">No. Induk</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nama</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Kelas</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Jenis Kelamin</th><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Aksi</th></tr></thead><tbody id="tabelSiswaBody"></tbody></table></div>
                <div id="emptyState" class="text-center py-8 text-gray-500"><p>Memuat data...</p></div>
                <div id="paginationControls" class="flex justify-center items-center space-x-1 mt-6"></div>
            </div>
        </div>
    `;
    
    // Attach event listeners setelah elemennya dijamin ada di halaman
    document.getElementById('formTambahMurid').addEventListener('submit', handleSimpanSiswa);
    document.getElementById('tombolBatalSiswa').addEventListener('click', resetFormSiswa);
    document.getElementById('tabelSiswaBody').addEventListener('click', handleAksiTabel);
    document.getElementById('paginationControls').addEventListener('click', handlePaginasi);

    // Setelah layout siap, langsung muat data awal
    muatDataSiswa();
}

async function muatDataSiswa() {
    const emptyState = document.getElementById('emptyState');
    if(emptyState) emptyState.innerHTML = `<p>Memuat data...</p>`;
    
    try {
        const { data, error } = await supabase
            .from('Siswa')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        semuaSiswaCache = data;
        currentPage = 1;
        tampilkanHalaman(currentPage);

    } catch (error) {
        console.error('Error saat memuat data siswa:', error);
        tampilkanNotifikasi('Gagal memuat data: ' + error.message, 'error');
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

function tambahBarisKeTabel(siswa) {
    const tabelBody = document.getElementById('tabelSiswaBody');
    const row = document.createElement('tr');
    row.id = `siswa-${siswa.id}`;
    row.className = 'border-t hover:bg-gray-50';
    row.innerHTML = `
      <td class="py-3 px-4">${siswa.Nomor_Induk}</td><td class="py-3 px-4">${siswa.Nama_Lengkap}</td>
      <td class="py-3 px-4">${siswa.Kelas}</td><td class="py-3 px-4">${siswa.Jenis_Kelamin}</td>
      <td class="py-3 px-4"><div class="flex space-x-2">
        <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-md text-sm" data-id="${siswa.id}">Edit</button>
        <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-sm" data-id="${siswa.id}">Hapus</button>
      </div></td>`;
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
        Nomor_Induk: document.getElementById('Nomor_Induk').value,
        Nama_Lengkap: document.getElementById('Nama_Lengkap').value,
        Kelas: document.getElementById('Kelas').value,
        Jenis_Kelamin: document.querySelector('input[name="Jenis_Kelamin"]:checked').value
    };

    let response;
    if (idSiswa) {
        tombolSimpan.innerHTML = "Mengupdate...";
        response = await supabase.from('Siswa').update(dataForm).eq('id', idSiswa);
    } else {
        tombolSimpan.innerHTML = "Menyimpan...";
        response = await supabase.from('Siswa').insert([dataForm]);
    }

    if (response.error) {
        tampilkanNotifikasi('Error: ' + response.error.message, 'error');
    } else {
        tampilkanNotifikasi('Sukses! Data siswa berhasil diproses.', 'success');
        resetFormSiswa();
        muatDataSiswa();
    }
    tombolSimpan.disabled = false;
}

function handleAksiTabel(e) {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('edit-btn')) {
        const siswa = semuaSiswaCache.find(s => s.id === id);
        if(siswa) {
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
    } else if (e.target.classList.contains('delete-btn')) {
        if (confirm('Yakin ingin menghapus siswa ini?')) {
            hapusDataSiswa(id);
        }
    }
}

async function hapusDataSiswa(id) {
    const { error } = await supabase.from('Siswa').delete().eq('id', id);
    if (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
    } else {
        tampilkanNotifikasi('Siswa berhasil dihapus