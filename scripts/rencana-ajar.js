// ISI DENGAN KUNCI SUPABASE-MU
const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let semuaRppCache = [];
let kartuYangDiDrag = null;

document.addEventListener('DOMContentLoaded', function() {
    muatSemuaRpp();
    document.getElementById('formRpp').addEventListener('submit', handleSimpanRpp);
    document.getElementById('tombolTambahBaru').addEventListener('click', tampilkanFormTambah);
    document.getElementById('tombolBatal').addEventListener('click', resetFormRpp);
    document.querySelectorAll('.drop-zone').forEach(setupDropZone);
});

async function muatSemuaRpp() {
    try {
        const { data, error } = await supa.from('RencanaAjar').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        semuaRppCache = data;
        gambarKanbanBoard();
    } catch (error) {
        tampilkanNotifikasi("Gagal memuat Rencana Ajar: " + error.message, 'error');
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
        <div class="text-xs text-gray-500 mt-2 truncate" title="${rppData.Pendekatan_Mengajar || ''}">${rppData.Pendekatan_Mengajar || ''}</div>
        <div class="flex justify-end mt-2 space-x-2">
            <button class="edit-rpp-btn text-xs text-blue-600 hover:underline" data-id="${rppData.id}">Edit</button>
            <button class="hapus-rpp-btn text-xs text-red-600 hover:underline" data-id="${rppData.id}">Hapus</button>
        </div>
    `;
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    
    // Pasang listener langsung ke tombol di kartu yang baru dibuat
    div.querySelector('.edit-rpp-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // Hentikan event agar tidak menyebar ke elemen kartu
        isiFormUntukEdit(e.target.dataset.id);
    });
    div.querySelector('.hapus-rpp-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // Hentikan event agar tidak menyebar
        handleHapusRpp(e.target.dataset.id);
    });

    return div;
}

// --- LOGIKA DRAG AND DROP ---
function handleDragStart(e) {
    kartuYangDiDrag = e.target;
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    if(kartuYangDiDrag) {
        kartuYangDiDrag.classList.remove('dragging');
    }
    kartuYangDiDrag = null;
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
        if (kartuYangDiDrag) {
            zone.appendChild(kartuYangDiDrag);
            const statusBaru = zone.id.replace('kolom-', '');
            const idKartu = kartuYangDiDrag.id;
            
            try {
                const { error } = await supa.from('RencanaAjar').update({ Status_Kanban: statusBaru }).eq('id', idKartu);
                if (error) throw error;
                tampilkanNotifikasi(`Status diubah menjadi "${statusBaru}"`, 'success');
                const index = semuaRppCache.findIndex(rpp => rpp.id === idKartu);
                if(index > -1) semuaRppCache[index].Status_Kanban = statusBaru;
            } catch (error) {
                tampilkanNotifikasi("Gagal update status: " + error.message, 'error');
                muatSemuaRpp(); 
            }
        }
    });
}

// --- FUNGSI-FUNGSI UNTUK FORM & AKSI KARTU ---
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
        if (idTopik) {
            response = await supa.from('RencanaAjar').update(dataForm).eq('id', idTopik);
        } else {
            dataForm.Status_Kanban = 'Belum Dikerjakan';
            response = await supa.from('RencanaAjar').insert([dataForm]);
        }
        if (response.error) throw response.error;
        tampilkanNotifikasi('Sukses! Rencana Ajar berhasil diproses.', 'success');
        resetFormRpp();
        muatSemuaRpp();
    } catch (error) {
        tampilkanNotifikasi('Error: ' + error.message, 'error');
    } finally {
        tombolSimpan.disabled = false;
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
        document.getElementById('tombolBatal').classList.remove('hidden');
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
    const tombolSimpan = document.getElementById('tombolSimpanRpp');
    tombolSimpan.textContent = "Simpan Rencana";
    tombolSimpan.disabled = false;
}

async function handleHapusRpp(id) {
    if (confirm("Apakah Anda yakin ingin menghapus Rencana Ajar ini?")) {
        try {
            const { error } = await supa.from('RencanaAjar').delete().eq('id', id);
            if (error) throw error;
            tampilkanNotifikasi('Rencana Ajar berhasil dihapus.', 'warning');
            muatSemuaRpp();
        } catch (error) {
            tampilkanNotifikasi('Error: ' + error.message, 'error');
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
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => { notification.remove(); }, 300);
    }, 3000);
}