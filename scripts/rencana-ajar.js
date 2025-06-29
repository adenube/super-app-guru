// ISI DENGAN KUNCI SUPABASE-MU
const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let semuaRppCache = [];

document.addEventListener('DOMContentLoaded', function() {
    muatSemuaRpp();

    // Event listener untuk form
    document.getElementById('formRpp').addEventListener('submit', handleSimpanRpp);
    document.getElementById('tombolTambahBaru').addEventListener('click', tampilkanFormTambah);
    document.getElementById('tombolBatal').addEventListener('click', resetFormRpp);
    
    // Event listener untuk drop zone
    document.querySelectorAll('.drop-zone').forEach(setupDropZone);
    // Event listener untuk klik pada kartu (untuk edit dan hapus)
    document.querySelector('.grid').addEventListener('click', handleAksiKartu);
});

async function muatSemuaRpp() {
    try {
        const { data, error } = await supa.from('RencanaAjar').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        semuaRppCache = data;
        gambarKanbanBoard();
    } catch (error) {
        console.error("Gagal memuat RPP:", error);
        alert("Gagal memuat Rencana Ajar: " + error.message);
    }
}

function gambarKanbanBoard() {
    const kolomTodo = document.getElementById('kolom-Belum Dikerjakan');
    const kolomInProgress = document.getElementById('kolom-Sedang Dikerjakan');
    const kolomDone = document.getElementById('kolom-Selesai');
    kolomTodo.innerHTML = '';
    kolomInProgress.innerHTML = '';
    kolomDone.innerHTML = '';

    if (semuaRppCache.length === 0) {
        kolomTodo.innerHTML = '<p class="text-sm text-gray-500 text-center">Belum ada rencana. Klik "+ Rencana Baru" untuk memulai.</p>';
        return;
    }

    semuaRppCache.forEach(rpp => {
        const kartu = buatKartuRpp(rpp);
        const status = rpp.Status_Kanban || "Belum Dikerjakan";
        
        if (status === 'Sedang Dikerjakan') {
            kolomInProgress.appendChild(kartu);
        } else if (status === 'Selesai') {
            kolomDone.appendChild(kartu);
        } else {
            kolomTodo.appendChild(kartu);
        }
    });
}

function buatKartuRpp(rppData) {
    const div = document.createElement('div');
    div.id = rppData.id;
    div.className = 'kanban-card bg-white p-3 rounded-md shadow';
    div.draggable = true;
    
    div.innerHTML = `
        <p class="font-semibold text-gray-800">${rppData.Topik_Bahasan}</p>
        <p class="text-sm text-gray-600">${rppData.Mata_Pelajaran}</p>
        <div class="text-xs text-gray-500 mt-2">${rppData.Pendekatan_Mengajar || ''}</div>
        <div class="flex justify-end mt-2 space-x-2">
            <button class="edit-rpp-btn text-xs text-blue-600 hover:underline" data-id="${rppData.id}">Edit</button>
            <button class="hapus-rpp-btn text-xs text-red-600 hover:underline" data-id="${rppData.id}">Hapus</button>
        </div>
    `;
    div.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', e.target.id);
        setTimeout(() => e.target.classList.add('dragging'), 0);
    });
    div.addEventListener('dragend', e => e.target.classList.remove('dragging'));
    return div;
}

function setupDropZone(zone) {
    zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('drag-over-zone');
    });
    zone.addEventListener('dragleave', e => zone.classList.remove('drag-over-zone'));
    zone.addEventListener('drop', async (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over-zone');
        const idKartu = e.dataTransfer.getData('text/plain');
        const kartu = document.getElementById(idKartu);
        if (kartu && e.currentTarget.contains(zone)) {
            zone.appendChild(kartu);
            const statusBaru = zone.id.replace('kolom-', '');
            
            try {
                const { error } = await supa.from('RencanaAjar').update({ Status_Kanban: statusBaru }).eq('id', idKartu);
                if (error) throw error;
                // Update cache lokal
                const index = semuaRppCache.findIndex(rpp => rpp.id === idKartu);
                if(index > -1) semuaRppCache[index].Status_Kanban = statusBaru;
            } catch (error) {
                alert("Gagal update status: " + error.message);
                muatSemuaRpp(); // Kembalikan ke posisi semula jika gagal
            }
        }
    });
}

function handleAksiKartu(e) {
    if (e.target.classList.contains('edit-rpp-btn')) {
        isiFormUntukEdit(e.target.dataset.id);
    }
    if (e.target.classList.contains('hapus-rpp-btn')) {
        handleHapusRpp(e.target.dataset.id);
    }
}

async function handleSimpanRpp(e) {
    e.preventDefault();
    const tombolSimpan = document.getElementById('tombolSimpanRpp');
    tombolSimpan.disabled = true;
    tombolSimpan.innerHTML = "Menyimpan...";

    const idTopik = document.getElementById('ID_Topik').value;
    const dataForm = {
        Mata_Pelajaran: document.getElementById('Mata_Pelajaran').value,
        Topik_Bahasan: document.getElementById('Topik_Bahasan').value,
        Ringkasan_Materi: document.getElementById('Ringkasan_Materi').value,
        Pendekatan_Mengajar: document.getElementById('Pendekatan_Mengajar').value,
        Link_Materi_Ajar: document.getElementById('Link_Materi_Ajar').value
    };

    try {
        let response;
        if (idTopik) { // Mode Edit
            response = await supa.from('RencanaAjar').update(dataForm).eq('id', idTopik).select();
        } else { // Mode Tambah Baru
            dataForm.Status_Kanban = 'Belum Dikerjakan';
            response = await supa.from('RencanaAjar').insert([dataForm]).select();
        }
        if (response.error) throw response.error;
        alert('Sukses! Rencana Ajar berhasil diproses.');
        resetFormRpp();
        muatSemuaRpp();
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        tombolSimpan.disabled = false;
        tombolSimpan.innerHTML = "Simpan Rencana";
    }
}

function isiFormUntukEdit(id) {
    const rpp = semuaRppCache.find(r => r.id === id);
    if (rpp) {
        const container = document.getElementById('form-container');
        container.classList.remove('hidden');
        document.getElementById('formRppTitle').textContent = "Edit Rencana Ajar";
        document.getElementById('ID_Topik').value = rpp.id;
        document.getElementById('Mata_Pelajaran').value = rpp.Mata_Pelajaran;
        document.getElementById('Topik_Bahasan').value = rpp.Topik_Bahasan;
        document.getElementById('Ringkasan_Materi').value = rpp.Ringkasan_Materi;
        document.getElementById('Pendekatan_Mengajar').value = rpp.Pendekatan_Mengajar;
        document.getElementById('Link_Materi_Ajar').value = rpp.Link_Materi_Ajar;
        document.getElementById('tombolSimpanRpp').textContent = "Update Rencana";
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

function tampilkanFormTambah() {
    resetFormRpp();
    document.getElementById('form-container').classList.remove('hidden');
    document.getElementById('formRppTitle').textContent = "Form Tambah Rencana Ajar Baru";
    document.getElementById('tombolSimpanRpp').textContent = "Simpan Rencana";
}

function resetFormRpp() {
    document.getElementById('formRpp').reset();
    document.getElementById('ID_Topik').value = '';
    document.getElementById('form-container').classList.add('hidden');
}

async function handleHapusRpp(id) {
    if (confirm("Apakah Anda yakin ingin menghapus Rencana Ajar ini?")) {
        try {
            const { error } = await supa.from('RencanaAjar').delete().eq('id', id);
            if (error) throw error;
            alert('Rencana Ajar berhasil dihapus.');
            muatSemuaRpp();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}