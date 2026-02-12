/* =========================================
 * Profile & Report Management System
 * Features: User Profile + History + PDF Export
 * ========================================= */

const ProfileManager = {
    STORAGE_KEY: 'bmi_user_profile',
    HISTORY_KEY: 'bmi_calculation_history',
    MAX_HISTORY: 50,

    // ذخیره/بارگذاری پروفایل
    saveProfile(profileData) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profileData));
    },

    loadProfile() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    // ذخیره نتیجه جدید
    saveResult(result) {
        let history = this.loadHistory();
        history.unshift(result); // اضافه کردن به ابتدای آرایه
        
        // محدود کردن به 50 رکورد اخیر
        if (history.length > this.MAX_HISTORY) {
            history = history.slice(0, this.MAX_HISTORY);
        }
        
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    },

    // بارگذاری تاریخچه
    loadHistory() {
        const data = localStorage.getItem(this.HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    },

    // پاک کردن تاریخچه
    clearHistory() {
        localStorage.removeItem(this.HISTORY_KEY);
    }
};

/* =========================================
 * PDF Report Generator
 * ========================================= */
function generatePDFReport() {
    // بررسی وجود کتابخانه html2pdf
    if (typeof html2pdf === 'undefined') {
        alert('❌ کتابخانه PDF لود نشده است. لطفاً اتصال اینترنت را بررسی کنید.');
        return;
    }

    // بارگذاری داده‌های صفحه نتایج
    const gender = document.getElementById('r-gender')?.textContent || 'نامشخص';
    const age = document.getElementById('r-age')?.textContent || 'نامشخص';
    const height = document.getElementById('r-height')?.textContent || 'نامشخص';
    const weight = document.getElementById('r-weight')?.textContent || 'نامشخص';
    const bmi = document.getElementById('bmi-value')?.textContent || 'نامشخص';
    const status = document.getElementById('bmi-status-text')?.textContent || 'نامشخص';
    const diff = document.getElementById('bmi-difference-text')?.textContent || 'نامشخص';
    const healthy = document.getElementById('r-healthy')?.textContent || 'نامشخص';
    const bmr = document.getElementById('r-bmr')?.textContent || 'نامشخص';
    const tdee = document.getElementById('r-tdee')?.textContent || 'نامشخص';
    const maintain = document.getElementById('maintain-calories')?.textContent || 'نامشخص';
    const gain = document.getElementById('gain-calories')?.textContent || 'نامشخص';
    const loss = document.getElementById('loss-calories')?.textContent || 'نامشخص';

    // تاریخ جاری
    const today = new Date().toLocaleDateString('fa-IR');

    // ساخت HTML گزارش
    const reportHTML = `
    <div style="font-family: 'Vazirmatn', 'Tahoma', sans-serif; direction: rtl; padding: 30px; max-width: 800px; margin: 0 auto; background: white;">
        <!-- هدر -->
        <div style="text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; font-size: 28px; margin: 0;">📊 گزارش تحلیل شاخص توده بدنی (BMI)</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 10px;">تاریخ: ${today}</p>
        </div>

        <!-- اطلاعات فردی -->
        <div style="background: #F1F5F9; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h2 style="color: #1E293B; font-size: 20px; margin-bottom: 15px; border-right: 4px solid #4F46E5; padding-right: 10px;">اطلاعات فردی</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; font-weight: bold; color: #475569;">جنسیت:</td>
                    <td style="padding: 8px; color: #1E293B;">${gender}</td>
                    <td style="padding: 8px; font-weight: bold; color: #475569;">سن:</td>
                    <td style="padding: 8px; color: #1E293B;">${age}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; color: #475569;">قد:</td>
                    <td style="padding: 8px; color: #1E293B;">${height}</td>
                    <td style="padding: 8px; font-weight: bold; color: #475569;">وزن:</td>
                    <td style="padding: 8px; color: #1E293B;">${weight}</td>
                </tr>
            </table>
        </div>

        <!-- نتایج BMI -->
        <div style="background: #EEF2FF; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #4F46E5;">
            <h2 style="color: #1E293B; font-size: 20px; margin-bottom: 15px; border-right: 4px solid #4F46E5; padding-right: 10px;">نتایج شاخص توده بدنی</h2>
            <div style="text-align: center; margin: 20px 0;">
                <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <p style="color: #64748B; font-size: 14px; margin: 0;">شاخص BMI شما</p>
                    <p style="color: #4F46E5; font-size: 42px; font-weight: bold; margin: 10px 0;">${bmi}</p>
                    <p style="color: #1E293B; font-size: 18px; font-weight: bold; margin: 0;">${status}</p>
                </div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <p style="color: #475569; margin: 0;"><strong>تحلیل:</strong> ${diff}</p>
                <p style="color: #475569; margin: 10px 0 0 0;"><strong>محدوده سالم:</strong> ${healthy}</p>
            </div>
        </div>

        <!-- متابولیسم -->
        <div style="background: #F0FDF4; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h2 style="color: #1E293B; font-size: 20px; margin-bottom: 15px; border-right: 4px solid #22C55E; padding-right: 10px;">اطلاعات متابولیسم</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px; background: white; border-radius: 8px; margin-bottom: 10px; display: block;">
                        <strong style="color: #475569;">متابولیسم پایه (BMR):</strong> 
                        <span style="color: #22C55E; font-size: 18px; font-weight: bold;">${bmr}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px; background: white; border-radius: 8px; display: block; margin-top: 10px;">
                        <strong style="color: #475569;">کالری مصرفی روزانه (TDEE):</strong> 
                        <span style="color: #22C55E; font-size: 18px; font-weight: bold;">${tdee}</span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- راهنمای کالری -->
        <div style="background: #FFF7ED; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h2 style="color: #1E293B; font-size: 20px; margin-bottom: 15px; border-right: 4px solid #F97316; padding-right: 10px;">راهنمای کالری روزانه</h2>
            <div style="display: grid; gap: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <p style="color: #475569; margin: 0;"><strong>🎯 حفظ وزن:</strong> ${maintain}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <p style="color: #475569; margin: 0;"><strong>📈 افزایش وزن:</strong> ${gain}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <p style="color: #475569; margin: 0;"><strong>📉 کاهش وزن:</strong> ${loss}</p>
                </div>
            </div>
        </div>

        <!-- فوتر -->
        <div style="text-align: center; padding-top: 20px; border-top: 2px solid #E2E8F0; color: #64748B; font-size: 12px;">
            <p>این گزارش توسط محاسبه‌گر BMI تولید شده است.</p>
            <p>⚠️ توجه: این گزارش صرفاً جنبه اطلاع‌رسانی دارد و جایگزین مشاوره پزشکی نیست.</p>
        </div>
    </div>
    `;

    // تنظیمات PDF
    const options = {
        margin: 10,
        filename: `BMI-Report-${today}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait'
        }
    };

    // ایجاد المان موقت برای تبدیل به PDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = reportHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    // تولید PDF
    html2pdf()
        .from(tempDiv)
        .set(options)
        .save()
        .then(() => {
            document.body.removeChild(tempDiv);
            console.log('✅ PDF با موفقیت ایجاد شد');
        })
        .catch(err => {
            document.body.removeChild(tempDiv);
            console.error('❌ خطا در تولید PDF:', err);
            alert('خطا در تولید PDF. لطفاً دوباره تلاش کنید.');
        });
}

// اتصال به دکمه PDF در صفحه نتایج
document.addEventListener('DOMContentLoaded', function() {
    const pdfBtn = document.getElementById('pdf-btn');
    if (pdfBtn) {
        pdfBtn.onclick = generatePDFReport;
    }
});
