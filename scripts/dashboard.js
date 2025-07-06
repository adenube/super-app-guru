const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let rekapDetailCache = {};

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('muatStatistikBtn').addEventListener('click', muatRekapSiswa);
    document.getElementById('terapkanFilterBtn').addEventListener('click', muatLaporanPresensi);
    
    const modal = document.getElementById('detailModal');
    if (modal) {
        document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.add('hidden'));
        document.getElementById('closeModalXBtn').addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') modal.classList.add('hidden');
        });
    }
    
    const laporanContainer = document.getElementById('laporan-presensi-container');
    if(laporanContainer) laporanContainer.addEventListener('click', handleAksiLaporan);

    const endDateInput = document.getElementById('endDate');
    const startDateInput = document.getElementById('startDate');
    if (endDateInput && startDateInput) {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 6);
        endDateInput.valueAsDate = today;
        startDateInput.valueAsDate = oneWeekAgo;
    }
});

async function muatRekapSiswa() {
    const btn = document.getElementById('muatStatistikBtn');
    btn.disabled = true;
    btn.innerHTML = "Memuat...";
    try {
        const { data, error, count } = await supa.from('Siswa').select('id, Jenis_Kelamin', { count: 'exact' });
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
        btn.innerHTML = "Muat Ulang";
    }
}

async function muatLaporanPresensi() {
    const btn = document.getElementById('terapkanFilterBtn');
    const wrapper = document.getElementById('tabel-laporan-wrapper');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        tampilkanNotifikasi("Silakan isi kedua tanggal filter.", "error"); return;
    }

    btn.disabled = true;
    btn.innerHTML = "Mencari...";
    wrapper.innerHTML = '<p class="text-center text-gray-500 py-8">Mencari data...</p>';

    try {
        const { data: presensiData, error } = await supa
            .from('Presensi')
            .select(`Status, Siswa (id, Nama_Lengkap, Kelas)`)
            .gte('Tanggal_Presensi', startDate)
            .lte('Tanggal_Presensi', endDate);
        if (error) throw error;

        const rekap = {};
        const detail = {};
        presensiData.forEach(p => {
            if (p.Siswa) {
                const { Kelas, Nama_Lengkap } = p.Siswa;
                const { Status } = p;
                const statusMap = { 'Hadir': 'H', 'Sakit': 'S', 'Izin': 'I', 'Alpha': 'A' };
                const statusSingkat = statusMap[Status];
                if (!rekap[Kelas]) {
                  rekap[Kelas] = { kelas: Kelas, H: 0, S: 0, I: 0, A: 0, JUMLAH: 0 };
                  detail[Kelas] = { H: [], S: [], I: [], A: [] };
                }
                if (rekap[Kelas].hasOwnProperty(statusSingkat)) {
                  rekap[Kelas][statusSingkat]++;
                  rekap[Kelas].JUMLAH++;
                  detail[Kelas][statusSingkat].push(Nama_Lengkap);
                }
            }
        });
        
        rekapDetailCache = detail;
        const summaryData = Object.values(rekap).sort((a, b) => a.kelas.localeCompare(b.kelas));
        
        if (summaryData.length > 0) {
            const table = document.createElement('table');
            table.className = 'min-w-full bg-white';
            table.innerHTML = `<thead class="bg-gray-100"><tr><th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Kelas</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">H</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">S</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">I</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">A</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Jumlah</th><th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Aksi</th></tr></thead><tbody id="rekapPresensiBody"></tbody>`;
            const tabelBody = table.querySelector('#rekapPresensiBody');
            summaryData.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'border-t hover:bg-blue-50';
                row.innerHTML = `<td class="py-3 px-4 font-medium">${item.kelas}</td>
                  <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="H">${item.H}</span></td>
                  <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="S">${item.S}</span></td>
                  <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="I">${item.I}</span></td>
                  <td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="A">${item.A}</span></td>
                  <td class="py-3 px-4 text-center font-semibold">${item.JUMLAH}</td>
                  <td class="py-3 px-4 text-center"><button class="download-kelas-btn bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md text-xs" data-kelas="${item.kelas}">PDF</button></td>`;
                tabelBody.appendChild(row);
            });
            wrapper.innerHTML = '';
            wrapper.appendChild(table);
        } else {
            wrapper.innerHTML = '<p class="text-center text-gray-500 py-8">Tidak ada data presensi pada rentang tanggal ini.</p>';
        }
    } catch (error) {
        wrapper.innerHTML = `<p class="text-center text-red-500">Gagal memuat laporan: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Tampilkan Laporan";
    }
}

function handleAksiLaporan(e) {
    if (e.target.classList.contains('clickable-cell')) {
        handleCellClick(e.target);
    } else if (e.target.classList.contains('download-kelas-btn')) {
        handleDownloadKelas(e.target);
    }
}

function handleCellClick(cell) {
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
        namaSiswa.sort().forEach(nama => {
            const li = document.createElement('li');
            li.textContent = nama;
            modalList.appendChild(li);
        });
    } else {
        modalList.innerHTML = '<li>Tidak ada data siswa ditemukan.</li>';
    }
    modal.classList.remove('hidden');
}

async function handleDownloadKelas(btn) {
    const kelas = btn.dataset.kelas;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    tampilkanNotifikasi(`Mempersiapkan PDF untuk kelas ${kelas}...`, 'success');
    btn.disabled = true;
    btn.innerHTML = '...';

    try {
        const { data, error } = await supa.from('Presensi')
            .select(`Status, Tanggal_Presensi, Siswa!inner(Nama_Lengkap)`)
            .eq('Siswa.Kelas', kelas)
            .gte('Tanggal_Presensi', startDate)
            .lte('Tanggal_Presensi', endDate)
            .order('Tanggal_Presensi', { ascending: true });
        
        if (error) throw error;
        if (data.length === 0) {
            tampilkanNotifikasi('Tidak ada data detail untuk diunduh.', 'warning');
            return;
        }
        generatePdf(kelas, startDate, endDate, data);
    } catch(e) {
        tampilkanNotifikasi('Gagal membuat PDF: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'PDF';
    }
}

function generatePdf(kelas, startDate, endDate, data) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');
    pdf.setFontSize(18);
    pdf.text(`Laporan Detail Presensi - Kelas ${kelas}`, 40, 60);
    pdf.setFontSize(12);
    pdf.text(`Periode: ${startDate} s/d ${endDate}`, 40, 80);
    const headers = [["No", "Tanggal", "Nama Siswa", "Status Kehadiran"]];
    const body = data.map((item, index) => [
        index + 1,
        new Date(item.Tanggal_Presensi).toLocaleDateString('id-ID'),
        item.Siswa.Nama_Lengkap,
        item.Status
    ]);
    pdf.autoTable({
        startY: 100,
        head: headers,
        body: body,
    });
    pdf.save(`laporan-presensi-${kelas}-${startDate}.pdf`);
}

function tampilkanNotifikasi(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-yellow-500');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-md shadow-lg text-white transition-all duration-300 z-50 ${bgColor}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}