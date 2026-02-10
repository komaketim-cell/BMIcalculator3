/* =========================================
 * Core BMI / BMR / TDEE Logic
 * WHO LMS + Adult BMI
 * Jalali Age Calculation
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
    document.getElementById("error-message").textContent = msg;
}

function clearError() {
    showError("");
}

/* ---------- Jalali Age Calculation ---------- */
function calculateExactAge(jy, jm, jd) {
    const today = new Date();
    const gy = today.getFullYear();
    const gm = today.getMonth() + 1;
    const gd = today.getDate();

    // تبدیل ساده جلالی به میلادی (کافی برای محاسبه سن)
    const ageYears = gy - (jy + 621);
    let ageMonths = ageYears * 12 + (gm - jm);
    if (gd < jd) ageMonths -= 1;

    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;

    return {
        years,
        months,
        totalMonths: ageMonths
    };
}

/* ---------- BMI ---------- */
function calculateBMI(weight, heightCm) {
    const h = heightCm / 100;
    return weight / (h * h);
}

/* ---------- WHO Z-Score ---------- */
function calculateZScore(bmi, L, M, S) {
    if (L === 0) {
        return Math.log(bmi / M) / S;
    }
    return (Math.pow(bmi / M, L) - 1) / (L * S);
}

function classifyWHO(z) {
    if (z < -3) return { label: "لاغری شدید", color: "#EF4444" };
    if (z < -2) return { label: "لاغری", color: "#F97316" };
    if (z <= 1) return { label: "نرمال", color: "#22C55E" };
    if (z <= 2) return { label: "اضافه‌وزن", color: "#EAB308" };
    return { label: "چاقی", color: "#DC2626" };
}

/* ---------- Adult BMI ---------- */
function classifyAdultBMI(bmi) {
    if (bmi < 18.5) return { label: "کم‌وزن", color: "#F97316" };
    if (bmi < 25) return { label: "نرمال", color: "#22C55E" };
    if (bmi < 30) return { label: "اضافه‌وزن", color: "#EAB308" };
    return { label: "چاقی", color: "#DC2626" };
}

/* ---------- BMR & TDEE ---------- */
function calculateBMR(gender, weight, height, ageYears) {
    if (gender === "مرد") {
        return 10 * weight + 6.25 * height - 5 * ageYears + 5;
    }
    return 10 * weight + 6.25 * height - 5 * ageYears - 161;
}

function calculateTDEE(bmr, activity) {
    return bmr * activity;
}

/* ---------- Healthy Weight Range ---------- */
function healthyAdultRange(heightCm) {
    const h = heightCm / 100;
    return {
        min: 18.5 * h * h,
        max: 24.9 * h * h
    };
}

/* ---------- Main Calculation ---------- */
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

    let bmiResult, healthyText;

    if (age.totalMonths >= 60 && age.totalMonths <= 228) {
        const lms = getLMS(gender, age.totalMonths);
        if (!lms) {
            showError("داده WHO برای این سن موجود نیست.");
            return;
        }
        const z = calculateZScore(bmi, lms.L, lms.M, lms.S);
        bmiResult = classifyWHO(z);

        const minBMI = lms.M * Math.pow(1 + lms.L * lms.S * (-2), 1 / lms.L);
        const maxBMI = lms.M * Math.pow(1 + lms.L * lms.S * (1), 1 / lms.L);
        const h = height / 100;
        healthyText = `${(minBMI * h * h).toFixed(1)} تا ${(maxBMI * h * h).toFixed(1)} کیلوگرم`;
    } else {
        bmiResult = classifyAdultBMI(bmi);
        const r = healthyAdultRange(height);
        healthyText = `${r.min.toFixed(1)} تا ${r.max.toFixed(1)} کیلوگرم`;
    }

    const bmr = calculateBMR(gender, weight, height, age.years);
    const tdee = calculateTDEE(bmr, activity);

    /* ---------- UI Update ---------- */
    document.getElementById("r-gender").textContent = gender;
    document.getElementById("r-height").textContent = `${height} سانتی‌متر`;
    document.getElementById("r-weight").textContent = `${weight} کیلوگرم`;
    document.getElementById("r-age").textContent = `${age.years} سال و ${age.months} ماه`;

    document.getElementById("bmi-value").textContent = bmi.toFixed(2);
    document.getElementById("bmi-circle").style.backgroundColor = bmiResult.color;

    document.getElementById("r-healthy").textContent = healthyText;
    document.getElementById("r-bmr").textContent = `${Math.round(bmr)} کیلوکالری`;
    document.getElementById("r-tdee").textContent = `${Math.round(tdee)} کیلوکالری`;

    document.getElementById("r-calorie").textContent =
        `برای کاهش وزن: ${Math.round(tdee - 500)}\n` +
        `برای حفظ وزن: ${Math.round(tdee)}\n` +
        `برای افزایش وزن: ${Math.round(tdee + 300)}`;

    document.getElementById("r-recommend").textContent =
        `وضعیت شما: ${bmiResult.label}\n` +
        `تمرکز روی تغذیه متعادل، پروتئین کافی و فعالیت منظم توصیه می‌شود.`;

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
