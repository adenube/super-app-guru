// GANTI DENGAN KUNCI SUPABASE-MU
const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let rekapDetailCache = {};

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('muatStatistikBtn').addEventListener('click', muatRekapSiswa);
    document.getElementById('terapkanFilterBtn').addEventListener('click', muatLaporanPresensi);
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

async function muatRekapSiswa() {
    const btn = document.getElementById('muatStatistikBtn');
    btn.disabled = true;
    btn.innerHTML = "Memuat...";
    try {
        const { data, error } = await supa.from('Siswa').select('id, Jenis_Kelamin');
        if (error) throw error;
        const totalMurid = data.length;
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
        const { data, error } = await supa.rpc('get_rekap_presensi_detail', {
            start_date: startDate, end_date: endDate
        });
        if (error) throw error;
        
        rekapDetailCache = data.detailedData;
        const summaryData = data.summaryData;
        if (summaryData && summaryData.length > 0) {
            emptyState.classList.add('hidden');
            summaryData.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'border-t hover:bg-blue-50';
                row.innerHTML = `<td class="py-3 px-4 font-medium">${item.kelas}</td><td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="H">${item.H}</span></td><td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="S">${item.S}</span></td><td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="I">${item.I}</span></td><td class="py-3 px-4 text-center"><span class="clickable-cell" data-kelas="${item.kelas}" data-status="A">${item.A}</span></td><td class="py-3 px-4 text-center font-semibold">${item.JUMLAH}</td>`;
                tabelBody.appendChild(row);
            });
        } else {
            emptyState.innerHTML = '<p>Tidak ada data presensi pada rentang tanggal tersebut.</p>';
        }
    } catch (error) {
        emptyState.innerHTML = `<p class="text-red-500">Gagal memuat laporan.</p>`;
        tampilkanNotifikasi(error.message, 'error');
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