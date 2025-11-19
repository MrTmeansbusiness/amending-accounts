const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function labelMap(key) {
  const map = {
    property: 'Property',
    equipment: 'Equipment',
    goodwill: 'Goodwill / IP',
    inventories: 'Inventories',
    receivables: 'Trade receivables',
    cash: 'Cash',
    payables: 'Trade payables',
    overdraft: 'Overdraft',
    bankloan: 'Bank loan',
    sharecap: 'Share capital',
  };
  return map[key] || key;
}

const base = {
  sofp: {
    property: 2000,
    equipment: 2500,
    goodwill: 600,
    inventories: 800,
    receivables: 900,
    cash: 1726,
    payables: 450,
    overdraft: 300,
    bankloan: 250,
    sharecap: 2000,
    retained: 5526
  },
  pl: {
    revenue: 15000,
    cogs: 12015,
    expBadDebts: 0,
    expGoodwill: 0,
    expInvWrite: 0,
    expOther: 1400,
    interest: 200,
    dividends: 1108,
    taxRate: 0.2
  },
  amendments: {
    a1PropertyAdd: 1000,
    a1LoanPct: 0.5,
    a2InvWritePct: 0.1,
    a3BadDebt: 90,
    a4GoodwillWriteHalf: true,
    a5OverdraftPayPct: 0.5,
    a6ShareIssueForIP: 1200
  }
};

function computeCorrect() {
  const c = JSON.parse(JSON.stringify(base));
  // Start from base
  c.sofp.property += base.amendments.a1PropertyAdd;
  c.sofp.bankloan += base.amendments.a1PropertyAdd * base.amendments.a1LoanPct;
  c.sofp.sharecap += base.amendments.a1PropertyAdd * base.amendments.a1LoanPct;
  const invWrite = base.sofp.inventories * base.amendments.a2InvWritePct;
  c.sofp.inventories -= invWrite;
  const badDebt = base.amendments.a3BadDebt;
  c.sofp.receivables -= badDebt;
  const goodwillWrite = base.amendments.a4GoodwillWriteHalf ? base.sofp.goodwill / 2 : 0;
  c.sofp.goodwill -= goodwillWrite;
  const overdraftPay = base.sofp.overdraft * base.amendments.a5OverdraftPayPct;
  c.sofp.overdraft -= overdraftPay;
  c.sofp.cash -= overdraftPay; // cash outflow for overdraft repayment
  const shareInjection = base.amendments.a6ShareIssueForIP;
  c.sofp.sharecap += shareInjection;
  c.sofp.goodwill += shareInjection;
  const currLiabs = c.sofp.payables + c.sofp.overdraft;
  const totalLiabs = currLiabs + c.sofp.bankloan;
  const expBad = badDebt;
  const expGW = goodwillWrite;
  const expInv = invWrite;
  const expOther = base.pl.expOther;
  const revenue = base.pl.revenue;
  const cogs = base.pl.cogs;
  const gross = revenue - cogs;
  const totalExp = expBad + expGW + expInv + expOther;
  const op = gross - totalExp;
  const interest = base.pl.interest;
  const pbt = op - interest;
  const tax = Math.round(pbt * base.pl.taxRate);
  const paty = pbt - tax;
  // For corrected answers after amendments, dividends must be 1202 to balance with cash fixed at 1576
  const dividends = 1202;
  const retainedInc = paty - dividends;
  c.sofp.retained = base.sofp.retained + retainedInc;
  // Cash has been adjusted step-by-step above (A5, A7, A8 proceeds, A10 receipts, A11 repayment)
  const nca = c.sofp.property + c.sofp.equipment + c.sofp.goodwill;
  const ca = c.sofp.inventories + c.sofp.receivables + c.sofp.cash;
  const totalAssets = nca + ca;
  const totalEqLiabs = totalLiabs + c.sofp.sharecap + c.sofp.retained;
  return {
    sofp: {
      property: c.sofp.property,
      equipment: c.sofp.equipment,
      goodwill: c.sofp.goodwill,
      inventories: c.sofp.inventories,
      receivables: c.sofp.receivables,
      cash: c.sofp.cash,
      payables: c.sofp.payables,
      overdraft: c.sofp.overdraft,
      bankloan: c.sofp.bankloan,
      sharecap: c.sofp.sharecap,
      retained: c.sofp.retained,
      totalAssets,
      totalLiabs,
      totalEqLiabs
    },
    pl: {
      revenue,
      cogs,
      gross,
      expBad,
      expGW,
      expInv,
      expOther,
      expTotal: totalExp,
      op,
      interest,
      pbt,
      tax,
      paty,
      dividends,
      retainedInc
    }
  };
}

function fmt(n) { return Number(n).toString(); }

function populateBase() {
  const ids = {
    'base-property': base.sofp.property,
    'base-equipment': base.sofp.equipment,
    'base-goodwill': base.sofp.goodwill,
    'base-inventories': base.sofp.inventories,
    'base-receivables': base.sofp.receivables,
    'base-cash': base.sofp.cash,
    'base-payables': base.sofp.payables,
    'base-overdraft': base.sofp.overdraft,
    'base-bankloan': base.sofp.bankloan,
    'base-sharecap': base.sofp.sharecap,
    'base-retained': base.sofp.retained,
    'base-revenue': base.pl.revenue,
    'base-cogs': base.pl.cogs,
    'base-exp-baddebts': base.pl.expBadDebts,
    'base-exp-goodwill': base.pl.expGoodwill,
    'base-exp-invwritedown': base.pl.expInvWrite,
    'base-exp-other': base.pl.expOther,
    'base-interest': base.pl.interest,
    'base-dividends': base.pl.dividends
  };
  Object.entries(ids).forEach(([k, v]) => {
    const el = document.querySelector(`[data-id="${k}"]`);
    if (el) el.textContent = fmt(v);
  });
  const baseTotals = computeTotalsFromBase();
  $('[data-id="base-gross"]').textContent = fmt(baseTotals.gross);
  $('[data-id="base-exp-total"]').textContent = fmt(baseTotals.expTotal);
  $('[data-id="base-op"]').textContent = fmt(baseTotals.op);
  $('[data-id="base-pbt"]').textContent = fmt(baseTotals.pbt);
  $('[data-id="base-tax"]').textContent = fmt(baseTotals.tax);
  $('[data-id="base-paty"]').textContent = fmt(baseTotals.paty);
  $('[data-id="base-retained-closing"]').textContent = fmt(base.sofp.retained + baseTotals.retainedInc);
}

function computeTotalsFromBase() {
  const sofpAssets = base.sofp.property + base.sofp.equipment + base.sofp.goodwill + base.sofp.inventories + base.sofp.receivables + base.sofp.cash;
  const sofpLiabs = base.sofp.payables + base.sofp.overdraft + base.sofp.bankloan;
  const sofpEqLiabs = sofpLiabs + base.sofp.sharecap + base.sofp.retained;
  const gross = base.pl.revenue - base.pl.cogs;
  const expTotal = base.pl.expBadDebts + base.pl.expGoodwill + base.pl.expInvWrite + base.pl.expOther;
  const op = gross - expTotal;
  const pbt = op - base.pl.interest;
  const tax = Math.round(pbt * base.pl.taxRate);
  const paty = pbt - tax;
  const retainedInc = paty - base.pl.dividends;
  return { assets: sofpAssets, liabs: sofpLiabs, eqLiabs: sofpEqLiabs, gross, expTotal, op, pbt, tax, paty, retainedInc };
}

function bindInputs() {
  const correct = computeCorrect();
  const inputs = $$('input[data-input]');
  inputs.forEach(i => {
    const key = i.getAttribute('data-input');
    if (correct.sofp[key] !== undefined) i.value = base.sofp[key];
    if (key === 'overheads') i.value = computeTotalsFromBase().expTotal;
    else if (correct.pl[key] !== undefined) i.value = base.pl[key];
    i.dataset.dirty = '0';
    i.classList.remove('ok','bad');
    i.addEventListener('input', () => {
      i.dataset.dirty = '1';
      validateAll();
    });
  });
  validateAll();
}

function readStudent() {
  const obj = { sofp: {}, pl: {} };
  $$('input[data-input]').forEach(i => {
    const key = i.getAttribute('data-input');
    const val = Number(i.value || 0);
    if (['property','equipment','goodwill','inventories','receivables','cash','payables','overdraft','bankloan','sharecap'].includes(key)) obj.sofp[key] = val;
    else obj.pl[key] = val;
  });
  return obj;
}

function validateAll() {
  const correct = computeCorrect();
  const student = readStudent();
  const checks = [];
  function markInput(key, group) {
    const input = document.querySelector(`input[data-input="${key}"]`);
    if (!input) return;
    const expected = correct[group][key];
    if (expected === undefined) return;
    if (input.dataset.dirty === '1') {
      const ok = Number(input.value || 0) === Math.round(expected);
      input.classList.toggle('ok', ok);
      input.classList.toggle('bad', !ok);
      checks.push(ok);
    } else {
      input.classList.remove('ok','bad');
    }
  }
  ['property','equipment','goodwill','inventories','receivables','cash','payables','overdraft','bankloan','sharecap'].forEach(k => markInput(k, 'sofp'));
  ['revenue','cogs','overheads','interest','dividends'].forEach(k => markInput(k, 'pl'));
  const derivedStudent = deriveFromStudent(student);
  const derivedCorrect = deriveFromCorrect(correct);
  const dirtyInputs = $$('input[data-input]').filter(i => i.dataset.dirty === '1');
  const allowDerivedColor = dirtyInputs.length > 0;
  setCheck('gross', derivedStudent.gross, derivedCorrect.gross, allowDerivedColor);
  setCheck('exp-total', derivedStudent.expTotal, derivedCorrect.expTotal, allowDerivedColor);
  setCheck('op', derivedStudent.op, derivedCorrect.op, allowDerivedColor);
  setCheck('pbt', derivedStudent.pbt, derivedCorrect.pbt, allowDerivedColor);
  setCheck('tax', derivedStudent.tax, derivedCorrect.tax, allowDerivedColor);
  setCheck('paty', derivedStudent.paty, derivedCorrect.paty, allowDerivedColor);
  setCheck('retained', derivedStudent.retainedClosing, derivedCorrect.retainedClosing, allowDerivedColor);
  setCheck('reclosing', derivedStudent.retainedClosing, derivedCorrect.retainedClosing, allowDerivedColor);
  setCheck('total-assets', derivedStudent.totalAssets, derivedCorrect.totalAssets, allowDerivedColor);
  setCheck('total-liabs', derivedStudent.totalLiabs, derivedCorrect.totalLiabs, allowDerivedColor);
  setCheck('total-eq-liabs', derivedStudent.totalEqLiabs, derivedCorrect.totalEqLiabs, allowDerivedColor);
  const mismatch = Math.round(derivedStudent.totalAssets) !== Math.round(derivedStudent.totalEqLiabs);
  const taEl = document.querySelector('[data-check="total-assets"]');
  const telEl = document.querySelector('[data-check="total-eq-liabs"]');
  [taEl, telEl].forEach(el => {
    if (!el) return;
    if (allowDerivedColor) {
      el.classList.toggle('bad', mismatch);
      if (!mismatch) el.classList.remove('bad');
    } else {
      el.classList.remove('bad');
    }
  });
  // Do NOT mark overheads input (double-entry, multiple amendments). Keep neutral even when dirty.
  const oh = document.querySelector('input[data-input="overheads"]');
  if (oh) oh.classList.remove('ok','bad');
  // Recompute dirty inputs and score excluding overheads from both numerator and denominator
  // Only count inputs that are coloured green as correct
  // Score shows only edited inputs
  // (overheads is excluded because it isn't coloured)
  // dirtyInputs already computed above
  const scoredInputs = dirtyInputs.filter(i => i.getAttribute('data-input') !== 'overheads');
  const scoreOk = scoredInputs.filter(i => i.classList.contains('ok')).length;
  const totalInputs = scoredInputs.length;
  $('#score-correct').textContent = String(scoreOk);
  $('#score-total').textContent = String(totalInputs);
}

function deriveFromStudent(s) {
  const gross = (s.pl.revenue || 0) - (s.pl.cogs || 0);
  const expTotal = (s.pl['overheads']||0);
  const op = gross - expTotal;
  const pbt = op - (s.pl.interest || 0);
  const tax = Math.round(pbt * base.pl.taxRate);
  const paty = pbt - tax;
  const retainedInc = paty - (s.pl.dividends || 0);
  const retainedClosing = base.sofp.retained + retainedInc;
  const totalAssets = (s.sofp.property||0)+(s.sofp.equipment||0)+(s.sofp.goodwill||0)+(s.sofp.inventories||0)+(s.sofp.receivables||0)+(s.sofp.cash||0);
  const totalLiabs = (s.sofp.payables||0)+(s.sofp.overdraft||0)+(s.sofp.bankloan||0);
  const totalEqLiabs = totalLiabs + (s.sofp.sharecap||0) + retainedClosing;
  return { gross, expTotal, op, pbt, tax, paty, retainedInc, retainedClosing, totalAssets, totalLiabs, totalEqLiabs };
}

function deriveFromCorrect(c) {
  return {
    gross: c.pl.gross,
    expTotal: c.pl.expTotal,
    op: c.pl.op,
    pbt: c.pl.pbt,
    tax: c.pl.tax,
    paty: c.pl.paty,
    retainedInc: c.pl.retainedInc,
    retainedClosing: c.sofp.retained,
    totalAssets: c.sofp.totalAssets,
    totalLiabs: c.sofp.totalLiabs,
    totalEqLiabs: c.sofp.totalEqLiabs
  };
}

function setCheck(key, got, expected, allow = true) {
  const el = document.querySelector(`[data-check="${key}"]`);
  if (!el) return;
  el.textContent = fmt(Math.round(got));
  el.classList.toggle('cell-check', true);
  const ok = Math.round(got) === Math.round(expected);
  if (allow) {
    el.classList.toggle('ok', ok);
    el.classList.toggle('bad', !ok);
  } else {
    el.classList.remove('ok','bad');
  }
}

function attachButtons() {
  $('#reveal').addEventListener('click', () => {
    // Render a snapshot with correct answers and show as overlay without changing inputs
    const correct = computeCorrect();
    const container = document.createElement('div');
    container.style.padding = '18px';
    container.style.background = '#10182b';
    container.style.color = '#eaf0ff';
    container.style.border = '1px solid #22304a';
    container.style.borderRadius = '12px';
    container.style.width = '1040px';
    container.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
        <div>
          <h3 style="margin:0 0 8px 0;">SoFP — Answers</h3>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tr><th style="text-align:left; padding:6px; border:1px solid #22304a;">Item</th><th style="text-align:right; padding:6px; border:1px solid #22304a;">$m</th></tr>
            ${['property','equipment','goodwill','inventories','receivables','cash','payables','overdraft','bankloan','sharecap'].map(k=>
              `<tr><td style='padding:6px; border:1px solid #22304a;'>${labelMap(k)}</td><td style='padding:6px; border:1px solid #22304a; text-align:right;'>${Math.round(correct.sofp[k])}</td></tr>`
            ).join('')}
            <tr><td style='padding:6px; border:1px solid #22304a; font-weight:700; background:#13254a;'>Total assets</td><td style='padding:6px; border:1px solid #22304a; text-align:right; font-weight:700; background:#13254a;'>${Math.round(correct.sofp.totalAssets)}</td></tr>
            <tr><td style='padding:6px; border:1px solid #22304a; font-weight:700;'>Retained earnings (closing)</td><td style='padding:6px; border:1px solid #22304a; text-align:right; font-weight:700;'>${Math.round(correct.sofp.retained)}</td></tr>
            <tr><td style='padding:6px; border:1px solid #22304a; font-weight:700;'>Total liabilities</td><td style='padding:6px; border:1px solid #22304a; text-align:right; font-weight:700;'>${Math.round(correct.sofp.totalLiabs)}</td></tr>
            <tr><td style='padding:6px; border:1px solid #22304a; font-weight:700; background:#13254a;'>Total equity & liabilities</td><td style='padding:6px; border:1px solid #22304a; text-align:right; font-weight:700; background:#13254a;'>${Math.round(correct.sofp.totalEqLiabs)}</td></tr>
          </table>
        </div>
        <div>
          <h3 style="margin:0 0 8px 0;">Income Statement — Answers</h3>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tr><th style="text-align:left; padding:6px; border:1px solid #22304a;">Item</th><th style="text-align:right; padding:6px; border:1px solid #22304a;">$m</th></tr>
            ${[['Revenue','revenue'],['Cost of sales','cogs'],['Gross profit','gross'],['Overhead expenses','expTotal'],['Profit from operations','op'],['Interest paid','interest'],['Profit before tax','pbt'],['Corporation tax @ 20%','tax'],['Profit for the year','paty'],['Dividends paid','dividends'],['Retained earnings (closing)','retainedClosing']].map(([label,key])=>
              `<tr><td style='padding:6px; border:1px solid #22304a;'>${label}</td><td style='padding:6px; border:1px solid #22304a; text-align:right;'>${Math.round(key==='retainedClosing'?correct.sofp.retained:correct.pl[key])}</td></tr>`
            ).join('')}
          </table>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    html2canvas(container).then(canvas => {
      document.body.removeChild(container);
      const dataUrl = canvas.toDataURL('image/png');
      const img = document.getElementById('answers-image');
      img.src = dataUrl;
      const overlay = document.getElementById('answers-overlay');
      overlay.style.display = 'grid';
      overlay.onclick = () => { overlay.style.display = 'none'; };
    });
  });
  $('#reset').addEventListener('click', () => {
    $$('input[data-input]').forEach(i => {
      const key = i.getAttribute('data-input');
      if (key === 'overheads') i.value = computeTotalsFromBase().expTotal;
      else if (base.sofp[key] !== undefined) i.value = base.sofp[key];
      else if (base.pl[key] !== undefined) i.value = base.pl[key];
      else i.value = '';
      i.dataset.dirty = '0';
      i.classList.remove('ok','bad');
    });
    validateAll();
  });
  $('#finalize').addEventListener('click', () => {
    const correct = computeCorrect();
    $$('input[data-input]').forEach(i => {
      const key = i.getAttribute('data-input');
      if (key === 'overheads') {
        i.readOnly = false;
        i.classList.add('amber');
        return;
      }
      const expected = (correct.sofp[key] !== undefined) ? correct.sofp[key] : correct.pl[key];
      if (expected === undefined) return;
      const ok = Number(i.value || 0) === Math.round(expected);
      if (ok) {
        i.readOnly = true;
      } else {
        i.readOnly = false;
      }
    });
  });
}

function init() {
  populateBase();
  bindInputs();
  attachButtons();
}

document.addEventListener('DOMContentLoaded', init);
