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
 * محاسبه BMI
 */
function calculateBMI(weight, height) {
    const heightM = height / 100;
    return weight / (heightM * heightM);
}

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
 * اعتبارسنجی ورودی‌ها
 */
function validateInputs() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const birthYear = parseInt(document.getElementById('birth-year').value);
    const birthMonth = parseInt(document.getElementById('birth-month').value);
    const birthDay = parseInt(document.getElementById('birth-day').value);

    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = '';

    if (!birthYear || !birthMonth || !birthDay) {
        errorDiv.textContent = 'لطفاً تاریخ تولد را کامل وارد کنید';
        return false;
    }

    if (isNaN(height) || height < 50 || height > 250) {
        errorDiv.textContent = 'لطفاً قد را به درستی وارد کنید (50-250 سانتی‌متر)';
        return false;
    }

    if (isNaN(weight) || weight < 2 || weight > 300) {
        errorDiv.textContent = 'لطفاً وزن را به درستی وارد کنید (2-300 کیلوگرم)';
        return false;
    }

    return true;
}

/**
 * محاسبه تفاوت وزن
 */
function calculateWeightDifference(currentWeight, minWeight, maxWeight) {
    if (currentWeight < minWeight) {
        const diff = (minWeight - currentWeight).toFixed(1);
        return `شما ${diff} کیلوگرم کمتر از حد نرمال وزن دارید`;
    } else if (currentWeight > maxWeight) {
        const diff = (currentWeight - maxWeight).toFixed(1);
        return `شما ${diff} کیلوگرم بیشتر از حد نرمال وزن دارید`;
    }
    return 'وزن شما در محدوده سالم قرار دارد';
}

/**
 * رنگ‌آمیزی دایره BMI
 */
function setBMIColor(category) {
    const circle = document.getElementById('bmi-circle');
    circle.classList.remove('underweight', 'normal', 'overweight', 'obese');
    
    if (category.includes('کمبود') || category.includes('لاغری')) {
        circle.classList.add('underweight');
    } else if (category === 'نرمال') {
        circle.classList.add('normal');
    } else if (category.includes('اضافه وزن')) {
        circle.classList.add('overweight');
    } else {
        circle.classList.add('obese');
    }
}

/**
 * تولید توصیه‌های کاربردی
 */
function generatePracticalTips(category, tdee, weight, healthyRange) {
    const tips = [];
    
    if (category.includes('اضافه وزن') || category.includes('چاقی')) {
        tips.push('💧 نوشیدن حداقل 8 لیوان آب در روز');
        tips.push('🥗 شروع وعده‌های غذایی با سالاد');
        tips.push('🚶 پیاده‌روی حداقل 30 دقیقه در روز');
        tips.push(`📉 هدف کاهش وزن: ${((tdee - 500) / 1000).toFixed(1)} هزار کالری در روز`);
    } else if (category.includes('کمبود') || category.includes('لاغری')) {
        tips.push('🥜 افزودن آجیل و خشکبار به رژیم غذایی');
        tips.push('🏋️ ورزش‌های قدرتی برای افزایش عضله');
        tips.push('🍽️ خوردن 5-6 وعده کوچک در روز');
        tips.push(`📈 هدف افزایش وزن: ${((tdee + 300) / 1000).toFixed(1)} هزار کالری در روز`);
    } else {
        tips.push('✅ وزن شما در محدوده سالم است');
        tips.push('💪 ادامه فعالیت بدنی منظم');
        tips.push('🥗 حفظ رژیم غذایی متعادل');
        tips.push(`⚖️ حفظ وزن: ${(tdee / 1000).toFixed(1)} هزار کالری در روز`);
    }
    
    return tips;
}

/**
 * تابع اصلی محاسبه
 */
function performCalculation() {
    if (!validateInputs()) {
        return;
    }

    // دریافت ورودی‌ها
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const gender = document.getElementById('gender').value;
    const activityLevel = parseFloat(document.getElementById('activity').value);

    // تاریخ تولد
    const birthYear = parseInt(document.getElementById('birth-year').value);
    const birthMonth = parseInt(document.getElementById('birth-month').value);
    const birthDay = parseInt(document.getElementById('birth-day').value);

    // تاریخ امروز (جلالی - باید از API یا تابع تبدیل استفاده شود)
    // فرض: تاریخ امروز 1404/11/22
    const todayYear = 1404;
    const todayMonth = 11;
    const todayDay = 22;

    // محاسبه سن به ماه (اعشاری)
    const ageMonths = calculateAgeInMonths(
        birthYear, birthMonth, birthDay,
        todayYear, todayMonth, todayDay
    );
    const ageYears = ageMonths / 12;

    // محاسبه BMI
    const bmi = calculateBMI(weight, height);

    let category = "نرمال";
    let healthyRange = null;
    let weightDifference = "";
    let zScore = null;
    let lmsValues = null;

    // اگر کودک/نوجوان (5-19 سال) - استفاده از LMS و Z-Score
    if (ageMonths >= 60 && ageMonths <= 228) {
        // دریافت پارامترهای LMS با درون‌یابی
        lmsValues = getLMSValues(ageMonths, gender);
        
        // محاسبه Z-Score
        zScore = calculateZScore(bmi, lmsValues.L, lmsValues.M, lmsValues.S);
        
        // طبقه‌بندی بر اساس Z-Score
        category = classifyZScore(zScore);
        
        // محاسبه بازه وزن سالم (Z = -2 تا +1)
        healthyRange = calculateHealthyWeightRange(height, ageMonths, gender);
        
        // محاسبه تفاوت وزن
        weightDifference = calculateWeightDifference(weight, healthyRange.min, healthyRange.max);
        
        console.log('=== محاسبات کودک/نوجوان ===');
        console.log('سن (ماه اعشاری):', ageMonths.toFixed(2));
        console.log('LMS Values:', lmsValues);
        console.log('Z-Score:', zScore.toFixed(2));
        console.log('دسته‌بندی:', category);
        console.log('بازه وزن سالم:', healthyRange);
    } else {
        // بزرگسال - استفاده از BMI استاندارد
        if (bmi < 18.5) category = "کمبود وزن";
        else if (bmi < 25) category = "نرمال";
        else if (bmi < 30) category = "اضافه وزن";
        else if (bmi < 35) category = "چاقی درجه ۱";
        else if (bmi < 40) category = "چاقی درجه ۲";
        else category = "چاقی درجه ۳";

        // محاسبه بازه وزن سالم (BMI 18.5-24.9)
        const heightM = height / 100;
        healthyRange = {
            min: 18.5 * heightM * heightM,
            max: 24.9 * heightM * heightM
        };
        
        weightDifference = calculateWeightDifference(weight, healthyRange.min, healthyRange.max);
        
        console.log('=== محاسبات بزرگسال ===');
        console.log('سن (سال):', ageYears.toFixed(1));
        console.log('BMI:', bmi.toFixed(1));
        console.log('دسته‌بندی:', category);
    }

    // محاسبه BMR و TDEE
    const bmr = calculateBMR(weight, height, ageYears, gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    console.log('BMR:', bmr.toFixed(0));
    console.log('TDEE:', tdee.toFixed(0));

    // نمایش نتایج در صفحه
    document.getElementById('r-gender').textContent = gender;
    document.getElementById('r-age').textContent = `${ageYears.toFixed(1)} سال`;
    document.getElementById('r-height').textContent = `${height} سانتی‌متر`;
    document.getElementById('r-weight').textContent = `${weight} کیلوگرم`;

    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    document.getElementById('bmi-status-text').textContent = category;
    document.getElementById('bmi-difference-text').textContent = weightDifference;
    setBMIColor(category);

    document.getElementById('r-healthy').textContent = 
        `${healthyRange.min.toFixed(1)} - ${healthyRange.max.toFixed(1)} کیلوگرم`;

    document.getElementById('r-bmr').textContent = `${bmr.toFixed(0)} کالری`;
    document.getElementById('r-tdee').textContent = `${tdee.toFixed(0)} کالری`;

    document.getElementById('maintain-calories').textContent = `${tdee.toFixed(0)} کالری`;
    document.getElementById('gain-calories').textContent = `${(tdee + 300).toFixed(0)} کالری`;
    document.getElementById('loss-calories').textContent = `${(tdee - 500).toFixed(0)} کالری`;

    // توصیه‌های کاربردی
    const tips = generatePracticalTips(category, tdee, weight, healthyRange);
    const tipsContainer = document.getElementById('practical-tips');
    tipsContainer.innerHTML = tips.map(tip => `<div class="tip-item">${tip}</div>`).join('');

    // تغییر صفحه به نتایج
    showPage('results-page');
}

/**
 * تغییر صفحه
 */
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

/**
 * Event Listeners - با IDهای صحیح از HTML
 */
document.addEventListener('DOMContentLoaded', function() {
    // دکمه محاسبه (ID صحیح: calc-btn)
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', performCalculation);
    } else {
        console.error('دکمه محاسبه یافت نشد! ID: calc-btn');
    }

    // دکمه بازگشت از نتایج
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => showPage('input-page'));
    }

    // دکمه راهنما (صفحه اول)
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => showPage('guide-page'));
    }

    // دکمه راهنما (صفحه نتایج)
    const helpBtn2 = document.getElementById('help-btn2');
    if (helpBtn2) {
        helpBtn2.addEventListener('click', () => showPage('guide-page'));
    }

    // دکمه بازگشت از راهنما
    const backGuideBtn = document.getElementById('back-guide-btn');
    if (backGuideBtn) {
        backGuideBtn.addEventListener('click', () => {
            // اگر قبلاً محاسبه انجام شده، به صفحه نتایج برگرد
            const bmiValue = document.getElementById('bmi-value').textContent;
            if (bmiValue !== '--') {
                showPage('results-page');
            } else {
                showPage('input-page');
            }
        });
    }

    // متن انگیزشی تصادفی
    const motivations = [
        'سلامتی سرمایه‌ای است که باید از آن مراقبت کنیم 💪',
        'هر قدمی که برای سلامتی برمی‌داریم، ارزشمند است 🌟',
        'بدن سالم، ذهن سالم ✨',
        'آگاهی اولین قدم برای تغییر است 🎯'
    ];
    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
    const motivationEl = document.getElementById('motivation-text');
    if (motivationEl) {
        motivationEl.textContent = randomMotivation;
    }
});
