document.addEventListener('DOMContentLoaded', () => {

    /* ========================================
       GLOBAL VARIABLES
    ======================================== */
    let currentAge = 0;
    let currentGender = 'مرد';
    let currentHeight = 0;
    let currentWeight = 0;

    /* ========================================
       BUTTON EVENT LISTENERS
    ======================================== */
    const calcBtn = document.getElementById('calc-btn');
    const backBtn = document.getElementById('back-btn');
    const helpBtn = document.getElementById('help-btn');
    const helpBtn2 = document.getElementById('help-btn2');
    const backGuideBtn = document.getElementById('back-guide-btn');

    if (calcBtn) calcBtn.addEventListener('click', calculateBMI);
    if (backBtn) backBtn.addEventListener('click', () => showPage('input-page'));
    if (helpBtn) helpBtn.addEventListener('click', () => showPage('guide-page'));
    if (helpBtn2) helpBtn2.addEventListener('click', () => showPage('guide-page'));
    if (backGuideBtn) backGuideBtn.addEventListener('click', () => showPage('results-page'));

    /* ========================================
       MAIN CALCULATION FUNCTION
    ======================================== */
    function calculateBMI() {
        // خواندن ورودی‌ها
        const gender = document.getElementById('gender').value;
        const year = parseInt(document.getElementById('birth-year').value);
        const month = parseInt(document.getElementById('birth-month').value);
        const day = parseInt(document.getElementById('birth-day').value);
        const height = parseFloat(document.getElementById('height').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const activity = parseFloat(document.getElementById('activity').value);

        // اعتبارسنجی
        const errorDiv = document.getElementById('error-message');
        if (!year || !month || !day) {
            errorDiv.textContent = '⚠️ لطفاً تاریخ تولد کامل را وارد کنید';
            errorDiv.style.display = 'block';
            return;
        }
        if (!height || height < 50 || height > 250) {
            errorDiv.textContent = '⚠️ قد باید بین 50 تا 250 سانتی‌متر باشد';
            errorDiv.style.display = 'block';
            return;
        }
        if (!weight || weight < 2 || weight > 300) {
            errorDiv.textContent = '⚠️ وزن باید بین 2 تا 300 کیلوگرم باشد';
            errorDiv.style.display = 'block';
            return;
        }
        errorDiv.style.display = 'none';

        // محاسبه سن
        const birthDate = jalaliToGregorian(year, month, day);
        const today = new Date();
        const age = calculateAge(birthDate, today);

        // ذخیره داده‌ها
        currentAge = age;
        currentGender = gender;
        currentHeight = height;
        currentWeight = weight;

        // محاسبه BMI
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);

        // محاسبه BMR (Mifflin-St Jeor)
        let bmr;
        if (gender === 'مرد') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // محاسبه TDEE
        const tdee = bmr * activity;

        // تحلیل BMI
        let analysis;
        if (age >= 5 && age < 19) {
            analysis = analyzeChildBMI(bmi, age, gender);
        } else if (age >= 19) {
            analysis = analyzeAdultBMI(bmi, height);
        } else {
            analysis = {
                status: 'نامشخص',
                color: '#95a5a6',
                message: 'محاسبه برای کودکان زیر 5 سال پشتیبانی نمی‌شود',
                healthyRange: '--'
            };
        }

        // نمایش نتایج
        displayResults(gender, age, height, weight, bmi, bmr, tdee, analysis);
        showPage('results-page');
    }

    /* ========================================
       CHILD BMI ANALYSIS (WHO 2007)
    ======================================== */
    function analyzeChildBMI(bmi, ageYears, gender) {
        const genderKey = gender === 'مرد' ? 'boys' : 'girls';
        
        if (!window.WHO_BMI_DATA || !window.WHO_BMI_DATA[genderKey]) {
            return {
                status: 'خطا',
                color: '#e74c3c',
                message: 'داده‌های WHO بارگذاری نشده',
                healthyRange: '--'
            };
        }

        const data = window.WHO_BMI_DATA[genderKey];
        const ageMonths = ageYears * 12;

        // پیدا کردن سال‌های قبل و بعد
        const ageLower = Math.floor(ageYears);
        const ageUpper = Math.ceil(ageYears);

        const dataLower = data[ageLower];
        const dataUpper = data[ageUpper];

        if (!dataLower || !dataUpper) {
            return {
                status: 'خطا',
                color: '#e74c3c',
                message: 'سن خارج از محدوده WHO (5-19 سال)',
                healthyRange: '--'
            };
        }

        // درون‌یابی خطی برای L، M، S
        const t = ageYears - ageLower;
        const L = dataLower.L + t * (dataUpper.L - dataLower.L);
        const M = dataLower.M + t * (dataUpper.M - dataLower.M);
        const S = dataLower.S + t * (dataUpper.S - dataLower.S);

        // محاسبه Z-Score
        let zScore;
        if (L !== 0) {
            zScore = (Math.pow(bmi / M, L) - 1) / (L * S);
        } else {
            zScore = Math.log(bmi / M) / S;
        }

        // تعیین وضعیت
        let status, color, message;
        if (zScore < -2) {
            status = 'کم‌وزن شدید';
            color = '#3498db';
            message = 'وزن کمتر از حد مطلوب است. مشاوره با متخصص تغذیه ضروری است.';
        } else if (zScore < -1) {
            status = 'کم‌وزن';
            color = '#5dade2';
            message = 'وزن کمی پایین‌تر از حد مطلوب است.';
        } else if (zScore <= 1) {
            status = 'نرمال';
            color = '#27ae60';
            message = 'وزن در محدوده سالم قرار دارد.';
        } else if (zScore <= 2) {
            status = 'اضافه‌وزن';
            color = '#f39c12';
            message = 'وزن بیشتر از حد مطلوب است. توجه به تغذیه و فعالیت بدنی توصیه می‌شود.';
        } else {
            status = 'چاقی';
            color = '#e74c3c';
            message = 'وزن بسیار بیشتر از حد مطلوب است. مشاوره با پزشک ضروری است.';
        }

        // محاسبه محدوده وزن سالم (-1 SD تا +1 SD)
        const zMinus1 = -1;
        const zPlus1 = 1;
        
        let bmiMinus1, bmiPlus1;
        if (L !== 0) {
            bmiMinus1 = M * Math.pow(1 + L * S * zMinus1, 1 / L);
            bmiPlus1 = M * Math.pow(1 + L * S * zPlus1, 1 / L);
        } else {
            bmiMinus1 = M * Math.exp(S * zMinus1);
            bmiPlus1 = M * Math.exp(S * zPlus1);
        }

        const heightM = currentHeight / 100;
        const weightMin = bmiMinus1 * heightM * heightM;
        const weightMax = bmiPlus1 * heightM * heightM;

        return {
            status: status,
            color: color,
            message: message,
            healthyRange: `${weightMin.toFixed(1)} - ${weightMax.toFixed(1)} کیلوگرم`,
            zScore: zScore.toFixed(2)
        };
    }

    /* ========================================
       ADULT BMI ANALYSIS
    ======================================== */
    function analyzeAdultBMI(bmi, height) {
        const heightM = height / 100;
        let status, color, message;

        if (bmi < 18.5) {
            status = 'کم‌وزن';
            color = '#3498db';
            message = 'وزن شما کمتر از حد نرمال است. افزایش وزن با مشاوره متخصص توصیه می‌شود.';
        } else if (bmi < 25) {
            status = 'نرمال';
            color = '#27ae60';
            message = 'وزن شما در محدوده سالم قرار دارد. این وضعیت را حفظ کنید.';
        } else if (bmi < 30) {
            status = 'اضافه‌وزن';
            color = '#f39c12';
            message = 'وزن شما بیشتر از حد نرمال است. کاهش 5-10% وزن می‌تواند سلامتی را بهبود دهد.';
        } else if (bmi < 35) {
            status = 'چاقی درجه ۱';
            color = '#e67e22';
            message = 'وزن شما در محدوده چاقی است. کاهش وزن با نظارت پزشک توصیه می‌شود.';
        } else if (bmi < 40) {
            status = 'چاقی درجه ۲';
            color = '#d35400';
            message = 'چاقی شدید. مشاوره پزشکی و برنامه کاهش وزن ضروری است.';
        } else {
            status = 'چاقی درجه ۳ (مرضی)';
            color = '#c0392b';
            message = 'چاقی بسیار شدید. مراجعه فوری به پزشک و متخصص تغذیه الزامی است.';
        }

        // محدوده وزن سالم (BMI 18.5-24.9)
        const minWeight = 18.5 * heightM * heightM;
        const maxWeight = 24.9 * heightM * heightM;

        return {
            status: status,
            color: color,
            message: message,
            healthyRange: `${minWeight.toFixed(1)} - ${maxWeight.toFixed(1)} کیلوگرم`
        };
    }

    /* ========================================
       DISPLAY RESULTS
    ======================================== */
    function displayResults(gender, age, height, weight, bmi, bmr, tdee, analysis) {
        // اطلاعات کلی
        document.getElementById('r-gender').textContent = gender;
        document.getElementById('r-age').textContent = `${age.toFixed(1)} سال`;
        document.getElementById('r-height').textContent = `${height} سانتی‌متر`;
        document.getElementById('r-weight').textContent = `${weight} کیلوگرم`;

        // BMI
        const bmiCircle = document.getElementById('bmi-circle');
        const bmiValue = document.getElementById('bmi-value');
        const bmiStatus = document.getElementById('bmi-status-text');
        const bmiDiff = document.getElementById('bmi-difference-text');

        bmiValue.textContent = bmi.toFixed(1);
        bmiCircle.style.borderColor = analysis.color;
        bmiStatus.textContent = analysis.status;
        bmiStatus.style.color = analysis.color;
        bmiDiff.textContent = analysis.message;

        if (analysis.zScore) {
            bmiDiff.textContent += ` (Z-Score: ${analysis.zScore})`;
        }

        // محدوده وزن سالم
        document.getElementById('r-healthy').textContent = analysis.healthyRange;

        // BMR & TDEE
        document.getElementById('r-bmr').textContent = `${Math.round(bmr)} کالری`;
        document.getElementById('r-tdee').textContent = `${Math.round(tdee)} کالری`;

        // توصیه‌های کالری
        document.getElementById('maintain-calories').textContent = `${Math.round(tdee)} کالری`;
        document.getElementById('gain-calories').textContent = `${Math.round(tdee + 300)} کالری`;
        document.getElementById('loss-calories').textContent = `${Math.round(tdee - 500)} کالری`;

        // توصیه‌های کاربردی
        const tipsDiv = document.getElementById('practical-tips');
        let tips = '<ul>';
        
        if (bmi < 18.5) {
            tips += '<li>🍽️ افزایش دریافت کالری با غذاهای پرمغذی</li>';
            tips += '<li>💪 ورزش‌های قدرتی برای افزایش توده عضلانی</li>';
            tips += '<li>🥜 مصرف پروتئین و چربی‌های سالم</li>';
        } else if (bmi < 25) {
            tips += '<li>✅ حفظ تعادل کالری دریافتی و مصرفی</li>';
            tips += '<li>🏃 ادامه فعالیت بدنی منظم</li>';
            tips += '<li>🥗 تغذیه متنوع و متعادل</li>';
        } else {
            tips += '<li>🥗 کاهش کالری روزانه به‌صورت تدریجی</li>';
            tips += '<li>🏃 افزایش فعالیت بدنی (حداقل 150 دقیقه در هفته)</li>';
            tips += '<li>💧 نوشیدن حداقل 8 لیوان آب در روز</li>';
            tips += '<li>😴 خواب کافی (7-9 ساعت)</li>';
        }

        if (age >= 5 && age < 19) {
            tips += '<li>⚠️ برای کودکان و نوجوانان، مشاوره با پزشک اطفال و متخصص تغذیه الزامی است</li>';
            tips += '<li>📈 تغییرات وزن باید تحت نظارت پزشک انجام شود</li>';
        }

        tips += '</ul>';
        tipsDiv.innerHTML = tips;
    }

    /* ========================================
       PAGE NAVIGATION
    ======================================== */
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById(pageId);
        if (page) page.classList.add('active');
    }

    /* ========================================
       JALALI TO GREGORIAN CONVERSION
    ======================================== */
    function jalaliToGregorian(jy, jm, jd) {
        const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        const gy = (jy <= 979) ? 621 : 1600;
        jy -= (jy <= 979) ? 0 : 979;
        
        const days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + 
                     ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
        
        let gy2 = 400 * Math.floor(days / 146097);
        let gd = days % 146097;
        
        if (gd >= 36525) {
            gd--;
            gy2 += 100 * Math.floor(gd / 36524);
            gd = gd % 36524;
            if (gd >= 365) gd++;
        }
        
        gy2 += 4 * Math.floor(gd / 1461);
        gd %= 1461;
        
        if (gd >= 366) {
            gd--;
            gy2 += Math.floor(gd / 365);
            gd = (gd % 365);
        }
        
        const leap = ((gy + gy2) % 4 === 0 && (gy + gy2) % 100 !== 0) || ((gy + gy2) % 400 === 0);
        const gm = (gd < g_d_m[1] || (gd === g_d_m[1] && !leap)) ? 1 :
                   (gd < g_d_m[2] + (leap ? 1 : 0)) ? 2 :
                   (gd < g_d_m[3] + (leap ? 1 : 0)) ? 3 :
                   (gd < g_d_m[4] + (leap ? 1 : 0)) ? 4 :
                   (gd < g_d_m[5] + (leap ? 1 : 0)) ? 5 :
                   (gd < g_d_m[6] + (leap ? 1 : 0)) ? 6 :
                   (gd < g_d_m[7] + (leap ? 1 : 0)) ? 7 :
                   (gd < g_d_m[8] + (leap ? 1 : 0)) ? 8 :
                   (gd < g_d_m[9] + (leap ? 1 : 0)) ? 9 :
                   (gd < g_d_m[10] + (leap ? 1 : 0)) ? 10 :
                   (gd < g_d_m[11] + (leap ? 1 : 0)) ? 11 : 12;
        
        const gd2 = gd - g_d_m[gm - 1] - ((gm > 2 && leap) ? 1 : 0) + 1;
        
        return new Date(gy + gy2, gm - 1, gd2);
    }

    /* ========================================
       AGE CALCULATION
    ======================================== */
    function calculateAge(birthDate, currentDate) {
        const diffMs = currentDate - birthDate;
        const ageDate = new Date(diffMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970) + (ageDate.getUTCMonth() / 12) + (ageDate.getUTCDate() / 365);
    }

    /* ========================================
       MOTIVATIONAL TEXT
    ======================================== */
    const motivations = [
        'سلامتی سرمایه‌ای است که باید از آن مراقبت کنی',
        'هر قدم کوچک به سمت سلامتی، یک پیروزی بزرگ است',
        'بدنت خانه‌ای است که باید در آن زندگی کنی، پس از آن نگهداری کن',
        'سرمایه‌گذاری روی سلامتی، بهترین سرمایه‌گذاری زندگی است'
    ];

    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
    const motivationEl = document.getElementById('motivation-text');
    if (motivationEl) motivationEl.textContent = randomMotivation;
});
