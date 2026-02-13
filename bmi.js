/* =========================================
 * BMI Calculator with WHO Standards & WHtR
 * نسخه به‌روز شده با پشتیبانی WHtR
 * ========================================= */

// تاریخ جاری (شمسی) - باید به‌روزرسانی شود
const CURRENT_JALALI_YEAR = 1404;
const CURRENT_JALALI_MONTH = 11;
const CURRENT_JALALI_DAY = 24; // به‌روز شده

// متغیرهای سراسری
let selectedGender = null;

/* =========================================
 * تابع بررسی کبیسه بودن سال شمسی
 * ========================================= */
function isJalaliLeapYear(year) {
    const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
    const cycle = 33;
    const gy = year + 621;
    let jp = breaks[0];
    
    let jump = 0;
    for (let i = 1; i < breaks.length; i++) {
        const jm = breaks[i];
        jump = jm - jp;
        if (year < jm) break;
        jp = jm;
    }
    
    const n = year - jp;
    if (jump - n < 6) {
        n = n - jump + (Math.floor((jump + 4) / 33) * 33);
    }
    
    let leap = ((((n + 1) % 33) - 1) % 4) === 0;
    if (leap && n === 0) {
        leap = false;
    }
    
    return leap;
}

/* =========================================
 * تابع دریافت تعداد روزهای ماه شمسی
 * ========================================= */
function getJalaliMonthDays(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isJalaliLeapYear(year) ? 30 : 29;
}

/* =========================================
 * محاسبه سن دقیق شمسی
 * ========================================= */
function calculateJalaliAge(birthYear, birthMonth, birthDay) {
    let years = CURRENT_JALALI_YEAR - birthYear;
    let months = CURRENT_JALALI_MONTH - birthMonth;
    let days = CURRENT_JALALI_DAY - birthDay;

    if (days < 0) {
        months--;
        const prevMonth = CURRENT_JALALI_MONTH === 1 ? 12 : CURRENT_JALALI_MONTH - 1;
        const prevYear = CURRENT_JALALI_MONTH === 1 ? CURRENT_JALALI_YEAR - 1 : CURRENT_JALALI_YEAR;
        days += getJalaliMonthDays(prevYear, prevMonth);
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const totalDays = (years * 365) + (months * 30) + days;
    const ageInYears = totalDays / 365.25;

    return {
        years: years,
        months: months,
        days: days,
        totalYears: ageInYears,
        displayAge: `${years} سال و ${months} ماه و ${days} روز`
    };
}

/* =========================================
 * اعتبارسنجی تاریخ شمسی
 * ========================================= */
function validateJalaliDate(year, month, day) {
    if (year < 1300 || year > CURRENT_JALALI_YEAR) {
        return { valid: false, message: 'سال باید بین 1300 تا 1404 باشد' };
    }
    
    if (month < 1 || month > 12) {
        return { valid: false, message: 'ماه باید بین 1 تا 12 باشد' };
    }
    
    const maxDays = getJalaliMonthDays(year, month);
    if (day < 1 || day > maxDays) {
        return { valid: false, message: `روز برای ${month}/${year} باید بین 1 تا ${maxDays} باشد` };
    }

    // بررسی تاریخ آینده
    if (year > CURRENT_JALALI_YEAR || 
        (year === CURRENT_JALALI_YEAR && month > CURRENT_JALALI_MONTH) ||
        (year === CURRENT_JALALI_YEAR && month === CURRENT_JALALI_MONTH && day > CURRENT_JALALI_DAY)) {
        return { valid: false, message: 'تاریخ تولد نمی‌تواند در آینده باشد' };
    }

    return { valid: true };
}

/* =========================================
 * محاسبه BMI کلاسیک
 * ========================================= */
function calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

/* =========================================
 * محاسبه WHtR (نسبت دور کمر به قد) - NEW
 * ========================================= */
function calculateWHtR(waist, height) {
    return waist / height;
}

/* =========================================
 * تحلیل WHtR و تعیین وضعیت - NEW
 * ========================================= */
function getWHtRStatus(whtr) {
    if (whtr < 0.40) {
        return {
            status: 'خطر سلامتی',
            description: 'نسبت دور کمر به قد شما کمتر از حد طبیعی است. این می‌تواند نشان‌دهنده لاغری غیرطبیعی باشد.',
            class: 'status-danger',
            color: '#dc2626',
            recommendation: 'توصیه می‌شود با پزشک یا متخصص تغذیه مشورت کنید.'
        };
    } else if (whtr >= 0.40 && whtr < 0.50) {
        return {
            status: 'محدوده سالم',
            description: 'نسبت دور کمر به قد شما در محدوده بهینه قرار دارد. این نشان‌دهنده توزیع سالم چربی بدن است.',
            class: 'status-success',
            color: '#16a34a',
            recommendation: 'وضعیت شما عالی است! با حفظ سبک زندگی سالم، این وضعیت را حفظ کنید.'
        };
    } else if (whtr >= 0.50 && whtr < 0.60) {
        return {
            status: 'ریسک متوسط',
            description: 'نسبت دور کمر به قد شما بالاتر از حد مطلوب است. این می‌تواند نشان‌دهنده شروع چاقی شکمی باشد.',
            class: 'status-warning',
            color: '#f59e0b',
            recommendation: 'توصیه می‌شود با رژیم غذایی متعادل و ورزش منظم، دور کمر خود را کاهش دهید.'
        };
    } else {
        return {
            status: 'ریسک بالا',
            description: 'نسبت دور کمر به قد شما در محدوده خطر قرار دارد. چاقی شکمی می‌تواند خطر بیماری‌های قلبی و متابولیک را افزایش دهد.',
            class: 'status-danger',
            color: '#dc2626',
            recommendation: 'حتماً با پزشک مشورت کنید و برنامه کاهش وزن اختصاصی دریافت کنید.'
        };
    }
}

/* =========================================
 * تحلیل BMI بزرگسالان
 * ========================================= */
function analyzeBMIAdult(bmi) {
    let status, statusClass, recommendations, healthyRange;

    if (bmi < 16) {
        status = 'لاغری شدید';
        statusClass = 'status-danger';
        healthyRange = '18.5 - 24.9';
        recommendations = [
            '⚠️ وضعیت شما نیازمند توجه پزشکی فوری است',
            '🍽️ مصرف غذاهای پرکالری و مغذی را افزایش دهید',
            '💊 ممکن است نیاز به مکمل‌های غذایی داشته باشید',
            '👨‍⚕️ حتماً با پزشک متخصص تغذیه مشورت کنید',
            '🏋️ از ورزش‌های مقاومتی برای افزایش توده عضلانی استفاده کنید'
        ];
    } else if (bmi < 18.5) {
        status = 'لاغری';
        statusClass = 'status-warning';
        healthyRange = '18.5 - 24.9';
        recommendations = [
            '🍽️ رژیم غذایی متعادل با کالری کافی داشته باشید',
            '🥑 غذاهای سرشار از پروتئین و چربی‌های سالم مصرف کنید',
            '🏋️ ورزش‌های قدرتی برای افزایش توده عضلانی انجام دهید',
            '😴 استراحت کافی داشته باشید',
            '👨‍⚕️ در صورت ادامه وضعیت با پزشک مشورت کنید'
        ];
    } else if (bmi < 25) {
        status = 'وزن نرمال';
        statusClass = 'status-success';
        healthyRange = '18.5 - 24.9';
        recommendations = [
            '✅ وزن شما در محدوده سالم است',
            '🥗 رژیم غذایی متعادل و متنوع داشته باشید',
            '🏃 ورزش منظم (حداقل 150 دقیقه در هفته) انجام دهید',
            '💧 مصرف روزانه 8-10 لیوان آب را فراموش نکنید',
            '😴 خواب کافی (7-9 ساعت) داشته باشید'
        ];
    } else if (bmi < 30) {
        status = 'اضافه وزن';
        statusClass = 'status-warning';
        healthyRange = '18.5 - 24.9';
        recommendations = [
            '⚖️ تلاش برای کاهش تدریجی وزن (0.5-1 کیلو در هفته)',
            '🥗 کاهش مصرف کالری روزانه (300-500 کالری)',
            '🏃 افزایش فعالیت فیزیکی به 200-300 دقیقه در هفته',
            '🚫 محدود کردن مصرف قند و نوشیدنی‌های شیرین',
            '👨‍⚕️ مشاوره با متخصص تغذیه توصیه می‌شود'
        ];
    } else {
        status = 'چاقی';
        statusClass = 'status-danger';
        healthyRange = '18.5 - 24.9';
        recommendations = [
            '⚠️ چاقی خطر ابتلا به بیماری‌های قلبی و دیابت را افزایش می‌دهد',
            '👨‍⚕️ حتماً با پزشک متخصص مشورت کنید',
            '🥗 رژیم غذایی کم‌کالری با نظارت پزشکی',
            '🏃 شروع تدریجی ورزش (پیاده‌روی روزانه)',
            '💊 ممکن است نیاز به درمان دارویی یا جراحی باشد',
            '🧠 حمایت روانشناختی برای تغییر سبک زندگی'
        ];
    }

    return { status, statusClass, recommendations, healthyRange };
}

/* =========================================
 * تحلیل BMI کودکان با استاندارد WHO
 * ========================================= */
function analyzeBMIChild(bmi, age, gender) {
    const monthsAge = Math.floor(age * 12);
    
    if (monthsAge < 61 || monthsAge > 228) {
        return {
            status: 'خارج از محدوده',
            statusClass: 'status-warning',
            recommendations: ['محاسبه BMI کودکان فقط برای سنین 5 تا 19 سال معتبر است'],
            healthyRange: 'نامشخص'
        };
    }

    const genderData = gender === 'male' ? WHO_BMI_DATA.boys : WHO_BMI_DATA.girls;
    const ageData = genderData.find(d => d.month === monthsAge);

    if (!ageData) {
        return analyzeBMIAdult(bmi);
    }

    const zScore = (bmi - ageData.median) / ageData.sd;
    let status, statusClass, recommendations, healthyRange;

    healthyRange = `${ageData.sd1neg.toFixed(1)} - ${ageData.sd1.toFixed(1)}`;

    if (zScore < -2) {
        status = 'کمبود وزن شدید';
        statusClass = 'status-danger';
        recommendations = [
            '⚠️ فرزند شما نیازمند معاینه پزشکی فوری است',
            '🍽️ تغذیه مناسب و کافی بسیار مهم است',
            '👨‍⚕️ حتماً با پزشک اطفال مشورت کنید',
            '💊 ممکن است نیاز به مکمل‌های غذایی باشد'
        ];
    } else if (zScore < -1) {
        status = 'کمبود وزن';
        statusClass = 'status-warning';
        recommendations = [
            '🍽️ تغذیه متنوع و مقوی برای کودک فراهم کنید',
            '🥛 مصرف لبنیات و پروتئین را افزایش دهید',
            '👨‍⚕️ پیگیری منظم رشد توسط پزشک',
            '🏃 فعالیت بدنی مناسب سن'
        ];
    } else if (zScore <= 1) {
        status = 'وزن نرمال';
        statusClass = 'status-success';
        recommendations = [
            '✅ وزن فرزند شما در محدوده سالم است',
            '🥗 تغذیه متعادل و متنوع ادامه یابد',
            '🏃 فعالیت بدنی منظم (حداقل 60 دقیقه در روز)',
            '😴 خواب کافی (9-12 ساعت بسته به سن)',
            '📱 محدود کردن زمان استفاده از صفحه‌نمایش'
        ];
    } else if (zScore <= 2) {
        status = 'اضافه وزن';
        statusClass = 'status-warning';
        recommendations = [
            '⚖️ کنترل وزن و پیشگیری از افزایش بیشتر',
            '🥗 کاهش مصرف غذاهای پرکالری و شیرینی',
            '🏃 افزایش فعالیت بدنی روزانه',
            '👨‍⚕️ مشاوره با پزشک اطفال یا متخصص تغذیه',
            '👨‍👩‍👧 مشارکت کل خانواده در سبک زندگی سالم'
        ];
    } else {
        status = 'چاقی';
        statusClass = 'status-danger';
        recommendations = [
            '⚠️ فرزند شما در معرض خطر مشکلات سلامتی است',
            '👨‍⚕️ حتماً با پزشک اطفال مشورت کنید',
            '🥗 برنامه تغذیه‌ای تخصصی دریافت کنید',
            '🏃 فعالیت بدنی منظم و سرگرمی‌های فعال',
            '🧠 حمایت روانی از کودک بسیار مهم است',
            '👨‍👩‍👧 تغییر سبک زندگی کل خانواده ضروری است'
        ];
    }

    return { status, statusClass, recommendations, healthyRange, zScore };
}

/* =========================================
 * محاسبه BMR (متابولیسم پایه)
 * ========================================= */
function calculateBMR(weight, height, age, gender) {
    if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * age - 161;
    }
}

/* =========================================
 * محاسبه وزن سالم
 * ========================================= */
function calculateHealthyWeight(height, age, gender) {
    const heightInMeters = height / 100;
    
    if (age < 19) {
        const monthsAge = Math.floor(age * 12);
        const genderData = gender === 'male' ? WHO_BMI_DATA.boys : WHO_BMI_DATA.girls;
        const ageData = genderData.find(d => d.month === monthsAge);
        
        if (ageData) {
            const minWeight = ageData.sd1neg * heightInMeters * heightInMeters;
            const maxWeight = ageData.sd1 * heightInMeters * heightInMeters;
            return { min: minWeight, max: maxWeight };
        }
    }
    
    const minWeight = 18.5 * heightInMeters * heightInMeters;
    const maxWeight = 24.9 * heightInMeters * heightInMeters;
    return { min: minWeight, max: maxWeight };
}

/* =========================================
 * جملات انگیزشی
 * ========================================= */
const motivationalQuotes = [
    '💪 سلامتی سرمایه واقعی زندگی است',
    '🌟 هر روز فرصتی تازه برای بهتر شدن است',
    '🎯 هدف‌گذاری واقع‌بینانه اولین قدم موفقیت است',
    '🏃 حرکت زندگی است، فعال بمانید',
    '🥗 غذای سالم، زندگی سالم',
    '😴 استراحت کافی به اندازه ورزش مهم است',
    '💧 آب، معجزه‌گر سلامتی',
    '🧘 آرامش ذهن، سلامت بدن',
    '👨‍👩‍👧 خانواده سالم، جامعه سالم'
];

/* =========================================
 * Event Listeners
 * ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    // Gender Selection
    const genderButtons = document.querySelectorAll('.gender-btn');
    genderButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            genderButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedGender = this.getAttribute('data-gender');
        });
    });

    // Form Submission
    const form = document.getElementById('bmi-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateAndDisplay();
    });

    // نمایش چرخشی جملات انگیزشی
    setInterval(updateMotivationalQuote, 5000);
});

/* =========================================
 * به‌روزرسانی جمله انگیزشی
 * ========================================= */
function updateMotivationalQuote() {
    const quoteElement = document.getElementById('motivational-quote');
    if (quoteElement && quoteElement.textContent !== 'در انتظار محاسبه...') {
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        quoteElement.style.opacity = '0';
        setTimeout(() => {
            quoteElement.textContent = randomQuote;
            quoteElement.style.opacity = '1';
        }, 300);
    }
}

/* =========================================
 * تابع اصلی محاسبه و نمایش
 * ========================================= */
function calculateAndDisplay() {
    // دریافت مقادیر
    if (!selectedGender) {
        alert('لطفاً جنسیت را انتخاب کنید');
        return;
    }

    const birthYear = parseInt(document.getElementById('birth-year').value);
    const birthMonth = parseInt(document.getElementById('birth-month').value);
    const birthDay = parseInt(document.getElementById('birth-day').value);
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const waist = parseFloat(document.getElementById('waist').value); // NEW
    const activityLevel = parseFloat(document.getElementById('activity').value);

    // اعتبارسنجی تاریخ
    const dateValidation = validateJalaliDate(birthYear, birthMonth, birthDay);
    if (!dateValidation.valid) {
        alert(dateValidation.message);
        return;
    }

    // محاسبه سن
    const ageData = calculateJalaliAge(birthYear, birthMonth, birthDay);
    const age = ageData.totalYears;

    // محاسبه BMI
    const bmi = calculateBMI(weight, height);
    
    // محاسبه WHtR (اگر دور کمر وارد شده باشد) - NEW
    let whtrData = null;
    if (!isNaN(waist) && waist > 0) {
        const whtr = calculateWHtR(waist, height);
        whtrData = {
            value: whtr,
            ...getWHtRStatus(whtr)
        };
    }

    // تحلیل BMI
    const analysis = age < 19 
        ? analyzeBMIChild(bmi, age, selectedGender)
        : analyzeBMIAdult(bmi);

    // محاسبه متابولیسم
    const bmr = calculateBMR(weight, height, age, selectedGender);
    const tdee = bmr * activityLevel;

    // محاسبه وزن سالم
    const healthyWeight = calculateHealthyWeight(height, age, selectedGender);
    const weightDiff = weight - ((healthyWeight.min + healthyWeight.max) / 2);

    // نمایش نتایج
    displayResults({
        gender: selectedGender === 'male' ? 'مرد' : 'زن',
        age: ageData.displayAge,
        height: `${height.toFixed(1)} سانتی‌متر`,
        weight: `${weight.toFixed(1)} کیلوگرم`,
        bmi: bmi.toFixed(1),
        ...analysis,
        bmr: `${Math.round(bmr)} کالری`,
        tdee: `${Math.round(tdee)} کالری`,
        maintainCalories: `${Math.round(tdee)} کالری`,
        gainCalories: `${Math.round(tdee + 500)} کالری`,
        lossCalories: `${Math.round(tdee - 500)} کالری`,
        healthyWeightRange: `${healthyWeight.min.toFixed(1)} - ${healthyWeight.max.toFixed(1)} کیلوگرم`,
        weightDifference: weightDiff > 0 
            ? `${weightDiff.toFixed(1)} کیلوگرم اضافه وزن دارید`
            : `${Math.abs(weightDiff).toFixed(1)} کیلوگرم کمبود وزن دارید`,
        whtr: whtrData // NEW
    });

    // ذخیره در تاریخچه
    if (typeof ProfileManager !== 'undefined') {
        ProfileManager.saveResult({
            timestamp: new Date().toISOString(),
            gender: selectedGender,
            age: age,
            height: height,
            weight: weight,
            waist: waist || null, // NEW
            bmi: bmi,
            whtr: whtrData ? whtrData.value : null, // NEW
            status: analysis.status
        });
    }
}

/* =========================================
 * نمایش نتایج در صفحه
 * ========================================= */
function displayResults(data) {
    // نمایش بخش نتایج
    document.getElementById('results').classList.remove('hidden');
    
    // اطلاعات شخصی
    document.getElementById('r-gender').textContent = data.gender;
    document.getElementById('r-age').textContent = data.age;
    document.getElementById('r-height').textContent = data.height;
    document.getElementById('r-weight').textContent = data.weight;

    // BMI
    document.getElementById('bmi-value').textContent = data.bmi;
    const statusBadge = document.getElementById('bmi-status-badge');
    statusBadge.className = `status-badge ${data.statusClass}`;
    document.getElementById('bmi-status-text').textContent = data.status;
    document.getElementById('bmi-difference-text').textContent = data.weightDifference;
    document.getElementById('r-healthy').textContent = data.healthyWeightRange;

    // WHtR (اگر محاسبه شده باشد) - NEW
    const whtrCard = document.getElementById('whtr-card');
    if (data.whtr) {
        whtrCard.style.display = 'block';
        document.getElementById('whtr-value').textContent = data.whtr.value.toFixed(3);
        const whtrStatusBadge = document.getElementById('whtr-status-badge');
        whtrStatusBadge.className = `status-badge ${data.whtr.class}`;
        whtrStatusBadge.style.backgroundColor = data.whtr.color;
        document.getElementById('whtr-status-text').textContent = data.whtr.status;
        document.getElementById('whtr-description').textContent = data.whtr.description;
    } else {
        whtrCard.style.display = 'none';
    }

    // متابولیسم
    document.getElementById('r-bmr').textContent = data.bmr;
    document.getElementById('r-tdee').textContent = data.tdee;

    // کالری
    document.getElementById('maintain-calories').textContent = data.maintainCalories;
    document.getElementById('gain-calories').textContent = data.gainCalories;
    document.getElementById('loss-calories').textContent = data.lossCalories;

    // توصیه‌ها
    const recommendationsDiv = document.getElementById('recommendations');
    recommendationsDiv.innerHTML = data.recommendations.map(rec => 
        `<p class="recommendation-item">${rec}</p>`
    ).join('');

    // اضافه کردن توصیه WHtR - NEW
    if (data.whtr && data.whtr.recommendation) {
        recommendationsDiv.innerHTML += `<p class="recommendation-item whtr-recommendation">🔍 ${data.whtr.recommendation}</p>`;
    }

    // جمله انگیزشی
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    document.getElementById('motivational-quote').textContent = randomQuote;

    // اسکرول به نتایج
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
