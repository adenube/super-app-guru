// ==========================================================
//  PASTE URL WEB APP DARI APPS SCRIPT YANG KAMU SIMPAN DI SINI
// ==========================================================
const API_URL = "https://script.google.com/macros/s/AKfycbwoymFxlkZKVnFQxSCd-e6JKzuEnmJndGEBMPb1s7AUpH69diV-vSh2RVubw15_UKzD/exec"; 
// ==========================================================


// Fungsi utama yang dijalankan saat halaman siap
document.addEventListener('DOMContentLoaded', function() {
    renderLayout();
    muatDataSiswa();
});

// Fungsi untuk merender layout awal
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
    // ...tambahkan event listener lain di sini...
}


// Pola baru menggunakan fetch untuk GET data
function muatDataSiswa() {
    fetch(`${API_URL}?action=getSemuaSiswa`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                // Logika untuk menampilkan data siswa (paginasi, dll)
                console.log('Data siswa diterima:', result.data);
                // Di sini nanti kita panggil fungsi untuk render tabel
            } else {
                throw new Error(result.message);
            }
        })
        .catch(error => {
            console.error('Error saat memuat data siswa:', error);
            document.getElementById('emptyState').innerHTML = `<p class="text-red-500">Gagal memuat data.</p>`;
        });
}

// Pola baru menggunakan fetch untuk POST data
function handleSimpanSiswa(e) {
    e.preventDefault();
    
    const dataForm = {
        // ... ambil data dari form ...
    };

    const payload = {
        action: 'tambahSiswaBaru', // atau 'editSiswa'
        payload: dataForm
    };

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-g', // Diperlukan untuk Apps Script
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('Respon server:', result.data);
            muatDataSiswa(); // Muat ulang data setelah berhasil
        } else {
            throw new Error(result.message);
        }
    })
    .catch(error => {
        console.error('Error saat menyimpan data:', error);
    });
}