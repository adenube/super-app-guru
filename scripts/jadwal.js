const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    muatJadwal();
    document.getElementById('formJadwal').addEventListener('submit', handleSimpanJadwal);
    document.getElementById('jadwal-table-body').addEventListener('click', handleAksiJadwal);
    document.getElementById('tombolBatal').addEventListener('click', resetForm);
});

async function muatJadwal() {
    const tbody = document.getElementById('jadwal-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Memuat jadwal...</td></tr>';
    try {
        const { data, error } = await supa.from('Jadwal').select('*').order('created_at');
        if (error) throw error;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Belum ada jadwal dibuat.</td></tr>';
        } else {
            data.forEach(j => {
                const row = document.createElement('tr');
                row.className = 'border-t';
                row.innerHTML = `
                    <td class="py-3 px-4">${j.Hari}</td>
                    <td class="py-3 px-4">${j.Jam_Mulai.substring(0,5)} - ${j.Jam_Selesai.substring(0,5)}</td>
                    <td class="py-3 px-4 font-semibold">${j.Mata_Pelajaran}</td>
                    <td class="py-3 px-4">${j.Kelas}</td>
                    <td class="py-3 px-4"><div class="flex space-x-2">
                        <button class="edit-btn text-sm text-yellow-600" data-id="${j.id}">Edit</button>
                        <button class="hapus-btn text-sm text-red-600" data-id="${j.id}">Hapus</button>
                    </div></td>`;
                tbody.appendChild(row);
            });
        }
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Gagal memuat jadwal: ${e.message}</td></tr>`;
    }
}

async function handleSimpanJadwal(e) {
    e.preventDefault();
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
            response = await supa.from('Jadwal').update(dataForm).eq('id', id);
        } else {
            response = await supa.from('Jadwal').insert([dataForm]);
        }
        if (response.error) throw response.error;
        resetForm();
        muatJadwal();
    } catch (error) {
        alert('Gagal menyimpan jadwal: ' + error.message);
    }
}

function handleAksiJadwal(e) {
    if (e.target.classList.contains('edit-btn')) {
        const row = e.target.closest('tr');
        const cells = row.querySelectorAll('td');
        document.getElementById('jadwal-id').value = e.target.dataset.id;
        document.getElementById('jadwal-hari').value = cells[0].textContent;
        document.getElementById('jadwal-jam-mulai').value = cells[1].textContent.split(' - ')[0];
        document.getElementById('jadwal-jam-selesai').value = cells[1].textContent.split(' - ')[1];
        document.getElementById('jadwal-mapel').value = cells[2].textContent;
        document.getElementById('jadwal-kelas').value = cells[3].textContent;
        document.getElementById('form-title').textContent = 'Edit Jadwal';
        document.getElementById('tombolSimpan').textContent = 'Update';
        document.getElementById('tombolBatal').classList.remove('hidden');
    } else if (e.target.classList.contains('hapus-btn')) {
        if (confirm('Yakin ingin menghapus jadwal ini?')) {
            hapusJadwal(e.target.dataset.id);
        }
    }
}

async function hapusJadwal(id) {
    try {
        const { error } = await supa.from('Jadwal').delete().eq('id', id);
        if (error) throw error;
        muatJadwal();
    } catch (error) {
        alert('Gagal menghapus jadwal: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('formJadwal').reset();
    document.getElementById('jadwal-id').value = '';
    document.getElementById('form-title').textContent = 'Tambah Jadwal Baru';
    document.getElementById('tombolSimpan').textContent = 'Simpan';
    document.getElementById('tombolBatal').classList.add('hidden');
}