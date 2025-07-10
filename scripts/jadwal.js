let jadwalHarianCache = [];

document.addEventListener('DOMContentLoaded', () => {
    tampilkanHeaderTanggal();
    muatJadwalHariIni();
    muatSemuaJadwal();
    
    document.getElementById('tombolTambahJadwal').addEventListener('click', (e) => {
        e.stopPropagation();
        tampilkanFormTambah();
    });
    document.getElementById('formJadwal').addEventListener('submit', handleSimpanJadwal);
    document.getElementById('jadwal-table-body').addEventListener('click', handleAksiJadwal);
    document.getElementById('tombolBatal').addEventListener('click', resetForm);

    const toggleButton = document.getElementById('toggle-jadwal-mingguan');
    const kontenJadwal = document.getElementById('konten-jadwal-mingguan');
    const toggleIcon = document.getElementById('toggle-icon');
    toggleButton.addEventListener('click', () => {
        kontenJadwal.classList.toggle('hidden');
        toggleIcon.classList.toggle('rotate-180');
    });

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
        
        jadwalHarianCache = data;
        gambarJadwalHarian();
        
    } catch(e) {
        container.innerHTML = `<p class="text-center text-red-500">Gagal memuat jadwal hari ini: ${e.message}</p>`;
    }
}

function gambarJadwalHarian() {
    const container = document.getElementById('jadwal-harian-container');
    const viewKosong = document.getElementById('jadwal-kosong');
    container.innerHTML = '';
    
    if (jadwalHarianCache.length === 0) {
        viewKosong.classList.remove('hidden');
        return;
    }

    viewKosong.classList.add('hidden');
    jadwalHarianCache.forEach(jadwal => {
        const card = document.createElement('div');
        card.id = `jadwal-card-${jadwal.id}`;
        card.dataset.jamSelesai = jadwal.Jam_Selesai.substring(0, 5);
        card.className = 'schedule-card rounded-lg shadow-lg p-6 flex items-center space-x-6';
        container.appendChild(card);
    });
    updateStatusJadwalLive(); // Panggil sekali untuk set status awal
}

function updateStatusJadwalLive() {
    const waktuSekarang = new Date().toTimeString().substring(0, 5);
    jadwalHarianCache.forEach(jadwal => {
        const card = document.getElementById(`jadwal-card-${jadwal.id}`);
        if (card) {
            const jamSelesai = card.dataset.jamSelesai;
            const isPast = waktuSekarang > jamSelesai;
            
            const jamMulai = jadwal.Jam_Mulai.substring(0, 5);
            card.className = `schedule-card rounded-lg shadow-lg p-6 flex items-center space-x-6 ${isPast ? 'is-past' : ''}`;
            card.innerHTML = `
                <div class="text-center flex-shrink-0"><p class="text-2xl font-bold">${jamMulai}</p><p class="text-sm opacity-80">s/d</p><p class="text-lg font-medium">${jamSelesai}</p></div>
                <div class="border-l-2 border-white/30 pl-6 flex-grow"><p class="text-2xl font-bold">${jadwal.Mata_Pelajaran}</p><p class="text-lg font-light opacity-90">Kelas ${jadwal.Kelas}</p></div>
                <div class="status-container">${isPast ? '<span class="text-xs font-semibold bg-white/30 py-1 px-2 rounded-full">SELESAI</span>' : ''}</div>
            `;
        }
    });
}

async function muatSemuaJadwal() {
    const tbody = document.getElementById('jadwal-table-body');
	if (!tbody) return;
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
        tombolSimpan.innerHTML = "Simpan";
    }
}

async function handleAksiJadwal(e) {
    const target = e.target;
    const id = target.dataset.id;
    if (target.classList.contains('edit-btn')) {
        try {
            const { data: jadwal, error } = await supa.from('Jadwal').select('*').eq('id', id).single();
            if (error) throw error;
            
            tampilkanFormTambah();
            document.getElementById('form-title').textContent = 'Edit Jadwal';
            document.getElementById('tombolSimpan').textContent = 'Update';
            
            document.getElementById('jadwal-id').value = jadwal.id;
            document.getElementById('jadwal-hari').value = jadwal.Hari;
            document.getElementById('jadwal-jam-mulai').value = jadwal.Jam_Mulai;
            document.getElementById('jadwal-jam-selesai').value = jadwal.Jam_Selesai;
            document.getElementById('jadwal-mapel').value = jadwal.Mata_Pelajaran;
            document.getElementById('jadwal-kelas').value = jadwal.Kelas;
        } catch (error) {
            tampilkanNotifikasi('Gagal mengambil data jadwal: ' + error.message, 'error');
        }
    } else if (target.classList.contains('hapus-btn')) {
        if (confirm('Yakin ingin menghapus jadwal ini?')) {
            hapusJadwal(id);
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
    document.getElementById('form-title').textContent = 'Tambah Jadwal Baru';
    document.getElementById('tombolBatal').classList.remove('hidden');
    document.getElementById('form-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
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