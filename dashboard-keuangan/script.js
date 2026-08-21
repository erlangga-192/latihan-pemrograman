// State Data
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let financeChart = null;

// Element DOM
const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const txListEl = document.getElementById('tx-list');
const txForm = document.getElementById('tx-form');

// Format Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number);
}

// Inisialisasi Grafik Chart.js
function initChart(income, expense) {
    const ctx = document.getElementById('financeChart').getContext('2d');
    
    financeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 12 }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Update Tampilan Dashboard
function updateUI() {
    // Hitung Ringkasan
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expense;

    // Render Kartu Teks
    totalBalanceEl.innerText = formatRupiah(balance);
    totalIncomeEl.innerText = formatRupiah(income);
    totalExpenseEl.innerText = formatRupiah(expense);

    // Render List Transaksi
    txListEl.innerHTML = '';
    
    if (transactions.length === 0) {
        txListEl.innerHTML = `<li style="text-align: center; color: #64748b; padding: 20px 0; font-size: 0.85rem;">Belum ada catatan transaksi</li>`;
    } else {
        transactions.slice().reverse().forEach(t => {
            const li = document.createElement('li');
            li.className = 'transaction-item';
            
            const isIncome = t.type === 'income';
            const sign = isIncome ? '+' : '-';
            const amountClass = isIncome ? 'income' : 'expense';

            li.innerHTML = `
                <div class="tx-info">
                    <span class="tx-title">${escapeHtml(t.desc)}</span>
                    <span class="tx-date">${t.date}</span>
                </div>
                <div class="tx-amount-group">
                    <span class="tx-amount ${amountClass}">${sign} ${formatRupiah(t.amount)}</span>
                    <button class="btn-delete" onclick="deleteTransaction(${t.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            txListEl.appendChild(li);
        });
    }

    // Update atau Buat Grafik Baru
    if (financeChart) {
        financeChart.data.datasets[0].data = [income, expense];
        financeChart.update();
    } else {
        initChart(income, expense);
    }

    // Simpan ke LocalStorage
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Tambah Transaksi
txForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const desc = document.getElementById('desc').value.trim();
    const amount = Number(document.getElementById('amount').value);
    const type = document.getElementById('type').value;

    if (!desc || amount <= 0) return;

    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const newTx = {
        id: Date.now(),
        desc: desc,
        amount: amount,
        type: type,
        date: dateStr
    };

    transactions.push(newTx);
    
    // Reset Form
    document.getElementById('desc').value = '';
    document.getElementById('amount').value = '';

    updateUI();
});

// Hapus Transaksi
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateUI();
}

// Helper Sanitasi Teks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Jalankan saat pertama dimuat
updateUI();