/* ========================================
 * BMI، BMR و TDEE Calculator
 * نسخه نهایی - سازگار با WHO Data (ماه‌های 60-228)
 * ======================================== */

// ============ پیکربندی اولیه ============
const TODAY_JALALI = { year: 1404, month: 11, day: 22 };

const motivationalMessages = [
    "سلامتی شما برای ما مهم است 💚",
    "یک قدم به سمت سلامتی 🎯",
    "بدن سالم، زندگی شاد ✨",
    "مراقب خودت باش 🌟"
];

// ============ Helper Functions ============

/**
 * نمایش پیام خطا
 */
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 4000);
}

/**
 * تبدیل تاریخ شمسی به روز (برای محاسبه اختلاف)
 */
function jalaliToDay(year, month, day) {
    const daysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    let totalDays = year * 365 + Math.floor(year / 33) * 8;
    for (let i = 0; i < month - 1; i++) {
        totalDays += daysInMonth[i];
    }
    totalDays += day;
    return totalDays;
}

/**
 * محاسبه سن به ماه اعشاری دقیق (شمسی)
 */
function calcAgeMonths(birthYear, birthMonth, birthDay) {
    const birthDays = jalaliToDay(birthYear, birthMonth, birthDay);
    const todayDays = jalaliToDay(TODAY_JALALI.year, TODAY_JALALI.month, TODAY_JALALI.day);
    
    const diffDays = todayDays - birthDays;
    const ageMonths = diffDays / 30.4375; // میانگین دقیق روزهای ماه
    
    return ageMonths;
}

/**
 * محاسبه سن سالانه (فقط برای نمایش)
 */
function calcAgeYears(birthYear, birthMonth, birthDay) {
    const ageMonths = calcAgeMonths(birthYear, birthMonth, birthDay);
    return Math.floor(ageMonths / 12);
}

/**
 * درون‌یابی خطی پارامترهای LMS
 */
function interpolateLMS(gender, ageMonths) {
    const table = gender === "مرد" ? WHO_BOYS_LMS : WHO_GIRLS_LMS;
    
    // محدود کردن به بازه 60-228 ماه
    if (ageMonths < 60) ageMonths = 60;
    if (ageMonths > 228) ageMonths = 228;
    
    const lowerMonth = Math.floor(ageMonths);
    const upperMonth = Math.ceil(ageMonths);
    
    // اگر دقیقاً روی یک ماه صحیح باشیم
    if (lowerMonth === upperMonth) {
        return table[lowerMonth];
    }
    
    const lowerLMS = table[lowerMonth];
    const upperLMS = table[upperMonth];
    
    // اگر یکی از دو نقطه موجود نباشد، از نزدیک‌ترین استفاده کن
    if (!lowerLMS) return upperLMS;
    if (!upperLMS) return lowerLMS;
    
    // درون‌یابی خطی
    const fraction = ageMonths - lowerMonth;
    return {
        L: lowerLMS.L + (upperLMS.L - lowerLMS.L) * fraction,
        M: lowerLMS.M + (upperLMS.M - lowerLMS.M) * fraction,
        S: lowerLMS.S + (upperLMS.S - lowerLMS.S) * fraction
    };
}

/**
 * محاسبه Z-score
 */
function calcZScore(bmi, L, M, S) {
    if (L !== 0) {
        return (Math.pow(bmi / M, L) - 1) / (L * S);
    } else {
        return Math.log(bmi / M) / S;
    }
}

/**
 * تعیین وضعیت BMI کودک بر اساس Z-score
 */
function getBMIStatusChild(zScore) {
    if (zScore < -2) return { status: "کم‌وزن شدید", color: "#e74c3c" };
    if (zScore < -1) return { status: "کم‌وزن", color: "#f39c12" };
    if (zScore <= 1) return { status: "وزن نرمال", color: "#27ae60" };
    if (zScore <= 2) return { status: "اضافه‌وزن", color: "#f39c12" };
    return { status: "چاقی", color: "#e74c3c" };
}

/**
 * محاسبه BMI و وضعیت برای بزرگسالان
 */
function calcBMIAdult(weight, height) {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    let status, color;
    if (bmi < 18.5) {
        status = "کم‌وزن";
        color = "#f39c12";
    } else if (bmi < 25) {
        status = "وزن نرمال";
        color = "#27ae60";
    } else if (bmi < 30) {
        status = "اضافه‌وزن";
        color = "#f39c12";
    } else {
        status = "چاقی";
        color = "#e74c3c";
    }
    
    return { bmi, status, color };
}

/**
 * محاسبه BMI و وضعیت برای کودکان (5-19 سال)
 */
function calcBMIChild(gender, weight, height, ageMonths) {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    const lms = interpolateLMS(gender, ageMonths);
    const zScore = calcZScore(bmi, lms.L, lms.M, lms.S);
    const statusInfo = getBMIStatusChild(zScore);
    
    return {
        bmi,
        status: statusInfo.status,
        color: statusInfo.color,
        zScore
    };
}

/**
 * محاسبه BMR (متابولیسم پایه) - فرمول Mifflin-St Jeor
 */
function calcBMR(gender, weight, height, ageYears) {
    let bmr;
    if (gender === "مرد") {
        bmr = 10 * weight + 6.25 * height - 5 * ageYears + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * ageYears - 161;
    }
    return Math.round(bmr);
}

/**
 * محاسبه محدوده وزن سالم
 */
function calcHealthyWeightRange(height, ageYears) {
    const heightM = height / 100;
    
    // برای کودکان و نوجوانان
    if (ageYears < 20) {
        return "برای کودکان و نوجوانان نیاز به مشاوره متخصص تغذیه است";
    }
    
    // برای بزرگسالان: BMI 18.5 تا 24.9
    const minWeight = (18.5 * heightM * heightM).toFixed(1);
    const maxWeight = (24.9 * heightM * heightM).toFixed(1);
    
    return `${minWeight} - ${maxWeight} کیلوگرم`;
}

/**
 * محاسبه اختلاف با وزن نرمال
 */
function calcWeightDifference(weight, height, ageYears) {
    if (ageYears < 20) return "";
    
    const heightM = height / 100;
    const currentBMI = weight / (heightM * heightM);
    
    if (currentBMI < 18.5) {
        const targetWeight = 18.5 * heightM * heightM;
        const diff = (targetWeight - weight).toFixed(1);
        return `برای رسیدن به وزن نرمال، ${diff} کیلوگرم افزایش وزن نیاز است`;
    } else if (currentBMI > 24.9) {
        const targetWeight = 24.9 * heightM * heightM;
        const diff = (weight - targetWeight).toFixed(1);
        return `برای رسیدن به وزن نرمال، ${diff} کیلوگرم کاهش وزن نیاز است`;
    } else {
        return "وزن شما در محدوده سالم قرار دارد ✅";
    }
}

/**
 * تولید توصیه‌های کاربردی
 */
function generateTips(bmiStatus, tdee) {
    const tips = [];
    
    if (bmiStatus === "وزن نرمال") {
        tips.push("✅ وزن شما در محدوده سالم است. برای حفظ آن:");
        tips.push("• حدود " + tdee + " کالری در روز مصرف کنید");
        tips.push("• ورزش منظم (حداقل 150 دقیقه در هفته)");
        tips.push("• خواب کافی (7-9 ساعت)");
    } else if (bmiStatus === "اضافه‌وزن" || bmiStatus === "چاقی") {
        tips.push("⚠️ برای کاهش وزن سالم:");
        tips.push("• کسری کالری تدریجی (500 کالری کمتر از TDEE)");
        tips.push("• ورزش ترکیبی (قدرتی + هوازی)");
        tips.push("• پرهیز از غذاهای فرآوری‌شده");
        tips.push("• مشاوره با متخصص تغذیه");
    } else if (bmiStatus === "کم‌وزن" || bmiStatus === "کم‌وزن شدید") {
        tips.push("⚠️ برای افزایش وزن سالم:");
        tips.push("• مازاد کالری تدریجی (300 کالری بیشتر از TDEE)");
        tips.push("• غذاهای پرکالری و مغذی");
        tips.push("• ورزش قدرتی برای عضله‌سازی");
        tips.push("• مشاوره با متخصص تغذیه");
    }
    
    tips.push("");
    tips.push("⚠️ نکته مهم: این محاسبات تخمینی هستند و نباید جایگزین مشاوره پزشکی شوند.");
    
    return tips.join("<br>");
}

// ============ Event Handlers ============

/**
 * تابع اصلی محاسبه
 */
function calculate() {
    // خواندن ورودی‌ها
    const gender = document.getElementById('gender').value;
    const birthYear = parseInt(document.getElementById('birth-year').value);
    const birthMonth = parseInt(document.getElementById('birth-month').value);
    const birthDay = parseInt(document.getElementById('birth-day').value);
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activityLevel = parseFloat(document.getElementById('activity').value);
    
    // اعتبارسنجی
    if (!birthYear || !birthMonth || !birthDay) {
        showError('لطفاً تاریخ تولد کامل را وارد کنید');
        return;
    }
    
    if (!height || height < 50 || height > 250) {
        showError('لطفاً قد معتبر وارد کنید (50-250 سانتی‌متر)');
        return;
    }
    
    if (!weight || weight < 2 || weight > 300) {
        showError('لطفاً وزن معتبر وارد کنید (2-300 کیلوگرم)');
        return;
    }
    
    // محاسبه سن
    const ageMonths = calcAgeMonths(birthYear, birthMonth, birthDay);
    const ageYears = Math.floor(ageMonths / 12);
    
    if (ageYears < 5) {
        showError('این ابزار برای افراد 5 سال به بالا طراحی شده است');
        return;
    }
    
    // محاسبه BMI
    let bmiResult;
    if (ageYears < 20) {
        bmiResult = calcBMIChild(gender, weight, height, ageMonths);
    } else {
        bmiResult = calcBMIAdult(weight, height);
    }
    
    // محاسبه BMR و TDEE
    const bmr = calcBMR(gender, weight, height, ageYears);
    const tdee = Math.round(bmr * activityLevel);
    
    // نمایش نتایج در صفحه جدید
    document.getElementById('r-gender').textContent = gender;
    document.getElementById('r-age').textContent = `${ageYears} سال`;
    document.getElementById('r-height').textContent = `${height} سانتی‌متر`;
    document.getElementById('r-weight').textContent = `${weight} کیلوگرم`;
    
    // BMI
    const bmiCircle = document.getElementById('bmi-circle');
    document.getElementById('bmi-value').textContent = bmiResult.bmi.toFixed(1);
    document.getElementById('bmi-status-text').textContent = bmiResult.status;
    bmiCircle.style.borderColor = bmiResult.color;
    
    // اختلاف وزن
    const diffText = calcWeightDifference(weight, height, ageYears);
    document.getElementById('bmi-difference-text').textContent = diffText;
    
    // محدوده وزن سالم
    document.getElementById('r-healthy').textContent = calcHealthyWeightRange(height, ageYears);
    
    // BMR و TDEE
    document.getElementById('r-bmr').textContent = `${bmr} کالری`;
    document.getElementById('r-tdee').textContent = `${tdee} کالری`;
    
    // توصیه‌های کالری
    document.getElementById('maintain-calories').textContent = `${tdee} کالری`;
    document.getElementById('gain-calories').textContent = `${tdee + 300} کالری`;
    document.getElementById('loss-calories').textContent = `${Math.max(1200, tdee - 500)} کالری`;
    
    // توصیه‌های کاربردی
    document.getElementById('practical-tips').innerHTML = generateTips(bmiResult.status, tdee);
    
    // نمایش صفحه نتایج
    showPage('results-page');
}

/**
 * نمایش صفحه مشخص
 */
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// ============ Event Listeners ============

document.addEventListener('DOMContentLoaded', function() {
    // نمایش پیام انگیزشی تصادفی
    const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    document.getElementById('motivation-text').textContent = randomMsg;
    
    // دکمه محاسبه
    document.getElementById('calc-btn').addEventListener('click', calculate);
    
    // دکمه بازگشت از نتایج
    document.getElementById('back-btn').addEventListener('click', function() {
        showPage('input-page');
    });
    
    // دکمه‌های راهنما
    document.getElementById('help-btn').addEventListener('click', function() {
        showPage('guide-page');
    });
    
    document.getElementById('help-btn2').addEventListener('click', function() {
        showPage('guide-page');
    });
    
    // دکمه بازگشت از راهنما
    document.getElementById('back-guide-btn').addEventListener('click', function() {
        // اگر از صفحه نتایج آمده‌ایم، برگردیم به نتایج
        const resultsPage = document.getElementById('results-page');
        if (resultsPage.classList.contains('active') || 
            document.getElementById('bmi-value').textContent !== '--') {
            showPage('results-page');
        } else {
            showPage('input-page');
        }
    });
    
    // اجازه محاسبه با Enter
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculate();
            }
        });
    });
});
