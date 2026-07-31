let currentExpression = '0';
let isEvaluated = false;

const mainDisplay = document.getElementById('main-display');
const historyDisplay = document.getElementById('history-display');
const scientificPad = document.getElementById('scientific-pad');
const calcContainer = document.querySelector('.calculator-container');
const historyList = document.getElementById('history-list');

// --- PENGATURAN MODE ---
function toggleMode(mode) {
    const btnStd = document.getElementById('btn-standard');
    const btnSci = document.getElementById('btn-scientific');

    if (mode === 'scientific') {
        scientificPad.classList.remove('hidden');
        calcContainer.classList.add('wide');
        btnSci.classList.add('active');
        btnStd.classList.remove('active');
    } else {
        scientificPad.classList.add('hidden');
        calcContainer.classList.remove('wide');
        btnStd.classList.add('active');
        btnSci.classList.remove('active');
    }
}

// --- UPDATE DISPLAY ---
function updateDisplay() {
    mainDisplay.innerText = currentExpression;
}

// --- INPUT ANGKA & OPERATOR ---
function appendNumber(num) {
    if (currentExpression === '0' || isEvaluated) {
        currentExpression = num;
        isEvaluated = false;
    } else {
        currentExpression += num;
    }
    updateDisplay();
}

function appendOperator(op) {
    isEvaluated = false;
    const lastChar = currentExpression.slice(-1);
    
    // Cegah penumpukan operator di akhir
    if (['+', '-', '×', '÷', '%', '^'].includes(lastChar)) {
        currentExpression = currentExpression.slice(0, -1) + op;
    } else {
        currentExpression += op;
    }
    updateDisplay();
}

function appendMath(func) {
    if (currentExpression === '0' || isEvaluated) {
        currentExpression = func;
        isEvaluated = false;
    } else {
        currentExpression += func;
    }
    updateDisplay();
}

function toggleSign() {
    if (currentExpression !== '0') {
        if (currentExpression.startsWith('-')) {
            currentExpression = currentExpression.substring(1);
        } else {
            currentExpression = '-' + currentExpression;
        }
        updateDisplay();
    }
}

function clearAll() {
    currentExpression = '0';
    historyDisplay.innerText = '';
    isEvaluated = false;
    updateDisplay();
}

function deleteChar() {
    if (isEvaluated) {
        clearAll();
        return;
    }
    if (currentExpression.length === 1) {
        currentExpression = '0';
    } else {
        currentExpression = currentExpression.slice(0, -1);
    }
    updateDisplay();
}

// --- PARSER MATEMATIKA CANGGIH UNTUK EKSPRESI KOMPLEKS ---
function parseComplexExpression(expr) {
    let parsed = expr;

    // 1. Ubah simbol visual ke operator JavaScript
    parsed = parsed.replace(/×/g, '*').replace(/÷/g, '/');

    // 2. Tangani Persentase Kompleks (contoh: 50 + 10% atau 200 * 5%)
    parsed = parsed.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    // 3. Tangani Faktorial (contoh: 5! atau (3+2)!)
    parsed = parsed.replace(/(\d+)!/g, (match, n) => factorial(parseInt(n)));

    // 4. Perkalian Tersirat (Implicit Multiplication)
    // Contoh: 2π -> 2*π | 3(4+5) -> 3*(4+5) | (2)(3) -> (2)*(3) | 5sin(30) -> 5*sin(30)
    parsed = parsed.replace(/(\d|\))(?=\(|π|e|sin|cos|tan|log|ln|√)/g, '$1*');
    parsed = parsed.replace(/(π|e)(?=\d|\()/g, '$1*');

    // 5. Ubah Konstanta
    parsed = parsed.replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E');

    // 6. Ubah Fungsi Matematika (Trigonometri dalam derajat)
    // Mengubah sin(x) agar menerima input Derajat (bukan Radian)
    parsed = parsed.replace(/sin\(([^()]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
    parsed = parsed.replace(/cos\(([^()]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
    parsed = parsed.replace(/tan\(([^()]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
    
    // Fungsi Logaritma & Akar
    parsed = parsed.replace(/log\(/g, 'Math.log10(');
    parsed = parsed.replace(/ln\(/g, 'Math.log(');
    parsed = parsed.replace(/√\(/g, 'Math.sqrt(');

    // Operasi Pangkat (x^y -> Math.pow atau **)
    parsed = parsed.replace(/\^/g, '**');

    // 7. Otomatis Otomatis Tutup Tanda Kurung jika pengguna lupa (contoh: "sin(30" -> "sin(30)")
    const openBrackets = (parsed.match(/\(/g) || []).length;
    const closeBrackets = (parsed.match(/\)/g) || []).length;
    if (openBrackets > closeBrackets) {
        parsed += ')'.repeat(openBrackets - closeBrackets);
    }

    return parsed;
}

// Fungsi Bantuan Faktorial
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

// --- LOGIKA EKSEKUSI KALKULASI ---
function calculate() {
    try {
        let rawExpr = currentExpression;
        historyDisplay.innerText = rawExpr + ' =';

        // Proses parsing ekspresi kompleks
        let parsedExpr = parseComplexExpression(rawExpr);

        // Eksekusi perhitungan
        let result = Function(`'use strict'; return (${parsedExpr})`)();

        // Validasi hasil
        if (!isFinite(result) || isNaN(result)) {
            throw new Error("Invalid Output");
        }

        // Bulatkan desimal panjang agar tidak berantakan di layar
        if (typeof result === 'number' && !Number.isInteger(result)) {
            result = Number(Math.round(result + 'e8') + 'e-8');
        }

        addHistory(rawExpr, result);
        currentExpression = result.toString();
        isEvaluated = true;
        updateDisplay();

    } catch (error) {
        mainDisplay.innerText = 'Error';
        isEvaluated = true;
        setTimeout(() => {
            if (mainDisplay.innerText === 'Error') {
                clearAll();
            }
        }, 1500);
    }
}

// --- PANEL RIWAYAT ---
function addHistory(expr, result) {
    const emptyMsg = document.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `<span>${expr}</span> <strong>${result}</strong>`;
    
    li.onclick = () => {
        currentExpression = result.toString();
        isEvaluated = false;
        updateDisplay();
    };

    historyList.prepend(li);
}

function clearHistoryList() {
    historyList.innerHTML = '<li class="empty-msg">Belum ada riwayat</li>';
}

// --- DUKUNGAN KEYBOARD ---
document.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') appendNumber(e.key);
    
    if (e.key === '*') appendOperator('×');
    else if (e.key === '/') appendOperator('÷');
    else if (['+', '-', '%', '^', '(', ')'].includes(e.key)) appendOperator(e.key);

    if (e.key === 'Enter' || e.key === '=') { 
        e.preventDefault(); 
        calculate(); 
    }
    if (e.key === 'Backspace') deleteChar();
    if (e.key === 'Escape') clearAll();
});