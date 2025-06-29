const SUPABASE_URL = "https://amlbepeqidkamfosxfxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbGJlcGVxaWRrYW1mb3N4Znh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUxMjQsImV4cCI6MjA2NjY5MTEyNH0.LS1-bUSkRMrSKle-UF72RBbehNxb7xw5RzcR1XLcQ88";
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let jurnalCurrentPage = 1;
const jurnalRowsPerPage = 5;

document.addEventListener('DOMContentLoaded', () => {
    muatRiwayatJurnal();
    muatDropdowns();
    
    document.getElementById('tombolTambahJurnal').addEventListener('click', tampilkanFormTambah);
    document.getElementById('tombolBatal').addEventListener('click', sembunyikanForm);
    document.getElementById('formJurnal').addEventListener('submit', handleSimpanJurnal);
    document.getElementById('jurnal-list').addEventListener('click', handleAksiJurnal);

    // Listener baru untuk filter dan download
    document.getElementById('filterKelas').addEventListener('change', () => muatRiwayatJurnal(true));
    document.getElementById('filterTopik').addEventListener('change', () => muatRiwayatJurnal(true));
    document.getElementById('tombolDownload').addEventListener('click', handleDownloadJurnal);
    document.getElementById('jurnalPaginationControls').addEventListener('click', handleJurnalPaginasi);
});

async function muatDropdowns() {
    try {
        const [topikResult, kelasResult] = await Promise.all([
            supa.from('RencanaAjar').select('id, Topik_Bahasan').order('Topik_Bahasan'),
            supa.from('Siswa').select('Kelas').order('Kelas')
        ]);

        if (topikResult.error) throw topikResult.error;
        populateSelect('pilihTopik', topikResult.data, "Pilih Topik Bahasan", 'id', 'Topik_Bahasan');
        populateSelect('filterTopik', topikResult.data, "Semua Topik", 'id', 'Topik_Bahasan');

        if (kelasResult.error) throw kelasResult.error;
        const daftarKelas = [...new Set(kelasResult.data.map(item => item.Kelas))].sort();
        populateSelect('pilihKelas', daftarKelas, "Pilih Kelas");
        populateSelect('filterKelas', daftarKelas, "Semua Kelas");

    } catch (e) {
        tampilkanNotifikasi('Gagal memuat data dropdown: ' + e.message, 'error');
    }
}

function populateSelect(elementId, data, defaultOption, valueKey = null, textKey = null) {
    const selectElement = document.getElementById(elementId);
    if (!selectElement) return;
    selectElement.innerHTML = `<option value="">${defaultOption}</option>`;
    data.forEach(item => {
        const value = valueKey ? item[valueKey] : item;
        const text = textKey ? item[textKey] : item;
        selectElement.innerHTML += `<option value="${value}">${text}</option>`;
    });
}


async function muatRiwayatJurnal(dariFilter = false) {
    const container = document.getElementById('jurnal-list');
    const kelasFilter = document.getElementById('filterKelas').value;
    const topikFilter = document.getElementById('filterTopik').value;
    container.innerHTML = '<p>Memuat riwayat jurnal...</p>';
    if (dariFilter) jurnalCurrentPage = 1;

    try {
        let query = supa.from('JurnalMengajar')
            .select(`*, RencanaAjar(Topik_Bahasan)`, { count: 'exact' });

        if (kelasFilter) {
            query = query.eq('Kelas_Diajar', kelasFilter);
        }
        if (topikFilter) {
            query = query.eq('ID_Topik', topikFilter);
        }

        const startIndex = (jurnalCurrentPage - 1) * jurnalRowsPerPage;
        const { data, error, count } = await query
            .order('Tanggal_Jurnal', { ascending: false })
            .range(startIndex, startIndex + jurnalRowsPerPage - 1);

        if (error) throw error;
        gambarKartuJurnal(data, count);
    } catch (e) {
        container.innerHTML = '<p class="text-red-500">Gagal memuat riwayat jurnal.</p>';
        tampilkanNotifikasi('Error: ' + e.message, 'error');
    }
}

function gambarKartuJurnal(data, totalRows) {
    const container = document.getElementById('jurnal-list');
    container.innerHTML = '';
    if (data.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Tidak ada jurnal yang cocok dengan filter ini.</p>';
    } else {
        data.forEach(jurnal => {
            const topikBahasan = jurnal.RencanaAjar ? jurnal.RencanaAjar.Topik_Bahasan : 'Topik Telah Dihapus';
            const card = document.createElement('div');
            card.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-blue-800">${topikBahasan}</p>
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
    }
    gambarJurnalPaginasi(totalRows);
}

function gambarJurnalPaginasi(totalRows) {
    const paginationControls = document.getElementById('jurnalPaginationControls');
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(totalRows / jurnalRowsPerPage);
    if (totalPages <= 1) return;
    
    // ... (Logika paginasi lengkap seperti modul lain)
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.dataset.page = i;
        pageButton.className = 'px-3 py-1 rounded-md border ' + (i === jurnalCurrentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-100');
        paginationControls.appendChild(pageButton);
    }
}

function handleJurnalPaginasi(e) {
    if (e.target.dataset.page) {
        jurnalCurrentPage = parseInt(e.target.dataset.page, 10);
        muatRiwayatJurnal();
    }
}

async function handleDownloadJurnal() {
    tampilkanNotifikasi('Mempersiapkan data unduhan...', 'success');
    try {
        const kelasFilter = document.getElementById('filterKelas').value;
        const topikFilter = document.getElementById('filterTopik').value;

        let query = supa.from('JurnalMengajar')
            .select(`Tanggal_Jurnal, Kelas_Diajar, Catatan_Refleksi, Link_Dokumentasi, RencanaAjar(Topik_Bahasan)`);

        if (kelasFilter) query = query.eq('Kelas_Diajar', kelasFilter);
        if (topikFilter) query = query.eq('ID_Topik', topikFilter);
        
        const { data, error } = await query.order('Tanggal_Jurnal', { ascending: false });
        if (error) throw error;

        if (data.length === 0) {
            tampilkanNotifikasi('Tidak ada data untuk di-download.', 'warning');
            return;
        }

        const dataToExport = data.map(jurnal => ({
            Tanggal: new Date(jurnal.Tanggal_Jurnal).toLocaleDateString('id-ID'),
            Kelas: jurnal.Kelas_Diajar,
            Topik: jurnal.RencanaAjar ? jurnal.RencanaAjar.Topik_Bahasan : 'N/A',
            Refleksi: `"${(jurnal.Catatan_Refleksi || '').replace(/"/g, '""')}"`,
            Link_Dokumentasi: jurnal.Link_Dokumentasi || ''
        }));
        
        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
            headers.join(','),
            ...dataToExport.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `laporan_jurnal_mengajar.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        tampilkanNotifikasi('Gagal mempersiapkan unduhan: ' + error.message, 'error');
    }
}

// --- FUNGSI-FUNGSI LAINNYA (handleSimpanJurnal, handleEdit, handleHapus, dll.) ---
// --- Paste semua fungsi lain yang sudah ada dari jawaban sebelumnya di sini ---
// (Fungsi-fungsi ini tidak berubah sama sekali)
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

    if (!dataForm.Kelas_Diajar || !dataForm.ID_Topik || !dataForm.Tanggal_Jurnal) {
        tampilkanNotifikasi("Tanggal, Kelas, dan Topik wajib diisi.", "error");
        tombolSimpan.disabled = false;
        return;
    }

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
        muatRiwayatJurnal(true);
    } catch (error) {
        tampilkanNotifikasi('Gagal menyimpan jurnal: ' + error.message, 'error');
    } finally {
        tombolSimpan.disabled = false;
        tombolSimpan.innerHTML = "Simpan Jurnal";
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
        
        tampilkanFormTambah();
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
            muatRiwayatJurnal(true);
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

// --- FUNGSI BARU UNTUK DOWNLOAD PDF ---
async function handleDownloadJurnal() {
    tampilkanNotifikasi('Mempersiapkan PDF...', 'success');
    
    const kelasFilter = document.getElementById('filterKelas').value;
    const topikFilter = document.getElementById('filterTopik').value;

    try {
        // Ambil SEMUA data yang cocok dengan filter (tanpa paginasi)
        let query = supa.from('JurnalMengajar')
            .select(`*, RencanaAjar(Topik_Bahasan)`)
            .order('Tanggal_Jurnal', { ascending: false });

        if (kelasFilter) query = query.eq('Kelas_Diajar', kelasFilter);
        if (topikFilter) query = query.eq('ID_Topik', topikFilter);
        
        const { data, error } = await query;
        if (error) throw error;

        if (data.length === 0) {
            tampilkanNotifikasi('Tidak ada data untuk di-download.', 'warning');
            return;
        }

        // Siapkan judul laporan
        const judulLaporan = `Laporan Jurnal Mengajar (Kelas: ${kelasFilter || 'Semua'}, Topik: ${topikFilter ? document.getElementById('filterTopik').options[document.getElementById('filterTopik').selectedIndex].text : 'Semua'})`;
        
        // Buat elemen HTML sementara untuk di-print
        const printArea = document.createElement('div');
        printArea.style.padding = '20px';
        printArea.innerHTML = `<h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">${judulLaporan}</h2>`;
        
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.innerHTML = `
            <thead>
                <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tanggal</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Topik</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Kelas</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Refleksi</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
        data.forEach(jurnal => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="border: 1px solid #ddd; padding: 8px;">${new Date(jurnal.Tanggal_Jurnal).toLocaleDateString('id-ID')}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${jurnal.RencanaAjar.Topik_Bahasan}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${jurnal.Kelas_Diajar}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${jurnal.Catatan_Refleksi}</td>
            `;
            tbody.appendChild(tr);
        });

        printArea.appendChild(table);
        document.body.appendChild(printArea); // Tambahkan ke body agar bisa "difoto"

        // "Foto" elemen dan buat PDF
        const { jsPDF } = window.jspdf;
        html2canvas(printArea).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("laporan-jurnal-mengajar.pdf");
            document.body.removeChild(printArea); // Hapus elemen sementara
        });

    } catch(e) {
        tampilkanNotifikasi('Gagal membuat PDF: ' + e.message, 'error');
    }
}