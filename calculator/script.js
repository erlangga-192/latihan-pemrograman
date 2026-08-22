let currentExpression = '0';
let isEvaluated = false;

const mainDisplay = document.getElementById('main-display');
const historyDisplay = document.getElementById('history-display');
const scientificPad = document.getElementById('scientific-pad');
const calcContainer = document.querySelector('.calculator-container');
const historyList = document.getElementById('history-list');

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

function updateDisplay() {
    mainDisplay.innerText = currentExpression;
}

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

function parseComplexExpression(expr) {
    let parsed = expr;

    parsed = parsed.replace(/×/g, '*').replace(/÷/g, '/');

    parsed = parsed.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    parsed = parsed.replace(/(\d+)!/g, (match, n) => factorial(parseInt(n)));

    parsed = parsed.replace(/(\d|\))(?=\(|π|e|sin|cos|tan|log|ln|√)/g, '$1*');
    parsed = parsed.replace(/(π|e)(?=\d|\()/g, '$1*');

    parsed = parsed.replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E');

    parsed = parsed.replace(/sin\(([^()]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
    parsed = parsed.replace(/cos\(([^()]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
    parsed = parsed.replace(/tan\(([^()]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
    
    parsed = parsed.replace(/log\(/g, 'Math.log10(');
    parsed = parsed.replace(/ln\(/g, 'Math.log(');
    parsed = parsed.replace(/√\(/g, 'Math.sqrt(');

    parsed = parsed.replace(/\^/g, '**');

    const openBrackets = (parsed.match(/\(/g) || []).length;
    const closeBrackets = (parsed.match(/\)/g) || []).length;
    if (openBrackets > closeBrackets) {
        parsed += ')'.repeat(openBrackets - closeBrackets);
    }

    return parsed;
}

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

function calculate() {
    try {
        let rawExpr = currentExpression;
        historyDisplay.innerText = rawExpr + ' =';

        let parsedExpr = parseComplexExpression(rawExpr);

        let result = Function(`'use strict'; return (${parsedExpr})`)();

        if (!isFinite(result) || isNaN(result)) {
            throw new Error("Invalid Output");
        }

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