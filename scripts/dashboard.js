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
async function muatJadwalHariIni() {
    const container = document.getElementById('jadwal-hari-ini');
    container.innerHTML = '<h2 class="text-xl font-semibold text-gray-800 mb-4">Jadwal Hari Ini...</h2>';
    
    const namaHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    try {
        const { data, error } = await supa.from('Jadwal')
            .select('*').eq('Hari', namaHariIni).order('Jam_Mulai');
        if (error) throw error;
        
        if (data.length === 0) {
            container.innerHTML += '<p class="text-gray-500">Tidak ada jadwal mengajar hari ini.</p>';
        } else {
            // Tampilkan jadwalnya... (logika sama seperti di jadwal.js)
        }
    } catch(e) {
        container.innerHTML += `<p class="text-red-500">Gagal memuat jadwal: ${e.message}</p>`;
    }
}

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
        // CARA BARU: Ambil data presensi dan data siswa yang terkait sekaligus
        const { data, error } = await supa
            .from('Presensi')
            .select(`
                Status,
                Siswa ( id, Nama_Lengkap, Kelas )
            `)
            .gte('Tanggal_Presensi', startDate)
            .lte('Tanggal_Presensi', endDate);

        if (error) throw error;

        // Proses data di sisi browser (JavaScript)
        const rekap = {};
        const detail = {};

        data.forEach(presensi => {
            if (presensi.Siswa) { // Hanya proses jika data siswanya ada
                const kelas = presensi.Siswa.Kelas;
                const nama = presensi.Siswa.Nama_Lengkap;
                const status = presensi.Status;
                const statusMap = { 'Hadir': 'H', 'Sakit': 'S', 'Izin': 'I', 'Alpha': 'A' };
                const statusSingkat = statusMap[status];

                if (!rekap[kelas]) {
                  rekap[kelas] = { kelas: kelas, H: 0, S: 0, I: 0, A: 0, JUMLAH: 0 };
                  detail[kelas] = { H: [], S: [], I: [], A: [] };
                }
                if (rekap[kelas].hasOwnProperty(statusSingkat)) {
                  rekap[kelas][statusSingkat]++;
                  rekap[kelas].JUMLAH++;
                  detail[kelas][statusSingkat].push(nama);
                }
            }
        });
        
        rekapDetailCache = detail; // Simpan data detail ke cache
        const summaryData = Object.values(rekap).sort((a, b) => a.kelas.localeCompare(b.kelas));
        
        if (summaryData && summaryData.length > 0) {
            emptyState.classList.add('hidden');
            summaryData.forEach(item => {
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