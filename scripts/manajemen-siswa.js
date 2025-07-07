// --- Variabel Global ---
let semuaSiswaCache = [];
let currentPage = 1;
const rowsPerPage = 5;

document.addEventListener('DOMContentLoaded', function() {
    muatDataSiswa();
    document.getElementById('formTambahMurid').addEventListener('submit', handleSimpanSiswa);
    document.getElementById('tombolBatalSiswa').addEventListener('click', resetFormSiswa);
    document.getElementById('tabelSiswaBody').addEventListener('click', handleAksiTabel);
    document.getElementById('paginationControls').addEventListener('click', handlePaginasi);
	document.getElementById('tombolImportSiswa').addEventListener('click', handleImportSiswa);
    document.getElementById('downloadContohSiswa').addEventListener('click', handleDownloadContoh);
    
    // Listener untuk form pop-up baru
    document.getElementById('formBuatAkunSiswa').addEventListener('submit', handleSimpanAkunSiswa);
    document.getElementById('akun_batal_btn').addEventListener('click', () => {
        document.getElementById('modalBuatAkun').classList.add('hidden');
    });
});

async function muatDataSiswa(forceReload = false) {
    const emptyState = document.getElementById('emptyState');
    if(emptyState) {
      emptyState.innerHTML = `<p>Memuat data...</p>`;
      emptyState.classList.remove('hidden');
    }
    try {
        const { data, error } = await supa.from('Siswa').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        semuaSiswaCache = data;
        currentPage = forceReload ? 1 : currentPage;
        tampilkanHalaman(currentPage);
    } catch (error) {
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
      <td class="py-3 px-4">
        <div class="flex space-x-2">
          <button class="edit-btn ..." data-id="${siswa.id}">Edit</button>
          <button class="hapus-btn ..." data-id="${siswa.id}">Hapus</button>
          ${!siswa.auth_user_id 
            ? `<button class="buat-akun-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs" data-id="${siswa.id}">Buat Akun</button>` 
            : `<span class="text-xs text-green-600 font-semibold px-2 py-1">✓ Akun Ada</span>`}
        </div>
      </td>`;
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
        resetFormSiswa();
    }
}

// GANTI FUNGSI HANDLEAKSITABEL YANG LAMA DENGAN VERSI BARU INI
// --- FUNGSI AKSI TABEL YANG DIPERBAIKI ---
function handleAksiTabel(e) {
    if (!e.target) return;
    const id = e.target.dataset.id;

    if (e.target.classList.contains('edit-btn')) {
        isiFormUntukEdit(id);
    } else if (e.target.classList.contains('hapus-btn')) {
        if (confirm('Yakin ingin menghapus siswa ini?')) {
            hapusDataSiswa(id);
        }
    } else if (e.target.classList.contains('buat-akun-btn')) {
        tampilkanFormBuatAkun(id);
    }
}

// --- FUNGSI BARU UNTUK MEMBUAT AKUN SISWA ---

function tampilkanFormBuatAkun(idSiswa) {
    const siswa = semuaSiswaCache.find(s => s.id === idSiswa);
    if (!siswa) {
        tampilkanNotifikasi('Data siswa tidak ditemukan!', 'error');
        return;
    }
    const modal = document.getElementById('modalBuatAkun');
    
    // Generate usulan email dan password
    const namaSimple = siswa.Nama_Lengkap.toLowerCase().replace(/ /g, '.');
    const emailDisarankan = `${namaSimple}.${siswa.Nomor_Induk}@superapp.guru`;
    const passwordDisarankan = siswa.Nomor_Induk;

    document.getElementById('akun_siswa_id').value = siswa.id;
    document.getElementById('akun_nama_siswa').textContent = siswa.Nama_Lengkap;
    document.getElementById('akun_email').value = emailDisarankan;
    document.getElementById('akun_password').value = passwordDisarankan;
    
    modal.classList.remove('hidden');
}

async function handleSimpanAkunSiswa(e) {
    e.preventDefault();
    const btn = document.getElementById('akun_simpan_btn');
    btn.disabled = true;
    btn.innerHTML = 'Membuat...';

    const idSiswa = document.getElementById('akun_siswa_id').value;
    const email = document.getElementById('akun_email').value;
    const password = document.getElementById('akun_password').value;

    try {
        // 1. Buat user di Supabase Auth
        const { data: authData, error: authError } = await supa.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    role: 'siswa' // Menyimpan role di metadata
                }
            }
        });

        if (authError) throw authError;

        // 2. Jika berhasil, update kolom auth_user_id di tabel Siswa
        const { error: updateError } = await supa
            .from('Siswa')
            .update({ auth_user_id: authData.user.id })
            .eq('id', idSiswa);

        if (updateError) throw updateError;

        tampilkanNotifikasi(`Akun untuk ${email} berhasil dibuat!`, 'success');
        document.getElementById('modalBuatAkun').classList.add('hidden');
        muatDataSiswa(); // Refresh tabel untuk menghilangkan tombol

    } catch (error) {
        tampilkanNotifikasi('Gagal membuat akun: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Buat Akun Sekarang';
    }
}

// ===== INI FUNGSI YANG HILANG & KITA TAMBAHKAN KEMBALI =====
function isiFormUntukEdit(id) {
    const siswa = semuaSiswaCache.find(s => s.id === id);
    if (siswa) {
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

// --- FUNGSI BARU UNTUK DOWNLOAD CONTOH FORMAT ---
function handleDownloadContoh(e) {
    e.preventDefault();
    const csvContent = "Nomor_Induk,Nama_Lengkap,Kelas,Jenis_Kelamin\n12345,Ahmad Luthfi,7A,Laki-laki\n12346,Bunga Citra,7B,Perempuan";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "contoh_import_siswa.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// --- FUNGSI BARU UNTUK IMPORT SISWA DARI CSV ---
async function handleImportSiswa() {
    const fileInput = document.getElementById('fileInputSiswa');
    if (fileInput.files.length === 0) {
        tampilkanNotifikasi('Silakan pilih file CSV terlebih dahulu.', 'warning');
        return;
    }

    const file = fileInput.files[0];
    const tombolImport = document.getElementById('tombolImportSiswa');
    tombolImport.disabled = true;
    tombolImport.innerHTML = "Memproses...";

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
            const dataToInsert = results.data.map(row => ({
                Nomor_Induk: row.Nomor_Induk,
                Nama_Lengkap: row.Nama_Lengkap,
                Kelas: row.Kelas,
                Jenis_Kelamin: row.Jenis_Kelamin
            }));

            if (dataToInsert.length > 0) {
                try {
                    const { error } = await supa.from('Siswa').insert(dataToInsert);
                    if (error) throw error;
                    
                    tampilkanNotifikasi(`${dataToInsert.length} siswa berhasil di-import!`, 'success');
                    muatDataSiswa(true); // Refresh tabel siswa
                } catch (e) {
                    tampilkanNotifikasi('Error saat import: ' + e.message, 'error');
                }
            } else {
                tampilkanNotifikasi('Tidak ada data valid untuk di-import.', 'warning');
            }

            tombolImport.disabled = false;
            tombolImport.innerHTML = "Import & Simpan Siswa";
            fileInput.value = ''; // Reset file input
        },
        error: function(err) {
            tampilkanNotifikasi('Gagal membaca file CSV: ' + err.message, 'error');
            tombolImport.disabled = false;
            tombolImport.innerHTML = "Import & Simpan Siswa";
        }
    });
}

async function buatAkunLoginSiswa(tombol, idSiswa) {
    tombol.disabled = true;
    tombol.innerHTML = '...';
    try {
        const { data, error } = await supa.rpc('buat_akun_siswa', { siswa_id: idSiswa });
        if (error) throw error;
        
        if (data.status === 'success') {
            alert(`Akun Berhasil Dibuat!\nEmail: ${data.email}\nPassword (default): ${data.password}\n\nTolong catat dan berikan ke siswa.`);
            muatDataSiswa(); // Refresh tabel untuk menghilangkan tombol
        } else {
            alert('Gagal membuat akun: ' + data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
        tombol.disabled = false;
        tombol.innerHTML = 'Buat Akun';
    }
}