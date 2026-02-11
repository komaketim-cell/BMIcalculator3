/**
 * bmi.js
 * منطق محاسباتی اصلی برنامه BMI Calculator
 * شامل: محاسبه BMI، BMR، TDEE، Z-Score و تحلیل کودکان/بزرگسالان
 */

// منتظر لود شدن کامل صفحه
document.addEventListener('DOMContentLoaded', function() {

// تاریخ امروز (جلالی)
const TODAY_JALALI = { year: 1404, month: 11, day: 22 };

// ---------------------------------------------------------
// توابع کمکی UI
// ---------------------------------------------------------
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

// ---------------------------------------------------------
// جملات انگیزشی
// ---------------------------------------------------------
const motivationalQuotes = [
    "سلامتی سرمایه‌ای است که با هیچ ثروتی قابل مقایسه نیست.",
    "هر گام کوچک به سمت سلامتی، یک پیروزی بزرگ است.",
    "بدنت خانه‌ای است که باید در آن زندگی کنی، پس از آن مراقبت کن.",
    "تغییر واقعی از درون شروع می‌شود.",
    "سلامتی یک سفر است، نه یک مقصد.",
    "بهترین سرمایه‌گذاری، سرمایه‌گذاری روی خودت است.",
    "قدرت واقعی در تعادل و ثبات قدم است.",
    "هر روز فرصتی جدید برای بهتر شدن است."
];

function getRandomQuote() {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

// ---------------------------------------------------------
// محاسبات تقویم جلالی
// ---------------------------------------------------------
function isJalaliLeapYear(year) {
    const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
    const gy = year + 621;
    let jp = breaks[0];
    let jump = 0;

    for (let i = 1; i < breaks.length; i++) {
        const jm = breaks[i];
        jump = jm - jp;
        if (year < jm) break;
        jp = jm;
    }

    let n = year - jp;
    if (jump - n < 6) n = n - jump + (jump + 4) / 33 * 33;

    let leap = ((n + 1) % 33 - 1) % 4;
    if (leap === -1) leap = 4;

    return leap === 0;
}

function getJalaliMonthDays(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isJalaliLeapYear(year) ? 30 : 29;
}

function isValidJalaliDate(year, month, day) {
    if (month < 1 || month > 12) return false;
    const maxDays = getJalaliMonthDays(year, month);
    return day >= 1 && day <= maxDays;
}

/**
 * محاسبه سن دقیق بر حسب سال، ماه و روز
 * @returns {Object} - {years, months, days, totalMonths, ageInYears}
 */
function calculateExactAge(birthYear, birthMonth, birthDay) {
    const { year: tYear, month: tMonth, day: tDay } = TODAY_JALALI;

    let years = tYear - birthYear;
    let months = tMonth - birthMonth;
    let days = tDay - birthDay;

    // تنظیم روزها
    if (days < 0) {
        months--;
        const prevMonth = tMonth === 1 ? 12 : tMonth - 1;
        const prevYear = tMonth === 1 ? tYear - 1 : tYear;
        days += getJalaliMonthDays(prevYear, prevMonth);
    }

    // تنظیم ماه‌ها
    if (months < 0) {
        years--;
        months += 12;
    }

    const totalMonths = years * 12 + months;
    
    // سن دقیق بر حسب سال (با اعشار)
    const ageInYears = years + months / 12 + days / 365.25;

    return { years, months, days, totalMonths, ageInYears };
}

// ---------------------------------------------------------
// محاسبات BMI و BMR
// ---------------------------------------------------------
function calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

function calculateBMR(weight, height, ageYears, gender) {
    // فرمول Mifflin-St Jeor
    const base = 10 * weight + 6.25 * height - 5 * ageYears;
    return gender === 'male' ? base + 5 : base - 161;
}

function calculateTDEE(bmr, activityLevel) {
    const factors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    };
    return bmr * (factors[activityLevel] || 1.2);
}

// ---------------------------------------------------------
// تحلیل کودکان (5-19 سال) با WHO LMS
// ---------------------------------------------------------
function analyzeChildBMI(bmi, ageYears, gender, height) {
    const lms = getLMS(ageYears, gender);
    
    if (!lms) {
        return {
            status: 'خارج از محدوده',
            description: 'داده‌های WHO برای این سن در دسترس نیست',
            zScore: null
        };
    }

    const zScore = calculateZScore(bmi, lms.L, lms.M, lms.S);
    const category = classifyZScore(zScore);

    // محاسبه محدوده وزن سالم (Z-Score بین -2 تا +1)
    const heightM = height / 100;
    
    // وزن در Z = -2
    const zMinus2 = -2;
    const bmiAtZMinus2 = lms.L !== 0 
        ? lms.M * Math.pow(1 + lms.L * lms.S * zMinus2, 1 / lms.L)
        : lms.M * Math.exp(lms.S * zMinus2);
    const minHealthyWeight = bmiAtZMinus2 * heightM * heightM;

    // وزن در Z = +1
    const zPlus1 = 1;
    const bmiAtZPlus1 = lms.L !== 0
        ? lms.M * Math.pow(1 + lms.L * lms.S * zPlus1, 1 / lms.L)
        : lms.M * Math.exp(lms.S * zPlus1);
    const maxHealthyWeight = bmiAtZPlus1 * heightM * heightM;

    return {
        status: category,
        zScore: zScore.toFixed(2),
        healthyWeightRange: {
            min: minHealthyWeight.toFixed(1),
            max: maxHealthyWeight.toFixed(1)
        },
        lmsParams: {
            L: lms.L.toFixed(4),
            M: lms.M.toFixed(4),
            S: lms.S.toFixed(4),
            age: ageYears.toFixed(2)
        }
    };
}

// ---------------------------------------------------------
// تحلیل بزرگسالان (19+ سال)
// ---------------------------------------------------------
function analyzeAdultBMI(bmi, height) {
    let status = '';
    if (bmi < 18.5) status = 'کمبود وزن';
    else if (bmi < 25) status = 'نرمال';
    else if (bmi < 30) status = 'اضافه وزن';
    else if (bmi < 35) status = 'چاقی درجه ۱';
    else if (bmi < 40) status = 'چاقی درجه ۲';
    else status = 'چاقی درجه ۳';

    // محدوده وزن سالم (BMI 18.5 - 25)
    const heightM = height / 100;
    const minHealthyWeight = 18.5 * heightM * heightM;
    const maxHealthyWeight = 25 * heightM * heightM;

    return {
        status,
        healthyWeightRange: {
            min: minHealthyWeight.toFixed(1),
            max: maxHealthyWeight.toFixed(1)
        }
    };
}

// ---------------------------------------------------------
// تولید توصیه‌های کاربردی
// ---------------------------------------------------------
function generatePracticalTips(status, ageYears) {
    const isChild = ageYears < 19;
    
    const tips = {
        'لاغری شدید': [
            isChild ? 'مشورت فوری با پزشک کودکان ضروری است' : 'مشاوره با پزشک متخصص تغذیه الزامی است',
            'افزایش تدریجی کالری مصرفی با تمرکز بر مواد مغذی',
            'وعده‌های غذایی منظم و متنوع',
            'بررسی احتمال مشکلات جذب مواد غذایی'
        ],
        'لاغری': [
            isChild ? 'مشورت با پزشک کودکان توصیه می‌شود' : 'مشاوره با متخصص تغذیه مفید است',
            'افزایش کالری با غذاهای سالم و پرانرژی',
            'میان‌وعده‌های مغذی (آجیل، خرما، شیر)',
            'بررسی برنامه ورزشی مناسب'
        ],
        'نرمال': [
            'حفظ وزن فعلی با رژیم غذایی متعادل',
            'فعالیت بدنی منظم (حداقل ۳۰ دقیقه در روز)',
            'مصرف کافی آب (۸-۱۰ لیوان در روز)',
            'خواب کافی و مدیریت استرس'
        ],
        'اضافه وزن': [
            'کاهش تدریجی ۵۰۰-۷۵۰ کالری از کالری روزانه',
            'افزایش فعالیت بدنی به ۴۵-۶۰ دقیقه در روز',
            'کاهش مصرف قند و نوشابه‌های شیرین',
            'افزایش مصرف سبزیجات و پروتئین'
        ],
        'چاقی': [
            isChild ? 'مشورت با پزشک کودکان ضروری است' : 'مشاوره با متخصص تغذیه الزامی است',
            'برنامه کاهش وزن تدریجی و پایدار',
            'فعالیت بدنی منظم با شدت متوسط',
            'کنترل اندازه وعده‌های غذایی',
            'حمایت روانی و خانوادگی'
        ],
        'چاقی شدید': [
            'مراجعه فوری به پزشک متخصص',
            'ارزیابی کامل سلامت و احتمال عوارض',
            'برنامه جامع کاهش وزن تحت نظر پزشک',
            'بررسی گزینه‌های درمانی مختلف',
            'پشتیبانی روانشناختی حرفه‌ای'
        ],
        'چاقی درجه ۱': [
            'مشاوره با متخصص تغذیه',
            'کاهش ۵۰۰-۷۵۰ کالری روزانه',
            'فعالیت بدنی منظم ۶۰ دقیقه در روز',
            'پیگیری منظم پیشرفت'
        ],
        'چاقی درجه ۲': [
            'مراجعه به پزشک و متخصص تغذیه',
            'برنامه کاهش وزن ساختاریافته',
            'فعالیت بدنی تحت نظارت',
            'بررسی و کنترل بیماری‌های همراه'
        ],
        'چاقی درجه ۳': [
            'مراجعه فوری به پزشک متخصص',
            'ارزیابی جامع سلامت',
            'بررسی گزینه‌های درمانی پیشرفته',
            'پشتیبانی چندتخصصی (پزشک، تغذیه، روانشناس)'
        ],
        'کمبود وزن': [
            'مشاوره با متخصص تغذیه',
            'افزایش کالری با غذاهای مغذی',
            'وعده‌های منظم و میان‌وعده‌ها',
            'بررسی علل احتمالی'
        ]
    };

    return tips[status] || tips['نرمال'];
}

// ---------------------------------------------------------
// نمایش نتایج
// ---------------------------------------------------------
function displayResults(bmi, analysis, age, bmr, tdee, isChild) {
    // BMI
    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    document.getElementById('bmi-status').textContent = analysis.status;
    
    // رنگ دایره بر اساس وضعیت
    const circle = document.getElementById('bmi-circle');
    const statusColors = {
        'لاغری شدید': '#e74c3c',
        'لاغری': '#e67e22',
        'نرمال': '#27ae60',
        'اضافه وزن': '#f39c12',
        'چاقی': '#e74c3c',
        'چاقی شدید': '#c0392b',
        'چاقی درجه ۱': '#e67e22',
        'چاقی درجه ۲': '#e74c3c',
        'چاقی درجه ۳': '#c0392b',
        'کمبود وزن': '#e67e22'
    };
    circle.style.borderColor = statusColors[analysis.status] || '#3498db';

    // سن
    document.getElementById('age-display').textContent = 
        `${age.years} سال، ${age.months} ماه و ${age.days} روز`;

    // Z-Score (فقط برای کودکان)
    const zscoreSection = document.getElementById('zscore-section');
    if (isChild && analysis.zScore !== null) {
        zscoreSection.style.display = 'block';
        document.getElementById('zscore-value').textContent = analysis.zScore;
        
        // نمایش پارامترهای LMS
        if (analysis.lmsParams) {
            document.getElementById('lms-params').innerHTML = `
                <small style="color: #7f8c8d;">
                    L: ${analysis.lmsParams.L} | 
                    M: ${analysis.lmsParams.M} | 
                    S: ${analysis.lmsParams.S} |
                    سن: ${analysis.lmsParams.age} سال
                </small>
            `;
        }
    } else {
        zscoreSection.style.display = 'none';
    }

    // محدوده وزن سالم
    if (analysis.healthyWeightRange) {
        document.getElementById('weight-range').textContent = 
            `${analysis.healthyWeightRange.min} - ${analysis.healthyWeightRange.max} کیلوگرم`;
    }

    // BMR و TDEE
    document.getElementById('bmr-value').textContent = Math.round(bmr);
    document.getElementById('tdee-value').textContent = Math.round(tdee);

    // اهداف کالری
    document.getElementById('cut-250').textContent = Math.round(tdee - 250);
    document.getElementById('cut-500').textContent = Math.round(tdee - 500);
    document.getElementById('maintenance').textContent = Math.round(tdee);
    document.getElementById('bulk-250').textContent = Math.round(tdee + 250);
    document.getElementById('bulk-500').textContent = Math.round(tdee + 500);

    // توصیه‌های کاربردی
    const tips = generatePracticalTips(analysis.status, age.ageInYears);
    const tipsHtml = tips.map(tip => `<li>${tip}</li>`).join('');
    document.getElementById('practical-tips').innerHTML = tipsHtml;

    // جمله انگیزشی
    document.getElementById('motivational-quote').textContent = getRandomQuote();
}

// ---------------------------------------------------------
// مدیریت رویداد فرم
// ---------------------------------------------------------
document.getElementById('bmi-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // دریافت مقادیر
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const birthYear = parseInt(document.getElementById('birth-year').value);
    const birthMonth = parseInt(document.getElementById('birth-month').value);
    const birthDay = parseInt(document.getElementById('birth-day').value);
    const gender = document.getElementById('gender').value;
    const activityLevel = document.getElementById('activity').value;

    // اعتبارسنجی تاریخ تولد
    if (!isValidJalaliDate(birthYear, birthMonth, birthDay)) {
        showError('تاریخ تولد وارد شده معتبر نیست!');
        return;
    }

    // محاسبه سن دقیق
    const age = calculateExactAge(birthYear, birthMonth, birthDay);
    
    if (age.years < 0) {
        showError('تاریخ تولد نمی‌تواند در آینده باشد!');
        return;
    }

    // محاسبه BMI
    const bmi = calculateBMI(weight, height);
    
    // تحلیل بر اساس سن
    let analysis;
    const isChild = age.ageInYears >= 5 && age.ageInYears < 19;
    
    if (isChild) {
        analysis = analyzeChildBMI(bmi, age.ageInYears, gender, height);
    } else {
        analysis = analyzeAdultBMI(bmi, height);
    }

    // محاسبه BMR و TDEE
    const bmr = calculateBMR(weight, height, age.ageInYears, gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    // نمایش نتایج
    displayResults(bmi, analysis, age, bmr, tdee, isChild);
    
    showPage('results-page');
});

// ---------------------------------------------------------
// دکمه‌های ناوبری
// ---------------------------------------------------------
document.getElementById('back-to-input').addEventListener('click', () => {
    showPage('input-page');
});

document.getElementById('show-guide').addEventListener('click', () => {
    showPage('guide-page');
});

document.getElementById('back-to-results').addEventListener('click', () => {
    showPage('results-page');
});

// پایان DOMContentLoaded
});
