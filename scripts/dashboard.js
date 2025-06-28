// ==========================================================
// PASTE URL WEB APP DARI APPS SCRIPT YANG KAMU SIMPAN DI SINI
// ==========================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxg1HyJhXd9Fckb3HD_u4C2l6XrjGbDSH8POg7dRNsA8Li0AgOCERqzQ5PWyUVRnC6h/exec";
// ==========================================================

let rekapDetailCache = {};

document.addEventListener('DOMContentLoaded', function() {
    renderLayout();
});

function renderLayout() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;
    
    container.innerHTML = `
        <h1 class="text-3xl font-bold text-blue-800 mb-8">Dashboard Rekapitulasi</h1>
        <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold text-blue-700">Statistik Total Murid</h2><button id="muatStatistikBtn" class="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md text-sm">Muat Statistik</button></div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-blue-50 p-4 rounded-md border border-blue-100 text-center"><div class="text-sm text-gray-500">Laki-laki</div><div class="text-3xl font-bold text-blue-600" id="totalLaki">-</div></div>
                <div class="bg-pink-50 p-4 rounded-md border border-pink-100 text-center"><div class="text-sm text-gray-500">Perempuan</div><div class="text-3xl font-bold text-pink-600" id="totalPerempuan">-</div></div>
                <div class="bg-indigo-50 p-4 rounded-md border border-indigo-100 text-center"><div class="text-sm text-gray-500">Total Murid</div><div class="text-3xl font-bold text-indigo-600" id="totalMurid">-</div></div>
            </div>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 class="text-xl font-semibold text-blue-700 mb-4">Laporan Presensi Siswa</h2>
            <div class="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div class="flex-1"><label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal:</label><input type="date" id="startDate" class="w-full px-3 py-2 border border-gray-300 rounded-md"></div>
                <div class="flex-1"><label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal:</label><input type="date" id="endDate" class="w-full px-3 py-2 border border-gray-300 rounded-md"></div>
                <div class="flex-shrink-0 self-end"><button id="terapkanFilterBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">Tampilkan Laporan</button></div>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white"><thead class="bg-gray-100"><tr><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Kelas</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">H</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">S</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">I</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">A</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">JUMLAH</th></tr></thead><tbody id="rekapPresensiBody"></tbody></table>
                 <div id="emptyStateLaporan" class="text-center py-8 text-gray-500"><p>Pilih rentang tanggal dan klik "Tampilkan Laporan" untuk melihat data.</p></div>
            </div>
        </div>
    `;

    document.getElementById('muatStatistikBtn').addEventListener('click', muatRekapSiswa);
    document.getElementById('terapkanFilterBtn').addEventListener('click', muatLaporanPresensi);
    document.getElementById('rekapPresensiBody').addEventListener('click', handleCellClick);
    
    const modal = document.getElementById('detailModal');
    document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('closeModalXBtn').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') modal.classList.add('hidden');
    });

    const endDateInput = document.getElementById('endDate');
    const startDateInput = document.getElementById('startDate');
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 6);
    endDateInput.valueAsDate = today;
    startDateInput.valueAsDate = oneWeekAgo;
}

function muatRekapSiswa() {
    const btn = document.getElementById('muatStatistikBtn');
    btn.disabled = true;
    btn.innerHTML = "Memuat...";
    fetch(`${API_URL}?action=getRekapitulasiData`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                document.getElementById('totalMurid').textContent = result.data.totalMurid;
                document.getElementById('totalLaki').textContent = result.data.totalLaki;
                document.getElementById('totalPerempuan').textContent = result.data.totalPerempuan;
            } else { throw new Error(result.message); }
            btn.disabled = false;
            btn.innerHTML = "Muat Statistik";
        })
        .catch(error => {
            tampilkanNotifikasi("Gagal memuat statistik: " + error.message, "error");
            btn.disabled = false;
            btn.innerHTML = "Muat Statistik";
        });
}

function muatLaporanPresensi() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const tabelBody = document.getElementById('rekapPresensiBody');
    const emptyState = document.getElementById('emptyStateLaporan');
    const btn = document.getElementById('terapkanFilterBtn');
    if (!startDate || !endDate) {
        tampilkanNotifikasi("Silakan isi kedua tanggal filter.", "error"); return;
    }
    btn.disabled = true;
    btn.innerHTML = "Memuat...";
    tabelBody.innerHTML = '';
    emptyState.innerHTML = '<p>Mencari data...</p>';
    emptyState.classList.remove('hidden');

    fetch(`${API_URL}?action=getRekapPresensi&startDate=${startDate}&endDate=${endDate}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                const data = result.data.summaryData;
                rekapDetailCache = result.data.detailedData;
                if (data && data.length > 0) {
                    emptyState.classList.add('hidden');
                    data.forEach(item => {
                        const row = document.createElement('tr');
                        row.className = 'border-t hover:bg-blue-50';
                        row.innerHTML = `
                            <td class="py-3 px-4 font-medium">${item.kelas}</td>
                            <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="H">${item.H}</span></td>
                            <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="S">${item.S}</span></td>
                            <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="I">${item.I}</span></td>
                            <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="A">${item.A}</span></td>
                            <td class="py-3 px-4 text-center font-semibold">${item.JUMLAH}</td>`;
                        tabelBody.appendChild(row);
                    });
                } else {
                    emptyState.innerHTML = '<p>Tidak ada data presensi pada rentang tanggal tersebut.</p>';
                }
            } else { throw new Error(result.message); }
            btn.disabled = false;
            btn.innerHTML = "Tampilkan Laporan";
        })
        .catch(error => {
            tampilkanNotifikasi("Gagal memuat laporan: " + error.message, "error");
            btn.disabled = false;
            btn.innerHTML = "Tampilkan Laporan";
        });
}

function handleCellClick(e) {
    if (e.target && e.target.classList.contains('clickable-cell')) {
        const cell = e.target;
        const jumlah = parseInt(cell.textContent, 10);
        if (isNaN(jumlah) || jumlah === 0) return;
        
        const kelas = cell.dataset.kelas;
        const status = cell.dataset.status;
        const namaSiswa = rekapDetailCache[kelas] ? (rekapDetailCache[kelas][status] || []) : [];
        
        const modal = document.getElementById('detailModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalList = document.getElementById('modalList');
        const statusLengkap = {'H':'Hadir','S':'Sakit','I':'Izin','A':'Alpha'}[status] || status;
        
        modalTitle.textContent = `Siswa Kelas ${kelas} (Status: ${statusLengkap})`;
        modalList.innerHTML = '';
        if (namaSiswa.length > 0) {
            namaSiswa.forEach(nama => {
                const li = document.createElement('li');
                li.textContent = nama;
                modalList.appendChild(li);
            });
        } else {
            modalList.innerHTML = '<li>Tidak ada data siswa ditemukan.</li>';
        }
        modal.classList.remove('hidden');
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