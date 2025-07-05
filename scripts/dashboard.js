// GANTI DENGAN KUNCI SUPABASE-MU
const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";

const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Variabel Global ---
let rekapDetailCache = {};

// --- Event Listener Utama ---
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('muatStatistikBtn').addEventListener('click', muatRekapSiswa);
    document.getElementById('terapkanFilterBtn').addEventListener('click', muatLaporanPresensi);
	document.getElementById('laporan-container').addEventListener('click', handleDownloadKelas);
    
    const modal = document.getElementById('detailModal');
    document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('closeModalXBtn').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') modal.classList.add('hidden');
    });
    document.getElementById('rekapPresensiBody').addEventListener('click', handleCellClick);
    
    const endDateInput = document.getElementById('endDate');
    const startDateInput = document.getElementById('startDate');
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 6);
    endDateInput.valueAsDate = today;
    startDateInput.valueAsDate = oneWeekAgo;
});

// --- Fungsi-fungsi Logika ---

async function muatRekapSiswa() {
    const btn = document.getElementById('muatStatistikBtn');
    btn.disabled = true;
    btn.innerHTML = "Memuat...";
    try {
        // Ambil data Jenis Kelamin dari semua siswa
        const { data, error, count } = await supa.from('Siswa').select('Jenis_Kelamin', { count: 'exact' });
        if (error) throw error;
        
        const totalMurid = count;
        const totalLaki = data.filter(s => s.Jenis_Kelamin === 'Laki-laki').length;
        const totalPerempuan = totalMurid - totalLaki;

        document.getElementById('totalMurid').textContent = totalMurid;
        document.getElementById('totalLaki').textContent = totalLaki;
        document.getElementById('totalPerempuan').textContent = totalPerempuan;

    } catch (error) {
        tampilkanNotifikasi("Gagal memuat statistik: " + error.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Muat Statistik";
    }
}

async function muatLaporanPresensi() {
    const btn = document.getElementById('terapkanFilterBtn');
    const tabelBody = document.getElementById('rekapPresensiBody');
    const emptyState = document.getElementById('emptyStateLaporan');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        tampilkanNotifikasi("Silakan isi kedua tanggal filter.", "error"); return;
    }

    btn.disabled = true;
    btn.innerHTML = "Memuat...";
    tabelBody.innerHTML = '';
    emptyState.innerHTML = '<p>Mencari data...</p>';
    emptyState.classList.remove('hidden');

    try {
        const { data, error } = await supa.rpc('get_rekap_presensi_detail', { /* ... */ });
        if (error) throw error;
        
        rekapDetailCache = data.detailedData;
        const summaryData = data.summaryData;

        // Kosongkan tabel lama
        const tabelContainer = document.getElementById('laporan-container');
        tabelContainer.innerHTML = ''; // Hapus semua isi sebelumnya
        
        if (summaryData && summaryData.length > 0) {
            // Buat tabel baru dengan header yang sudah di-upgrade
            const table = document.createElement('table');
            table.className = 'min-w-full bg-white';
            table.innerHTML = `
                <thead class="bg-gray-100">
                    <tr>
                        <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Kelas</th>
                        <th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Hadir</th>
                        <th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Sakit</th>
                        <th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Izin</th>
                        <th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Alpha</th>
                        <th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Jumlah</th>
                        <th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                </thead>
                <tbody id="rekapPresensiBody"></tbody>
            `;
            
            const tabelBody = table.querySelector('#rekapPresensiBody');
            summaryData.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'border-t hover:bg-blue-50';
                // Tambahkan kolom baru untuk tombol Download
                row.innerHTML = `
                  <td class="py-3 px-4 font-medium">${item.kelas}</td>
                  <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="H">${item.H}</span></td>
                  <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="S">${item.S}</span></td>
                  <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="I">${item.I}</span></td>
                  <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="A">${item.A}</span></td>
                  <td class="py-3 px-4 text-center font-semibold">${item.JUMLAH}</td>
                  <td class="py-3 px-4 text-center">
                    <button class="download-kelas-btn bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md text-xs" data-kelas="${item.kelas}">
                        PDF
                    </button>
                  </td>`;
                tabelBody.appendChild(row);
            });
            tabelContainer.appendChild(table); // Masukkan tabel yang sudah jadi ke container
        } else {
            tabelContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Tidak ada data presensi pada rentang tanggal tersebut.</p>';
        }
    } catch (error) {
        emptyState.innerHTML = `<p class="text-red-500">Gagal memuat laporan.</p>`;
        tampilkanNotifikasi('Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Tampilkan Laporan";
    }
}

function handleCellClick(e) {
    if (!e.target || !e.target.classList.contains('clickable-cell')) return;
    const cell = e.target;
    const jumlah = parseInt(cell.textContent, 10);
    if (isNaN(jumlah) || jumlah === 0) return;
    
    const kelas = cell.dataset.kelas;
    const status = cell.dataset.status;
    
    const modal = document.getElementById('detailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalList = document.getElementById('modalList');
    const statusLengkap = {'H':'Hadir','S':'Sakit','I':'Izin','A':'Alpha'}[status] || status;
    
    modalTitle.textContent = `Siswa Kelas ${kelas} (Status: ${statusLengkap})`;
    modalList.innerHTML = '';
    
    const namaSiswa = rekapDetailCache[kelas] ? (rekapDetailCache[kelas][status] || []) : [];
    
    if (namaSiswa.length > 0) {
        namaSiswa.sort().forEach(nama => { // Urutkan nama sesuai abjad
            const li = document.createElement('li');
            li.textContent = nama;
            modalList.appendChild(li);
        });
    } else {
        modalList.innerHTML = '<li>Tidak ada data siswa ditemukan.</li>';
    }
    modal.classList.remove('hidden');
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

// --- FUNGSI BARU UNTUK DOWNLOAD PDF PER KELAS ---
async function handleDownloadKelas(e) {
    if (!e.target || !e.target.classList.contains('download-kelas-btn')) return;

    const btn = e.target;
    const kelas = btn.dataset.kelas;
    const startDate = document.getElementById('tanggalMulai').value;
    const endDate = document.getElementById('tanggalSelesai').value;
    
    tampilkanNotifikasi(`Mempersiapkan PDF untuk kelas ${kelas}...`, 'success');
    btn.disabled = true;
    btn.innerHTML = '...';

    try {
        // Kita ambil data detail untuk kelas ini dari cache yang sudah ada
        const detailHadir = rekapDetailCache[kelas]?.H || [];
        const detailSakit = rekapDetailCache[kelas]?.S || [];
        const detailIzin = rekapDetailCache[kelas]?.I || [];
        const detailAlpha = rekapDetailCache[kelas]?.A || [];

        // Buat elemen HTML sementara untuk dicetak
        const printArea = document.createElement('div');
        printArea.style.padding = '20px';
        printArea.style.fontFamily = 'sans-serif';
        printArea.innerHTML = `
            <h2 style="font-size: 18px; font-weight: 600;">Laporan Detail Presensi</h2>
            <p style="font-size: 14px; margin-bottom: 4px;">Kelas: ${kelas}</p>
            <p style="font-size: 12px; color: #555; margin-bottom: 16px;">
                Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}
            </p>
        `;

        // Buat tabel detail
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.innerHTML = `
            <thead>
                <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nama Siswa</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
                </tr>
            </thead>
            <tbody></tbody>`;
        
        const tbody = table.querySelector('tbody');
        const allStudents = [
            ...detailHadir.map(nama => ({nama, status: 'Hadir'})),
            ...detailSakit.map(nama => ({nama, status: 'Sakit'})),
            ...detailIzin.map(nama => ({nama, status: 'Izin'})),
            ...detailAlpha.map(nama => ({nama, status: 'Alpha'}))
        ].sort((a,b) => a.nama.localeCompare(b.nama));

        allStudents.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="border: 1px solid #ddd; padding: 8px;">${s.nama}</td><td style="border: 1px solid #ddd; padding: 8px;">${s.status}</td>`;
            tbody.appendChild(tr);
        });

        printArea.appendChild(table);
        document.body.appendChild(printArea);

        // "Foto" elemen dan buat PDF
        const { jsPDF } = window.jspdf;
        await html2canvas(printArea).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
            pdf.save(`laporan-presensi-${kelas}.pdf`);
            document.body.removeChild(printArea);
        });

    } catch (error) {
        tampilkanNotifikasi('Gagal membuat PDF: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'PDF';
    }
}