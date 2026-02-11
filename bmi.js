/* who-data.js */

/* ... داده‌های WHO_BOYS_LMS و WHO_GIRLS_LMS بدون تغییر ... */

const WHO_MIN_MONTH = 60;
const WHO_MAX_MONTH = 228;

/**
 * خطی‌سازی پارامترهای LMS بین دو سن صحیح مجاور
 * @param {Object} lower پارامترهای سن پایین‌تر
 * @param {Object} upper پارامترهای سن بالاتر
 * @param {number} ratio نسبت پیشروی بین دو سن (۰ تا ۱)
 * @returns {{L:number,M:number,S:number}}
 */
function interpolateLMS(lower, upper, ratio) {
    return {
        L: lower.L + (upper.L - lower.L) * ratio,
        M: lower.M + (upper.M - lower.M) * ratio,
        S: lower.S + (upper.S - lower.S) * ratio,
    };
}

/**
 * دریافت پارامترهای LMS برای سن و جنسیت مشخص (با درون‌یابی خطی)
 * @param {"مرد"|"زن"} gender
 * @param {number} ageMonthsExact سن دقیق به ماه (می‌تواند اعشاری باشد)
 * @returns {{L:number,M:number,S:number}|null}
 */
function getLMS(gender, ageMonthsExact) {
    const table = gender === "مرد" ? WHO_BOYS_LMS : WHO_GIRLS_LMS;
    if (!Number.isFinite(ageMonthsExact)) {
        return null;
    }

    const age = Math.max(WHO_MIN_MONTH, Math.min(WHO_MAX_MONTH, ageMonthsExact));

    const lowerBound = Math.floor(age);
    const upperBound = Math.ceil(age);

    const lowerParams = table[lowerBound];
    const upperParams = table[upperBound];

    if (!lowerParams || !upperParams) {
        return null;
    }

    if (lowerBound === upperBound) {
        return { ...lowerParams };
    }

    const ratio = (age - lowerBound) / (upperBound - lowerBound);
    return interpolateLMS(lowerParams, upperParams, ratio);
}
