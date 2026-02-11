/* ========================================
 * BMI / BMR / TDEE Calculator (Solar Calendar + WHO BMI-for-age)
 * Aligned with bmi_logic.py reference implementation
 * ======================================== */

"use strict";

/* ---- ثابت‌ها ---- */

const MS_PER_DAY = 86_400_000;
const AVERAGE_DAYS_PER_MONTH = 365.2422 / 12;

const ACTIVITY_FACTORS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
};

const ADULT_HEALTHY_BMI_RANGE = { min: 18.5, max: 24.9 };

/* ---- توابع مربوط به تقویم شمسی ---- */

/**
 * تعیین کبیسه بودن سال شمسی (هجری خورشیدی)
 * @param {number} jy
 * @returns {boolean}
 */
function isJalaliLeapYear(jy) {
    const breaks = [
        -61, 9, 38, 199, 426, 686, 756, 818,
        1111, 1181, 1210, 1635, 2060, 2097, 2192,
        2262, 2324, 2394, 2456, 3178
    ];
    let bl = breaks.length;
    let gy = jy + 621;
    let leapJ = -14;
    let jp = breaks[0];
    let jm, jump, leapG;
    for (let i = 1; i < bl; ++i) {
        jm = breaks[i];
        jump = jm - jp;
        if (jy < jm) break;
        leapJ += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
        jp = jm;
    }
    let n = jy - jp;
    leapJ += Math.floor(n / 33) * 8 + Math.floor((n % 33) / 4);
    if ((jump % 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = Math.floor(gy / 4) - Math.floor((Math.floor((gy / 100) + 1)) * 3 / 4) - 150;
    return ((leapJ - leapG) % 33) < 8;
}

/**
 * طول ماه در تقویم شمسی
 * @param {number} jy
 * @param {number} jm
 * @returns {number}
 */
function getJalaliMonthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * تبدیل تاریخ شمسی به میلادی
 * @param {number} jy
 * @param {number} jm
 * @param {number} jd
 * @returns {{gy:number,gm:number,gd:number}}
 */
function jalaliToGregorian(jy, jm, jd) {
    jy = parseInt(jy, 10);
    jm = parseInt(jm, 10);
    jd = parseInt(jd, 10);

    let gy = jy + 621;
    let leapJ = -14;
    const breaks = [
        -61, 9, 38, 199, 426, 686, 756, 818,
        1111, 1181, 1210, 1635, 2060, 2097, 2192,
        2262, 2324, 2394, 2456, 3178
    ];

    let jp = breaks[0], jmBreak, jump;
    for (let i = 1; i < breaks.length; ++i) {
        jmBreak = breaks[i];
        jump = jmBreak - jp;
        if (jy < jmBreak) break;
        leapJ += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
        jp = jmBreak;
    }
    let n = jy - jp;
    leapJ += Math.floor(n / 33) * 8 + Math.floor((n % 33) / 4);
    if ((jump % 33) === 4 && jump - n === 4) leapJ += 1;

    let leapG = Math.floor(gy / 4) - Math.floor((Math.floor((gy / 100) + 1)) * 3 / 4) - 150;
    let march = 20 + leapJ - leapG;

    let gDayNo = march + jd - 1;
    if (jm <= 7) {
        gDayNo += (jm - 1) * 31;
    } else {
        gDayNo += (jm - 7) * 30 + 186;
    }

    let gMonth = 0;
    let gDay = 0;

    if (gy % 4 === 0 && gy % 100 !== 0 || gy % 400 === 0) {
        if (gDayNo > 366) {
            gy += 1;
            gDayNo -= 366;
        }
    } else {
        if (gDayNo > 365) {
            gy += 1;
            gDayNo -= 365;
        }
    }

    const gMonths = [31, gy % 4 === 0 && gy % 100 !== 0 || gy % 400 === 0 ? 29 : 28,
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    for (let i = 0; i < 12 && gDayNo > 0; ++i) {
        let v = gMonths[i];
        if (gDayNo <= v) {
            gMonth = i + 1;
            gDay = gDayNo;
            break;
        }
        gDayNo -= v;
    }

    return { gy, gm: gMonth, gd: gDay };
}

/**
 * تبدیل تاریخ میلادی به شمسی
 * @param {number} gy
 * @param {number} gm
 * @param {number} gd
 * @returns {{jy:number,jm:number,jd:number}}
 */
function gregorianToJalali(gy, gm, gd) {
    let gDayNo = Date.UTC(gy, gm - 1, gd) / MS_PER_DAY | 0;

    const march = 79;

    gy -= 1600;
    gm -= 1;
    gd -= 1;

    gDayNo = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
    for (let i = 0; i < gm; ++i) {
        gDayNo += [31, 28 + (isGregorianLeapYear(gy + 1600) ? 1 : 0), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
    }
    gDayNo += gd;

    gDayNo -= 79;

    const jNp = Math.floor(gDayNo / 12053);
    gDayNo %= 12053;

    let jy = 979 + 33 * jNp + 4 * Math.floor(gDayNo / 1461);
    gDayNo %= 1461;

    if (gDayNo >= 366) {
        jy += Math.floor((gDayNo - 366) / 365);
        gDayNo = (gDayNo - 366) % 365;
    }

    let jm, jd;
    const jalaliMonthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, isJalaliLeapYear(jy) ? 30 : 29];

    for (jm = 0; jm < 12; ++jm) {
        if (gDayNo < jalaliMonthLengths[jm]) break;
        gDayNo -= jalaliMonthLengths[jm];
    }
    jd = gDayNo + 1;
    return { jy, jm: jm + 1, jd };
}

/**
 * بررسی کبیسه بودن سال میلادی
 * @param {number} gy
 * @returns {boolean}
 */
function isGregorianLeapYear(gy) {
    return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
}

/**
 * ساخت Date در UTC برای تاریخ شمسی
 * @param {{year:number,month:number,day:number}} jalaliDate
 * @returns {Date}
 */
function jalaliToUTCDate(jalaliDate) {
    const { gy, gm, gd } = jalaliToGregorian(jalaliDate.year, jalaliDate.month, jalaliDate.day);
    return new Date(Date.UTC(gy, gm - 1, gd));
}

/**
 * سن شمسی دقیق (سال، ماه، روز، تعداد روز) بین دو تاریخ
 * @param {{year:number,month:number,day:number}} birthJalali
 * @param {{year:number,month:number,day:number}|null} referenceJalali
 * @returns {{years:number,months:number,days:number,totalDays:number}}
 */
function calculateExactSolarAge(birthJalali, referenceJalali = null) {
    if (!birthJalali || !Number.isFinite(birthJalali.year) || !Number.isFinite(birthJalali.month) || !Number.isFinite(birthJalali.day)) {
        return { years: NaN, months: NaN, days: NaN, totalDays: NaN };
    }

    const birthDateUTC = jalaliToUTCDate(birthJalali);

    let referenceDateUTC;
    if (referenceJalali) {
        referenceDateUTC = jalaliToUTCDate(referenceJalali);
    } else {
        const now = new Date();
        referenceDateUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }

    if (referenceDateUTC < birthDateUTC) {
        return { years: 0, months: 0, days: 0, totalDays: 0 };
    }

    const diffDays = Math.floor((referenceDateUTC - birthDateUTC) / MS_PER_DAY);

    const referenceJ = gregorianToJalali(
        referenceDateUTC.getUTCFullYear(),
        referenceDateUTC.getUTCMonth() + 1,
        referenceDateUTC.getUTCDate()
    );

    let years = referenceJ.jy - birthJalali.year;
    let months = referenceJ.jm - birthJalali.month;
    let days = referenceJ.jd - birthJalali.day;

    if (days < 0) {
        const prevMonth = referenceJ.jm === 1 ? 12 : referenceJ.jm - 1;
        const prevYear = referenceJ.jm === 1 ? referenceJ.jy - 1 : referenceJ.jy;
        days += getJalaliMonthLength(prevYear, prevMonth);
        months -= 1;
    }

    if (months < 0) {
        months += 12;
        years -= 1;
    }

    return {
        years,
        months,
        days,
        totalDays: diffDays
    };
}

/* ---- توابع عمومی BMI / TDEE ---- */

/**
 * محاسبه BMI
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number}
 */
function calculateBMI(weightKg, heightCm) {
    if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0) {
        return NaN;
    }
    const heightMeters = heightCm / 100;
    return weightKg / (heightMeters * heightMeters);
}

/**
 * سن دقیق به ماه (اعشاری)
 * @param {{years:number,months:number,days:number}} ageParts
 * @returns {number}
 */
function computeAgeMonthsExact(ageParts) {
    if (!ageParts) return NaN;
    return ageParts.years * 12 + ageParts.months + (ageParts.days / AVERAGE_DAYS_PER_MONTH);
}

/**
 * سن دقیق به سال (اعشاری)
 * @param {{years:number,months:number,days:number,totalDays:number}} ageParts
 * @returns {number}
 */
function computeAgeYearsExact(ageParts) {
    if (!ageParts) return NaN;
    return ageParts.totalDays / 365.2422;
}

/**
 * محاسبه Z-Score برای BMI-for-age
 * @param {number} bmi
 * @param {"مرد"|"زن"} gender
 * @param {number} ageMonthsExact
 * @returns {number}
 */
function calculateBMIZScore(bmi, gender, ageMonthsExact) {
    const lms = getLMS(gender, ageMonthsExact);
    if (!lms || !Number.isFinite(bmi)) return NaN;

    const { L, M, S } = lms;
    if (L === 0) {
        return Math.log(bmi / M) / S;
    }
    return (Math.pow(bmi / M, L) - 1) / (L * S);
}

/**
 * محاسبه BMI از روی Z-Score
 * @param {number} zScore
 * @param {"مرد"|"زن"} gender
 * @param {number} ageMonthsExact
 * @returns {number}
 */
function bmiFromZ(zScore, gender, ageMonthsExact) {
    const lms = getLMS(gender, ageMonthsExact);
    if (!lms) return NaN;

    const { L, M, S } = lms;

    if (L === 0) {
        return M * Math.exp(S * zScore);
    }

    const inner = 1 + L * S * zScore;
    if (inner <= 0) return NaN;

    return M * Math.pow(inner, 1 / L);
}

/**
 * بازه وزن سالم برای کودک/نوجوان (WHO BMI-for-age Z = [-2, +1])
 * @param {"مرد"|"زن"} gender
 * @param {number} heightCm
 * @param {number} ageMonthsExact
 * @param {number} [zLower=-2]
 * @param {number} [zUpper=1]
 * @returns {{min:number,max:number}|null}
 */
function calculateChildHealthyWeightRange(gender, heightCm, ageMonthsExact, zLower = -2, zUpper = 1) {
    if (!Number.isFinite(heightCm)) return null;

    const heightMetersSquared = Math.pow(heightCm / 100, 2);
    const lowerBMI = bmiFromZ(zLower, gender, ageMonthsExact);
    const upperBMI = bmiFromZ(zUpper, gender, ageMonthsExact);

    if (!Number.isFinite(lowerBMI) || !Number.isFinite(upperBMI)) {
        return null;
    }

    return {
        min: lowerBMI * heightMetersSquared,
        max: upperBMI * heightMetersSquared
    };
}

/**
 * بازه وزن سالم برای بزرگ‌سال (BMI 18.5 تا 24.9)
 * @param {number} heightCm
 * @returns {{min:number,max:number}|null}
 */
function calculateAdultHealthyWeightRange(heightCm) {
    if (!Number.isFinite(heightCm) || heightCm <= 0) return null;
    const heightMetersSquared = Math.pow(heightCm / 100, 2);
    return {
        min: ADULT_HEALTHY_BMI_RANGE.min * heightMetersSquared,
        max: ADULT_HEALTHY_BMI_RANGE.max * heightMetersSquared
    };
}

/**
 * دسته‌بندی BMI برای بزرگ‌سالان
 * @param {number} bmi
 * @returns {{label:string, code:string}}
 */
function classifyAdultBMI(bmi) {
    if (!Number.isFinite(bmi)) return { label: "نامشخص", code: "unknown" };

    if (bmi < 18.5) return { label: "کمبود وزن", code: "underweight" };
    if (bmi < 25) return { label: "وزن سالم", code: "normal" };
    if (bmi < 30) return { label: "اضافه وزن", code: "overweight" };
    if (bmi < 35) return { label: "چاقی درجه ۱", code: "obesity-class-1" };
    if (bmi < 40) return { label: "چاقی درجه ۲", code: "obesity-class-2" };
    return { label: "چاقی درجه ۳", code: "obesity-class-3" };
}

/**
 * دسته‌بندی BMI-for-age برای کودکان/نوجوانان
 * @param {number} zScore
 * @returns {{label:string, code:string}}
 */
function classifyWHO(zScore) {
    if (!Number.isFinite(zScore)) {
        return { label: "نامشخص", code: "unknown" };
    }

    if (zScore < -3) return { label: "لاغری شدید", code: "severe-underweight" };
    if (zScore < -2) return { label: "لاغری", code: "underweight" };
    if (zScore <= 1) return { label: "سالم", code: "normal" };
    if (zScore <= 2) return { label: "اضافه وزن", code: "overweight" };
    if (zScore <= 3) return { label: "چاقی", code: "obesity" };
    return { label: "چاقی شدید", code: "severe-obesity" };
}

/**
 * محاسبه BMR با فرمول میفلین سنت-ژئور و سن اعشاری دقیق
 * @param {"مرد"|"زن"} gender
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} ageYearsExact
 * @returns {number}
 */
function calculateBMR(gender, weightKg, heightCm, ageYearsExact) {
    if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || !Number.isFinite(ageYearsExact)) {
        return NaN;
    }
    const genderConstant = gender === "مرد" ? 5 : -161;
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYearsExact + genderConstant;
}

/**
 * محاسبه TDEE با ضریب فعالیت
 * @param {number} bmr
 * @param {string} activityLevel
 * @returns {number}
 */
function calculateTDEE(bmr, activityLevel) {
    if (!Number.isFinite(bmr)) return NaN;
    const factor = ACTIVITY_FACTORS[activityLevel] ?? ACTIVITY_FACTORS.sedentary;
    return bmr * factor;
}

/**
 * تعیین بازه وزن سالم مناسب (بر اساس سن)
 * @param {"مرد"|"زن"} gender
 * @param {number} heightCm
 * @param {number} ageMonthsExact
 * @param {number} ageYearsExact
 * @returns {{min:number,max:number}|null}
 */
function computeHealthyWeightRange(gender, heightCm, ageMonthsExact, ageYearsExact) {
    if (ageYearsExact >= 20) {
        return calculateAdultHealthyWeightRange(heightCm);
    }
    return calculateChildHealthyWeightRange(gender, heightCm, ageMonthsExact);
}

/**
 * دسته‌بندی نهایی BMI بر اساس سن
 * @param {number} bmi
 * @param {"مرد"|"زن"} gender
 * @param {number} ageMonthsExact
 * @param {number} ageYearsExact
 * @returns {{label:string, code:string, zScore?:number}}
 */
function classifyBMI(bmi, gender, ageMonthsExact, ageYearsExact) {
    if (ageYearsExact >= 20) {
        return classifyAdultBMI(bmi);
    }
    const z = calculateBMIZScore(bmi, gender, ageMonthsExact);
    const category = classifyWHO(z);
    return { ...category, zScore: z };
}

/**
 * گرد کردن اعداد به یک اعشار (مطابق خروجی نمونه پایتون)
 * @param {number} value
 * @param {number} digits
 * @returns {number}
 */
function roundTo(value, digits = 1) {
    if (!Number.isFinite(value)) return value;
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

/**
 * محاسبه کامل شاخص‌ها (BMI, BMR, TDEE, دسته‌بندی و ...)
 * @param {{
 *   gender:"مرد"|"زن",
 *   heightCm:number,
 *   weightKg:number,
 *   birthDate:{year:number,month:number,day:number},
 *   measureDate?:{year:number,month:number,day:number},
 *   activityLevel?:string
 * }} input
 * @returns {{
 *   bmi:number,
 *   bmiRounded:number,
 *   ageParts:{years:number,months:number,days:number,totalDays:number},
 *   ageMonthsExact:number,
 *   ageYearsExact:number,
 *   classification:{label:string,code:string,zScore?:number},
 *   healthyWeightRange:{min:number,max:number}|null,
 *   healthyWeightRangeRounded?:{min:number,max:number},
 *   bmr:number,
 *   bmrRounded:number,
 *   tdee:number,
 *   tdeeRounded:number
 * }}
 */
function evaluateHealthProfile(input) {
    const {
        gender,
        heightCm,
        weightKg,
        birthDate,
        measureDate = null,
        activityLevel = "sedentary"
    } = input;

    const ageParts = calculateExactSolarAge(birthDate, measureDate);
    const ageMonthsExact = computeAgeMonthsExact(ageParts);
    const ageYearsExact = computeAgeYearsExact(ageParts);

    const bmi = calculateBMI(weightKg, heightCm);
    const bmiRounded = roundTo(bmi, 1);

    const classification = classifyBMI(bmi, gender, ageMonthsExact, ageYearsExact);

    const healthyWeightRange = computeHealthyWeightRange(gender, heightCm, ageMonthsExact, ageYearsExact);
    const healthyWeightRangeRounded = healthyWeightRange
        ? {
            min: roundTo(healthyWeightRange.min, 1),
            max: roundTo(healthyWeightRange.max, 1)
        }
        : null;

    const bmr = calculateBMR(gender, weightKg, heightCm, ageYearsExact);
    const bmrRounded = roundTo(bmr, 0);

    const tdee = calculateTDEE(bmr, activityLevel);
    const tdeeRounded = roundTo(tdee, 0);

    return {
        bmi,
        bmiRounded,
        ageParts,
        ageMonthsExact,
        ageYearsExact,
        classification,
        healthyWeightRange,
        healthyWeightRangeRounded,
        bmr,
        bmrRounded,
        tdee,
        tdeeRounded
    };
}

/* ---- دسترسی عمومی ---- */

if (typeof window !== "undefined") {
    window.calculateExactSolarAge = calculateExactSolarAge;
    window.calculateBMI = calculateBMI;
    window.calculateBMIZScore = calculateBMIZScore;
    window.bmiFromZ = bmiFromZ;
    window.calculateChildHealthyWeightRange = calculateChildHealthyWeightRange;
    window.calculateAdultHealthyWeightRange = calculateAdultHealthyWeightRange;
    window.calculateBMR = calculateBMR;
    window.calculateTDEE = calculateTDEE;
    window.evaluateHealthProfile = evaluateHealthProfile;
    window.classifyBMI = classifyBMI;
    window.roundTo = roundTo;
}
