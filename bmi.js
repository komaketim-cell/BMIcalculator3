// ============================================================
//  bmi.js  –  نسخه نهایی با منطق LMS بر اساس ماه
//  هماهنگ با کد مرجع Python (Mifflin-St Jeor + WHO LMS)
// ============================================================

'use strict';

// ──────────────────────────────────────────
//  ۱. ابزارهای تقویم شمسی
// ──────────────────────────────────────────

function isLeapJalali(year) {
    const leapYears = [1, 5, 9, 13, 17, 22, 26, 30];
    const cycle = ((year - 474) % 2820 + 2820) % 2820 + 474;
    return leapYears.includes((cycle - 474) % 2820 % 128 % 29);
}

function jalaliDaysInMonth(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isLeapJalali(year) ? 30 : 29;
}

/** سن دقیق بر حسب ماه (عدد اعشاری) از تاریخ تولد شمسی تا امروز */
function calcAgeMonths(birthYear, birthMonth, birthDay) {
    const today = getTodayJalali();
    let years  = today.year  - birthYear;
    let months = today.month - birthMonth;
    let days   = today.day   - birthDay;

    if (days < 0) {
        months -= 1;
        days += jalaliDaysInMonth(birthYear, ((birthMonth - 2 + 12) % 12) + 1);
    }
    if (months < 0) {
        years  -= 1;
        months += 12;
    }

    const totalMonths = years * 12 + months + days / 30.4375;
    return totalMonths;          // ماه دقیق (اعشاری)
}

function getTodayJalali() {
    // تبدیل میلادی به شمسی
    const g = new Date();
    return gregorianToJalali(g.getFullYear(), g.getMonth() + 1, g.getDate());
}

function gregorianToJalali(gy, gm, gd) {
    const g_d_no = [0,31,59+1,90+1,120+1,151+1,181+1,212+1,243+1,273+1,304+1,334+1];
    let jy, jm, jd;
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
             + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_no[gm - 1];
    jy = -1444;
    days -= 365 * jy + Math.floor(jy / 4) - Math.floor(jy / 100) + Math.floor(jy / 400);
    let dy = days % 365;
    if (dy < 186) { dy++; jm = Math.ceil(dy / 31); jd = dy - 31 * (jm - 1); }
    else           { dy -= 186; jm = Math.ceil(dy / 30) + 6; jd = dy - 30 * (jm - 7); }
    jy += Math.floor(days / 365);
    // تصحیح اگر روز صفر یا منفی شد
    if (jd <= 0) { jm--; if (jm <= 0) { jy--; jm = 12; } jd += jalaliDaysInMonth(jy, jm); }
    return { year: jy, month: jm, day: jd };
}

// ──────────────────────────────────────────
//  ۲. داده‌های LMS (از who-data.js تزریق می‌شود)
//     کلیدها بر حسب ماه (60 تا 228)
// ──────────────────────────────────────────

// WHO_LMS_DATA باید از who-data.js در صفحه لود شده باشد:
//   WHO_LMS_DATA = { boys: { 60: {L,M,S}, 61: {L,M,S}, ... },
//                    girls: { ... } }

// ──────────────────────────────────────────
//  ۳. درون‌یابی خطی LMS و محاسبه Z-Score
// ──────────────────────────────────────────

/**
 * درون‌یابی خطی بین دو ماه در جدول LMS
 * @param {Object} table  - جدول جنس (boys یا girls)
 * @param {number} ageM   - سن به ماه (اعشاری)
 * @returns {{L,M,S}}
 */
function interpolateLMS(table, ageM) {
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    const minKey = keys[0];
    const maxKey = keys[keys.length - 1];

    if (ageM <= minKey) return table[minKey];
    if (ageM >= maxKey) return table[maxKey];

    const lo = keys.filter(k => k <= ageM).pop();
    const hi = keys.find(k => k > ageM);

    if (lo === hi || hi === undefined) return table[lo];

    const t = (ageM - lo) / (hi - lo);   // کسر درون‌یابی [0,1]
    const lLo = table[lo], lHi = table[hi];

    return {
        L: lLo.L + t * (lHi.L - lLo.L),
        M: lLo.M + t * (lHi.M - lLo.M),
        S: lLo.S + t * (lHi.S - lLo.S),
    };
}

/**
 * محاسبه Z-Score بر اساس فرمول WHO LMS:
 *   اگر L ≠ 0 :  Z = ( (BMI/M)^L − 1 ) / (L × S)
 *   اگر L = 0  :  Z = ln(BMI/M) / S
 */
function calcZScore(bmi, L, M, S) {
    if (Math.abs(L) < 1e-10) {
        return Math.log(bmi / M) / S;
    }
    return (Math.pow(bmi / M, L) - 1) / (L * S);
}

/**
 * دریافت وضعیت BMI برای کودکان ۵–۱۹ سال بر اساس Z-Score
 */
function getBMIStatusChild(zScore) {
    if      (zScore < -3)  return { status: 'لاغری شدید',    color: '#e74c3c' };
    else if (zScore < -2)  return { status: 'لاغری',          color: '#e67e22' };
    else if (zScore < 1)   return { status: 'وزن طبیعی',      color: '#27ae60' };
    else if (zScore < 2)   return { status: 'اضافه وزن',      color: '#f39c12' };
    else if (zScore < 3)   return { status: 'چاقی',            color: '#e74c3c' };
    else                   return { status: 'چاقی مرضی',       color: '#c0392b' };
}

/**
 * محاسبه کامل LMS برای کودک
 * @param {number} bmi
 * @param {number} ageMonths  - سن به ماه (اعشاری)
 * @param {string} sex        - 'male' | 'female'
 * @returns {{ zScore, status, color } | null}
 */
function calcChildBMI(bmi, ageMonths, sex) {
    if (typeof WHO_LMS_DATA === 'undefined') {
        console.error('WHO_LMS_DATA تعریف نشده است.');
        return null;
    }
    const table = (sex === 'male') ? WHO_LMS_DATA.boys : WHO_LMS_DATA.girls;
    if (!table) return null;

    const { L, M, S } = interpolateLMS(table, ageMonths);
    const z = calcZScore(bmi, L, M, S);
    return { zScore: parseFloat(z.toFixed(4)), ...getBMIStatusChild(z) };
}

// ──────────────────────────────────────────
//  ۴. BMI برای بزرگسالان
// ──────────────────────────────────────────

function getBMIStatusAdult(bmi) {
    if      (bmi < 18.5) return { status: 'لاغری',       color: '#e67e22' };
    else if (bmi < 25)   return { status: 'وزن طبیعی',   color: '#27ae60' };
    else if (bmi < 30)   return { status: 'اضافه وزن',   color: '#f39c12' };
    else                 return { status: 'چاقی',          color: '#e74c3c' };
}

// ──────────────────────────────────────────
//  ۵. BMR (Mifflin-St Jeor) و TDEE
// ──────────────────────────────────────────

/**
 * BMR بر اساس فرمول Mifflin-St Jeor
 * @param {number} weight  - کیلوگرم
 * @param {number} height  - سانتی‌متر
 * @param {number} ageYears- سال
 * @param {string} sex     - 'male' | 'female'
 */
function calcBMR(weight, height, ageYears, sex) {
    const base = 10 * weight + 6.25 * height - 5 * ageYears;
    return sex === 'male' ? base + 5 : base - 161;
}

const ACTIVITY_FACTORS = {
    sedentary:    { label: 'کم‌تحرک (بدون ورزش)',             factor: 1.2   },
    light:        { label: 'کم ورزش (۱-۳ روز در هفته)',        factor: 1.375 },
    moderate:     { label: 'ورزش متوسط (۳-۵ روز در هفته)',     factor: 1.55  },
    active:       { label: 'ورزش سنگین (۶-۷ روز در هفته)',     factor: 1.725 },
    very_active:  { label: 'ورزشکار حرفه‌ای / کار فیزیکی سنگین', factor: 1.9  },
};

/** TDEE برای هر سطح فعالیت */
function calcAllTDEE(bmr) {
    return Object.entries(ACTIVITY_FACTORS).map(([key, { label, factor }]) => ({
        key,
        label,
        calories: Math.round(bmr * factor),
    }));
}

// ──────────────────────────────────────────
//  ۶. وزن ایده‌آل (Devine)
// ──────────────────────────────────────────

function calcIdealWeight(height, sex) {
    const hInch = height / 2.54;
    const extra = Math.max(0, hInch - 60);
    if (sex === 'male')   return parseFloat((50  + 2.3 * extra).toFixed(1));
    else                  return parseFloat((45.5 + 2.3 * extra).toFixed(1));
}

// ──────────────────────────────────────────
//  ۷. رابط کاربری (Event Listeners)
// ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // ── المان‌های ورودی ──
    const weightInput    = document.getElementById('weight');
    const heightInput    = document.getElementById('height');
    const sexSelect      = document.getElementById('sex');
    const ageTypeSelect  = document.getElementById('age-type');
    const ageYearsWrap   = document.getElementById('age-years-wrap');
    const ageBirthWrap   = document.getElementById('age-birth-wrap');
    const ageInput       = document.getElementById('age');
    const birthYearInput = document.getElementById('birth-year');
    const birthMonthInput= document.getElementById('birth-month');
    const birthDayInput  = document.getElementById('birth-day');
    const activitySelect = document.getElementById('activity');
    const calcBtn        = document.getElementById('calc-btn');
    const errorDiv       = document.getElementById('error-msg');

    // ── صفحه‌ها ──
    const pages = {
        input:  document.getElementById('input-page'),
        result: document.getElementById('result-page'),
        guide:  document.getElementById('guide-page'),
    };

    const navBtns = {
        result: document.getElementById('nav-result'),
        guide:  document.getElementById('nav-guide'),
        back:   document.getElementById('back-btn'),
    };

    // ── نمایش صفحه‌ها ──
    function showPage(name) {
        Object.values(pages).forEach(p => p && p.classList.remove('active'));
        if (pages[name]) pages[name].classList.add('active');
    }

    if (navBtns.guide)  navBtns.guide.addEventListener('click',  () => showPage('guide'));
    if (navBtns.result) navBtns.result.addEventListener('click', () => showPage('result'));
    if (navBtns.back)   navBtns.back.addEventListener('click',   () => showPage('input'));

    // ── تغییر نوع ورودی سن ──
    if (ageTypeSelect) {
        ageTypeSelect.addEventListener('change', () => {
            const isBirth = ageTypeSelect.value === 'birth';
            if (ageYearsWrap) ageYearsWrap.style.display = isBirth ? 'none' : 'block';
            if (ageBirthWrap) ageBirthWrap.style.display = isBirth ? 'block' : 'none';
        });
    }

    // ── دکمه محاسبه ──
    if (calcBtn) calcBtn.addEventListener('click', calculate);

    function showError(msg) {
        if (errorDiv) { errorDiv.textContent = msg; errorDiv.style.display = 'block'; }
    }
    function clearError() {
        if (errorDiv) { errorDiv.textContent = ''; errorDiv.style.display = 'none'; }
    }

    // ──────────────────────────────────────
    //  تابع اصلی محاسبه
    // ──────────────────────────────────────
    function calculate() {
        clearError();

        // ── دریافت مقادیر پایه ──
        const weight = parseFloat(weightInput?.value);
        const height = parseFloat(heightInput?.value);
        const sex    = sexSelect?.value;                    // 'male' | 'female'
        const activity = activitySelect?.value || 'sedentary';

        if (!weight || !height || weight <= 0 || height <= 0) {
            return showError('لطفاً وزن و قد را به‌درستی وارد کنید.');
        }

        // ── محاسبه سن ──
        let ageMonths;      // سن به ماه (دقیق، اعشاری)
        let ageYearsDisplay;

        const ageType = ageTypeSelect?.value || 'years';

        if (ageType === 'birth') {
            const by = parseInt(birthYearInput?.value);
            const bm = parseInt(birthMonthInput?.value);
            const bd = parseInt(birthDayInput?.value);

            if (!by || !bm || !bd || by < 1300 || bm < 1 || bm > 12 || bd < 1 || bd > 31) {
                return showError('لطفاً تاریخ تولد را به‌درستی وارد کنید.');
            }
            ageMonths = calcAgeMonths(by, bm, bd);
        } else {
            const ageYears = parseFloat(ageInput?.value);
            if (!ageYears || ageYears <= 0) {
                return showError('لطفاً سن را به‌درستی وارد کنید.');
            }
            ageMonths = ageYears * 12;
        }

        if (ageMonths <= 0) {
            return showError('سن محاسبه‌شده معتبر نیست.');
        }

        const ageYears = ageMonths / 12;
        ageYearsDisplay = ageYears.toFixed(1);

        // ── BMI ──
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);

        // ── وضعیت BMI ──
        let bmiStatus, bmiColor, zScoreDisplay = null;

        const isChild = (ageMonths >= 60 && ageMonths <= 228);   // ۵–۱۹ سال

        if (isChild) {
            const childResult = calcChildBMI(bmi, ageMonths, sex);
            if (childResult) {
                bmiStatus     = childResult.status;
                bmiColor      = childResult.color;
                zScoreDisplay = childResult.zScore;
            } else {
                // fallback به جداول بزرگسالان
                const r = getBMIStatusAdult(bmi);
                bmiStatus = r.status; bmiColor = r.color;
            }
        } else {
            const r = getBMIStatusAdult(bmi);
            bmiStatus = r.status; bmiColor = r.color;
        }

        // ── وزن ایده‌آل و اختلاف ──
        const idealWeight = calcIdealWeight(height, sex);
        const weightDiff  = parseFloat((weight - idealWeight).toFixed(1));

        // ── BMR و TDEE ──
        const bmr  = calcBMR(weight, height, ageYears, sex);
        const tdee = calcAllTDEE(bmr);

        // ── نمایش نتایج ──
        renderResults({
            weight, height, sex, ageYearsDisplay, ageMonths,
            bmi: parseFloat(bmi.toFixed(2)),
            bmiStatus, bmiColor, zScoreDisplay,
            idealWeight, weightDiff,
            bmr: Math.round(bmr),
            tdee, activity,
        });

        showPage('result');
    }

    // ──────────────────────────────────────
    //  رندر خروجی
    // ──────────────────────────────────────
    function renderResults(d) {

        // اطلاعات کلی
        setHTML('res-weight',  `${d.weight} کیلوگرم`);
        setHTML('res-height',  `${d.height} سانتی‌متر`);
        setHTML('res-sex',     d.sex === 'male' ? 'مرد' : 'زن');
        setHTML('res-age',     `${d.ageYearsDisplay} سال`);

        // دایره BMI
        const circle = document.getElementById('bmi-circle');
        if (circle) {
            circle.textContent   = d.bmi.toFixed(1);
            circle.style.background = d.bmiColor;
        }

        // وضعیت
        const statusSpan = document.getElementById('bmi-status-text');
        if (statusSpan) {
            statusSpan.textContent  = d.bmiStatus;
            statusSpan.style.color  = d.bmiColor;
        }

        // Z-Score (فقط کودکان)
        const zRow = document.getElementById('zscore-row');
        if (zRow) {
            if (d.zScoreDisplay !== null) {
                zRow.style.display = 'block';
                setHTML('zscore-val', d.zScoreDisplay.toFixed(2));
            } else {
                zRow.style.display = 'none';
            }
        }

        // اختلاف وزن
        const diffText = d.weightDiff === 0
            ? 'وزن ایده‌آل دارید'
            : d.weightDiff > 0
                ? `${d.weightDiff} کیلوگرم اضافه وزن`
                : `${Math.abs(d.weightDiff)} کیلوگرم کمبود وزن`;
        setHTML('weight-diff', diffText);
        setHTML('ideal-weight-val', `${d.idealWeight} کیلوگرم`);

        // BMR
        setHTML('bmr-val', `${d.bmr} کیلوکالری`);

        // TDEE – هایلایت سطح فعلی
        const tdeeContainer = document.getElementById('tdee-list');
        if (tdeeContainer) {
            tdeeContainer.innerHTML = d.tdee.map(item => `
                <div class="calorie-item ${item.key === d.activity ? 'active-activity' : ''}">
                    <span class="calorie-label">${item.label}</span>
                    <span class="calorie-value">${item.calories.toLocaleString('fa-IR')} کیلوکالری</span>
                </div>
            `).join('');
        }
    }

    // ── کمکی ──
    function setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

});
