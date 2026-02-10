// ========================================
// بخش 1: تابع محاسبه سن دقیق
// ========================================

/**
 * محاسبه سن دقیق بر اساس تاریخ تولد و تاریخ فعلی
 * @returns {Object} شامل: years, months, days, totalMonths, isChild
 */
function calculatePreciseAge(birthYear, birthMonth, birthDay) {
    // تاریخ فعلی ثابت: 1404/11/22
    const currentYear = 1404;
    const currentMonth = 11;
    const currentDay = 22;

    let years = currentYear - birthYear;
    let months = currentMonth - birthMonth;
    let days = currentDay - birthDay;

    // تنظیم روزها
    if (days < 0) {
        months--;
        // تعداد روزهای ماه قبل (ساده‌سازی شده)
        const daysInPrevMonth = 30;
        days += daysInPrevMonth;
    }

    // تنظیم ماه‌ها
    if (months < 0) {
        years--;
        months += 12;
    }

    const totalMonths = years * 12 + months;
    const isChild = totalMonths >= 60 && totalMonths <= 228; // 5 تا 19 سال

    return { years, months, days, totalMonths, isChild };
}

// ========================================
// بخش 2: محاسبه BMI کودکان (با WHO)
// ========================================

/**
 * محاسبه BMI برای کودکان 5-19 سال با استفاده از LMS WHO
 */
function calculateChildBMI(bmi, ageInMonths, gender) {
    const lms = getLMS(ageInMonths, gender);
    
    if (!lms) {
        return {
            category: 'خطا در دریافت داده‌های WHO',
            color: '#999',
            percentile: null,
            zscore: null
        };
    }

    const { L, M, S } = lms;

    // محاسبه Z-score با فرمول WHO
    const zscore = (Math.pow(bmi / M, L) - 1) / (L * S);

    // تبدیل Z-score به Percentile (تقریب)
    const percentile = zScoreToPercentile(zscore);

    // تعیین وضعیت بر اساس Percentile
    let category, color;
    if (percentile < 5) {
        category = 'کمبود وزن شدید';
        color = '#e74c3c';
    } else if (percentile < 15) {
        category = 'کمبود وزن';
        color = '#f39c12';
    } else if (percentile < 85) {
        category = 'وزن نرمال';
        color = '#27ae60';
    } else if (percentile < 95) {
        category = 'اضافه وزن';
        color = '#f39c12';
    } else {
        category = 'چاقی';
        color = '#e74c3c';
    }

    return {
        category,
        color,
        percentile: percentile.toFixed(1),
        zscore: zscore.toFixed(2),
        isChild: true
    };
}

/**
 * تبدیل Z-score به Percentile (تقریب آماری)
 */
function zScoreToPercentile(z) {
    // تقریب با استفاده از تابع توزیع نرمال استاندارد
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    let percentile;
    if (z >= 0) {
        percentile = (1 - probability) * 100;
    } else {
        percentile = probability * 100;
    }
    
    return Math.max(0.1, Math.min(99.9, percentile));
}

// ========================================
// بخش 3: محاسبه BMI بزرگسالان
// ========================================

/**
 * محاسبه BMI برای بزرگسالان (بالای 19 سال)
 */
function calculateAdultBMI(bmi) {
    let category, color;

    if (bmi < 18.5) {
        category = 'کمبود وزن';
        color = '#f39c12';
    } else if (bmi < 25) {
        category = 'وزن نرمال';
        color = '#27ae60';
    } else if (bmi < 30) {
        category = 'اضافه وزن';
        color = '#f39c12';
    } else {
        category = 'چاقی';
        color = '#e74c3c';
    }

    return { category, color, isChild: false };
}

// ========================================
// بخش 4: محاسبه اختلاف وزن از محدوده سالم
// ========================================

/**
 * محاسبه میزان اضافه‌وزن یا کمبود وزن نسبت به محدوده سالم
 */
function calculateWeightDifference(currentWeight, height, ageInMonths, gender, isChild) {
    const heightInMeters = height / 100;
    
    let minHealthyWeight, maxHealthyWeight;

    if (isChild) {
        // برای کودکان: استفاده از P5 و P95
        const lms = getLMS(ageInMonths, gender);
        if (!lms) return '';

        const { L, M, S } = lms;

        // محاسبه BMI برای P5 (Z = -1.645)
        const bmiP5 = M * Math.pow(1 + L * S * (-1.645), 1 / L);
        // محاسبه BMI برای P95 (Z = 1.645)
        const bmiP95 = M * Math.pow(1 + L * S * 1.645, 1 / L);

        minHealthyWeight = bmiP5 * heightInMeters * heightInMeters;
        maxHealthyWeight = bmiP95 * heightInMeters * heightInMeters;

    } else {
        // برای بزرگسالان: BMI بین 18.5 تا 24.9
        minHealthyWeight = 18.5 * heightInMeters * heightInMeters;
        maxHealthyWeight = 24.9 * heightInMeters * heightInMeters;
    }

    // محاسبه اختلاف
    if (currentWeight < minHealthyWeight) {
        const diff = minHealthyWeight - currentWeight;
        return `${diff.toFixed(1)} کیلوگرم کمبود وزن`;
    } else if (currentWeight > maxHealthyWeight) {
        const diff = currentWeight - maxHealthyWeight;
        return `${diff.toFixed(1)} کیلوگرم اضافه وزن`;
    } else {
        return 'در محدوده سالم';
    }
}

// ========================================
// بخش 5: محاسبه BMR (متابولیسم پایه)
// ========================================

/**
 * محاسبه BMR با فرمول Mifflin-St Jeor
 */
function calculateBMR(weight, height, age, gender) {
    let bmr;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    return Math.round(bmr);
}

// ========================================
// بخش 6: محاسبه محدوده وزن سالم
// ========================================

/**
 * محاسبه محدوده وزن سالم بر اساس سن و جنسیت
 */
function calculateHealthyWeightRange(height, ageInMonths, gender, isChild) {
    const heightInMeters = height / 100;

    if (isChild) {
        const lms = getLMS(ageInMonths, gender);
        if (!lms) return 'خطا در محاسبه';

        const { L, M, S } = lms;

        // P5 (Z = -1.645)
        const bmiP5 = M * Math.pow(1 + L * S * (-1.645), 1 / L);
        // P95 (Z = 1.645)
        const bmiP95 = M * Math.pow(1 + L * S * 1.645, 1 / L);

        const minWeight = (bmiP5 * heightInMeters * heightInMeters).toFixed(1);
        const maxWeight = (bmiP95 * heightInMeters * heightInMeters).toFixed(1);

        return `${minWeight} - ${maxWeight} کیلوگرم`;

    } else {
        // بزرگسالان: BMI 18.5 - 24.9
        const minWeight = (18.5 * heightInMeters * heightInMeters).toFixed(1);
        const maxWeight = (24.9 * heightInMeters * heightInMeters).toFixed(1);

        return `${minWeight} - ${maxWeight} کیلوگرم`;
    }
}

// ========================================
// بخش 7: مدیریت فرم و نمایش نتایج
// ========================================

document.getElementById('healthForm').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateAndGo();
});

function calculateAndGo() {
    // دریافت داده‌ها از فرم
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const birthYear = parseInt(document.getElementById('birthYear').value);
    const birthMonth = parseInt(document.getElementById('birthMonth').value);
    const birthDay = parseInt(document.getElementById('birthDay').value);
    const activityLevel = parseFloat(document.getElementById('activity').value);

    // محاسبه سن دقیق
    const ageData = calculatePreciseAge(birthYear, birthMonth, birthDay);
    const { years, months, days, totalMonths, isChild } = ageData;

    // محاسبه BMI
    const bmi = weight / Math.pow(height / 100, 2);

    // تعیین وضعیت BMI
    let bmiResult;
    if (isChild) {
        bmiResult = calculateChildBMI(bmi, totalMonths, gender);
    } else {
        bmiResult = calculateAdultBMI(bmi);
    }

    // محاسبه اختلاف وزن
    const weightDiff = calculateWeightDifference(weight, height, totalMonths, gender, isChild);

    // محاسبه BMR
    const ageInYears = years + (months / 12);
    const bmr = calculateBMR(weight, height, ageInYears, gender);

    // محاسبه TDEE
    const tdee = Math.round(bmr * activityLevel);

    // محاسبه کالری‌ها
    const maintenanceCalories = tdee;
    const bulkCalories = Math.round(tdee + 300);
    const cutCalories = Math.round(tdee - 400);

    // محاسبه محدوده وزن سالم
    const healthyRange = calculateHealthyWeightRange(height, totalMonths, gender, isChild);

    // نمایش نتایج
    document.getElementById('bmiValue').textContent = bmi.toFixed(1);
    document.getElementById('bmiValue').style.color = bmiResult.color;

    // نمایش وضعیت BMI
    let statusText = bmiResult.category;
    if (bmiResult.isChild && bmiResult.percentile) {
        statusText += ` (صدک ${bmiResult.percentile})`;
    }
    document.getElementById('bmiStatus').textContent = statusText;
    document.getElementById('bmiStatus').style.color = bmiResult.color;

    // نمایش اختلاف وزن
    document.getElementById('weightDifference').textContent = weightDiff;

    document.getElementById('healthyWeight').textContent = healthyRange;
    document.getElementById('bmrValue').textContent = `${bmr} کالری`;
    document.getElementById('tdeeValue').textContent = `${tdee} کالری`;
    document.getElementById('maintenanceCalories').textContent = `${maintenanceCalories} کالری`;
    document.getElementById('bulkCalories').textContent = `${bulkCalories} کالری`;
    document.getElementById('cutCalories').textContent = `${cutCalories} کالری`;

    // نمایش بخش نتایج
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}
