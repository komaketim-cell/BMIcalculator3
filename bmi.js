/* =========================================
 * Core BMI / BMR / TDEE Logic
 * WHO LMS + Adult BMI
 * Exact Jalali Age
 * ========================================= */

/* ---------- Motivation Quotes ---------- */
const MOTIVATIONS = [
    "سلامتی، سرمایه‌ای است که هر روز می‌توانی روی آن سرمایه‌گذاری کنی.",
    "تغییرات کوچک، نتایج بزرگ می‌سازند.",
    "بدن سالم، ذهن قوی می‌سازد.",
    "امروز بهترین روز برای شروع است.",
    "ثبات، راز موفقیت در سلامتی است."
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

/* ---------- Exact Jalali Age ---------- */
function calculateExactAge(jy, jm, jd) {
    const today = new Date();
    const gy = today.getFullYear();
    const gm = today.getMonth() + 1;
    const gd = today.getDate();

    // تبدیل ساده ولی پایدار
    let by = jy + 621;
    let bm = jm;
    let bd = jd;

    let years = gy - by;
    let months = gm - bm;
    let days = gd - bd;

    if (days < 0) {
        days += 30;
        months -= 1;
    }
    if (months < 0) {
        months += 12;
        years -= 1;
    }

    const totalMonths = years * 12 + months;

    return { years, months, days, totalMonths };
}

/* ---------- BMI ---------- */
function calculateBMI(weight, heightCm) {
    const h = heightCm / 100;
    return weight / (h * h);
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

/* ---------- Main ---------- */
function calculateAndGo() {
    clearError();

    const gender = document.getElementById("gender").value;
    const jy = +document.getElementById("birth-year").value;
    const jm = +document.getElementById("birth-month").value;
    const jd = +document.getElementById("birth-day").value;
    const height = +document.getElementById("height").value;
    const weight = +document.getElementById("weight").value;
    const activity = +document.getElementById("activity").value;

    if (!jy || !jm || !jd || !height || !weight) {
        showError("لطفاً همه فیلدها را کامل وارد کنید.");
        return;
    }

    const age = calculateExactAge(jy, jm, jd);
    const bmi = calculateBMI(weight, height);
    const h = height / 100;

    let statusText = "";
    let diffText = "";
    let healthyText = "";
    let color = "";

    /* ---------- WHO Children & Teens ---------- */
    if (age.totalMonths >= 60 && age.totalMonths <= 228) {
        const lms = getLMS(gender, age.totalMonths);
        if (!lms) {
            showError("داده WHO برای این سن موجود نیست.");
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

    /* ---------- Adults ---------- */
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

    /* ---------- UI ---------- */
    document.getElementById("r-gender").textContent = gender;
    document.getElementById("r-height").textContent = `${height} سانتی‌متر`;
    document.getElementById("r-weight").textContent = `${weight} کیلوگرم`;
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

    showPage("results-page");
}

/* ---------- Events ---------- */
document.getElementById("calc-btn").onclick = calculateAndGo;
document.getElementById("back-btn").onclick = () => showPage("input-page");
document.getElementById("help-btn").onclick = () => showPage("guide-page");
document.getElementById("help-btn2").onclick = () => showPage("guide-page");
document.getElementById("back-guide-btn").onclick = () => showPage("input-page");

/* ---------- Motivation ---------- */
document.getElementById("motivation-text").textContent =
    MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
