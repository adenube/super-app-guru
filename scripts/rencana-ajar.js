// ISI DENGAN KUNCI SUPABASE-MU
let semuaRppCache = [];
let kartuYangDiDrag = null;

document.addEventListener('DOMContentLoaded', function() {
    muatSemuaRpp();
    
    // Event listener untuk form
    document.getElementById('formRpp').addEventListener('submit', handleSimpanRpp);
    document.getElementById('tombolTambahBaru').addEventListener('click', tampilkanFormTambah);
    document.getElementById('tombolBatal').addEventListener('click', resetFormRpp);
    
    // Event listener untuk drop zone
    document.querySelectorAll('.drop-zone').forEach(setupDropZone);
    
    // Event listener untuk modal (pop-up)
    const modal = document.getElementById('detailRppModal');
    document.getElementById('closeRppModalBtn').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('closeRppModalXBtn').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'detailRppModal') modal.classList.add('hidden');
    });
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
    // Tambahkan data-id ke elemen kartu utama untuk deteksi klik
    div.dataset.id = rppData.id; 
    div.className = 'kanban-card bg-white p-3 rounded-md shadow';
    div.draggable = true;
    
    div.innerHTML = `
        <p class="font-semibold text-gray-800 pointer-events-none">${rppData.Topik_Bahasan}</p>
        <p class="text-sm text-gray-600 pointer-events-none">${rppData.Mata_Pelajaran}</p>
        <div class="text-xs text-gray-500 mt-2 truncate pointer-events-none" title="${rppData.Pendekatan_Mengajar || ''}">${rppData.Pendekatan_Mengajar || ''}</div>
        <div class="flex justify-end mt-2 space-x-2">
            <button class="edit-rpp-btn text-xs text-blue-600 hover:underline" data-id="${rppData.id}">Edit</button>
            <button class="hapus-rpp-btn text-xs text-red-600 hover:underline" data-id="${rppData.id}">Hapus</button>
        </div>`;

    // Pasang event listener
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    // Listener untuk membuka detail saat kartu diklik
    div.addEventListener('click', handleDetailKartu); 
	
	// Pasang listener langsung ke tombol di kartu yang baru dibuat - ANYAAARRR
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

// GANTI FUNGSI LAMA DENGAN VERSI BARU YANG LEBIH PINTAR INI
function handleDetailKartu(e) {
    // Pastikan yang diklik adalah kartu, bukan tombol di dalamnya
    if (e.target.classList.contains('edit-rpp-btn') || e.target.classList.contains('hapus-rpp-btn')) {
        return;
    }

    const id = e.currentTarget.dataset.id;
    const rpp = semuaRppCache.find(r => r.id === id);

    if (rpp) {
        const modal = document.getElementById('detailRppModal');
        const modalTitle = document.getElementById('modalRppTitle');
        const modalContent = document.getElementById('modalRppContent');

        modalTitle.textContent = rpp.Topik_Bahasan;
        
        // --- LOGIKA BARU UNTUK MEMBUAT BANYAK LINK ---
        let linkHtml = '<p>-</p>'; // Default text jika tidak ada link
        if (rpp.Link_Materi_Ajar) {
            // 1. Pisahkan teks link menjadi array berdasarkan baris baru
            const links = rpp.Link_Materi_Ajar.split('\n').filter(link => link.trim() !== '');
            // 2. Buat elemen <a> untuk setiap link
            linkHtml = links.map(link => 
                `<a href="${link}" target="_blank" rel="noopener noreferrer" class="block text-blue-500 hover:underline truncate">${link}</a>`
            ).join('');
        }
        // --- AKHIR LOGIKA BARU ---

        modalContent.innerHTML = `
            <p><strong>Mata Pelajaran:</strong> ${rpp.Mata_Pelajaran}</p>
            <p><strong>Status:</strong> ${rpp.Status_Kanban || 'Belum Dikerjakan'}</p>
            <div class="mt-4">
                <strong class="block mb-1">Ringkasan/Tujuan:</strong>
                <p class="p-2 bg-gray-50 rounded whitespace-pre-wrap">${rpp.Ringkasan_Materi || '-'}</p>
            </div>
            <div class="mt-4">
                <strong class="block mb-1">Pendekatan Mengajar:</strong>
                <p class="p-2 bg-gray-50 rounded whitespace-pre-wrap">${rpp.Pendekatan_Mengajar || '-'}</p>
            </div>
            <div class="mt-4">
                <strong class="block mb-1">Link Materi:</strong>
                ${linkHtml}
            </div>
        `;
        modal.classList.remove('hidden');
    }
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