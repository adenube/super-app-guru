let jadwalHarianCache = [];

document.addEventListener('DOMContentLoaded', () => {
    tampilkanHeaderTanggal();
    muatJadwalHariIni();
    muatSemuaJadwal();
    
    document.getElementById('tombolTambahJadwal').addEventListener('click', tampilkanFormTambah);
    document.getElementById('formJadwal').addEventListener('submit', handleSimpanJadwal);
    document.getElementById('jadwal-table-body').addEventListener('click', handleAksiJadwal);
    document.getElementById('tombolBatal').addEventListener('click', resetForm);

    // --- INI DIA "DETAK JANTUNG"-NYA ---
    // Cek status jadwal setiap 30 detik (30000 ms)
    setInterval(updateStatusJadwalLive, 30000); 
});

function tampilkanHeaderTanggal() {
    const sekarang = new Date();
    const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalLengkap = sekarang.toLocaleDateString('id-ID', opsi);
    document.getElementById('headerHari').textContent = `Jadwal Hari Ini`;
    document.getElementById('headerTanggal').textContent = tanggalLengkap;
}

async function muatJadwalHariIni() {
    const container = document.getElementById('jadwal-harian-container');
    const viewKosong = document.getElementById('jadwal-kosong');
    container.innerHTML = '<p class="text-center text-gray-500">Mencari jadwal...</p>';

    const namaHariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

    try {
        const { data, error } = await supa.from('Jadwal').select('*').eq('Hari', namaHariIni).order('Jam_Mulai');
        if (error) throw error;
        
        jadwalHarianCache = data; // Simpan data ke cache
        gambarJadwalHarian(); // Gambar jadwal dari cache
        
    } catch(e) {
        container.innerHTML = `<p class="text-center text-red-500">Gagal memuat jadwal hari ini: ${e.message}</p>`;
    }
}

function gambarJadwalHarian() {
    const container = document.getElementById('jadwal-harian-container');
    const viewKosong = document.getElementById('jadwal-kosong');
    const waktuSekarang = new Date().toTimeString().substring(0, 5);

    container.innerHTML = '';
    
    if (jadwalHarianCache.length === 0) {
        viewKosong.classList.remove('hidden');
        return;
    }

    viewKosong.classList.add('hidden');
    jadwalHarianCache.forEach(jadwal => {
        const card = document.createElement('div');
        const jamSelesai = jadwal.Jam_Selesai.substring(0, 5);
        const isPast = waktuSekarang > jamSelesai;

        card.id = `jadwal-card-${jadwal.id}`;
        // Simpan jam selesai di data-attribute untuk dicek nanti
        card.dataset.jamSelesai = jamSelesai; 
        
        card.className = `schedule-card rounded-lg shadow-lg p-6 flex items-center space-x-6 ${isPast ? 'is-past' : ''}`;
        
        const jamMulai = jadwal.Jam_Mulai.substring(0, 5);

        card.innerHTML = `
            <div class="text-center flex-shrink-0">
                <p class="text-2xl font-bold">${jamMulai}</p>
                <p class="text-sm opacity-80">s/d</p>
                <p class="text-lg font-medium">${jamSelesai}</p>
            </div>
            <div class="border-l-2 border-white/30 pl-6 flex-grow">
                <p class="text-2xl font-bold">${jadwal.Mata_Pelajaran}</p>
                <p class="text-lg font-light opacity-90">Kelas ${jadwal.Kelas}</p>
            </div>
            <div class="status-container">
                ${isPast ? '<span class="text-xs font-semibold bg-white/30 py-1 px-2 rounded-full">SELESAI</span>' : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

// FUNGSI BARU UNTUK UPDATE TAMPILAN SECARA LIVE
function updateStatusJadwalLive() {
    const waktuSekarang = new Date().toTimeString().substring(0, 5);
    const semuaKartu = document.querySelectorAll('.schedule-card-mini'); // Pastikan nama kelas ini benar

    semuaKartu.forEach(card => {
        if (!card.classList.contains('is-past')) {
            const jamSelesai = card.dataset.jamSelesai;
            if (waktuSekarang > jamSelesai) {
                card.classList.add('is-past');
                const statusContainer = card.querySelector('.status-container');
                if (statusContainer) {
                    statusContainer.innerHTML = '<span class="text-xs font-semibold bg-white/30 py-1 px-2 rounded-full">SELESAI</span>';
                }
            }
        }
    });
}

async function muatSemuaJadwal() {
    const tbody = document.getElementById('jadwal-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Memuat jadwal...</td></tr>';
    try {
        const { data, error } = await supa.from('Jadwal').select('*').order('created_at');
        if (error) throw error;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Belum ada jadwal mingguan dibuat.</td></tr>';
        } else {
            const urutanHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
            data.sort((a, b) => urutanHari.indexOf(a.Hari) - urutanHari.indexOf(b.Hari) || a.Jam_Mulai.localeCompare(b.Jam_Mulai));
            data.forEach(j => {
                const row = document.createElement('tr');
                row.className = 'border-t';
                row.innerHTML = `<td class="py-3 px-4 font-bold">${j.Hari}</td><td class="py-3 px-4">${j.Jam_Mulai.substring(0,5)} - ${j.Jam_Selesai.substring(0,5)}</td><td class="py-3 px-4 font-semibold">${j.Mata_Pelajaran}</td><td class="py-3 px-4">${j.Kelas}</td><td class="py-3 px-4"><div class="flex space-x-2"><button class="edit-btn text-sm text-yellow-600 hover:underline" data-id="${j.id}">Edit</button><button class="hapus-btn text-sm text-red-600 hover:underline" data-id="${j.id}">Hapus</button></div></td>`;
                tbody.appendChild(row);
            });
        }
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Gagal memuat jadwal: ${e.message}</td></tr>`;
    }
}

async function handleSimpanJadwal(e) {
    e.preventDefault();
    const tombolSimpan = document.getElementById('tombolSimpan');
    tombolSimpan.disabled = true;
    const id = document.getElementById('jadwal-id').value;
    const dataForm = {
        Hari: document.getElementById('jadwal-hari').value,
        Jam_Mulai: document.getElementById('jadwal-jam-mulai').value,
        Jam_Selesai: document.getElementById('jadwal-jam-selesai').value,
        Mata_Pelajaran: document.getElementById('jadwal-mapel').value,
        Kelas: document.getElementById('jadwal-kelas').value,
    };
    try {
        let response;
        if (id) {
            tombolSimpan.innerHTML = "Mengupdate...";
            response = await supa.from('Jadwal').update(dataForm).eq('id', id);
        } else {
            tombolSimpan.innerHTML = "Menyimpan...";
            response = await supa.from('Jadwal').insert([dataForm]);
        }
        if (response.error) throw response.error;
        tampilkanNotifikasi('Jadwal berhasil disimpan!', 'success');
        resetForm();
        muatSemuaJadwal();
        muatJadwalHariIni();
    } catch (error) {
        tampilkanNotifikasi('Gagal menyimpan jadwal: ' + error.message, 'error');
    } finally {
        tombolSimpan.disabled = false;
    }
}

function handleAksiJadwal(e) {
    const target = e.target;
    if (target.classList.contains('edit-btn')) {
        const row = target.closest('tr');
        const cells = row.querySelectorAll('td');
        const [jamMulai, jamSelesai] = cells[1].textContent.split(' - ');
        
        document.getElementById('form-title').textContent = 'Edit Jadwal';
        document.getElementById('tombolSimpan').textContent = 'Update';
        document.getElementById('tombolBatal').classList.remove('hidden');
        document.getElementById('form-container').classList.remove('hidden');

        document.getElementById('jadwal-id').value = target.dataset.id;
        document.getElementById('jadwal-hari').value = cells[0].textContent;
        document.getElementById('jadwal-jam-mulai').value = jamMulai;
        document.getElementById('jadwal-jam-selesai').value = jamSelesai;
        document.getElementById('jadwal-mapel').value = cells[2].textContent;
        document.getElementById('jadwal-kelas').value = cells[3].textContent;
        
        window.scrollTo({top: 0, behavior: 'smooth'});
    } else if (target.classList.contains('hapus-btn')) {
        if (confirm('Yakin ingin menghapus jadwal ini?')) {
            hapusJadwal(target.dataset.id);
        }
    }
}

async function hapusJadwal(id) {
    try {
        const { error } = await supa.from('Jadwal').delete().eq('id', id);
        if (error) throw error;
        tampilkanNotifikasi('Jadwal berhasil dihapus.', 'warning');
        muatSemuaJadwal();
        muatJadwalHariIni();
    } catch (error) {
        tampilkanNotifikasi('Gagal menghapus jadwal: ' + error.message, 'error');
    }
}

function tampilkanFormTambah() {
    resetForm();
    document.getElementById('form-container').classList.remove('hidden');
    document.getElementById('form-container').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('formJadwal').reset();
    document.getElementById('jadwal-id').value = '';
    document.getElementById('form-title').textContent = 'Tambah Jadwal Baru';
    document.getElementById('tombolSimpan').textContent = 'Simpan';
    document.getElementById('tombolSimpan').disabled = false;
    document.getElementById('tombolBatal').classList.add('hidden');
    document.getElementById('form-container').classList.add('hidden');
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