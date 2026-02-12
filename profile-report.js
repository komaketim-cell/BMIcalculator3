/* =========================================
 * Profile & Report Management System (FIXED VERSION)
 * Features: Better Error Handling + Debugging
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
 * PDF Report Generator (IMPROVED VERSION)
 * ========================================= */
function generatePDFReport() {
    console.log('🚀 شروع تولید PDF...');
    
    // بررسی وجود کتابخانه
    if (typeof html2pdf === 'undefined') {
        console.error('❌ کتابخانه html2pdf لود نشده است');
        alert('❌ خطا: کتابخانه PDF لود نشده است.\n\nلطفاً اتصال اینترنت را بررسی کنید یا صفحه را Refresh کنید.');
        return;
    }
    console.log('✅ کتابخانه html2pdf موجود است');

    // خواندن داده‌ها با بررسی دقیق
    const getData = (id, defaultValue = 'نامشخص') => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ المان ${id} یافت نشد`);
            return defaultValue;
        }
        const text = element.textContent.trim();
        console.log(`📊 ${id}: ${text}`);
        return text || defaultValue;
    };

    const gender = getData('r-gender');
    const age = getData('r-age');
    const height = getData('r-height');
    const weight = getData('r-weight');
    const bmi = getData('bmi-value');
    const status = getData('bmi-status-text');
    const diff = getData('bmi-difference-text');
    const healthy = getData('r-healthy');
    const bmr = getData('r-bmr');
    const tdee = getData('r-tdee');
    const maintain = getData('maintain-calories');
    const gain = getData('gain-calories');
    const loss = getData('loss-calories');

    // بررسی داده‌ها
    if (bmi === 'نامشخص' || bmi === '--') {
        console.error('❌ داده‌های BMI موجود نیست');
        alert('❌ خطا: لطفاً ابتدا محاسبات را انجام دهید.');
        return;
    }
    console.log('✅ تمام داده‌ها خوانده شد');

    // تاریخ
    const today = new Date().toLocaleDateString('fa-IR');

    // HTML گزارش
    const reportHTML = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: Tahoma, Arial, sans-serif; 
                direction: rtl; 
                padding: 30px;
                background: white;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #4F46E5;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #4F46E5;
                font-size: 24px;
                margin-bottom: 10px;
            }
            .section {
                background: #F8F9FA;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            .section h2 {
                color: #1E293B;
                font-size: 18px;
                margin-bottom: 15px;
                border-right: 4px solid #4F46E5;
                padding-right: 10px;
            }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px; }
            .bmi-box {
                text-align: center;
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 15px 0;
            }
            .bmi-value {
                font-size: 36px;
                color: #4F46E5;
                font-weight: bold;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 2px solid #E2E8F0;
                color: #64748B;
                font-size: 11px;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📊 گزارش تحلیل شاخص توده بدنی (BMI)</h1>
            <p style="color: #64748B; font-size: 12px;">تاریخ: ${today}</p>
        </div>

        <div class="section">
            <h2>اطلاعات فردی</h2>
            <table>
                <tr>
                    <td><strong>جنسیت:</strong></td>
                    <td>${gender}</td>
                    <td><strong>سن:</strong></td>
                    <td>${age}</td>
                </tr>
                <tr>
                    <td><strong>قد:</strong></td>
                    <td>${height}</td>
                    <td><strong>وزن:</strong></td>
                    <td>${weight}</td>
                </tr>
            </table>
        </div>

        <div class="section" style="background: #EEF2FF; border: 2px solid #4F46E5;">
            <h2>نتایج شاخص توده بدنی</h2>
            <div class="bmi-box">
                <p style="color: #64748B; font-size: 12px;">شاخص BMI شما</p>
                <p class="bmi-value">${bmi}</p>
                <p style="color: #1E293B; font-size: 16px; font-weight: bold;">${status}</p>
            </div>
            <div style="background: white; padding: 12px; border-radius: 6px;">
                <p><strong>تحلیل:</strong> ${diff}</p>
                <p style="margin-top: 8px;"><strong>محدوده سالم:</strong> ${healthy}</p>
            </div>
        </div>

        <div class="section" style="background: #F0FDF4;">
            <h2 style="border-color: #22C55E;">اطلاعات متابولیسم</h2>
            <table>
                <tr>
                    <td><strong>متابولیسم پایه (BMR):</strong></td>
                    <td style="color: #22C55E; font-weight: bold;">${bmr}</td>
                </tr>
                <tr>
                    <td><strong>کالری روزانه (TDEE):</strong></td>
                    <td style="color: #22C55E; font-weight: bold;">${tdee}</td>
                </tr>
            </table>
        </div>

        <div class="section" style="background: #FFF7ED;">
            <h2 style="border-color: #F97316;">راهنمای کالری روزانه</h2>
            <table>
                <tr><td>🎯 حفظ وزن:</td><td><strong>${maintain}</strong></td></tr>
                <tr><td>📈 افزایش وزن:</td><td><strong>${gain}</strong></td></tr>
                <tr><td>📉 کاهش وزن:</td><td><strong>${loss}</strong></td></tr>
            </table>
        </div>

        <div class="footer">
            <p>این گزارش توسط محاسبه‌گر BMI تولید شده است</p>
            <p>⚠️ این گزارش صرفاً جنبه اطلاع‌رسانی دارد و جایگزین مشاوره پزشکی نیست</p>
        </div>
    </body>
    </html>
    `;

    console.log('📄 HTML گزارش آماده شد');

    // تنظیمات PDF
    const options = {
        margin: [10, 10, 10, 10],
        filename: `BMI-Report-${today}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        }
    };

    // ایجاد المان موقت
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = reportHTML;
    tempDiv.style.cssText = 'position:absolute;left:-9999px;width:210mm;';
    document.body.appendChild(tempDiv);

    console.log('⏳ در حال تبدیل به PDF...');

    // تولید PDF
    html2pdf()
        .from(tempDiv)
        .set(options)
        .save()
        .then(() => {
            document.body.removeChild(tempDiv);
            console.log('✅ PDF با موفقیت ایجاد و دانلود شد');
            alert('✅ گزارش PDF با موفقیت ایجاد شد!');
        })
        .catch(err => {
            document.body.removeChild(tempDiv);
            console.error('❌ خطا در تولید PDF:', err);
            alert('❌ خطا در تولید PDF:\n' + err.message + '\n\nلطفاً Console را بررسی کنید (F12)');
        });
}

// اتصال به دکمه
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 صفحه بارگذاری شد');
    
    const pdfBtn = document.getElementById('pdf-btn');
    if (pdfBtn) {
        pdfBtn.onclick = function() {
            console.log('🖱️ کلیک روی دکمه PDF');
            generatePDFReport();
        };
        console.log('✅ دکمه PDF متصل شد');
    } else {
        console.warn('⚠️ دکمه PDF یافت نشد');
    }
});
