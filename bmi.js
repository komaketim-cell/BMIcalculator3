// ========== محاسبه سن دقیق با ماه و روز ==========
function calculatePreciseAge(birthYear, birthMonth, birthDay) {
    // تاریخ فعلی شمسی: 1404/11/21
    const currentYear = 1404;
    const currentMonth = 11;
    const currentDay = 21;
    
    let years = currentYear - birthYear;
    let months = currentMonth - birthMonth;
    let days = currentDay - birthDay;
    
    // اصلاح روزها
    if (days < 0) {
        months--;
        // تعداد روزهای ماه قبل
        const daysInPrevMonth = birthMonth === 1 ? 31 : 
                                birthMonth === 2 ? 31 :
                                birthMonth === 3 ? 31 :
                                birthMonth === 4 ? 31 :
                                birthMonth === 5 ? 31 :
                                birthMonth === 6 ? 31 :
                                birthMonth === 7 ? 30 :
                                birthMonth === 8 ? 30 :
                                birthMonth === 9 ? 30 :
                                birthMonth === 10 ? 30 :
                                birthMonth === 11 ? 30 : 29;
        days += daysInPrevMonth;
    }
    
    // اصلاح ماه‌ها
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // محاسبه سن به صورت اعشاری برای استفاده در محاسبات WHO
    const decimalAge = years + (months / 12) + (days / 365.25);
    
    return {
        years: years,
        months: months,
        days: days,
        decimal: decimalAge,
        display: `${years} سال و ${months} ماه و ${days} روز`
    };
}

// ========== محاسبه BMI دقیق برای کودکان با استفاده از WHO LMS ==========
function calculateChildBMI(weight, height, ageMonths, gender) {
    const bmi = weight / ((height / 100) ** 2);
    
    // دریافت داده‌های LMS از WHO
    const lmsData = getLMS(ageMonths, gender);
    
    if (!lmsData) {
        // اگر داده WHO موجود نیست، از محاسبه استاندارد استفاده کن
        return {
            bmi: bmi.toFixed(1),
            status: getBMIStatus(bmi, 'adult'),
            percentile: null,
            zScore: null
        };
    }
    
    // محاسبه Z-Score با استفاده از LMS
    const L = lmsData.L;
    const M = lmsData.M;
    const S = lmsData.S;
    
    let zScore;
    if (L !== 0) {
        zScore = (Math.pow(bmi / M, L) - 1) / (L * S);
    } else {
        zScore = Math.log(bmi / M) / S;
    }
    
    // تبدیل Z-Score به Percentile (تقریبی)
    const percentile = calculatePercentile(zScore);
    
    // تعیین وضعیت بر اساس WHO
    let status;
    if (zScore < -2) status = 'کمبود وزن شدید';
    else if (zScore < -1) status = 'کمبود وزن';
    else if (zScore <= 1) status = 'وزن نرمال';
    else if (zScore <= 2) status = 'اضافه وزن';
    else status = 'چاقی';
    
    return {
        bmi: bmi.toFixed(1),
        status: status,
        percentile: percentile.toFixed(1),
        zScore: zScore.toFixed(2)
    };
}

// تبدیل Z-Score به Percentile (با استفاده از تقریب)
function calculatePercentile(z) {
    // استفاده از توزیع نرمال استاندارد
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    if (z >= 0) {
        return (1 - p) * 100;
    } else {
        return p * 100;
    }
}

// ========== تعیین وضعیت BMI ==========
function getBMIStatus(bmi, ageCategory) {
    if (ageCategory === 'adult') {
        if (bmi < 18.5) return 'کمبود وزن';
        if (bmi < 25) return 'وزن نرمال';
        if (bmi < 30) return 'اضافه وزن';
        if (bmi < 35) return 'چاقی درجه ۱';
        if (bmi < 40) return 'چاقی درجه ۲';
        return 'چاقی درجه ۳ (شدید)';
    }
    return 'نامشخص';
}

// ========== محاسبه میزان اضافه وزن یا کمبود وزن ==========
function calculateWeightDifference(weight, height, bmi, ageCategory) {
    const heightM = height / 100;
    let targetBMI;
    
    if (ageCategory === 'adult') {
        // محدوده سالم: 18.5 - 24.9
        if (bmi < 18.5) {
            targetBMI = 18.5;
            const targetWeight = targetBMI * (heightM ** 2);
            const diff = targetWeight - weight;
            return `برای رسیدن به وزن سالم، ${diff.toFixed(1)} کیلوگرم افزایش وزن نیاز است`;
        } else if (bmi > 24.9) {
            targetBMI = 24.9;
            const targetWeight = targetBMI * (heightM ** 2);
            const diff = weight - targetWeight;
            return `برای رسیدن به وزن سالم، ${diff.toFixed(1)} کیلوگرم کاهش وزن نیاز است`;
        } else {
            return 'وزن شما در محدوده سالم قرار دارد ✓';
        }
    }
    
    return '';
}

// ========== محاسبه BMR (فرمول Mifflin-St Jeor) ==========
function calculateBMR(weight, height, age, gender) {
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

// ========== محاسبه TDEE ==========
function calculateTDEE(bmr, activityLevel) {
    return bmr * parseFloat(activityLevel);
}

// ========== محاسبه محدوده وزن سالم ==========
function calculateHealthyWeightRange(height) {
    const heightM = height / 100;
    const minWeight = 18.5 * (heightM ** 2);
    const maxWeight = 24.9 * (heightM ** 2);
    return {
        min: minWeight.toFixed(1),
        max: maxWeight.toFixed(1)
    };
}

// ========== نمایش صفحه ==========
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== اعتبارسنجی ورودی ==========
function validateInputs(weight, height, birthYear, birthMonth, birthDay) {
    const errors = [];
    
    if (!weight || weight <= 0 || weight > 300) {
        errors.push('وزن باید بین ۱ تا ۳۰۰ کیلوگرم باشد');
    }
    
    if (!height || height < 50 || height > 250) {
        errors.push('قد باید بین ۵۰ تا ۲۵۰ سانتی‌متر باشد');
    }
    
    if (!birthYear || birthYear < 1300 || birthYear > 1404) {
        errors.push('سال تولد معتبر نیست');
    }
    
    if (!birthMonth || birthMonth < 1 || birthMonth > 12) {
        errors.push('ماه تولد معتبر نیست');
    }
    
    if (!birthDay || birthDay < 1 || birthDay > 31) {
        errors.push('روز تولد معتبر نیست');
    }
    
    return errors;
}

// ========== توصیه‌های سلامت ==========
function getHealthRecommendations(bmi, ageCategory) {
    if (ageCategory === 'adult') {
        if (bmi < 18.5) {
            return `⚠️ شما کمبود وزن دارید

✅ توصیه‌ها:
• افزایش تدریجی کالری مصرفی
• مصرف غذاهای مغذی و پروتئین‌دار
• ورزش‌های قدرتی برای افزایش توده عضلانی
• مشورت با متخصص تغذیه`;
        } else if (bmi < 25) {
            return `✅ وزن شما در محدوده سالم است

💪 توصیه‌ها:
• حفظ الگوی غذایی متعادل
• ورزش منظم (۱۵۰ دقیقه در هفته)
• خواب کافی (۷-۸ ساعت)
• مدیریت استرس`;
        } else if (bmi < 30) {
            return `⚠️ شما اضافه وزن دارید

✅ توصیه‌ها:
• کاهش تدریجی کالری (۳۰۰-۵۰۰ کالری)
• افزایش فعالیت بدنی
• مصرف بیشتر سبزیجات و میوه
• کاهش قندها و کربوهیدرات‌های ساده
• مشورت با متخصص تغذیه`;
        } else {
            return `🚨 شما در محدوده چاقی قرار دارید

⚠️ توصیه‌ها:
• مراجعه فوری به پزشک و متخصص تغذیه
• برنامه کاهش وزن تخصصی
• کنترل فشار خون و قند خون
• ورزش با نظارت پزشک
• پیگیری منظم سلامت`;
        }
    }
    
    return 'لطفاً با متخصص تغذیه مشورت کنید';
}

// ========== محاسبه نتایج اصلی ==========
function calculateResults() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = '';
    
    // دریافت مقادیر
    const gender = document.getElementById('gender').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const birthYear = parseInt(document.getElementById('birthYear').value);
    const birthMonth = parseInt(document.getElementById('birthMonth').value);
    const birthDay = parseInt(document.getElementById('birthDay').value);
    const activity = document.getElementById('activity').value;
    
    // اعتبارسنجی
    const errors = validateInputs(weight, height, birthYear, birthMonth, birthDay);
    if (errors.length > 0) {
        errorElement.textContent = errors.join(' • ');
        return;
    }
    
    // محاسبه سن دقیق
    const ageInfo = calculatePreciseAge(birthYear, birthMonth, birthDay);
    const ageMonths = Math.floor(ageInfo.decimal * 12);
    
    // تعیین دسته سنی
    const ageCategory = ageInfo.years >= 20 ? 'adult' : 'child';
    
    // محاسبه BMI
    let bmiResult;
    if (ageCategory === 'child') {
        bmiResult = calculateChildBMI(weight, height, ageMonths, gender);
    } else {
        const bmi = weight / ((height / 100) ** 2);
        bmiResult = {
            bmi: bmi.toFixed(1),
            status: getBMIStatus(bmi, 'adult'),
            percentile: null,
            zScore: null
        };
    }
    
    // محاسبه BMR و TDEE
    const bmr = calculateBMR(weight, height, ageInfo.years, gender);
    const tdee = calculateTDEE(bmr, activity);
    
    // محاسبه محدوده وزن سالم
    const healthyRange = calculateHealthyWeightRange(height);
    
    // محاسبه میزان اضافه/کمبود وزن
    const weightDiff = calculateWeightDifference(weight, height, parseFloat(bmiResult.bmi), ageCategory);
    
    // نمایش نتایج
    displayResults(gender, ageInfo, weight, height, bmiResult, bmr, tdee, healthyRange, weightDiff, ageCategory);
    
    // نمایش صفحه نتایج
    showPage('resultPage');
}

// ========== نمایش نتایج ==========
function displayResults(gender, ageInfo, weight, height, bmiResult, bmr, tdee, healthyRange, weightDiff, ageCategory) {
    // خلاصه اطلاعات
    document.getElementById('summaryGender').textContent = gender === 'male' ? 'مرد' : 'زن';
    document.getElementById('summaryAge').textContent = ageInfo.display;
    document.getElementById('summaryWeight').textContent = `${weight} کیلوگرم`;
    document.getElementById('summaryHeight').textContent = `${height} سانتی‌متر`;
    
    // نتیجه BMI
    document.getElementById('bmiValue').textContent = bmiResult.bmi;
    document.getElementById('bmiStatus').textContent = `وضعیت: ${bmiResult.status}`;
    document.getElementById('bmiWeightDiff').textContent = weightDiff;
    
    // محدوده وزن سالم
    document.getElementById('healthyRa
        `محدوده وزن سالم برای قد شما:\n${healthyRange.min} تا ${healthyRange.max} کیلوگرم`;
    
    // BMR
    document.getElementById('bmrValue').textContent = 
        `${Math.round(bmr)} کالری در روز\n\n(انرژی مورد نیاز بدن در حالت استراحت کامل)`;
    
    // TDEE
    document.getElementById('tdeeValue').textContent = 
        `${Math.round(tdee)} کالری در روز\n\n(انرژی کل مصرفی روزانه با توجه به فعالیت)`;
    
    // توصیه‌های کالری با عناوین جدید
    const calorieRecommend = `
🔵 کالری ثابت نگه دشتن وزن:
   ${Math.round(tdee)} کالری

🟢 کالری افزایش وزن و حجم عضلات:
   ${Math.round(tdee + 400)} کالری (+۴۰۰)

 کالری کاهش وزن بدون افت عضلات:
   ${Math.round(tdee - 400)} کالری (-۴۰۰)
    `.trim();
    
    document.getElementById('calorieRecommend').textContent = calorieRecommend;
    
    // توصیه‌های سلامت
    const recommendations = getHealthRecommendations(parseFloat(bmiResult.bmi), ageCategory);
    document
