/* ===============================
   توابع پایه
================================ */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function interpolate(a, b, t) {
    return a + (b - a) * t;
}

/* ===============================
   محاسبه Z-Score از LMS (WHO)
================================ */

function zFromLMS(bmi, L, M, S) {
    if (Math.abs(L) < 1e-8) {
        return Math.log(bmi / M) / S;
    }
    return (Math.pow(bmi / M, L) - 1) / (L * S);
}

/* ===============================
   محاسبه BMI از Z-Score
================================ */

function bmiFromZ(L, M, S, z) {
    if (Math.abs(L) < 1e-8) {
        return M * Math.exp(S * z);
    }
    const base = 1 + L * S * z;
    if (base <= 0) return NaN;
    return M * Math.pow(base, 1 / L);
}

/* ===============================
   دریافت LMS با Interpolation
================================ */

function getLMSInterpolated(sex, ageMonths) {
    const data = WHO_DATA[sex];
    const minAge = data[0].age;
    const maxAge = data[data.length - 1].age;

    ageMonths = clamp(ageMonths, minAge, maxAge);

    for (let i = 0; i < data.length - 1; i++) {
        const a = data[i];
        const b = data[i + 1];

        if (ageMonths === a.age) {
            return { L: a.L, M: a.M, S: a.S };
        }

        if (ageMonths > a.age && ageMonths < b.age) {
            const t = (ageMonths - a.age) / (b.age - a.age);
            return {
                L: interpolate(a.L, b.L, t),
                M: interpolate(a.M, b.M, t),
                S: interpolate(a.S, b.S, t)
            };
        }
    }

    return {
        L: data[data.length - 1].L,
        M: data[data.length - 1].M,
        S: data[data.length - 1].S
    };
}

/* ===============================
   محاسبه BMI
================================ */

function calculateBMI(weightKg, heightCm) {
    const h = heightCm / 100;
    return weightKg / (h * h);
}

/* ===============================
   محاسبه وضعیت کودکان و نوجوانان
================================ */

function evaluateChildBMI(sex, ageMonths, weightKg, heightCm) {
    const bmi = calculateBMI(weightKg, heightCm);
    const { L, M, S } = getLMSInterpolated(sex, ageMonths);

    const z = zFromLMS(bmi, L, M, S);

    const bmiMin = bmiFromZ(L, M, S, -2);
    const bmiMax = bmiFromZ(L, M, S, 1);

    const h2 = Math.pow(heightCm / 100, 2);
    const weightMin = bmiMin * h2;
    const weightMax = bmiMax * h2;

    let status;
    if (z < -3) status = "لاغری شدید";
    else if (z < -2) status = "لاغری";
    else if (z <= 1) status = "طبیعی";
    else if (z <= 2) status = "اضافه‌وزن";
    else status = "چاقی";

    return {
        bmi: Number(bmi.toFixed(1)),
        zScore: Number(z.toFixed(2)),
        healthyWeightMin: Number(weightMin.toFixed(1)),
        healthyWeightMax: Number(weightMax.toFixed(1)),
        status
    };
}
