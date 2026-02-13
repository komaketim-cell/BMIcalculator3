/* =========================================
 * BMI / BMR / TDEE / WHtR Core Logic
 * ========================================= */

/* ---------- ابزارهای تاریخ شمسی ---------- */

// دریافت سال شمسی فعلی به‌صورت داینامیک
function getCurrentJalaliYear() {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        year: 'numeric'
    }).format(new Date()) * 1;
}

// بررسی کبیسه بودن سال شمسی
function isLeapJalaliYear(year) {
    const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
        1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
        2456, 3178
    ];
    let bl = breaks.length;
    let jp = breaks[0];
    let jm, jump, leap, n, i;

    if (year < jp || year >= breaks[bl - 1]) return false;

    for (i = 1; i < bl; i++) {
        jm = breaks[i];
        jump = jm - jp;
        if (year < jm) break;
        jp = jm;
    }
    n = year - jp;
    leap = ((n + 1) % 33 - 1) % 4;
    if (leap === -1) leap = 4;
    return leap === 0;
}

// تعداد روزهای ماه شمسی
function getJalaliMonthDays(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isLeapJalaliYear(year) ? 30 : 29;
}

// محاسبه سن دقیق
function calculateAge(year, month, day) {
    const now = new Date();
    const currentYear = getCurrentJalaliYear();

    let age = currentYear - year;
    return age > 0 ? age : 0;
}

/* ---------- محاسبات اصلی ---------- */

function calculateBMI(weight, heightCm) {
    const heightM = heightCm / 100;
    return weight / (heightM * heightM);
}

function getBMIStatus(bmi) {
    if (bmi < 18.5) return 'کم‌وزن';
    if (bmi < 25) return 'وزن نرمال';
    if (bmi < 30) return 'اضافه‌وزن';
    return 'چاقی';
}

function calculateHealthyWeightRange(heightCm) {
    const h = heightCm / 100;
    return {
        min: (18.5 * h * h).toFixed(1),
        max: (24.9 * h * h).toFixed(1)
    };
}

function calculateBMR(gender, weight, height, age) {
    if (gender === 'مرد') {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    }
    return 10 * weight + 6.25 * height - 5 * age - 161;
}

function calculateTDEE(bmr, activity) {
    return bmr * activity;
}

/* ---------- WHtR (اختیاری) ---------- */

function calculateWHtR(waistCm, heightCm) {
    return waistCm / heightCm;
}

function getWHtRStatus(whtr) {
    if (whtr < 0.4) {
        return {
            status: 'خیلی لاغر',
            risk: 'احتمال کمبود وزن یا توده عضلانی'
        };
    }
    if (whtr < 0.5) {
        return {
            status: 'سالم',
            risk: 'کمترین ریسک چربی شکمی'
        };
    }
    if (whtr < 0.6) {
        return {
            status: 'پرخطر',
            risk: 'ریسک افزایش بیماری‌های قلبی'
        };
    }
    return {
        status: 'خطر بالا',
        risk: 'ریسک بالای دیابت و بیماری قلبی'
    };
}

/* ---------- رویداد اصلی ---------- */

document.getElementById('calc-btn').addEventListener('click', () => {
    const gender = document.getElementById('gender').value;
    const year = parseInt(document.getElementById('birth-year').value);
    const month = parseInt(document.getElementById('birth-month').value);
    const day = parseInt(document.getElementById('birth-day').value);

    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const waist = parseFloat(document.getElementById('waist').value);
    const activity = parseFloat(document.getElementById('activity').value);

    const errorBox = document.getElementById('error-message');
    errorBox.textContent = '';

    if (!year || !month || !day || !height || !weight) {
        errorBox.textContent = '❌ لطفاً تمام فیلدهای ضروری را تکمیل کنید.';
        return;
    }

    if (day > getJalaliMonthDays(year, month)) {
        errorBox.textContent = '❌ تاریخ تولد نامعتبر است.';
        return;
    }

    const age = calculateAge(year, month, day);
    const bmi = calculateBMI(weight, height);
    const bmiStatus = getBMIStatus(bmi);
    const healthyRange = calculateHealthyWeightRange(height);

    const bmr = calculateBMR(gender, weight, height, age);
    const tdee = calculateTDEE(bmr, activity);

    /* ---------- نمایش نتایج ---------- */

    document.getElementById('r-gender').textContent = gender;
    document.getElementById('r-age').textContent = age + ' سال';
    document.getElementById('r-height').textContent = height + ' cm';
    document.getElementById('r-weight').textContent = weight + ' kg';

    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    document.getElementById('bmi-status-text').textContent = bmiStatus;
    document.getElementById('r-healthy').textContent =
        healthyRange.min + ' تا ' + healthyRange.max + ' کیلوگرم';

    document.getElementById('r-bmr').textContent = Math.round(bmr);
    document.getElementById('r-tdee').textContent = Math.round(tdee);

    document.getElementById('maintain-calories').textContent = Math.round(tdee);
    document.getElementById('gain-calories').textContent = Math.round(tdee + 300);
    document.getElementById('loss-calories').textContent = Math.round(tdee - 500);

    /* ---------- WHtR (در صورت ورود) ---------- */
    if (!isNaN(waist) && waist > 0) {
        const whtr = calculateWHtR(waist, height);
        const whtrInfo = getWHtRStatus(whtr);

        document.getElementById('whtr-card').style.display = 'block';
        document.getElementById('whtr-value').textContent = whtr.toFixed(2);
        document.getElementById('whtr-status-text').textContent = whtrInfo.status;
        document.getElementById('whtr-risk-text').textContent = whtrInfo.risk;
    } else {
        document.getElementById('whtr-card').style.display = 'none';
    }

    /* ---------- تغییر صفحه ---------- */
    document.getElementById('input-page').classList.remove('active');
    document.getElementById('results-page').classList.add('active');
});
