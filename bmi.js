// ===== داده‌های جهانی =====
let userData = {};

// ===== تاریخ جاری شمسی =====
const currentJalaliDate = {
    year: 1404,
    month: 11,
    day: 22
};

// ===== پیام‌های انگیزشی =====
const motivationMessages = [
    "سلامتی سرمایه‌ای است که هر روز باید به آن سرمایه‌گذاری کنید 🌱",
    "بهترین سرمایه‌گذاری، سرمایه‌گذاری روی سلامتی خودتان است 💪",
    "هر قدم کوچک به سمت سلامتی، یک پیروزی بزرگ است ✨",
    "بدن شما خانه‌ای است که تا آخر عمر در آن زندگی خواهید کرد 🏡",
    "سلامتی یک انتخاب روزانه است، نه یک هدف موقت 🎯"
];

// ===== نمایش پیام انگیزشی تصادفی =====
document.addEventListener('DOMContentLoaded', () => {
    const randomMsg = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
    document.getElementById('motivation-text').textContent = randomMsg;
});

// ===== نمایش/مخفی‌سازی صفحات =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// ===== تبدیل تاریخ شمسی به میلادی (تقریبی) =====
function jalaliToGregorian(jy, jm, jd) {
    const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    
    let gy = jy <= 1342 ? 1900 : 2000;
    let days = 365 * (jy - 1342) + Math.floor((jy - 1342) / 33) * 8 + 
               Math.floor(((jy - 1342) % 33 + 3) / 4) + 78 + jd;
    
    for (let i = 0; i < jm - 1; i++) {
        days += j_days_in_month[i];
    }
    
    gy += Math.floor(days / 365);
    days %= 365;
    
    let gm = 0;
    while (gm < 12 && days > g_days_in_month[gm]) {
        days -= g_days_in_month[gm];
        gm++;
    }
    
    return { year: gy, month: gm + 1, day: days };
}

// ===== محاسبه سن دقیق بر اساس سال، ماه و روز =====
function calculatePreciseAge(birthYear, birthMonth, birthDay) {
    const current = currentJalaliDate;
    
    let years = current.year - birthYear;
    let months = current.month - birthMonth;
    let days = current.day - birthDay;
    
    if (days < 0) {
        months--;
        const prevMonth = current.month - 1 || 12;
        const daysInPrevMonth = prevMonth <= 6 ? 31 : (prevMonth <= 11 ? 30 : 29);
        days += daysInPrevMonth;
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    return { years, months, days };
}

// ===== تابع برگرداندن رشته سن فارسی =====
function formatAge(ageObj) {
    let parts = [];
    if (ageObj.years > 0) parts.push(`${ageObj.years} سال`);
    if (ageObj.months > 0) parts.push(`${ageObj.months} ماه`);
    if (ageObj.days > 0) parts.push(`${ageObj.days} روز`);
    return parts.join(' و ') || '0 روز';
}

// ===== محاسبه سن به ماه (برای LMS) =====
function calculateAgeInMonths(birthYear, birthMonth, birthDay) {
    const current = currentJalaliDate;
    const ageObj = calculatePreciseAge(birthYear, birthMonth, birthDay);
    return ageObj.years * 12 + ageObj.months + (ageObj.days / 30);
}

// ===== محاسبه Z-Score با استفاده از LMS =====
function calculateZScore(ageMonths, bmi, gender) {
    if (ageMonths < 61 || ageMonths > 228) return null;
    
    const data = gender === 'مرد' ? whoDataBoys : whoDataGirls;
    const closest = data.reduce((prev, curr) => 
        Math.abs(curr.Month - ageMonths) < Math.abs(prev.Month - ageMonths) ? curr : prev
    );
    
    const L = closest.L;
    const M = closest.M;
    const S = closest.S;
    
    const zScore = (Math.pow(bmi / M, L) - 1) / (L * S);
    return zScore;
}

// ===== تعیین وضعیت BMI کودکان بر اساس Z-Score =====
function getChildBMIStatus(zScore) {
    if (zScore < -2) return { status: 'لاغری شدید', color: '#e74c3c', emoji: '⚠️' };
    if (zScore < -1) return { status: 'لاغری', color: '#f39c12', emoji: '⚠️' };
    if (zScore <= 1) return { status: 'نرمال', color: '#27ae60', emoji: '✅' };
    if (zScore <= 2) return { status: 'اضافه وزن', color: '#f39c12', emoji: '⚠️' };
    return { status: 'چاقی', color: '#e74c3c', emoji: '⚠️' };
}

// ===== تعیین وضعیت BMI بزرگسالان =====
function getAdultBMIStatus(bmi) {
    if (bmi < 18.5) return { status: 'کم‌وزن', color: '#f39c12', emoji: '⚠️' };
    if (bmi < 25) return { status: 'نرمال', color: '#27ae60', emoji: '✅' };
    if (bmi < 30) return { status: 'اضافه وزن', color: '#f39c12', emoji: '⚠️' };
    return { status: 'چاقی', color: '#e74c3c', emoji: '⚠️' };
}

// ===== محاسبه محدوده وزن سالم برای کودکان =====
function getHealthyWeightRangeChild(heightCm, ageMonths, gender) {
    const data = gender === 'مرد' ? whoDataBoys : whoDataGirls;
    const closest = data.reduce((prev, curr) => 
        Math.abs(curr.Month - ageMonths) < Math.abs(prev.Month - ageMonths) ? curr : prev
    );
    
    const heightM = heightCm / 100;
    const M = closest.M;
    const S = closest.S;
    const L = closest.L;
    
    const minBMI = M * Math.pow(1 + L * S * (-1), 1/L);
    const maxBMI = M * Math.pow(1 + L * S * (1), 1/L);
    
    const minWeight = minBMI * heightM * heightM;
    const maxWeight = maxBMI * heightM * heightM;
    
    return { min: minWeight.toFixed(1), max: maxWeight.toFixed(1) };
}

// ===== محاسبه محدوده وزن سالم برای بزرگسالان =====
function getHealthyWeightRangeAdult(heightCm) {
    const heightM = heightCm / 100;
    const minWeight = 18.5 * heightM * heightM;
    const maxWeight = 24.9 * heightM * heightM;
    return { min: minWeight.toFixed(1), max: maxWeight.toFixed(1) };
}

// ===== محاسبه اختلاف وزن =====
function calculateWeightDifference(currentWeight, healthyRange, isUnderweight) {
    if (isUnderweight) {
        const diff = parseFloat(healthyRange.min) - currentWeight;
        return diff > 0 ? `${diff.toFixed(1)} کیلوگرم کمبود وزن` : null;
    } else {
        const diff = currentWeight - parseFloat(healthyRange.max);
        return diff > 0 ? `${diff.toFixed(1)} کیلوگرم اضافه وزن` : null;
    }
}

// ===== محاسبه BMR (فرمول میفلین-سنت‌جئور) =====
function calculateBMR(weight, height, ageYears, gender) {
    if (gender === 'مرد') {
        return 10 * weight + 6.25 * height - 5 * ageYears + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * ageYears - 161;
    }
}

// ===== اعتبارسنجی ورودی‌ها =====
function validateInputs() {
    const gender = document.getElementById('gender').value;
    const birthYear = parseInt(document.getElementById('birth-year').value);
    const birthMonth = parseInt(document.getElementById('birth-month').value);
    const birthDay = parseInt(document.getElementById('birth-day').value);
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activity = parseFloat(document.getElementById('activity').value);
    
    const errorDiv = document.getElementById('error-message');
    
    // بررسی خالی بودن فیلدها
    if (!birthYear || !birthMonth || !birthDay) {
        errorDiv.textContent = '⚠️ لطفاً تاریخ تولد را به طور کامل وارد کنید';
        return false;
    }
    
    if (!height || !weight) {
        errorDiv.textContent = '⚠️ لطفاً قد و وزن را وارد کنید';
        return false;
    }
    
    // بررسی تاریخ تولد نسبت به تاریخ جاری
    if (birthYear > currentJalaliDate.year) {
        errorDiv.textContent = `⚠️ سال تولد نمی‌تواند بیشتر از سال جاری (${currentJalaliDate.year}) باشد`;
        return false;
    }
    
    if (birthYear === currentJalaliDate.year && birthMonth > currentJalaliDate.month) {
        errorDiv.textContent = `⚠️ ماه تولد نمی‌تواند در آینده باشد`;
        return false;
    }
    
    if (birthYear === currentJalaliDate.year && birthMonth === currentJalaliDate.month && birthDay > currentJalaliDate.day) {
        errorDiv.textContent = `⚠️ روز تولد نمی‌تواند در آینده باشد`;
        return false;
    }
    
    // محاسبه سن
    const ageObj = calculatePreciseAge(birthYear, birthMonth, birthDay);
    
    if (ageObj.years < 0 || (ageObj.years === 0 && ageObj.months === 0 && ageObj.days === 0)) {
        errorDiv.textContent = '⚠️ تاریخ تولد نامعتبر است';
        return false;
    }
    
    // بررسی محدوده قد و وزن
    if (height < 50 || height > 250) {
        errorDiv.textContent = '⚠️ قد باید بین 50 تا 250 سانتی‌متر باشد';
        return false;
    }
    
    if (weight < 2 || weight > 300) {
        errorDiv.textContent = '⚠️ وزن باید بین 2 تا 300 کیلوگرم باشد';
        return false;
    }
    
    errorDiv.textContent = '';
    
    userData = {
        gender,
        birthYear,
        birthMonth,
        birthDay,
        ageObj,
        ageYears: ageObj.years,
        ageMonths: calculateAgeInMonths(birthYear, birthMonth, birthDay),
        height,
        weight,
        activity
    };
    
    return true;
}

// ===== محاسبه و نمایش نتایج =====
function calculateResults() {
    if (!validateInputs()) return;
    
    const { gender, ageObj, ageYears, ageMonths, height, weight, activity } = userData;
    const isChild = ageYears < 19;
    
    // محاسبه BMI
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    // تعیین وضعیت
    let status, zScore = null, healthyRange, weightDiff = null;
    
    if (isChild && ageMonths >= 61) {
        zScore = calculateZScore(ageMonths, bmi, gender);
        status = getChildBMIStatus(zScore);
        healthyRange = getHealthyWeightRangeChild(height, ageMonths, gender);
        
        // محاسبه اختلاف وزن
        if (zScore < -1) {
            weightDiff = calculateWeightDifference(weight, healthyRange, true);
        } else if (zScore > 1) {
            weightDiff = calculateWeightDifference(weight, healthyRange, false);
        }
    } else {
        status = getAdultBMIStatus(bmi);
        healthyRange = getHealthyWeightRangeAdult(height);
        
        // محاسبه اختلاف وزن
        if (bmi < 18.5) {
            weightDiff = calculateWeightDifference(weight, healthyRange, true);
        } else if (bmi >= 25) {
            weightDiff = calculateWeightDifference(weight, healthyRange, false);
        }
    }
    
    // محاسبه BMR و TDEE
    const bmr = calculateBMR(weight, height, ageYears, gender);
    const tdee = bmr * activity;
    
    // نمایش اطلاعات کلی
    document.getElementById('r-gender').textContent = gender;
    document.getElementById('r-age').textContent = formatAge(ageObj);
    document.getElementById('r-height').textContent = `${height} سانتی‌متر`;
    document.getElementById('r-weight').textContent = `${weight} کیلوگرم`;
    
    // نمایش BMI
    const bmiCircle = document.getElementById('bmi-circle');
    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    bmiCircle.style.borderColor = status.color;
    
    // نمایش وضعیت و اختلاف وزن
    document.getElementById('bmi-status-text').innerHTML = `${status.emoji} ${status.status}`;
    document.getElementById('bmi-status-text').style.color = status.color;
    
    const diffElement = document.getElementById('bmi-difference-text');
    if (weightDiff) {
        diffElement.textContent = weightDiff;
        diffElement.style.display = 'block';
    } else {
        diffElement.style.display = 'none';
    }
    
    // نمایش محدوده وزن سالم
    document.getElementById('r-healthy').textContent = `${healthyRange.min} - ${healthyRange.max} کیلوگرم`;
    
    // نمایش BMR و TDEE
    document.getElementById('r-bmr').textContent = `${Math.round(bmr)} کالری`;
    document.getElementById('r-tdee').textContent = `${Math.round(tdee)} کالری`;
    
    // توصیه‌های کالری
    document.getElementById('maintain-calories').textContent = `${Math.round(tdee)} کالری`;
    document.getElementById('gain-calories').textContent = `${Math.round(tdee + 300)} کالری`;
    document.getElementById('loss-calories').textContent = `${Math.round(tdee - 500)} کالری`;
    
    // توصیه‌های تغذیه‌ای
    let recommendations = generateRecommendations(status.status, isChild);
    document.getElementById('r-recommend').textContent = recommendations;
    
    showPage('results-page');
}

// ===== تولید توصیه‌های تغذیه‌ای =====
function generateRecommendations(status, isChild) {
    const base = isChild 
        ? "⚠️ توجه: این محاسبات برای کودکان و نوجوانان تخمینی است. لطفاً با متخصص تغذیه کودکان مشورت کنید.\n\n"
        : "";
    
    const recommendations = {
        'لاغری شدید': "• مصرف غذاهای پرکالری و مغذی\n• وعده‌های غذایی منظم و کامل\n• مشاوره با متخصص تغذیه ضروری است",
        'لاغری': "• افزایش مصرف پروتئین و کربوهیدرات سالم\n• میان‌وعده‌های مقوی\n• ورزش قدرتی برای افزایش عضله",
        'کم‌وزن': "• افزایش مصرف پروتئین و کربوهیدرات سالم\n• میان‌وعده‌های مقوی\n• ورزش قدرتی برای افزایش عضله",
        'نرمال': "• حفظ تعادل در مصرف مواد غذایی\n• ورزش منظم 3-5 بار در هفته\n• مصرف آب کافی (8-10 لیوان)",
        'اضافه وزن': "• کاهش تدریجی کالری\n• افزایش فعالیت بدنی\n• کاهش مصرف قند و چربی‌های اشباع",
        'چاقی': "• رژیم غذایی تحت نظر متخصص\n• فعالیت بدنی روزانه\n• کاهش مصرف غذاهای فرآوری‌شده"
    };
    
    return base + (recommendations[status] || recommendations['نرمال']);
}

// ===== Event Listeners =====
document.getElementById('calc-btn').addEventListener('click', calculateResults);
document.getElementById('back-btn').addEventListener('click', () => showPage('input-page'));
document.getElementById('help-btn').addEventListener('click', () => showPage('guide-page'));
document.getElementById('help-btn2').addEventListener('click', () => showPage('guide-page'));
document.getElementById('back-guide-btn').addEventListener('click', () => showPage('input-page'));

// کلید Enter برای محاسبه
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.getElementById('input-page').classList.contains('active')) {
        calculateResults();
    }
});
