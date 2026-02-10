// bmi.js - نسخه اصلاح‌شده با محاسبات کامل WHO LMS

// تابع محاسبه سن دقیق با تقویم جلالی
function calculateExactAge(birthYear, birthMonth, birthDay) {
    const todayJalali = {year: 1404, month: 11, day: 21};
    
    let years = todayJalali.year - birthYear;
    let months = todayJalali.month - birthMonth;
    let days = todayJalali.day - birthDay;
    
    if (days < 0) {
        months--;
        const daysInPrevMonth = 30;
        days += daysInPrevMonth;
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    const ageInYears = years + (months / 12) + (days / 365);
    const totalMonths = years * 12 + months;
    
    return {
        years: years,
        months: months,
        days: days,
        totalYears: ageInYears,
        totalMonths: totalMonths,
        display: `${years} سال و ${months} ماه و ${days} روز`
    };
}

// تابع محاسبه Z-score از LMS (مقدار به Z)
function lmsToZScore(value, L, M, S) {
    if (Math.abs(L) > 0.01) {
        return (Math.pow(value / M, L) - 1) / (L * S);
    } else {
        return Math.log(value / M) / S;
    }
}

// تابع محاسبه مقدار از Z-score (Z به مقدار) - اضافه شده
function zScoreToLMS(zScore, L, M, S) {
    if (Math.abs(L) > 0.01) {
        return M * Math.pow(1 + L * S * zScore, 1 / L);
    } else {
        return M * Math.exp(S * zScore);
    }
}

// تابع پیدا کردن داده LMS دقیق با interpolation
function getLMSForAge(gender, ageMonths) {
    const data = gender === 'male' ? WHO_BOYS_DATA : WHO_GIRLS_DATA;
    
    // محدود کردن سن به محدوده موجود
    if (ageMonths < 61) ageMonths = 61;
    if (ageMonths > 228) ageMonths = 228;
    
    // پیدا کردن دقیق‌ترین ماه
    const roundedMonth = Math.round(ageMonths);
    const exact = data.find(row => row.month === roundedMonth);
    if (exact) return exact;
    
    // اگر دقیقاً پیدا نشد، interpolation کن
    const lower = data.filter(row => row.month <= ageMonths).pop();
    const upper = data.find(row => row.month > ageMonths);
    
    if (!upper) return lower;
    if (!lower) return upper;
    
    // Linear interpolation
    const ratio = (ageMonths - lower.month) / (upper.month - lower.month);
    return {
        month: ageMonths,
        L: lower.L + (upper.L - lower.L) * ratio,
        M: lower.M + (upper.M - lower.M) * ratio,
        S: lower.S + (upper.S - lower.S) * ratio
    };
}

// تابع محاسبه BMI برای کودکان (WHO LMS)
function calculateChildBMI(gender, ageMonths, height, weight) {
    const lmsData = getLMSForAge(gender, ageMonths);
    
    const bmi = weight / Math.pow(height / 100, 2);
    const zScore = lmsToZScore(bmi, lmsData.L, lmsData.M, lmsData.S);
    
    let category, color;
    if (zScore < -2) {
        category = 'کم‌وزن شدید';
        color = '#4444ff';
    } else if (zScore < -1) {
        category = 'کم‌وزن';
        color = '#ffff44';
    } else if (zScore <= 1) {
        category = 'نرمال';
        color = '#44ff44';
    } else if (zScore <= 2) {
        category = 'اضافه‌وزن';
        color = '#ff8844';
    } else {
        category = 'چاقی';
        color = '#ff4444';
    }
    
    return { bmi, category, color, zScore };
}

// تابع محاسبه BMI برای بزرگسالان
function calculateAdultBMI(height, weight) {
    const bmi = weight / Math.pow(height / 100, 2);
    
    let category, color;
    if (bmi < 18.5) {
        category = 'کم‌وزن';
        color = '#4444ff';
    } else if (bmi < 25) {
        category = 'نرمال';
        color = '#44ff44';
    } else if (bmi < 30) {
        category = 'اضافه‌وزن';
        color = '#ff8844';
    } else {
        category = 'چاقی';
        color = '#ff4444';
    }
    
    return { bmi, category, color };
}

// تابع محاسبه محدوده وزن سالم - اصلاح شده
function calculateHealthyWeightRange(height, ageYears, gender, ageMonths) {
    const heightM = height / 100;
    
    if (ageYears < 19) {
        // برای کودکان: استفاده از LMS با Z-score بین -1 و +1
        const lmsData = getLMSForAge(gender, ageMonths);
        
        const zMin = -1;
        const zMax = 1;
        
        // استفاده از تابع معکوس اصلاح‌شده
        const bmiMin = zScoreToLMS(zMin, lmsData.L, lmsData.M, lmsData.S);
        const bmiMax = zScoreToLMS(zMax, lmsData.L, lmsData.M, lmsData.S);
        
        const minWeight = bmiMin * heightM * heightM;
        const maxWeight = bmiMax * heightM * heightM;
        
        return { 
            min: minWeight.toFixed(1), 
            max: maxWeight.toFixed(1) 
        };
    } else {
        // برای بزرگسالان
        const minWeight = 18.5 * heightM * heightM;
        const maxWeight = 24.9 * heightM * heightM;
        return { 
            min: minWeight.toFixed(1), 
            max: maxWeight.toFixed(1) 
        };
    }
}

// تابع محاسبه اختلاف وزن - اصلاح شده
function calculateWeightDifference(currentWeight, height, ageYears, gender, ageMonths, category) {
    const healthyRange = calculateHealthyWeightRange(height, ageYears, gender, ageMonths);
    const minWeight = parseFloat(healthyRange.min);
    const maxWeight = parseFloat(healthyRange.max);
    
    if (category.includes('کم‌وزن')) {
        const diff = minWeight - currentWeight;
        return `کمبود ${diff.toFixed(1)} کیلوگرم`;
    } else if (category.includes('اضافه‌وزن') || category.includes('چاقی')) {
        const diff = currentWeight - maxWeight;
        return `اضافه ${diff.toFixed(1)} کیلوگرم`;
    } else {
        return 'در محدوده سالم';
    }
}

// تابع محاسبه BMR (Mifflin-St Jeor)
function calculateBMR(gender, weight, height, ageYears) {
    if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * ageYears + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * ageYears - 161;
    }
}

// تابع محاسبه TDEE
function calculateTDEE(bmr, activityLevel) {
    return bmr * parseFloat(activityLevel);
}

// تابع اصلی محاسبه و نمایش - اصلاح شده
function calculateAndShow() {
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const birthYear = parseInt(document.getElementById('birth-year').value);
    const birthMonth = parseInt(document.getElementById('birth-month').value);
    const birthDay = parseInt(document.getElementById('birth-day').value);
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activity = document.getElementById('activity').value;
    
    if (!birthYear || !birthMonth || !birthDay || !height || !weight) {
        alert('لطفاً تمام فیلدها را پر کنید');
        return;
    }
    
    const ageData = calculateExactAge(birthYear, birthMonth, birthDay);
    
    if (ageData.totalYears < 5) {
        alert('این محاسبه‌گر برای افراد بالای ۵ سال طراحی شده است');
        return;
    }
    
    // نمایش اطلاعات فرد
    document.getElementById('result-gender').textContent = gender === 'male' ? 'مرد' : 'زن';
    document.getElementById('result-age').textContent = ageData.display;
    document.getElementById('result-height').textContent = height + ' سانتی‌متر';
    document.getElementById('result-weight').textContent = weight + ' کیلوگرم';
    
    // محاسبه BMI
    let bmiResult;
    if (ageData.totalYears < 19) {
        bmiResult = calculateChildBMI(gender, ageData.totalMonths, height, weight);
        console.log('استفاده از جدول WHO LMS - Z-score:', bmiResult.zScore.toFixed(2));
    } else {
        bmiResult = calculateAdultBMI(height, weight);
        console.log('استفاده از فرمول بزرگسالان');
    }
    
    // نمایش BMI
    document.getElementById('bmi-value').textContent = bmiResult.bmi.toFixed(1);
    document.getElementById('bmi-category').textContent = bmiResult.category;
    
    // محاسبه و نمایش اختلاف وزن
    const weightDiff = calculateWeightDifference(
        weight, 
        height, 
        ageData.totalYears, 
        gender, 
        ageData.totalMonths, 
        bmiResult.category
    );
    document.getElementById('weight-difference').textContent = weightDiff;
    
    // تنظیم موقعیت نشانگر BMI
    let indicatorPosition;
    if (bmiResult.bmi < 18.5) {
        indicatorPosition = (bmiResult.bmi / 18.5) * 20;
    } else if (bmiResult.bmi < 25) {
        indicatorPosition = 20 + ((bmiResult.bmi - 18.5) / (25 - 18.5)) * 30;
    } else if (bmiResult.bmi < 30) {
        indicatorPosition = 50 + ((bmiResult.bmi - 25) / (30 - 25)) * 25;
    } else {
        indicatorPosition = 75 + Math.min(((bmiResult.bmi - 30) / 10) * 25, 23);
    }
    document.getElementById('bmi-indicator').style.left = indicatorPosition + '%';
    
    // نمایش محدوده وزن سالم
    const healthyRange = calculateHealthyWeightRange(
        height, 
        ageData.totalYears, 
        gender, 
        ageData.totalMonths
    );
    document.getElementById('min-healthy-weight').textContent = healthyRange.min;
    document.getElementById('max-healthy-weight').textContent = healthyRange.max;
    
    // محاسبه BMR و TDEE
    const bmr = calculateBMR(gender, weight, height, ageData.years);
    const tdee = calculateTDEE(bmr, activity);
    
    document.getElementById('bmr-value').textContent = Math.round(bmr);
    document.getElementById('tdee-value').textContent = Math.round(tdee);
    
    // توصیه‌های کالری
    const maintainCalories = Math.round(tdee);
    const gainCalories = Math.round(tdee + 300);
    const loseCalories = Math.round(tdee - 500);
    
    document.getElementById('maintain-calories').textContent = maintainCalories;
    document.getElementById('gain-calories').textContent = gainCalories;
    document.getElementById('lose-calories').textContent = loseCalories;
    
    // نمایش صفحه نتایج
    document.getElementById('input-page').classList.remove('active');
    document.getElementById('results-page').classList.add('active');
}

function goBack() {
    document.getElementById('results-page').classList.remove('active');
    document.getElementById('guide-page').classList.remove('active');
    document.getElementById('input-page').classList.add('active');
}

async function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const gender = document.getElementById('result-gender').textContent;
        const age = document.getElementById('result-age').textContent;
        const height = document.getElementById('result-height').textContent;
        const weight = document.getElementById('result-weight').textContent;
        const bmi = document.getElementById('bmi-value').textContent;
        const category = document.getElementById('bmi-category').textContent;
        const weightDiff = document.getElementById('weight-difference').textContent;
        const minWeight = document.getElementById('min-healthy-weight').textContent;
        const maxWeight = document.getElementById('max-healthy-weight').textContent;
        const bmr = document.getElementById('bmr-value').textContent;
        const tdee = document.getElementById('tdee-value').textContent;
        const maintain = document.getElementById('maintain-calories').textContent;
        const gain = document.getElementById('gain-calories').textContent;
        const lose = document.getElementById('lose-calories').textContent;
        
        doc.setFontSize(20);
        doc.text('Health Report - WHO Standards', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        let y = 40;
        doc.text(`Gender: ${gender}`, 20, y); y += 10;
        doc.text(`Age: ${age}`, 20, y); y += 10;
        doc.text(`Height: ${height}`, 20, y); y += 10;
        doc.text(`Weight: ${weight}`, 20, y); y += 15;
        
        doc.text(`BMI: ${bmi}`, 20, y); y += 10;
        doc.text(`Status: ${category}`, 20, y); y += 10;
        doc.text(`${weightDiff}`, 20, y); y += 15;
        
        doc.text(`Healthy Weight Range:`, 20, y); y += 10;
        doc.text(`Min: ${minWeight} kg`, 20, y); y += 10;
        doc.text(`Max: ${maxWeight} kg`, 20, y); y += 15;
        
        doc.text(`BMR: ${bmr} kcal/day`, 20, y); y += 10;
        doc.text(`TDEE: ${tdee} kcal/day`, 20, y); y += 15;
        
        doc.text(`Calorie Recommendations:`, 20, y); y += 10;
        doc.text(`Maintain weight: ${maintain} kcal`, 20, y); y += 10;
        doc.text(`Gain weight/muscle: ${gain} kcal`, 20, y); y += 10;
        doc.text(`Lose weight (preserve muscle): ${lose} kcal`, 20, y);
        
        doc.save('health-report-who.pdf');
        alert('گزارش PDF با موفقیت ذخیره شد!');
    } catch (error) {
        alert('خطا در ایجاد PDF. لطفاً مجدداً تلاش کنید.');
        console.error(error);
    }
}

const quotes = [
    "سلامتی سرمایه‌ای است که هرگز از بین نمی‌رود",
    "بدن سالم، ذهن سالم",
    "ورزش و تغذیه مناسب کلید سلامتی است",
    "هر روز یک قدم به سمت سلامتی",
    "سلامتی بزرگترین هدیه زندگی است"
];

let quoteIndex = 0;
setInterval(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    const quoteElement = document.getElementById('quote-text');
    if (quoteElement) {
        quoteElement.style.opacity = '0';
        setTimeout(() => {
            quoteElement.textContent = '"' + quotes[quoteIndex] + '"';
            quoteElement.style.opacity = '1';
        }, 500);
    }
}, 5000);
