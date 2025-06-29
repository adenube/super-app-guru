const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', function() {
    loadDropdowns();
    document.getElementById('filterKelas').addEventListener('change', handleFilterKelas);
    document.getElementById('formNilai').addEventListener('submit', handleSimpanNilai);
});

async function loadDropdowns() {
    try {
        const [kelasResult, topikResult] = await Promise.all([
            supa.from('Siswa').select('Kelas'),
            supa.from('RencanaAjar').select('id, Topik_Bahasan')
        ]);

        if (kelasResult.error) throw kelasResult.error;
        const daftarKelas = [...new Set(kelasResult.data.map(item => item.Kelas))].sort();
        const filterDropdown = document.getElementById('filterKelas');
        filterDropdown.innerHTML = '<option value="">Pilih Kelas</option>';
        daftarKelas.forEach(kelas => {
            filterDropdown.innerHTML += `<option value="${kelas}">${kelas}</option>`;
        });

        if (topikResult.error) throw topikResult.error;
        const topikSelect = document.getElementById('pilihTopik');
        topikSelect.innerHTML = '<option value="">Pilih Topik/Kegiatan</option>';
        if (topikResult.data.length === 0) {
            topikSelect.innerHTML += '<option value="" disabled>Buat Rencana Ajar terlebih dahulu</option>';
        } else {
            topikResult.data.forEach(topik => {
                topikSelect.innerHTML += `<option value="${topik.id}">${topik.Topik_Bahasan}</option>`;
            });
        }
    } catch (error) {
        tampilkanNotifikasi('Gagal memuat data dropdown: ' + error.message, 'error');
    }
}

async function handleFilterKelas() {
    const kelasTerpilih = document.getElementById('filterKelas').value;
    const siswaDropdown = document.getElementById('pilihSiswa');
    siswaDropdown.innerHTML = '<option value="">Memuat siswa...</option>';
    
    if (!kelasTerpilih) {
        siswaDropdown.innerHTML = '<option value="">Pilih Kelas Dulu</option>';
        return;
    }

    try {
        const { data, error } = await supa.from('Siswa').select('id, Nama_Lengkap').eq('Kelas', kelasTerpilih).order('Nama_Lengkap');
        if (error) throw error;
        
        siswaDropdown.innerHTML = '<option value="">Pilih Siswa</option>';
        data.forEach(siswa => {
            siswaDropdown.innerHTML += `<option value="${siswa.id}">${siswa.Nama_Lengkap}</option>`;
        });
    } catch (error) {
        tampilkanNotifikasi('Gagal memuat daftar siswa: ' + error.message, 'error');
    }
}

async function handleSimpanNilai(e) {
    e.preventDefault();
    const tombolSimpan = document.getElementById('tombolSimpanNilai');
    tombolSimpan.disabled = true;
    tombolSimpan.innerHTML = "Menyimpan...";

    const nilaiDeskriptifTerpilih = document.querySelector('input[name="nilaiDeskriptif"]:checked');

    const dataForm = {
        ID_Siswa: document.getElementById('pilihSiswa').value,
        ID_Topik: document.getElementById('pilihTopik').value,
        Tanggal_Penilaian: new Date().toISOString().slice(0, 10),
        Jenis_Nilai: 'Karakter',
        Aspek_Yang_Dinilai: document.getElementById('aspekDinilai').value,
        Nilai_Skor: null,
        Nilai_Deskriptif: nilaiDeskriptifTerpilih ? nilaiDeskriptifTerpilih.value : null,
        Umpan_Balik_Siswa: document.getElementById('umpanBalik').value
    };

    if (!dataForm.ID_Siswa || !dataForm.ID_Topik || !dataForm.Aspek_Yang_Dinilai || !dataForm.Nilai_Deskriptif) {
        tampilkanNotifikasi('Siswa, Topik, Aspek, dan Nilai Deskriptif wajib diisi.', 'error');
        tombolSimpan.disabled = false;
        tombolSimpan.innerHTML = "Simpan Nilai";
        return;
    }

    try {
        const { error } = await supa.from('Nilai').insert([dataForm]);
        if (error) throw error;
        tampilkanNotifikasi('Sukses! Nilai karakter berhasil disimpan.', 'success');
        document.getElementById('formNilai').reset();
        document.getElementById('pilihSiswa').innerHTML = '<option value="">Pilih Siswa</option>';
        document.getElementById('filterKelas').value = '';
    } catch (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
    } finally {
        tombolSimpan.disabled = false;
        tombolSimpan.innerHTML = "Simpan Nilai";
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