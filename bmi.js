// =============================================
// توابع کمکی UI
// =============================================

/**
 * نمایش صفحه مشخص شده
 */
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

/**
 * نمایش خطا
 */
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

// =============================================
// توابع محاسبات تاریخ شمسی
// =============================================

/**
 * تعداد روزهای ماه جلالی
 */
function daysInJalaliMonth(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    // اسفند: بررسی کبیسه
    return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * بررسی سال کبیسه جلالی
 */
function isJalaliLeapYear(jy) {
    const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
    const cycle = jy % 128;
    return breaks.some(b => cycle === b || cycle === b + 33 || cycle === b + 66 || cycle === b + 99);
}

/**
 * اعتبارسنجی تاریخ شمسی
 */
function isValidJalaliDate(year, month, day) {
    if (year < 1300 || year > 1450) return false;
    if (month < 1 || month > 12) return false;
    
    const maxDay = daysInJalaliMonth(year, month);
    if (day < 1 || day > maxDay) return false;
    
    return true;
}

// =============================================
// محاسبه سن
// =============================================

/**
 * محاسبه سن دقیق بر حسب ماه (اعشاری)
 * @param {number} birthJY - سال تولد جلالی
 * @param {number} birthJM - ماه تولد جلالی
 * @param {number} birthJD - روز تولد جلالی
 * @param {number} todayJY - سال امروز جلالی
 * @param {number} todayJM - ماه امروز جلالی
 * @param {number} todayJD - روز امروز جلالی
 * @returns {number} سن به ماه (اعشاری)
 */
function calculateAgeInMonths(birthJY, birthJM, birthJD, todayJY, todayJM, todayJD) {
    let y = todayJY - birthJY;
    let m = todayJM - birthJM;
    let d = todayJD - birthJD;

    if (d < 0) {
        m -= 1;
        const prevMonth = todayJM === 1 ? 12 : todayJM - 1;
        const prevYear = prevMonth === 12 ? todayJY - 1 : todayJY;
        d += daysInJalaliMonth(prevYear, prevMonth);
    }

    if (m < 0) {
        y -= 1;
        m += 12;
    }

    // تبدیل به ماه اعشاری (دقیقاً مانند Python)
    const totalMonths = y * 12 + m + d / 30.4375;
    return totalMonths;
}

// =============================================
// دریافت پارامترهای LMS با درون‌یابی
// =============================================

/**
 * دریافت پارامترهای LMS با درون‌یابی خطی
 * @param {number} ageMonths - سن به ماه (اعشاری، مثلاً 97.36)
 * @param {string} gender - "مرد" یا "زن"
 * @returns {Object} {L, M, S}
 */
function getLMSValues(ageMonths, gender) {
    const table = gender === "مرد" ? WHO_BOYS_LMS : WHO_GIRLS_LMS;
    
    // گرد کردن به نزدیک‌ترین عدد صحیح برای جستجو
    const monthInt = Math.round(ageMonths);
    
    // اگر دقیقاً روی یک نقطه بود
    if (table[monthInt]) {
        return table[monthInt];
    }

    // پیدا کردن کلیدهای موجود
    const availableMonths = Object.keys(table).map(Number).sort((a, b) => a - b);

    // اگر خارج از بازه بود
    if (ageMonths <= availableMonths[0]) {
        return table[availableMonths[0]];
    }
    if (ageMonths >= availableMonths[availableMonths.length - 1]) {
        return table[availableMonths[availableMonths.length - 1]];
    }

    // پیدا کردن دو نقطه برای درون‌یابی
    let lowerMonth = null;
    let upperMonth = null;

    for (let i = 0; i < availableMonths.length - 1; i++) {
        if (availableMonths[i] <= ageMonths && ageMonths <= availableMonths[i + 1]) {
            lowerMonth = availableMonths[i];
            upperMonth = availableMonths[i + 1];
            break;
        }
    }

    if (lowerMonth === null) {
        // اگر نتوانست پیدا کند، نزدیک‌ترین را برگردان
        return table[monthInt] || table[availableMonths[0]];
    }

    // درون‌یابی خطی
    const t = (ageMonths - lowerMonth) / (upperMonth - lowerMonth);
    const lms1 = table[lowerMonth];
    const lms2 = table[upperMonth];

    return {
        L: lms1.L + t * (lms2.L - lms1.L),
        M: lms1.M + t * (lms2.M - lms1.M),
        S: lms1.S + t * (lms2.S - lms1.S)
    };
}

// =============================================
// محاسبات BMI و Z-Score
// =============================================

/**
 * محاسبه BMI
 */
function calculateBMI(weight, height) {
    const heightM = height / 100;
    return weight / (heightM * heightM);
}

/**
 * محاسبه Z-Score از فرمول LMS
 */
function calculateZScore(value, L, M, S) {
    if (L === 0) {
        return Math.log(value / M) / S;
    }
    return (Math.pow(value / M, L) - 1) / (L * S);
}

/**
 * محاسبه BMI از Z-Score (معکوس فرمول LMS)
 */
function calculateBMIFromZ(z, L, M, S) {
    if (L === 0) {
        return M * Math.exp(z * S);
    }
    return M * Math.pow(1 + L * S * z, 1 / L);
}

/**
 * طبقه‌بندی Z-Score (WHO)
 */
function classifyZScore(z) {
    if (z < -3) return "لاغری شدید";
    if (z < -2) return "لاغری";
    if (z <= 1) return "نرمال";
    if (z <= 2) return "اضافه وزن";
    if (z <= 3) return "چاقی";
    return "چاقی شدید";
}

/**
 * محاسبه بازه وزن سالم بر اساس Z-Score
 */
function calculateHealthyWeightRange(height, ageMonths, gender) {
    const lms = getLMSValues(ageMonths, gender);
    const heightM = height / 100;

    // Z = -2 تا Z = +1 (بازه نرمال WHO)
    const bmiMin = calculateBMIFromZ(-2, lms.L, lms.M, lms.S);
    const bmiMax = calculateBMIFromZ(1, lms.L, lms.M, lms.S);

    const weightMin = bmiMin * heightM * heightM;
    const weightMax = bmiMax * heightM * heightM;

    return { min: weightMin, max: weightMax };
}

// =============================================
// محاسبات BMR و TDEE
// =============================================

/**
 * محاسبه BMR (Mifflin-St Jeor)
 */
function calculateBMR(weight, height, ageYears, gender) {
    if (gender === "مرد") {
        return 10 * weight + 6.25 * height - 5 * ageYears + 5;
    }
    return 10 * weight + 6.25 * height - 5 * ageYears - 161;
}

/**
 * محاسبه TDEE
 */
function calculateTDEE(bmr, activityFactor) {
    return bmr * activityFactor;
}

// =============================================
// تابع اصلی محاسبه
// =============================================

/**
 * تابع اصلی محاسبه
 */
function performCalculation() {
    // دریافت ورودی‌ها
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const gender = document.getElementById('gender').value;
    const activityLevel = parseFloat(document.getElementById('activity').value);

    // تاریخ تولد
    const birthYear = parseInt(document.getElementById('birth-year').value);
    const birthMonth = parseInt(document.getElementById('birth-month').value);
    const birthDay = parseInt(document.getElementById('birth-day').value);

    // اعتبارسنجی ورودی‌ها
    if (isNaN(weight) || weight <= 0 || weight > 300) {
        showError('لطفاً وزن معتبری وارد کنید (بین 1 تا 300 کیلوگرم)');
        return;
    }

    if (isNaN(height) || height <= 0 || height > 250) {
        showError('لطفاً قد معتبری وارد کنید (بین 1 تا 250 سانتی‌متر)');
        return;
    }

    if (!isValidJalaliDate(birthYear, birthMonth, birthDay)) {
        showError('تاریخ تولد نامعتبر است');
        return;
    }

    // تاریخ امروز (جلالی - باید از API یا تابع تبدیل استفاده شود)
    // فرض: تاریخ امروز 1404/11/22
    const todayYear = 1404;
    const todayMonth = 11;
    const todayDay = 22;

    // محاسبه سن به ماه
    const ageMonths = calculateAgeInMonths(
        birthYear, birthMonth, birthDay,
        todayYear, todayMonth, todayDay
    );
    
    if (ageMonths < 0) {
        showError('تاریخ تولد نمی‌تواند در آینده باشد');
        return;
    }

    const ageYears = ageMonths / 12;

    // محاسبه BMI
    const bmi = calculateBMI(weight, height);

    let result = {
        bmi: bmi.toFixed(1),
        ageYears: ageYears.toFixed(1),
        ageMonths: ageMonths.toFixed(1)
    };

    // اگر کودک/نوجوان (5-19 سال)
    if (ageMonths >= 60 && ageMonths <= 228) {
        const lms = getLMSValues(ageMonths, gender);
        const zScore = calculateZScore(bmi, lms.L, lms.M, lms.S);
        const category = classifyZScore(zScore);
        const healthyRange = calculateHealthyWeightRange(height, ageMonths, gender);

        result.zScore = zScore.toFixed(2);
        result.category = category;
        result.healthyWeightMin = healthyRange.min.toFixed(1);
        result.healthyWeightMax = healthyRange.max.toFixed(1);
        result.L = lms.L.toFixed(3);
        result.M = lms.M.toFixed(3);
        result.S = lms.S.toFixed(3);
    } else {
        // بزرگسال
        let category = "نرمال";
        if (bmi < 18.5) category = "کمبود وزن";
        else if (bmi < 25) category = "نرمال";
        else if (bmi < 30) category = "اضافه وزن";
        else if (bmi < 35) category = "چاقی درجه ۱";
        else if (bmi < 40) category = "چاقی درجه ۲";
        else category = "چاقی درجه ۳";

        result.category = category;
    }

    // محاسبه BMR و TDEE
    const bmr = calculateBMR(weight, height, ageYears, gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    result.bmr = bmr.toFixed(0);
    result.tdee = tdee.toFixed(0);
    result.cut250 = (tdee - 250).toFixed(0);
    result.cut500 = (tdee - 500).toFixed(0);
    result.bulk250 = (tdee + 250).toFixed(0);
    result.bulk500 = (tdee + 500).toFixed(0);

    // نمایش نتایج
    displayResults(result);
    showPage('results-page');
}

// =============================================
// نمایش نتایج
// =============================================

/**
 * نمایش نتایج در صفحه
 */
function displayResults(result) {
    document.getElementById('bmi-value').textContent = result.bmi;
    document.getElementById('bmi-category').textContent = result.category;

    if (result.zScore) {
        document.getElementById('zscore-section').style.display = 'block';
        document.getElementById('zscore-value').textContent = result.zScore;
        document.getElementById('healthy-range').textContent = 
            `${result.healthyWeightMin} - ${result.healthyWeightMax} کیلوگرم`;
        
        // نمایش پارامترهای LMS (اختیاری)
        if (result.L && result.M && result.S) {
            const lmsInfo = document.getElementById('lms-info');
            if (lmsInfo) {
                lmsInfo.textContent = `L: ${result.L}, M: ${result.M}, S: ${result.S}`;
                lmsInfo.style.display = 'block';
            }
        }
    } else {
        document.getElementById('zscore-section').style.display = 'none';
    }

    document.getElementById('bmr-value').textContent = result.bmr;
    document.getElementById('tdee-value').textContent = result.tdee;
    document.getElementById('cut-250').textContent = result.cut250;
    document.getElementById('cut-500').textContent = result.cut500;
    document.getElementById('bulk-250').textContent = result.bulk250;
    document.getElementById('bulk-500').textContent = result.bulk500;
}

// =============================================
// Event Listeners
// =============================================

// Event Listener برای دکمه محاسبه
document.addEventListener('DOMContentLoaded', function () {
    const calculateBtn = document.getElementById('calculateBtn');

    if (!calculateBtn) {
        console.error('❌ calculateBtn پیدا نشد');
        return;
    }

    calculateBtn.addEventListener('click', calculateBMI);
    console.log('✅ دکمه محاسبه متصل شد');
    }

    // Event Listener برای دکمه راهنما
    const guideBtn = document.getElementById('guide-btn');
    if (guideBtn) {
        guideBtn.addEventListener('click', () => showPage('guide-page'));
    }

    // Event Listener برای دکمه بازگشت از راهنما
    const backFromGuideBtn = document.getElementById('back-from-guide');
    if (backFromGuideBtn) {
        backFromGuideBtn.addEventListener('click', () => showPage('input-page'));
    }

    // Event Listener برای دکمه محاسبه مجدد
    const recalculateBtn = document.getElementById('recalculate-btn');
    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', () => showPage('input-page'));
    }
});
