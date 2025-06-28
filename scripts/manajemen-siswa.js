// GANTI DENGAN KUNCI RAHASIA SUPABASE-MU
const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Variabel Global ---
let semuaSiswaCache = [];
let currentPage = 1;
const rowsPerPage = 5;

// --- Event Listener Utama (VERSI LEBIH STABIL) ---
document.addEventListener('DOMContentLoaded', function() {
    // Langsung pasang semua "kabel" ke elemen HTML yang sudah pasti ada
    document.getElementById('formTambahMurid').addEventListener('submit', handleSimpanSiswa);
    document.getElementById('tombolBatalSiswa').addEventListener('click', resetFormSiswa);
    document.getElementById('tabelSiswaBody').addEventListener('click', handleAksiTabel);
    document.getElementById('paginationControls').addEventListener('click', handlePaginasi);

    // Setelah semua siap, baru muat data
    muatDataSiswa();
});

// --- Fungsi-fungsi ---

async function muatDataSiswa() {
    const emptyState = document.getElementById('emptyState');
    if(emptyState) emptyState.innerHTML = `<p>Memuat data...</p>`;
    
    try {
        const { data, error } = await supa
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
      <td class="py-3 px-4">${siswa.Nomor_Induk}</td>
      <td class="py-3 px-4">${siswa.Nama_Lengkap}</td>
      <td class="py-3 px-4">${siswa.Kelas}</td>
      <td class="py-3 px-4">${siswa.Jenis_Kelamin}</td>
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

    let response;
    try {
        if (idSiswa) {
            tombolSimpan.innerHTML = "Mengupdate...";
            response = await supa.from('Siswa').update(dataForm).eq('id', idSiswa);
        } else {
            tombolSimpan.innerHTML = "Menyimpan...";
            response = await supa.from('Siswa').insert([dataForm]);
        }
        if (response.error) throw response.error;
        tampilkanNotifikasi('Sukses! Data siswa berhasil diproses.', 'success');
        resetFormSiswa();
        muatDataSiswa();
    } catch (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
        // Kita tetap reset formnya walaupun error
        resetFormSiswa();
    }
}

// GANTI FUNGSI HANDLEAKSITABEL YANG LAMA DENGAN INI
async function handleAksiTabel(e) {
    console.log("--- MENDETEKSI KLIK DI DALAM TABEL ---");
    console.log("Elemen yang diklik:", e.target);

    const id = e.target.dataset.id;
    console.log("Mencoba mengambil ID dari elemen:", id);

    if (e.target.classList.contains('edit-btn')) {
        console.log("INFO: Tombol 'Edit' terdeteksi!");
        
        const siswa = semuaSiswaCache.find(s => s.id === id);
        console.log("Mencari siswa di cache. Hasil:", siswa);

        if (siswa) {
            console.log("SUKSES: Siswa ditemukan! Mengisi form...");
            document.getElementById('formSiswaTitle').textContent = "Edit Data Murid";
            document.getElementById('ID_Siswa').value = siswa.id;
            document.getElementById('Nomor_Induk').value = siswa.Nomor_Induk;
            document.getElementById('Nama_Lengkap').value = siswa.Nama_Lengkap;
            document.getElementById('Kelas').value = siswa.Kelas;
            document.querySelector(`input[name="Jenis_Kelamin"][value="${siswa.Jenis_Kelamin}"]`).checked = true;
            document.getElementById('tombolSimpanSiswa').textContent = 'Update Data';
            document.getElementById('tombolBatalSiswa').classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.error("GAGAL: Siswa dengan ID '" + id + "' tidak ditemukan di cache!");
        }

    } else if (e.target.classList.contains('delete-btn')) {
        console.log("INFO: Tombol 'Hapus' terdeteksi!");
        if (confirm('Yakin ingin menghapus siswa ini?')) {
            try {
                // hapusDataSiswa adalah async, jadi kita beri await di sini
                await hapusDataSiswa(id); 
            } catch(error){
                console.error("Gagal menjalankan hapusDataSiswa:", error)
            }
        }
    } else {
        console.log("INFO: Klik terdeteksi, tapi bukan tombol Edit atau Hapus.");
    }
}

async function hapusDataSiswa(id) {
    try {
        const { error } = await supa.from('Siswa').delete().eq('id', id);
        if (error) throw error;
        tampilkanNotifikasi('Siswa berhasil dihapus.', 'warning');
        muatDataSiswa();
    } catch (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
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