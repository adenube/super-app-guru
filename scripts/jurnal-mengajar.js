const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    muatRiwayatJurnal();
    muatDropdowns();
    
    document.getElementById('tombolTambahJurnal').addEventListener('click', tampilkanFormTambah);
    document.getElementById('tombolBatal').addEventListener('click', sembunyikanForm);
    document.getElementById('formJurnal').addEventListener('submit', handleSimpanJurnal);
    document.getElementById('jurnal-list').addEventListener('click', handleAksiJurnal);
});

async function muatDropdowns() {
    try {
        const [topikResult, kelasResult] = await Promise.all([
            supa.from('RencanaAjar').select('id, Topik_Bahasan').order('Topik_Bahasan'),
            supa.from('Siswa').select('Kelas')
        ]);

        if (topikResult.error) throw topikResult.error;
        const topikSelect = document.getElementById('pilihTopik');
        topikSelect.innerHTML = '<option value="">Pilih Topik Bahasan</option>';
        topikResult.data.forEach(topik => {
            topikSelect.innerHTML += `<option value="${topik.id}">${topik.Topik_Bahasan}</option>`;
        });

        if (kelasResult.error) throw kelasResult.error;
        const kelasSelect = document.getElementById('pilihKelas');
        const daftarKelas = [...new Set(kelasResult.data.map(item => item.Kelas))].sort();
        kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>';
        daftarKelas.forEach(kelas => {
            if(kelas) kelasSelect.innerHTML += `<option value="${kelas}">${kelas}</option>`;
        });

    } catch (e) {
        tampilkanNotifikasi('Gagal memuat data dropdown: ' + e.message, 'error');
    }
}

async function muatRiwayatJurnal() {
    const container = document.getElementById('jurnal-list');
    container.innerHTML = '<p>Memuat riwayat jurnal...</p>';
    try {
        const { data, error } = await supa.from('JurnalMengajar')
            .select(`*, RencanaAjar(Topik_Bahasan)`)
            .order('Tanggal_Jurnal', { ascending: false });

        if (error) throw error;
        
        if (data.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">Belum ada jurnal yang ditulis. Klik "+ Tulis Jurnal Baru" untuk memulai.</p>';
            return;
        }

        container.innerHTML = '';
        data.forEach(jurnal => {
            const card = document.createElement('div');
            card.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-blue-800">${jurnal.RencanaAjar.Topik_Bahasan}</p>
                        <p class="text-sm text-gray-600 font-semibold">Kelas: ${jurnal.Kelas_Diajar}</p>
                        <p class="text-xs text-gray-500">${new Date(jurnal.Tanggal_Jurnal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div class="flex space-x-2 flex-shrink-0">
                        <button class="edit-jurnal-btn text-sm text-yellow-600 hover:underline" data-id="${jurnal.id}">Edit</button>
                        <button class="hapus-jurnal-btn text-sm text-red-600 hover:underline" data-id="${jurnal.id}">Hapus</button>
                    </div>
                </div>
                <p class="mt-3 text-gray-700 whitespace-pre-wrap">${jurnal.Catatan_Refleksi}</p>
                ${jurnal.Link_Dokumentasi ? `<a href="${jurnal.Link_Dokumentasi}" target="_blank" rel="noopener noreferrer" class="text-sm text-blue-500 hover:underline mt-2 inline-block">Lihat Dokumentasi</a>` : ''}
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p class="text-red-500">Gagal memuat riwayat jurnal.</p>';
        tampilkanNotifikasi('Error: ' + e.message, 'error');
    }
}

function tampilkanFormTambah() {
    document.getElementById('formJurnal').reset();
    document.getElementById('id_jurnal').value = '';
    document.getElementById('form-title').textContent = 'Tulis Jurnal Refleksi Baru';
    document.getElementById('tombolSimpan').textContent = 'Simpan Jurnal';
    document.getElementById('form-container').classList.remove('hidden');
    document.getElementById('tombolTambahJurnal').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sembunyikanForm() {
    document.getElementById('form-container').classList.add('hidden');
    document.getElementById('tombolTambahJurnal').classList.remove('hidden');
}

async function handleSimpanJurnal(e) {
    e.preventDefault();
    const tombolSimpan = document.getElementById('tombolSimpan');
    tombolSimpan.disabled = true;

    const id = document.getElementById('id_jurnal').value;
    const dataForm = {
        Tanggal_Jurnal: document.getElementById('tanggal_jurnal').value,
        ID_Topik: document.getElementById('pilihTopik').value,
        Kelas_Diajar: document.getElementById('pilihKelas').value,
        Catatan_Refleksi: document.getElementById('catatan_refleksi').value,
        Link_Dokumentasi: document.getElementById('link_dokumentasi').value || null
    };

    try {
        let response;
        if (id) {
            tombolSimpan.innerHTML = "Mengupdate...";
            response = await supa.from('JurnalMengajar').update(dataForm).eq('id', id);
        } else {
            tombolSimpan.innerHTML = "Menyimpan...";
            response = await supa.from('JurnalMengajar').insert([dataForm]);
        }
        if (response.error) throw response.error;
        tampilkanNotifikasi('Jurnal berhasil disimpan!', 'success');
        sembunyikanForm();
        muatRiwayatJurnal();
    } catch (error) {
        tampilkanNotifikasi('Gagal menyimpan jurnal: ' + error.message, 'error');
    } finally {
        tombolSimpan.disabled = false;
    }
}

function handleAksiJurnal(e) {
    if (e.target.classList.contains('edit-jurnal-btn')) {
        handleEdit(e.target.dataset.id);
    } else if (e.target.classList.contains('hapus-jurnal-btn')) {
        handleHapus(e.target.dataset.id);
    }
}

async function handleEdit(id) {
    try {
        const { data: jurnal, error } = await supa.from('JurnalMengajar').select('*').eq('id', id).single();
        if (error) throw error;
        
        tampilkanFormTambah(); // Panggil fungsi ini untuk menampilkan form
        document.getElementById('form-title').textContent = 'Edit Jurnal Refleksi';
        document.getElementById('tombolSimpan').textContent = 'Update Jurnal';
        document.getElementById('id_jurnal').value = jurnal.id;
        document.getElementById('tanggal_jurnal').value = jurnal.Tanggal_Jurnal;
        document.getElementById('pilihTopik').value = jurnal.ID_Topik;
        document.getElementById('pilihKelas').value = jurnal.Kelas_Diajar;
        document.getElementById('catatan_refleksi').value = jurnal.Catatan_Refleksi;
        document.getElementById('link_dokumentasi').value = jurnal.Link_Dokumentasi;
    } catch(e) {
        tampilkanNotifikasi('Gagal mengambil data untuk diedit: ' + e.message, 'error');
    }
}

async function handleHapus(id) {
    if (confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
        try {
            const { error } = await supa.from('JurnalMengajar').delete().eq('id', id);
            if (error) throw error;
            tampilkanNotifikasi('Jurnal berhasil dihapus.', 'warning');
            muatRiwayatJurnal();
        } catch (e) {
            tampilkanNotifikasi('Gagal menghapus jurnal: ' + e.message, 'error');
        }
    }
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