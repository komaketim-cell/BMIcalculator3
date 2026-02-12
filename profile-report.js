/* =========================================
 * Profile & Report Management System (FINAL VERSION)
 * با پشتیبانی کامل از فونت فارسی در PDF
 * ========================================= */

const ProfileManager = {
    STORAGE_KEY: 'bmi_user_profile',
    HISTORY_KEY: 'bmi_calculation_history',
    MAX_HISTORY: 50,

    saveProfile(profileData) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profileData));
    },

    loadProfile() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    saveResult(result) {
        let history = this.loadHistory();
        history.unshift(result);
        
        if (history.length > this.MAX_HISTORY) {
            history = history.slice(0, this.MAX_HISTORY);
        }
        
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    },

    loadHistory() {
        const data = localStorage.getItem(this.HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    },

    clearHistory() {
        localStorage.removeItem(this.HISTORY_KEY);
    }
};

/* =========================================
 * PDF Report Generator با پشتیبانی فارسی
 * استفاده از Canvas به جای HTML
 * ========================================= */
function generatePDFReport() {
    console.log('🚀 شروع تولید PDF با روش جدید...');
    
    // بررسی وجود کتابخانه
    if (typeof html2pdf === 'undefined') {
        console.error('❌ کتابخانه html2pdf لود نشده است');
        alert('❌ خطا: کتابخانه PDF لود نشده است.\n\nلطفاً اتصال اینترنت را بررسی کنید.');
        return;
    }

    // خواندن داده‌ها
    const getData = (id, defaultValue = 'نامشخص') => {
        const element = document.getElementById(id);
        return element ? (element.textContent.trim() || defaultValue) : defaultValue;
    };

    const data = {
        gender: getData('r-gender'),
        age: getData('r-age'),
        height: getData('r-height'),
        weight: getData('r-weight'),
        bmi: getData('bmi-value'),
        status: getData('bmi-status-text'),
        diff: getData('bmi-difference-text'),
        healthy: getData('r-healthy'),
        bmr: getData('r-bmr'),
        tdee: getData('r-tdee'),
        maintain: getData('maintain-calories'),
        gain: getData('gain-calories'),
        loss: getData('loss-calories')
    };

    // بررسی داده‌ها
    if (data.bmi === 'نامشخص' || data.bmi === '--') {
        alert('❌ خطا: لطفاً ابتدا محاسبات را انجام دهید.');
        return;
    }

    const today = new Date().toLocaleDateString('fa-IR');

    // HTML با Inline Styles کامل
    const reportHTML = `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
            direction: rtl;
            padding: 25px;
            background: white;
            color: #1a1a1a;
            line-height: 1.8;
        }
        
        .container {
            max-width: 700px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            border-bottom: 4px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #4F46E5;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header .date {
            color: #64748B;
            font-size: 14px;
            font-weight: 400;
        }
        
        .section {
            background: #F8F9FA;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid #E2E8F0;
        }
        
        .section h2 {
            color: #1E293B;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 15px;
            border-right: 5px solid #4F46E5;
            padding-right: 12px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            background: white;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
        }
        
        .info-label {
            color: #64748B;
            font-size: 13px;
            margin-bottom: 5px;
            font-weight: 400;
        }
        
        .info-value {
            color: #1E293B;
            font-size: 16px;
            font-weight: 700;
        }
        
        .bmi-highlight {
            background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
            border: 3px solid #4F46E5;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
        }
        
        .bmi-label {
            color: #64748B;
            font-size: 14px;
            margin-bottom: 10px;
            font-weight: 400;
        }
        
        .bmi-value {
            font-size: 48px;
            color: #4F46E5;
            font-weight: 700;
            margin: 10px 0;
        }
        
        .bmi-status {
            color: #1E293B;
            font-size: 20px;
            font-weight: 700;
            margin-top: 10px;
        }
        
        .analysis-box {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #CBD5E1;
        }
        
        .analysis-text {
            color: #334155;
            font-size: 15px;
            line-height: 1.6;
            font-weight: 400;
        }
        
        .calorie-item {
            background: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
            border: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .calorie-label {
            color: #475569;
            font-size: 15px;
            font-weight: 400;
        }
        
        .calorie-value {
            color: #F97316;
            font-size: 17px;
            font-weight: 700;
        }
        
        .footer {
            text-align: center;
            padding-top: 20px;
            margin-top: 30px;
            border-top: 2px solid #E2E8F0;
        }
        
        .footer-text {
            color: #64748B;
            font-size: 12px;
            line-height: 1.6;
            font-weight: 400;
        }
        
        .warning {
            color: #DC2626;
            font-size: 13px;
            margin-top: 8px;
            font-weight: 400;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📊 گزارش تحلیل شاخص توده بدنی</h1>
            <p class="date">تاریخ: ${today}</p>
        </div>

        <!-- اطلاعات فردی -->
        <div class="section">
            <h2>اطلاعات فردی</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">جنسیت</div>
                    <div class="info-value">${data.gender}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">سن</div>
                    <div class="info-value">${data.age}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">قد</div>
                    <div class="info-value">${data.height}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">وزن</div>
                    <div class="info-value">${data.weight}</div>
                </div>
            </div>
        </div>

        <!-- نتایج BMI -->
        <div class="section" style="background: #EEF2FF; border-color: #4F46E5;">
            <h2>نتایج شاخص توده بدنی (BMI)</h2>
            <div class="bmi-highlight">
                <p class="bmi-label">شاخص BMI شما</p>
                <div class="bmi-value">${data.bmi}</div>
                <div class="bmi-status">${data.status}</div>
            </div>
            <div class="analysis-box">
                <p class="analysis-text"><strong>تحلیل:</strong> ${data.diff}</p>
                <p class="analysis-text" style="margin-top: 10px;"><strong>محدوده سالم:</strong> ${data.healthy}</p>
            </div>
        </div>

        <!-- متابولیسم -->
        <div class="section" style="background: #F0FDF4; border-color: #22C55E;">
            <h2 style="border-color: #22C55E;">اطلاعات متابولیسم</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">متابولیسم پایه (BMR)</div>
                    <div class="info-value" style="color: #22C55E;">${data.bmr}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">کالری روزانه (TDEE)</div>
                    <div class="info-value" style="color: #22C55E;">${data.tdee}</div>
                </div>
            </div>
        </div>

        <!-- راهنمای کالری -->
        <div class="section" style="background: #FFF7ED; border-color: #F97316;">
            <h2 style="border-color: #F97316;">راهنمای کالری روزانه</h2>
            <div class="calorie-item">
                <span class="calorie-label">🎯 حفظ وزن</span>
                <span class="calorie-value">${data.maintain}</span>
            </div>
            <div class="calorie-item">
                <span class="calorie-label">📈 افزایش وزن</span>
                <span class="calorie-value">${data.gain}</span>
            </div>
            <div class="calorie-item">
                <span class="calorie-label">📉 کاهش وزن</span>
                <span class="calorie-value">${data.loss}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">این گزارش توسط محاسبه‌گر BMI تولید شده است</p>
            <p class="warning">⚠️ این گزارش صرفاً جنبه اطلاع‌رسانی دارد و جایگزین مشاوره پزشکی نیست</p>
        </div>
    </div>
</body>
</html>
    `;

    console.log('📄 HTML گزارش آماده شد');

    // تنظیمات PDF بهینه‌شده
    const opt = {
        margin: [8, 8, 8, 8],
        filename: `BMI-Report-${today}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 3,
            useCORS: true,
            letterRendering: true,
            logging: false,
            windowWidth: 800,
            windowHeight: 1200
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // ایجاد المان موقت با ابعاد دقیق
    const container = document.createElement('div');
    container.innerHTML = reportHTML;
    container.style.cssText = `
        position: fixed;
        top: -10000px;
        left: -10000px;
        width: 210mm;
        height: auto;
        background: white;
        z-index: -1;
    `;
    document.body.appendChild(container);

    console.log('⏳ در حال تبدیل به PDF (ممکن است 3-5 ثانیه طول بکشد)...');

    // تاخیر برای Load شدن فونت
    setTimeout(() => {
        html2pdf()
            .from(container)
            .set(opt)
            .save()
            .then(() => {
                document.body.removeChild(container);
                console.log('✅ PDF با موفقیت ایجاد شد');
                alert('✅ گزارش PDF با موفقیت دانلود شد!');
            })
            .catch(err => {
                document.body.removeChild(container);
                console.error('❌ خطا در تولید PDF:', err);
                alert('❌ خطا در تولید PDF. لطفاً مجدداً تلاش کنید.');
            });
    }, 500); // تاخیر 500ms برای load فونت
}

/* =========================================
 * Event Listeners
 * ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 سیستم پروفایل و گزارش‌گیری آماده است');
    
    const pdfBtn = document.getElementById('pdf-btn');
    if (pdfBtn) {
        pdfBtn.onclick = function() {
            console.log('🖱️ کلیک روی دکمه PDF');
            generatePDFReport();
        };
        console.log('✅ دکمه PDF متصل شد');
    } else {
        console.warn('⚠️ دکمه PDF یافت نشد - ممکن است در صفحه نتایج نباشید');
    }
});
