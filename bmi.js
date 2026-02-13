/* =========================================
 * BMI Calculator with WHtR Support
 * محاسبه‌گر BMI، BMR، TDEE و WHtR
 * نسخه نهایی با پشتیبانی کامل از تقویم شمسی
 * ========================================= */

// تابع بررسی سال کبیسه در تقویم شمسی
function isPersianLeapYear(year) {
    const breaks = [
        -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
        1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
        2456, 3178
    ];
    const gy = year + 621;
    let leapJ = -14;
    let jp = breaks[0];
    let jump;
    
    for (let j = 1; j <= 19; j++) {
        const jm = breaks[j];
        jump = jm - jp;
        if (year < jm) break;
        leapJ += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
        jp = jm;
    }
    
    let n = year - jp;
    if (jump - n < 6) n = n - jump + Math.floor((jump + 4) / 33) * 33;
    
    let leap = Math.floor(((n + 1) % 33 - 1) % 4);
    if (leap === -1) leap = 4;
    
    return leap === 0;
}

// تابع تعیین تعداد روزهای هر ماه شمسی
function getPersianMonthDays(month, year) {
    if (month >= 1 && month <= 6) return 31;
    if (month >= 7 && month <= 11) return 30;
    if (month === 12) return isPersianLeapYear(year) ? 30 : 29;
    return 0;
}

// محاسبه سن دقیق شمسی با در نظر گرفتن سال کبیسه
function calculatePersianAge(birthYear, birthMonth, birthDay, currentYear, currentMonth, currentDay) {
    let ageYears = currentYear - birthYear;
    let ageMonths = currentMonth - birthMonth;
    let ageDays = currentDay - birthDay;

    if (ageDays < 0) {
        ageMonths--;
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        ageDays += getPersianMonthDays(prevMonth, prevYear);
    }

    if (ageMonths < 0) {
        ageYears--;
        ageMonths += 12;
    }

    return { years: ageYears, months: ageMonths, days: ageDays };
}

// محاسبه BMR با فرمول Mifflin-St Jeor
function calculateBMR(weight, heightCm, ageYears, gender) {
    if (gender === 'male') {
        return 10 * weight + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
        return 10 * weight + 6.25 * heightCm - 5 * ageYears - 161;
    }
}

// محاسبه TDEE
function calculateTDEE(bmr, activity) {
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9
    };
    return bmr * (activityMultipliers[activity] || 1.2);
}

/* =========================================
 * WHtR Calculator & Interpreter
 * محاسبه و تفسیر نسبت دور کمر به قد
 * ========================================= */

/**
 * محاسبه و تفسیر نسبت دور کمر به قد (WHtR)
 * @param {number} waistCm  - دور کمر به سانتی‌متر
 * @param {number} heightCm - قد به سانتی‌متر
 * @param {string} gender   - 'male' یا 'female'
 * @param {number} ageYears - سن به سال
 * @returns {object|null}
 */
function calculateWHtR(waistCm, heightCm, gender, ageYears) {
    // اعتبارسنجی ورودی‌ها
    if (
        !waistCm || !heightCm ||
        isNaN(waistCm) || isNaN(heightCm) ||
        waistCm <= 0 || heightCm <= 0 ||
        waistCm < 40 || waistCm > 200
    ) {
        return null;
    }

    const ratio = parseFloat((waistCm / heightCm).toFixed(3));

    // تعیین وضعیت بر اساس جنسیت
    // مرجع: Ashwell & Gibson 2016 + WHO thresholds
    let statusKey, statusLabel, color, cssClass, description, advice;

    if (gender === 'female') {
        // آستانه‌های زنان
        if (ratio < 0.34) {
            statusKey   = 'low';
            statusLabel = 'بسیار لاغر';
            color       = '#0ea5e9';
            cssClass    = 'status-low';
            description = 'نسبت دور کمر به قد شما پایین‌تر از حد طبیعی است. این می‌تواند نشانه‌ای از کمبود چربی یا توده عضلانی ناکافی باشد.';
            advice      = 'توصیه می‌شود با یک متخصص تغذیه مشورت کنید تا برنامه افزایش وزن سالم و متعادل برای شما طراحی شود.';
        } else if (ratio <= 0.46) {
            statusKey   = 'normal';
            statusLabel = 'محدوده سالم';
            color       = '#22c55e';
            cssClass    = 'status-normal';
            description = 'عالی! نسبت دور کمر به قد شما در محدوده سالم قرار دارد. این نشان‌دهنده توزیع متعادل چربی بدن و ریسک پایین بیماری‌های قلبی-متابولیک است.';
            advice      = 'وضعیت فعلی خود را با ادامه تغذیه سالم و فعالیت بدنی منظم حفظ کنید.';
        } else if (ratio <= 0.54) {
            statusKey   = 'medium';
            statusLabel = 'اضافه‌وزن خفیف';
            color       = '#f59e0b';
            cssClass    = 'status-medium';
            description = 'نسبت دور کمر به قد شما کمی بالاتر از حد مطلوب است. تجمع چربی در ناحیه شکمی ریسک بیماری‌های قلبی و دیابت را افزایش می‌دهد.';
            advice      = 'کاهش مصرف کربوهیدرات‌های ساده و چربی‌های اشباع‌شده، همراه با ورزش هوازی منظم (حداقل ۱۵۰ دقیقه در هفته) توصیه می‌شود.';
        } else if (ratio <= 0.58) {
            statusKey   = 'high';
            statusLabel = 'اضافه‌وزن';
            color       = '#f97316';
            cssClass    = 'status-high';
            description = 'نسبت دور کمر به قد شما در محدوده اضافه‌وزن است. چربی احشایی (شکمی) در این سطح می‌تواند ریسک قابل‌توجهی برای سلامت ایجاد کند.';
            advice      = 'مراجعه به متخصص تغذیه و پزشک برای برنامه کاهش وزن ساختاریافته و ارزیابی فشار خون و قند خون توصیه می‌شود.';
        } else {
            statusKey   = 'veryhigh';
            statusLabel = 'چاقی مرکزی';
            color       = '#ef4444';
            cssClass    = 'status-veryhigh';
            description = 'نسبت دور کمر به قد شما در محدوده چاقی مرکزی است. این وضعیت با ریسک بالای بیماری‌های قلبی-عروقی، دیابت نوع ۲ و سندرم متابولیک همراه است.';
            advice      = 'اقدام فوری با مراجعه به پزشک متخصص ضروری است. کاهش وزن تدریجی (۰.۵ تا ۱ کیلوگرم در هفته) با رژیم غذایی متعادل و ورزش منظم توصیه می‌شود.';
        }
    } else {
        // آستانه‌های مردان
        if (ratio < 0.34) {
            statusKey   = 'low';
            statusLabel = 'بسیار لاغر';
            color       = '#0ea5e9';
            cssClass    = 'status-low';
            description = 'نسبت دور کمر به قد شما پایین‌تر از حد طبیعی است. این ممکن است نشانه کمبود توده عضلانی یا چربی بدن باشد.';
            advice      = 'با یک متخصص تغذیه مشورت کنید تا برنامه‌ای برای افزایش وزن سالم و تقویت عضلات برای شما تهیه شود.';
        } else if (ratio <= 0.53) {
            statusKey   = 'normal';
            statusLabel = 'محدوده سالم';
            color       = '#22c55e';
            cssClass    = 'status-normal';
            description = 'عالی! نسبت دور کمر به قد شما در محدوده سالم قرار دارد. این نشان‌دهنده توزیع مطلوب چربی و ریسک پایین بیماری‌های متابولیک است.';
            advice      = 'وضعیت فعلی خود را با تغذیه سالم، فعالیت بدنی منظم و خواب کافی حفظ کنید.';
        } else if (ratio <= 0.58) {
            statusKey   = 'medium';
            statusLabel = 'اضافه‌وزن خفیف';
            color       = '#f59e0b';
            cssClass    = 'status-medium';
            description = 'نسبت دور کمر به قد شما کمی از محدوده مطلوب فراتر رفته است. توجه بیشتر به تغذیه و فعالیت بدنی توصیه می‌شود.';
            advice      = 'ترکیبی از ورزش مقاومتی و هوازی، همراه با کاهش کربوهیدرات‌های فرآوری‌شده، می‌تواند به بهبود این شاخص کمک کند.';
        } else if (ratio <= 0.63) {
            statusKey   = 'high';
            statusLabel = 'اضافه‌وزن';
            color       = '#f97316';
            cssClass    = 'status-high';
            description = 'نسبت دور کمر به قد شما در محدوده اضافه‌وزن است. تجمع چربی احشایی در این سطح ریسک قابل‌توجهی برای سلامت قلب و متابولیسم ایجاد می‌کند.';
            advice      = 'مراجعه به پزشک برای ارزیابی کامل سلامت متابولیک و مشاوره با متخصص تغذیه برای برنامه کاهش وزن توصیه می‌شود.';
        } else {
            statusKey   = 'veryhigh';
            statusLabel = 'چاقی مرکزی';
            color       = '#ef4444';
            cssClass    = 'status-veryhigh';
            description = 'نسبت دور کمر به قد شما در محدوده چاقی مرکزی قرار دارد. این وضعیت با ریسک بسیار بالای بیماری‌های قلبی-عروقی، دیابت و فشار خون بالا همراه است.';
            advice      = 'مراجعه فوری به پزشک ضروری است. برنامه کاهش وزن جامع شامل رژیم غذایی کم‌کالری، ورزش منظم و پایش دوره‌ای سلامت توصیه می‌شود.';
        }
    }

    // محاسبه موقعیت نشانگر روی نوار (0% تا 100%)
    // بازه نوار: 0.28 تا 0.72
    const barMin = 0.28;
    const barMax = 0.72;
    const clampedRatio = Math.max(barMin, Math.min(barMax, ratio));
    const indicatorPercent = ((clampedRatio - barMin) / (barMax - barMin)) * 100;

    return {
        ratio,
        statusKey,
        statusLabel,
        color,
        cssClass,
        description,
        advice,
        indicatorPercent,
        waistCm,
        heightCm,
        gender
    };
}

/**
 * نمایش نتایج WHtR در صفحه
 * @param {object|null} whtrResult - خروجی calculateWHtR
 */
function displayWHtRResult(whtrResult) {
    const card = document.getElementById('whtr-card');
    if (!card) return;

    // اگر دور کمر وارد نشده یا محاسبه ناموفق بود، کارت را مخفی کن
    if (!whtrResult) {
        card.style.display = 'none';
        return;
    }

    // نمایش کارت
    card.style.display = 'block';

    // مقدار WHtR
    const valueEl = document.getElementById('whtr-value');
    if (valueEl) valueEl.textContent = whtrResult.ratio.toFixed(2);

    // وضعیت متنی
    const statusEl = document.getElementById('whtr-status-text');
    if (statusEl) {
        statusEl.textContent = whtrResult.statusLabel;
        statusEl.style.color = whtrResult.color;
    }

    // توضیح
    const descEl = document.getElementById('whtr-description');
    if (descEl) descEl.textContent = whtrResult.description;

    // کلاس رنگ دایره
    const circleEl = document.getElementById('whtr-circle');
    if (circleEl) {
        circleEl.className = 'whtr-circle ' + whtrResult.cssClass;
    }

    // موقعیت نشانگر روی نوار
    const indicator = document.getElementById('whtr-indicator');
    if (indicator) {
        // تأخیر کوچک برای انیمیشن
        setTimeout(() => {
            indicator.style.left = whtrResult.indicatorPercent + '%';
        }, 150);
    }

    // توصیه
    const adviceEl = document.getElementById('whtr-advice-text');
    if (adviceEl) adviceEl.textContent = whtrResult.advice;
}

/* =========================================
 * تابع اصلی محاسبه BMI
 * ========================================= */
function calculateBMI() {
    // دریافت مقادیر ورودی
    const weight = parseFloat(document.getElementById('weight').value);
    const heightCm = parseFloat(document.getElementById('height').value);
    const gender = document.getElementById('gender').value;
    const activity = document.getElementById('activity').value;

    const birthYear = parseInt(document.getElementById('birthYear').value);
    const birthMonth = parseInt(document.getElementById('birthMonth').value);
    const birthDay = parseInt(document.getElementById('birthDay').value);

    // تاریخ فعلی (شمسی)
    const currentYear = 1404;
    const currentMonth = 11;
    const currentDay = 24;

    // اعتبارسنجی ورودی‌ها
    if (!weight || !heightCm || !birthYear || !birthMonth || !birthDay) {
        alert('لطفاً تمام فیلدهای ضروری را پر کنید');
        return;
    }

    // محاسبه سن دقیق
    const age = calculatePersianAge(birthYear, birthMonth, birthDay, currentYear, currentMonth, currentDay);
    const ageYears = age.years;

    // محاسبه BMI
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);

    // تعیین وضعیت BMI
    let status, statusClass, statusColor;
    if (bmi < 18.5) {
        status = 'کمبود وزن';
        statusClass = 'status-underweight';
        statusColor = '#3b82f6';
    } else if (bmi < 25) {
        status = 'وزن طبیعی';
        statusClass = 'status-normal';
        statusColor = '#22c55e';
    } else if (bmi < 30) {
        status = 'اضافه وزن';
        statusClass = 'status-overweight';
        statusColor = '#f59e0b';
    } else {
        status = 'چاقی';
        statusClass = 'status-obese';
        statusColor = '#ef4444';
    }

    // محاسبه BMR و TDEE
    const bmr = calculateBMR(weight, heightCm, ageYears, gender);
    const tdee = calculateTDEE(bmr, activity);

    // محاسبه وزن ایده‌آل (فرمول Devine)
    let idealWeight;
    if (gender === 'male') {
        idealWeight = 50 + 2.3 * ((heightCm / 2.54) - 60);
    } else {
        idealWeight = 45.5 + 2.3 * ((heightCm / 2.54) - 60);
    }

    // محاسبه WHtR
    const waistInput = document.getElementById('waist');
    const waistValue = waistInput ? parseFloat(waistInput.value) : null;
    const whtrResult = calculateWHtR(waistValue, heightCm, gender, ageYears);
    displayWHtRResult(whtrResult);

    // نمایش نتایج BMI
    document.getElementById('bmi-value').textContent = bmi.toFixed(1);
    document.getElementById('bmi-status').textContent = status;
    document.getElementById('bmi-status').className = 'status-badge ' + statusClass;

    // نمایش سن
    document.getElementById('age-display').textContent = 
        `${ageYears} سال، ${age.months} ماه و ${age.days} روز`;

    // نمایش BMR و TDEE
    document.getElementById('bmr-value').textContent = Math.round(bmr);
    document.getElementById('tdee-value').textContent = Math.round(tdee);

    // توصیه‌های کالری
    const maintainCalories = Math.round(tdee);
    const loseWeightCalories = Math.round(tdee - 500);
    const gainWeightCalories = Math.round(tdee + 500);

    document.getElementById('maintain-calories').textContent = maintainCalories;
    document.getElementById('lose-calories').textContent = loseWeightCalories;
    document.getElementById('gain-calories').textContent = gainWeightCalories;

    // نمایش وزن ایده‌آل
    document.getElementById('ideal-weight').textContent = idealWeight.toFixed(1);

    // نمایش بخش نتایج
    document.getElementById('input-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';

    // ذخیره نتایج در localStorage
    const result = {
        date: new Date().toLocaleDateString('fa-IR'),
        bmi: bmi.toFixed(1),
        status,
        weight,
        height: heightCm,
        age: ageYears,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        idealWeight: idealWeight.toFixed(1)
    };

    // ذخیره WHtR در نتیجه
    if (whtrResult) {
        result.whtr = whtrResult.ratio;
        result.whtrLabel = whtrResult.statusLabel;
    }

    // ذخیره در تاریخچه
    let history = JSON.parse(localStorage.getItem('bmiHistory') || '[]');
    history.unshift(result);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('bmiHistory', JSON.stringify(history));
}

// محاسبه مجدد
function recalculate() {
    document.getElementById('input-section').style.display = 'block';
    document.getElementById('results-section').style.display = 'none';
}

// چاپ نتایج
function printResults() {
    window.print();
}

// دانلود PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // فونت فارسی
    doc.addFont('https://cdn.jsdelivr.net/gh/font-store/font-yekan@master/Yekan.ttf', 'Yekan', 'normal');
    doc.setFont('Yekan');
    doc.setR2L(true);

    // عنوان
    doc.setFontSize(18);
    doc.text('گزارش محاسبات سلامت', 105, 20, { align: 'center' });

    // خط جداکننده
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    // اطلاعات BMI
    doc.setFontSize(14);
    doc.text('شاخص توده بدنی (BMI)', 190, 35, { align: 'right' });
    
    const bmiValue = document.getElementById('bmi-value').textContent;
    const bmiStatus = document.getElementById('bmi-status').textContent;
    
    doc.setFontSize(12);
    doc.text(`مقدار: ${bmiValue}`, 190, 45, { align: 'right' });
    doc.text(`وضعیت: ${bmiStatus}`, 190, 52, { align: 'right' });

    // اطلاعات متابولیسم
    doc.setFontSize(14);
    doc.text('اطلاعات متابولیسم', 190, 65, { align: 'right' });
    
    const bmrValue = document.getElementById('bmr-value').textContent;
    const tdeeValue = document.getElementById('tdee-value').textContent;
    
    doc.setFontSize(12);
    doc.text(`BMR: ${bmrValue} کالری`, 190, 75, { align: 'right' });
    doc.text(`TDEE: ${tdeeValue} کالری`, 190, 82, { align: 'right' });

    // اطلاعات WHtR (در صورت وجود)
    const whtrCard = document.getElementById('whtr-card');
    if (whtrCard && whtrCard.style.display !== 'none') {
        doc.setFontSize(14);
        doc.text('نسبت دور کمر به قد (WHtR)', 190, 95, { align: 'right' });
        
        const whtrValue = document.getElementById('whtr-value').textContent;
        const whtrStatus = document.getElementById('whtr-status-text').textContent;
        
        doc.setFontSize(12);
        doc.text(`مقدار: ${whtrValue}`, 190, 105, { align: 'right' });
        doc.text(`وضعیت: ${whtrStatus}`, 190, 112, { align: 'right' });
    }

    // توصیه‌های کالری
    const yPos = whtrCard && whtrCard.style.display !== 'none' ? 125 : 95;
    doc.setFontSize(14);
    doc.text('توصیه‌های کالری روزانه', 190, yPos, { align: 'right' });
    
    const maintain = document.getElementById('maintain-calories').textContent;
    const lose = document.getElementById('lose-calories').textContent;
    const gain = document.getElementById('gain-calories').textContent;
    
    doc.setFontSize(12);
    doc.text(`حفظ وزن: ${maintain} کالری`, 190, yPos + 10, { align: 'right' });
    doc.text(`کاهش وزن: ${lose} کالری`, 190, yPos + 17, { align: 'right' });
    doc.text(`افزایش وزن: ${gain} کالری`, 190, yPos + 24, { align: 'right' });

    // تاریخ
    doc.setFontSize(10);
    const date = new Date().toLocaleDateString('fa-IR');
    doc.text(`تاریخ: ${date}`, 190, 280, { align: 'right' });

    // ذخیره فایل
    doc.save('health-report.pdf');
}

// نمایش تاریخچه
function showHistory() {
    const history = JSON.parse(localStorage.getItem('bmiHistory') || '[]');
    const modal = document.getElementById('history-modal');
    const tbody = document.getElementById('history-tbody');
    
    tbody.innerHTML = '';
    
    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ سابقه‌ای ثبت نشده است</td></tr>';
    } else {
        history.forEach(item => {
            const row = document.createElement('tr');
            
            // ستون WHtR (در صورت وجود)
            const whtrCell = item.whtr 
                ? `${item.whtr.toFixed(2)} (${item.whtrLabel})` 
                : '-';
            
            row.innerHTML = `
                <td>${item.date}</td>
                <td>${item.bmi}</td>
                <td>${whtrCell}</td>
                <td>${item.status}</td>
                <td>${item.weight} کیلوگرم</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    modal.style.display = 'flex';
}

// بستن مودال
function closeHistory() {
    document.getElementById('history-modal').style.display = 'none';
}

// بستن مودال با کلیک بیرون از آن
window.onclick = function(event) {
    const modal = document.getElementById('history-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// پاک کردن تاریخچه
function clearHistory() {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام تاریخچه را پاک کنید؟')) {
        localStorage.removeItem('bmiHistory');
        closeHistory();
        alert('تاریخچه با موفقیت پاک شد');
    }
}

// بارگذاری اولیه صفحه
document.addEventListener('DOMContentLoaded', function() {
    // تنظیم سال‌های تولد (1300 تا 1404)
    const birthYearSelect = document.getElementById('birthYear');
    for (let year = 1404; year >= 1300; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        birthYearSelect.appendChild(option);
    }

    // تنظیم ماه‌ها
    const months = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    
    const birthMonthSelect = document.getElementById('birthMonth');
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        birthMonthSelect.appendChild(option);
    });

    // به‌روزرسانی روزها بر اساس ماه و سال انتخابی
    function updateDays() {
        const year = parseInt(birtYearSelect.value);
        const month = parseInt(birthMonthSelect.value);
        const daySelect = document.getElementById('birthDay');
        
        if (!year || !month) return;
        
        const daysInMonth = getPersianMonthDays(month, year);
        const currentDay = parseInt(daySelect.value) || 1;
        
        daySelect.innerHTML = '';
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            daySelect.appendChild(option);
        }
        
        // انتخاب روز قبلی یا آخرین روز
        daySelect.value = Math.min(currentDay, daysInMonth);
    }

    birthYearSelect.addEventListener('change', updateDays);
    birthMonthSelect.addEventListener('change', updateDays);

    // مقداردهی اولیه روزها
    updateDays();
});
