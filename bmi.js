/* ==========================================
   🧮 BMI Calculator Logic with:
   * WHO LMS Z-Score (Children & Teens 5-19 years)
   * Adult BMI + WHtR
   * Exact Jalali Age with Leap Year Support
   * Auto-Update Current Date
   ========================================== */

/* ---------- تاریخ جاری شمسی (Auto-Update) ---------- */
function getCurrentJalaliDate() {
    // تبدیل تاریخ میلادی به شمسی با الگوریتم دقیق
    const now = new Date();
    const gy = now.getFullYear();
    const gm = now.getMonth() + 1;
    const gd = now.getDate();
    
    let g_d_no, jy, jm, jd;
    const g_d_arr = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    
    if (gm > 2) {
        g_d_no = 355666 + (365 * gy) + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) + gd + g_d_arr[gm - 1];
    } else {
        g_d_no = 355666 + (365 * gy) + Math.floor((gy + 2) / 4) - Math.floor((gy + 98) / 100) + Math.floor((gy + 398) / 400) + gd + g_d_arr[gm - 1];
    }
    
    jy = -1595 + 33 * Math.floor(g_d_no / 12053);
    g_d_no = g_d_no % 12053;
    
    jy += 4 * Math.floor(g_d_no / 1461);
    g_d_no = g_d_no % 1461;
    
    if (g_d_no > 365) {
        jy += Math.floor((g_d_no - 1) / 365);
        g_d_no = (g_d_no - 1) % 365;
    }
    
    if (g_d_no < 186) {
        jm = 1 + Math.floor(g_d_no / 31);
        jd = 1 + (g_d_no % 31);
    } else {
        jm = 7 + Math.floor((g_d_no - 186) / 30);
        jd = 1 + ((g_d_no - 186) % 30);
    }
    
    return { year: jy, month: jm, day: jd };
}

const jalaliNow = getCurrentJalaliDate();
const CURRENT_JALALI_YEAR = jalaliNow.year;
const CURRENT_JALALI_MONTH = jalaliNow.month;
const CURRENT_JALALI_DAY = jalaliNow.day;

/* ---------- Motivation Quotes ---------- */
const MOTIVATIONS = [
    "تغییرات کوچک، نتایج بزرگ می‌سازند 🎯",
    "بدن سالم، ذهن قوی می‌سازد 🌱",
    "امروز بهترین روز برای شروع است ✨",
    "ثبات، راز موفقیت در سلامتی است 💪",
    "سلامتی سرمایه‌ای است که هر روز باید به آن سرمایه‌گذاری کنید 🌱",
    "بهترین سرمایه‌گذاری، سرمایه‌گذاری روی سلامتی خودتان است 💪",
    "هر قدم کوچک به سمت سلامتی، یک پیروزی بزرگ است ✨",
    "بدن شما خانه‌ای است که تا آخر عمر در آن زندگی خواهید کرد 🏡",
    "سلامتی یک انتخاب روزانه است، نه یک هدف موقت 🎯"
];

/* ---------- Helpers ---------- */
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function showError(msg) {
    const el = document.getElementById("error-message");
    el.textContent = msg;
}

function clearError() {
    showError("");
}

/* ==========================================
   تابع تشخیص سال کبیسه شمسی
   ========================================== */
function isJalaliLeapYear(year) {
    // الگوریتم 33-ساله تقویم جلالی
    const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
    const modulo = year % 33;
    return breaks.includes(modulo);
}

/* ==========================================
   تابع تعداد روزهای ماه شمسی
   ========================================== */
function getJalaliMonthDays(year, month) {
    if (month >= 1 && month <= 6) {
        return 31; // فروردین تا شهریور
    } else if (month >= 7 && month <= 11) {
        return 30; // مهر تا بهمن
    } else if (month === 12) {
        return isJalaliLeapYear(year) ? 30 : 29; // اسفند
    }
    return 0;
}

/* ==========================================
   اعتبارسنجی تاریخ تولد با کبیسه
   ========================================== */
function validateBirthDate(year, month, day) {
    // بررسی محدوده سال
    if (year < 1300 || year > CURRENT_JALALI_YEAR) {
        return { 
            valid: false, 
            error: `❌ سال تولد باید بین ۱۳۰۰ تا ${CURRENT_JALALI_YEAR} باشد.` 
        };
    }

    // بررسی محدوده ماه
    if (month < 1 || month > 12) {
        return { valid: false, error: '❌ ماه تولد نامعتبر است.' };
    }

    // بررسی روز با توجه به کبیسه
    const maxDays = getJalaliMonthDays(year, month);
    if (day < 1 || day > maxDays) {
        if (month === 12 && day === 30 && !isJalaliLeapYear(year)) {
            return { 
                valid: false, 
                error: `❌ سال ${year} کبیسه نیست - اسفند فقط ۲۹ روز دارد.` 
            };
        }
        return { 
            valid: false, 
            error: `❌ روز ${day} برای ماه ${month} نامعتبر است (حداکثر: ${maxDays} روز).` 
        };
    }

    // بررسی تاریخ آینده
    if (year === CURRENT_JALALI_YEAR) {
        if (month > CURRENT_JALALI_MONTH || 
            (month === CURRENT_JALALI_MONTH && day > CURRENT_JALALI_DAY)) {
            return { valid: false, error: '❌ تاریخ تولد نمی‌تواند در آینده باشد.' };
        }
    }

    return { valid: true };
}

/* ==========================================
   محاسبه سن دقیق با در نظر گرفتن کبیسه
   ========================================== */
function calculateExactAge(birthYear, birthMonth, birthDay) {
    let years = CURRENT_JALALI_YEAR - birthYear;
    let months = CURRENT_JALALI_MONTH - birthMonth;
    let days = CURRENT_JALALI_DAY - birthDay;

    // تنظیم روزها
    if (days < 0) {
        months--;
        const prevMonth = CURRENT_JALALI_MONTH === 1 ? 12 : CURRENT_JALALI_MONTH - 1;
        const prevYear = CURRENT_JALALI_MONTH === 1 ? CURRENT_JALALI_YEAR - 1 : CURRENT_JALALI_YEAR;
        days += getJalaliMonthDays(prevYear, prevMonth);
    }

    // تنظیم ماه‌ها
    if (months < 0) {
        years--;
        months += 12;
    }

    // محاسبه کل ماه‌ها (برای WHO)
    const totalMonths = years * 12 + months;

    return { years, months, days, totalMonths };
}

/* ---------- BMI ---------- */
function calculateBMI(weight, heightCm) {
    const h = heightCm / 100;
    return weight / (h * h);
}

/* ---------- WHtR (Waist-to-Height Ratio) ---------- */
function calculateWHtR(waist, heightCm) {
    return waist / heightCm;
}

function getWHtRStatus(whtr) {
    if (whtr < 0.40) {
        return { label: "کم‌وزن غیرطبیعی", color: "#3B82F6", risk: "کم" };
    } else if (whtr >= 0.40 && whtr < 0.50) {
        return { label: "سالم", color: "#22C55E", risk: "طبیعی" };
    } else if (whtr >= 0.50 && whtr < 0.60) {
        return { label: "ریسک متوسط", color: "#EAB308", risk: "افزایش خطر" };
    } else {
        return { label: "ریسک بالا", color: "#DC2626", risk: "خطر جدی" };
    }
}

/* ---------- WHO Z-Score ---------- */
function calculateZScore(bmi, L, M, S) {
    if (L === 0) return Math.log(bmi / M) / S;
    return (Math.pow(bmi / M, L) - 1) / (L * S);
}

function classifyWHO(z) {
    if (z < -3) return { label: "لاغری شدید", color: "#EF4444", zMin: -2 };
    if (z < -2) return { label: "لاغری", color: "#F97316", zMin: -2 };
    if (z <= 1) return { label: "نرمال", color: "#22C55E", zMin: -2 };
    if (z <= 2) return { label: "اضافه‌وزن", color: "#EAB308", zMin: 1 };
    return { label: "چاقی", color: "#DC2626", zMin: 1 };
}

/* ---------- Adult BMI ---------- */
function classifyAdultBMI(bmi) {
    if (bmi < 18.5) return { label: "کم‌وزن", color: "#F97316", target: 18.5 };
    if (bmi < 25) return { label: "نرمال", color: "#22C55E", target: 24.9 };
    if (bmi < 30) return { label: "اضافه‌وزن", color: "#EAB308", target: 24.9 };
    return { label: "چاقی", color: "#DC2626", target: 24.9 };
}

/* ---------- BMR & TDEE ---------- */
function calculateBMR(gender, weight, height, ageYears) {
    return gender === "مرد"
        ? 10 * weight + 6.25 * height - 5 * ageYears + 5
        : 10 * weight + 6.25 * height - 5 * ageYears - 161;
}

function calculateTDEE(bmr, activity) {
    return bmr * activity;
}

/* ---------- Practical Tips Based on Status ---------- */
function generatePracticalTips(statusLabel, bmi, age) {
    const tips = {
        "لاغری شدید": [
            "🍽️ وعده‌های غذایی خود را به ۵-۶ وعده کوچک در روز تقسیم کنید تا اشتها بهتر تحریک شود",
            "🥜 مواد غذایی پرکالری و مغذی مانند آجیل، کره بادام‌زمینی و خرما مصرف کنید",
            "💪 ورزش‌های مقاومتی انجام دهید تا عضله‌سازی کنید، نه چربی‌سوزی",
            "⚕️ با متخصص تغذیه مشورت کنید تا علت کم‌وزنی شناسایی شود"
        ],
        "لاغری": [
            "🥗 پروتئین کافی مصرف کنید: گوشت، تخم‌مرغ، لبنیات و حبوبات",
            "🏋️ تمرینات قدرتی ۳ بار در هفته برای افزایش توده عضلانی",
            "🍌 میان‌وعده‌های مغذی مانند موز با کره بادام‌زمینی اضافه کنید",
            "💧 مایعات را بین وعده‌ها بنوشید تا احساس سیری زودهنگام نداشته باشید"
        ],
        "نرمال": [
            "✅ الگوی غذایی فعلی را حفظ کنید و تنوع را فراموش نکنید",
            "🚶 حداقل ۳۰ دقیقه فعالیت بدنی روزانه برای حفظ سلامت قلب",
            "🥦 نصف بشقاب را سبزیجات، یک‌چهارم پروتئین و یک‌چهارم کربوهیدرات سالم اختصاص دهید",
            "😴 خواب کافی (۷-۹ ساعت) برای تنظیم هورمون‌های اشتها ضروری است"
        ],
        "اضافه‌وزن": [
            "🔥 کسری کالری ۳۰۰-۵۰۰ واحد برای کاهش وزن تدریجی و پایدار",
            "🚴 ترکیب کاردیو و تمرینات قدرتی ۴-۵ بار در هفته",
            "🍬 قندهای ساده (نوشابه، شیرینی) را محدود کنید و با میوه جایگزین کنید",
            "📊 رژیم غذایی را ردیابی کنید تا از میزان کالری دریافتی مطمئن شوید"
        ],
        "چاقی": [
            "⚕️ مشاوره با متخصص تغذیه و پزشک برای برنامه کاهش وزن تخصصی",
            "🏃 شروع با پیاده‌روی ۲۰ دقیقه‌ای و افزایش تدریجی شدت",
            "🍽️ کنترل اندازه وعده‌ها: از ظروف کوچک‌تر استفاده کنید",
            "🧘 کنترل استرس و خواب کافی برای تنظیم هورمون‌های چاقی (کورتیزول و گرلین)"
        ],
        "کم‌وزن": [
            "🥛 افزودن شیر، پنیر و ماست پرچرب به رژیم غذایی",
            "🍚 کربوهیدرات‌های سالم مانند برنج قهوه‌ای، سیب‌زمینی و غلات کامل",
            "🏋️ تمرینات مقاومتی برای افزایش توده عضلانی به‌جای چربی",
            "📈 افزایش تدریجی کالری (۲۰۰-۳۰۰ واحد هر هفته)"
        ]
    };

    // توصیه‌های ویژه کودکان و نوجوانان
    if (age < 18) {
        return [
            "👨‍👩‍👧 والدین باید با متخصص تغذیه کودکان مشورت کنند",
            "🎯 تمرکز بر عادات غذایی سالم به‌جای محدودیت‌های شدید",
            "🏃 فعالیت بدنی روزانه به‌صورت بازی و ورزش‌های گروهی",
            "📵 کاهش زمان صفحه‌نمایش و افزایش فعالیت‌های فیزیکی"
        ];
    }

    return tips[statusLabel] || tips["نرمال"];
}

/* ---------- Main ---------- */
function calculateAndGo() {
    clearError();

    const gender = document.getElementById("gender").value;
    const jy = +document.getElementById("birth-year").value;
    const jm = +document.getElementById("birth-month").value;
    const jd = +document.getElementById("birth-day").value;
    const height = +document.getElementById("height").value;
    const weight = +document.getElementById("weight").value;
    const waist = +document.getElementById("waist").value || 0; // اختیاری
    const activity = +document.getElementById("activity").value;

    if (!jy || !jm || !jd || !height || !weight) {
        showError("❌ لطفاً همه فیلدهای ضروری را کامل وارد کنید.");
        return;
    }

    /* ---------- اعتبارسنجی تاریخ تولد با کبیسه ---------- */
    const validation = validateBirthDate(jy, jm, jd);
    if (!validation.valid) {
        showError(validation.error);
        return;
    }

    /* ---------- محاسبه سن دقیق ---------- */
    const age = calculateExactAge(jy, jm, jd);

    /* ---------- بررسی سن منفی ---------- */
    if (age.years < 0 || age.totalMonths < 0) {
        showError("❌ تاریخ تولد نامعتبر است! لطفاً یک تاریخ گذشته وارد کنید.");
        return;
    }

    /* ---------- بررسی سن کمتر از 5 سال ---------- */
    if (age.totalMonths < 60) {
        showError("❌ این ابزار برای سنین ۵ سال به بالا طراحی شده است.");
        return;
    }

    const bmi = calculateBMI(weight, height);
    const h = height / 100;

    let statusText = "";
    let diffText = "";
    let healthyText = "";
    let color = "";

    /* ---------- WHO Children & Teens (5-19 سال) ---------- */
    if (age.totalMonths >= 60 && age.totalMonths <= 228) {
        const lms = getLMS(gender, age.totalMonths);
        if (!lms) {
            showError("❌ داده WHO برای این سن موجود نیست.");
            return;
        }

        const z = calculateZScore(bmi, lms.L, lms.M, lms.S);
        const cls = classifyWHO(z);
        color = cls.color;
        statusText = cls.label;

        const healthyMinBMI =
            lms.M * Math.pow(1 + lms.L * lms.S * (-2), 1 / lms.L);
        const healthyMaxBMI =
            lms.M * Math.pow(1 + lms.L * lms.S * (1), 1 / lms.L);

        const healthyMinW = healthyMinBMI * h * h;
        const healthyMaxW = healthyMaxBMI * h * h;

        healthyText = `${healthyMinW.toFixed(1)} تا ${healthyMaxW.toFixed(1)} کیلوگرم`;

        if (bmi < healthyMinBMI) {
            diffText = `کمبود وزن: ${(healthyMinW - weight).toFixed(1)} کیلوگرم`;
        } else if (bmi > healthyMaxBMI) {
            diffText = `اضافه وزن: ${(weight - healthyMaxW).toFixed(1)} کیلوگرم`;
        } else {
            diffText = "در محدوده سالم قرار دارید ✅";
        }
    }

    /* ---------- Adults (19+ سال) ---------- */
    else {
        const cls = classifyAdultBMI(bmi);
        color = cls.color;
        statusText = cls.label;

        const targetWeight = cls.target * h * h;
        const minW = 18.5 * h * h;
        const maxW = 24.9 * h * h;
        healthyText = `${minW.toFixed(1)} تا ${maxW.toFixed(1)} کیلوگرم`;

        if (bmi < 18.5) {
            diffText = `کمبود وزن: ${(targetWeight - weight).toFixed(1)} کیلوگرم`;
        } else if (bmi > 24.9) {
            diffText = `اضافه وزن: ${(weight - targetWeight).toFixed(1)} کیلوگرم`;
        } else {
            diffText = "در محدوده سالم قرار دارید ✅";
        }
    }

    const bmr = calculateBMR(gender, weight, height, age.years);
    const tdee = calculateTDEE(bmr, activity);

    /* ---------- محاسبه WHtR (اختیاری) ---------- */
    let whtrData = null;
    if (waist > 0) {
        const whtr = calculateWHtR(waist, height);
        whtrData = {
            value: whtr.toFixed(3),
            ...getWHtRStatus(whtr)
        };
    }

    /* ---------- UI ---------- */
    document.getElementById("r-gender").textContent = gender;
    document.getElementById("r-height").textContent = `${height} سانتی‌متر`;
    document.getElementById("r-weight").textContent = `${weight} کیلوگرم`;
    
    // نمایش سن دقیق (سال، ماه، روز)
    document.getElementById("r-age").textContent =
        `${age.years} سال، ${age.months} ماه و ${age.days} روز`;

    document.getElementById("bmi-value").textContent = bmi.toFixed(2);
    document.getElementById("bmi-circle").style.backgroundColor = color;
    document.getElementById("bmi-status-text").textContent = statusText;
    document.getElementById("bmi-difference-text").textContent = diffText;

    document.getElementById("r-healthy").textContent = healthyText;
    document.getElementById("r-bmr").textContent = `${Math.round(bmr)} kcal`;
    document.getElementById("r-tdee").textContent = `${Math.round(tdee)} kcal`;

    document.getElementById("maintain-calories").textContent =
        `${Math.round(tdee)} kcal`;
    document.getElementById("gain-calories").textContent =
        `${Math.round(tdee + 300)} kcal`;
    document.getElementById("loss-calories").textContent =
        `${Math.round(tdee - 500)} kcal`;

    /* ---------- نمایش WHtR ---------- */
    const whtrCard = document.getElementById("whtr-card");
    if (whtrData) {
        whtrCard.style.display = "block";
        document.getElementById("whtr-value").textContent = whtrData.value;
        document.getElementById("whtr-circle").style.backgroundColor = whtrData.color;
        document.getElementById("whtr-status-text").textContent = whtrData.label;
        document.getElementById("whtr-risk-text").textContent = `سطح ریسک: ${whtrData.risk}`;
    } else {
        whtrCard.style.display = "none";
    }

    /* ---------- نمایش توصیه‌های کاربردی ---------- */
    const practicalTips = generatePracticalTips(statusText, bmi, age.years);
    const tipsHTML = practicalTips.map(tip => `<p class="tip-item">✦ ${tip}</p>`).join("");
    document.getElementById("practical-tips").innerHTML = tipsHTML;

    showPage("results-page");
}

/* ---------- Events ---------- */
document.getElementById("calc-btn").onclick = calculateAndGo;
document.getElementById("back-btn").onclick = () => showPage("input-page");
document.getElementById("help-btn").onclick = () => showPage("guide-page");
document.getElementById("help-btn2").onclick = () => showPage("guide-page");
document.getElementById("back-guide-btn").onclick = () => showPage("input-page");

/* ---------- Motivation with Smooth Transition ---------- */
function showMotivation() {
    const el = document.getElementById("motivation-text");
    const randomQuote = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    
    // حالت محو شدن
    el.style.opacity = "0";
    
    setTimeout(() => {
        el.textContent = randomQuote;
        // حالت ظاهر شدن
        el.style.opacity = "1";
    }, 500);
}

// نمایش اولیه
showMotivation();

// تغییر هر 5 ثانیه
setInterval(showMotivation, 5000);
