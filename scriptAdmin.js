if (sessionStorage.getItem("adminPass") !== "ok") {
    window.location.href = "index.html";
}

const ACCOUNTS = {
    "Cash": "Asset",
    "Inventory": "Asset",
    "Accounts Payable": "Liability",
    "Owner's Capital": "Equity",
    "Sales Revenue": "Revenue",
    "Cost of Goods Sold": "Expense",
    "Rent Expense": "Expense",
    "Utilities Expense": "Expense",
    "Salaries Expense": "Expense"
};
const names = Object.keys(ACCOUNTS);
const KEY = "pcspace_journal";
let journal = JSON.parse(localStorage.getItem(KEY)) || [];

const $ = id => document.getElementById(id);
const peso = n => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);

function save() {
    localStorage.setItem(KEY, JSON.stringify(journal));
    render();
}

function getBalances() {
    const b = {};
    names.forEach(n => b[n] = 0);
    journal.forEach(e => {
        b[e.debit] += e.amount;
        b[e.credit] -= e.amount;
    });
    return b;
}

function total(b, type, sign) {
    return names
        .filter(n => ACCOUNTS[n] === type)
        .reduce((t, n) => t + b[n] * sign, 0);
}

const line = (label, value, cls = "") =>
    `<tr class="${cls}"><td>${label}</td><td class="num">${peso(value)}</td></tr>`;
const header = text => `<tr class="section-row"><td colspan="2">${text}</td></tr>`;

const options = names.map(n => `<option>${n}</option>`).join("");
$("debitAcc").innerHTML = options;
$("creditAcc").innerHTML = options;
$("debitAcc").value = "Cash";
$("creditAcc").value = "Sales Revenue";
$("date").value = today();

$("entryForm").addEventListener("submit", e => {
    e.preventDefault();
    const debit = $("debitAcc").value;
    const credit = $("creditAcc").value;
    const amount = parseFloat($("amount").value);

    if (debit === credit) {
        $("formMsg").textContent = "Debit and credit must be different accounts.";
        return;
    }
    if (!(amount > 0)) {
        $("formMsg").textContent = "Amount must be more than 0.";
        return;
    }
    $("formMsg").textContent = "";

    journal.push({ id: Date.now(), date: $("date").value, desc: $("desc").value.trim(), debit, credit, amount });
    $("desc").value = "";
    $("amount").value = "";
    save();
});


$("journalBody").addEventListener("click", e => {
    if (e.target.classList.contains("del")) {
        journal = journal.filter(j => j.id !== Number(e.target.dataset.id));
        save();
    }
});

function renderDashboard(b) {
    const sales = total(b, "Revenue", -1);
    const expenses = total(b, "Expense", 1);
    const net = sales - expenses;
    $("statCash").textContent = peso(b["Cash"]);
    $("statSales").textContent = peso(sales);
    $("statExpenses").textContent = peso(expenses);
    $("statNet").textContent = peso(net);
    
    $("statNet").className = "stat-value" + (net > 0 ? " good" : net < 0 ? " bad" : "");
}

function renderJournal() {
    if (journal.length === 0) {
        $("journalBody").innerHTML = `<tr><td class="empty" colspan="6">No entries. Add one above or load sample data on the Dashboard.</td></tr>`;
        return;
    }
    $("journalBody").innerHTML = journal.map(j => `
        <tr>
            <td>${j.date}</td>
            <td>${esc(j.desc)}</td>
            <td>${j.debit}</td>
            <td class="num">${peso(j.amount)}</td>
            <td></td>
            <td rowspan="2"><button class="del" data-id="${j.id}">Delete</button></td>
        </tr>
        <tr>
            <td></td><td></td>
            <td class="indent">${j.credit}</td>
            <td></td>
            <td class="num">${peso(j.amount)}</td>
        </tr>`).join("");
}

function renderTrial(b) {
    let totalDebit = 0, totalCredit = 0;
    const rows = names.filter(n => b[n] !== 0).map(n => {
        const d = b[n] > 0 ? b[n] : 0;
        const c = b[n] < 0 ? -b[n] : 0;
        totalDebit += d;
        totalCredit += c;
        return `<tr><td>${n}</td><td class="num">${d ? peso(d) : ""}</td><td class="num">${c ? peso(c) : ""}</td></tr>`;
    });
    if (rows.length === 0) {
        $("trialBody").innerHTML = `<tr><td class="empty" colspan="3">No data.</td></tr>`;
        $("trialStatus").className = "status";
        $("trialStatus").textContent = "";
        return;
    }
    rows.push(`<tr class="total"><td>Total</td><td class="num">${peso(totalDebit)}</td><td class="num">${peso(totalCredit)}</td></tr>`);
    $("trialBody").innerHTML = rows.join("");

    const ok = Math.abs(totalDebit - totalCredit) < 0.005;
    $("trialStatus").className = "status " + (ok ? "ok" : "bad");
    $("trialStatus").textContent = ok ? "Balanced: total debits equal total credits." : "Not balanced. Check your entries.";
}

function renderIncome(b) {
    const revenues = names.filter(n => ACCOUNTS[n] === "Revenue");
    const expenses = names.filter(n => ACCOUNTS[n] === "Expense" && b[n] !== 0);
    const totalRev = total(b, "Revenue", -1);
    const totalExp = total(b, "Expense", 1);
    const net = totalRev - totalExp;

    $("incomeBody").innerHTML =
        header("Revenue") +
        revenues.map(n => line(n, -b[n])).join("") +
        line("Total Revenue", totalRev, "total") +
        header("Expenses") +
        (expenses.map(n => line(n, b[n])).join("") || `<tr><td class="empty" colspan="2">No expenses.</td></tr>`) +
        line("Total Expenses", totalExp, "total") +
        line(net >= 0 ? "Net Income" : "Net Loss", net, "total");
}

function renderBalance(b) {
    const net = total(b, "Revenue", -1) - total(b, "Expense", 1);
    const assets = total(b, "Asset", 1);
    const liabilities = total(b, "Liability", -1);
    const equity = total(b, "Equity", -1) + net; 

    const listOf = (type, sign) => names
        .filter(n => ACCOUNTS[n] === type && b[n] !== 0)
        .map(n => line(n, b[n] * sign)).join("");

    $("balanceBody").innerHTML =
        header("Assets") + listOf("Asset", 1) + line("Total Assets", assets, "total") +
        header("Liabilities") + listOf("Liability", -1) + line("Total Liabilities", liabilities, "total") +
        header("Owner's Equity") + listOf("Equity", -1) + line("Net Income (Loss)", net) +
        line("Total Owner's Equity", equity, "total") +
        line("Total Liabilities + Owner's Equity", liabilities + equity, "total");

    const ok = Math.abs(assets - (liabilities + equity)) < 0.005;
    $("balanceStatus").className = "status " + (ok ? "ok" : "bad");
    $("balanceStatus").textContent = ok
        ? "Balanced: Assets = Liabilities + Owner's Equity."
        : "Not balanced. Check your entries.";
}

function render() {
    const b = getBalances();
    renderDashboard(b);
    renderJournal();
    renderTrial(b);
    renderIncome(b);
    renderBalance(b);
}

const toolButtons = document.querySelectorAll(".admin-tools-box button");

toolButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        toolButtons.forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        $(btn.dataset.tab).classList.add("active");
    });
});

$("sampleBtn").addEventListener("click", () => {
    const d = today();
    const rows = [
        ["Owner invested cash", "Cash", "Owner's Capital", 100000],
        ["Bought PC parts on credit", "Inventory", "Accounts Payable", 40000],
        ["Cash sales (week 1)", "Cash", "Sales Revenue", 15000],
        ["Cost of parts sold (week 1)", "Cost of Goods Sold", "Inventory", 9000],
        ["Paid store rent", "Rent Expense", "Cash", 5000],
        ["Paid electricity bill", "Utilities Expense", "Cash", 1800],
        ["Paid staff salaries", "Salaries Expense", "Cash", 6000],
        ["Paid supplier", "Accounts Payable", "Cash", 10000],
        ["Cash sales (week 2)", "Cash", "Sales Revenue", 22000],
        ["Cost of parts sold (week 2)", "Cost of Goods Sold", "Inventory", 13000]
    ];
    rows.forEach((r, i) => journal.push({ id: Date.now() + i, date: d, desc: r[0], debit: r[1], credit: r[2], amount: r[3] }));
    save();
});

$("clearBtn").addEventListener("click", () => {
    journal = [];
    save();
});


render();