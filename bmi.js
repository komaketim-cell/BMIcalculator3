// ========================================
// محاسبات BMI، BMR، TDEE با الگوریتم WHO
// ========================================

// ---- تبدیل تاریخ شمسی به میلادی (تقریبی) ----
function jalaliToGregorian(jy, jm, jd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  
  const jdn = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  const j_day_no = jdn - 79;
  
  let leap = ((gy % 4 === 0) && (gy % 100 !== 0)) || (gy % 400 === 0) ? 1 : 0;
  let gy_temp = gy + Math.floor(j_day_no / 365.25);
  let gd_temp = j_day_no - Math.floor((gy_temp - gy) * 365.25);
  
  if (gd_temp >= 0) {
    gy = gy_temp;
  } else {
    gy = gy_temp - 1;
    gd_temp = j_day_no - Math.floor((gy - gy_temp) * 365.25);
  }
  
  leap = ((gy % 4 === 0) && (gy % 100 !== 0)) || (gy % 400 === 0) ? 1 : 0;
  
  let gm = 0;
  for (let i = 0; i < 12; i++) {
    const v = (i === 1 && leap === 1) ? 29 : (g_d_m[i] + ((i > 1) ? leap : 0));
    if (gd_temp < v) {
      gm = i;
      break;
    }
  }
  
  const gd = gd_temp - g_d_m[gm] + 1 - ((gm > 1) ? leap : 0);
  return { year: gy, month: gm + 1, day: gd };
}

// ---- محاسبه سن دقیق ----
function calculateAge(birthYear, birthMonth, birthDay) {
  const gregorianBirth = jalaliToGregorian(birthYear, birthMonth, birthDay);
  const today = new Date();
  
  let years = today.getFullYear() - gregorianBirth.year;
  let months = today.getMonth() + 1 - gregorianBirth.month;
  let days = today.getDate() - gregorianBirth.day;
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalDays = Math.floor((today - new Date(gregorianBirth.year, gregorianBirth.month - 1, gregorianBirth.day)) / (1000 * 60 * 60 * 24));
  const ageInYears = years + months / 12 + days / 365.25;
  
  return { years, months, days, totalDays, ageInYears };
}

// ---- درون‌یابی خطی LMS ----
function interpolateLMS(lmsData, ageInYears) {
  if (!lmsData || lmsData.length === 0) {
    throw new Error("داده‌های LMS موجود نیست");
  }
  
  // مرتب‌سازی بر اساس سن
  const sorted = lmsData.slice().sort((a, b) => a.age - b.age);
  
  // اگر سن کمتر از اولین نقطه
  if (ageInYears <= sorted[0].age) {
    return sorted[0];
  }
  
  // اگر سن بیشتر از آخرین نقطه
  if (ageInYears >= sorted[sorted.length - 1].age) {
    return sorted[sorted.length - 1];
  }
  
  // پیدا کردن دو نقطه برای درون‌یابی
  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    
    if (p1.age <= ageInYears && ageInYears <= p2.age) {
      // درون‌یابی خطی
      const t = (ageInYears - p1.age) / (p2.age - p1.age);
      
      return {
        age: ageInYears,
        L: p1.L + t * (p2.L - p1.L),
        M: p1.M + t * (p2.M - p1.M),
        S: p1.S + t * (p2.S - p1.S)
      };
    }
  }
  
  return sorted[sorted.length - 1];
}

// ---- محاسبه Z-Score با فرمول LMS ----
function calculateZScore(value, L, M, S) {
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

// ---- طبقه‌بندی Z-Score (مطابق کد پایتون) ----
function classifyZScore(z) {
  if (z < -3) return "لاغری شدید";
  if (z < -2) return "لاغری";
  if (z <= 1) return "نرمال";  // تغییر از +2 به +1
  if (z <= 2) return "اضافه وزن";
  if (z <= 3) return "چاقی";
  return "چاقی شدید";
}

// ---- محاسبه BMI ----
function calculateBMI(weight, height) {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

// ---- محاسبه BMR (Mifflin-St Jeor) ----
function calculateBMR(weight, height, age, isMale) {
  if (isMale) {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

// ---- محاسبه TDEE ----
function calculateTDEE(bmr, activityLevel) {
  const factors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };
  return bmr * (factors[activityLevel] || 1.2);
}

// ---- محاسبه محدوده وزن سالم کودک (با Z-Score) ----
function calculateHealthyWeightRangeChild(height, ageInYears, isMale) {
  const lmsData = isMale ? WHO_BMI_BOYS : WHO_BMI_GIRLS;
  const lms = interpolateLMS(lmsData, ageInYears);
  
  // محدوده نرمال: -2 <= z <= +1
  const zMin = -2;
  const zMax = 1;
  
  // فرمول معکوس LMS برای محاسبه BMI از Z-Score
  function bmiFromZScore(z, L, M, S) {
    if (L === 0) {
      return M * Math.exp(S * z);
    }
    return M * Math.pow(1 + L * S * z, 1 / L);
  }
  
  const bmiMin = bmiFromZScore(zMin, lms.L, lms.M, lms.S);
  const bmiMax = bmiFromZScore(zMax, lms.L, lms.M, lms.S);
  
  const heightInMeters = height / 100;
  const minWeight = bmiMin * heightInMeters * heightInMeters;
  const maxWeight = bmiMax * heightInMeters * heightInMeters;
  
  return { min: minWeight, max: maxWeight };
}

// ---- محاسبه محدوده وزن سالم بزرگسال ----
function calculateHealthyWeightRangeAdult(height) {
  const heightInMeters = height / 100;
  const minWeight = 18.5 * heightInMeters * heightInMeters;
  const maxWeight = 24.9 * heightInMeters * heightInMeters;
  return { min: minWeight, max: maxWeight };
}

// ---- طبقه‌بندی BMI بزرگسال ----
function classifyAdultBMI(bmi) {
  if (bmi < 18.5) return "کمبود وزن";
  if (bmi < 25) return "نرمال";
  if (bmi < 30) return "اضافه وزن";
  return "چاقی";
}

// ========================================
// تابع اصلی محاسبات
// ========================================
function calculateResults(formData) {
  const { birthYear, birthMonth, birthDay, weight, height, isMale, activityLevel } = formData;
  
  // محاسبه سن
  const age = calculateAge(birthYear, birthMonth, birthDay);
  const ageInYears = age.ageInYears;
  
  // محاسبه BMI
  const bmi = calculateBMI(weight, height);
  
  let category, zScore, healthyWeightRange;
  
  // تشخیص کودک/نوجوان (5-19 سال)
  if (ageInYears >= 5 && ageInYears < 19) {
    const lmsData = isMale ? WHO_BMI_BOYS : WHO_BMI_GIRLS;
    const lms = interpolateLMS(lmsData, ageInYears);
    
    zScore = calculateZScore(bmi, lms.L, lms.M, lms.S);
    category = classifyZScore(zScore);
    healthyWeightRange = calculateHealthyWeightRangeChild(height, ageInYears, isMale);
  } else {
    // بزرگسال
    category = classifyAdultBMI(bmi);
    healthyWeightRange = calculateHealthyWeightRangeAdult(height);
    zScore = null;
  }
  
  // محاسبه BMR و TDEE
  const bmr = calculateBMR(weight, height, ageInYears, isMale);
  const tdee = calculateTDEE(bmr, activityLevel);
  
  return {
    bmi: bmi.toFixed(1),
    category,
    zScore: zScore !== null ? zScore.toFixed(2) : null,
    age: {
      years: age.years,
      months: age.months,
      days: age.days,
      decimal: ageInYears.toFixed(2)
    },
    healthyWeightRange: {
      min: healthyWeightRange.min.toFixed(1),
      max: healthyWeightRange.max.toFixed(1)
    },
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTargets: {
      cut500: Math.round(tdee - 500),
      cut250: Math.round(tdee - 250),
      maintenance: Math.round(tdee),
      bulk250: Math.round(tdee + 250),
      bulk500: Math.round(tdee + 500)
    },
    weightDifference: (weight - healthyWeightRange.min).toFixed(1),
    isChild: ageInYears >= 5 && ageInYears < 19
  };
}

// ========================================
// توابع UI
// ========================================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
}

function handleSubmit(event) {
  event.preventDefault();
  
  const formData = {
    birthYear: parseInt(document.getElementById('birthYear').value),
    birthMonth: parseInt(document.getElementById('birthMonth').value),
    birthDay: parseInt(document.getElementById('birthDay').value),
    weight: parseFloat(document.getElementById('weight').value),
    height: parseFloat(document.getElementById('height').value),
    isMale: document.getElementById('gender').value === 'male',
    activityLevel: document.getElementById('activity').value
  };
  
  try {
    const results = calculateResults(formData);
    displayResults(results, formData);
    showPage('resultsPage');
  } catch (error) {
    alert('خطا در محاسبات: ' + error.message);
  }
}

function displayResults(results, formData) {
  // BMI
  document.getElementById('bmiValue').textContent = results.bmi;
  document.getElementById('bmiCategory').textContent = results.category;
  
  // رنگ‌بندی دسته‌بندی
  const categoryElement = document.getElementById('bmiCategory');
  categoryElement.className = 'value';
  
  if (results.isChild) {
    // رنگ‌بندی برای کودکان
    if (results.category === 'لاغری شدید' || results.category === 'لاغری') {
      categoryElement.classList.add('underweight');
    } else if (results.category === 'نرمال') {
      categoryElement.classList.add('normal');
    } else if (results.category === 'اضافه وزن') {
      categoryElement.classList.add('overweight');
    } else {
      categoryElement.classList.add('obese');
    }
    
    // نمایش Z-Score
    document.getElementById('zscoreRow').style.display = 'flex';
    document.getElementById('zscoreValue').textContent = results.zScore;
  } else {
    // رنگ‌بندی برای بزرگسالان
    if (results.category === 'کمبود وزن') {
      categoryElement.classList.add('underweight');
    } else if (results.category === 'نرمال') {
      categoryElement.classList.add('normal');
    } else if (results.category === 'اضافه وزن') {
      categoryElement.classList.add('overweight');
    } else {
      categoryElement.classList.add('obese');
    }
    
    document.getElementById('zscoreRow').style.display = 'none';
  }
  
  // سن
  document.getElementById('ageValue').textContent = 
    `${results.age.years} سال، ${results.age.months} ماه، ${results.age.days} روز`;
  
  // محدوده وزن سالم
  document.getElementById('healthyWeightValue').textContent = 
    `${results.healthyWeightRange.min} تا ${results.healthyWeightRange.max} کیلوگرم`;
  
  // BMR و TDEE
  document.getElementById('bmrValue').textContent = results.bmr;
  document.getElementById('tdeeValue').textContent = results.tdee;
  
  // اهداف کالری
  document.getElementById('cut500Value').textContent = results.calorieTargets.cut500;
  document.getElementById('cut250Value').textContent = results.calorieTargets.cut250;
  document.getElementById('maintenanceValue').textContent = results.calorieTargets.maintenance;
  document.getElementById('bulk250Value').textContent = results.calorieTargets.bulk250;
  document.getElementById('bulk500Value').textContent = results.calorieTargets.bulk500;
  
  // توصیه‌ها
  generateRecommendations(results, formData);
}

function generateRecommendations(results, formData) {
  const container = document.getElementById('recommendations');
  container.innerHTML = '';
  
  const recommendations = [];
  
  // توصیه براساس وضعیت
  if (results.isChild) {
    if (results.category === 'لاغری شدید' || results.category === 'لاغری') {
      recommendations.push('⚠️ لطفاً با پزشک متخصص اطفال مشورت کنید.');
      recommendations.push('🍎 تغذیه متعادل و کافی برای رشد ضروری است.');
    } else if (results.category === 'اضافه وزن' || results.category === 'چاقی' || results.category === 'چاقی شدید') {
      recommendations.push('⚠️ مشاوره با پزشک متخصص اطفال توصیه می‌شود.');
      recommendations.push('🏃 فعالیت بدنی روزانه حداقل 60 دقیقه.');
      recommendations.push('🥗 محدود کردن غذاهای پرکالری و نوشابه‌ها.');
    } else {
      recommendations.push('✅ وضعیت کودک در محدوده سالم است.');
      recommendations.push('🏃 فعالیت بدنی منظم برای رشد مناسب ضروری است.');
    }
  } else {
    if (results.category === 'کمبود وزن') {
      recommendations.push('📊 افزایش کالری روزانه با غذاهای مقوی.');
      recommendations.push('🏋️ تمرینات قدرتی برای افزایش توده عضلانی.');
    } else if (results.category === 'اضافه وزن' || results.category === 'چاقی') {
      recommendations.push('📉 کاهش تدریجی کالری (250-500 کالری کمتر از TDEE).');
      recommendations.push('🏃 ورزش هوازی 150 دقیقه در هفته.');
      recommendations.push('🍎 تغذیه متعادل با کاهش قندها و چربی‌های اشباع.');
    } else {
      recommendations.push('✅ وضعیت شما در محدوده سالم است.');
      recommendations.push('🎯 حفظ وزن فعلی با تغذیه متعادل و ورزش منظم.');
    }
  }
  
  // نمایش توصیه‌ها
  recommendations.forEach(rec => {
    const div = document.createElement('div');
    div.className = 'recommendation-item';
    div.textContent = rec;
    container.appendChild(div);
  });
  
  // جمله انگیزشی
  const motivationalQuotes = [
    '💪 سلامتی یک سفر است، نه یک مقصد.',
    '🌟 هر روز فرصتی برای بهتر شدن است.',
    '🎯 موفقیت حاصل تلاش‌های کوچک روزانه است.',
    '🌈 بدن شما شایسته بهترین مراقبت است.',
    '⭐ تغییرات کوچک، نتایج بزرگ.',
    '🔥 قدرت تو بیشتر از آن چیزی است که فکر می‌کنی.'
  ];
  
  const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  const quoteDiv = document.createElement('div');
  quoteDiv.className = 'motivational-quote';
  quoteDiv.textContent = quote;
  container.appendChild(quoteDiv);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('healthForm').addEventListener('submit', handleSubmit);
  
  document.querySele').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      showPage(page);
    });
  });
  
  document.getElementById('backToInput').addEventListener('click', () => {
    showPage('inputPage');
  });
  
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('healthForm').reset();
  });
});
