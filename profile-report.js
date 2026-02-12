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
 * PDF Report Generator با jsPDF خالص
 * بدون وابستگی به html2canvas
 * ========================================= */
async function generatePDFReport() {
    console.log('🚀 شروع تولید PDF با jsPDF...');
    
    // بررسی وجود jsPDF
    if (typeof window.jspdf === 'undefined') {
        console.error('❌ کتابخانه jsPDF لود نشده است');
        alert('❌ خطا: کتابخانه PDF لود نشده است.\n\nلطفاً اتصال اینترنت را بررسی کنید.');
        return;
    }

    const { jsPDF } = window.jspdf;

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

    console.log('📊 داده‌ها خوانده شد:', data);

    const today = new Date().toLocaleDateString('fa-IR');
    
    try {
        // ایجاد PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageW = 210;
        const pageH = 297;
        const margin = 15;
        const contentW = pageW - margin * 2;
        let y = 20;

        // ---- helper: رسم باکس پس‌زمینه ----
        const fillRect = (x, rectY, w, h, r, g, b) => {
            doc.setFillColor(r, g, b);
            doc.rect(x, rectY, w, h, 'F');
        };

        // ---- helper: متن راست‌چین ----
        const rtl = (text, fontSize, r, g, b, posY) => {
            doc.setFontSize(fontSize);
            doc.setTextColor(r, g, b);
            doc.text(String(text), pageW - margin, posY, { align: 'right' });
        };

        // ---- helper: متن مرکز ----
        const center = (text, fontSize, r, g, b, posY) => {
            doc.setFontSize(fontSize);
            doc.setTextColor(r, g, b);
            doc.text(String(text), pageW / 2, posY, { align: 'center' });
        };

        // ---- helper: خط جداکننده ----
        const hr = (r = 226, g = 232, b = 240) => {
            doc.setDrawColor(r, g, b);
            doc.setLineWidth(0.4);
            doc.line(margin, y, pageW - margin, y);
            y += 6;
        };

        // ==== HEADER ====
        fillRect(0, 0, pageW, 28, 79, 70, 229);
        center('گزارش تحلیل شاخص توده بدنی', 18, 255, 255, 255, 13);
        center('تاریخ: ' + today, 10, 220, 220, 255, 22);
        y = 38;

        // ==== اطلاعات فردی ====
        fillRect(margin, y - 2, contentW, 8, 241, 245, 249);
        rtl('اطلاعات فردی', 13, 30, 41, 59, y + 4);
        y += 12;

        const infoRows = [
            ['جنسیت:', data.gender],
            ['سن:', data.age],
            ['قد:', data.height],
            ['وزن:', data.weight]
        ];

        infoRows.forEach(([label, value]) => {
            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text(label, pageW - margin, y, { align: 'right' });
            doc.setTextColor(30, 41, 59);
            doc.text(String(value), pageW - margin - 35, y, { align: 'right' });
            y += 7;
        });

        y += 5;
        hr();

        // ==== نتایج BMI ====
        fillRect(margin, y - 2, contentW, 8, 238, 242, 255);
        rtl('نتایج شاخص توده بدنی (BMI)', 13, 79, 70, 229, y + 4);
        y += 15;

        // دایره BMI
        doc.setFillColor(79, 70, 229);
        doc.circle(pageW / 2, y + 8, 18, 'F');
        center(data.bmi, 22, 255, 255, 255, y + 10);
        y += 30;

        center(data.status, 14, 30, 41, 59, y);
        y += 10;

        // تحلیل
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        const diffLines = doc.splitTextToSize(data.diff, contentW - 10);
        diffLines.forEach(line => {
            doc.text(line, pageW - margin, y, { align: 'right' });
            y += 5;
        });

        doc.setTextColor(79, 70, 229);
        doc.text('محدوده سالم: ' + data.healthy, pageW - margin, y, { align: 'right' });
        y += 10;

        hr();

        // ==== متابولیسم ====
        fillRect(margin, y - 2, contentW, 8, 240, 253, 244);
        rtl('اطلاعات متابولیسم', 13, 22, 163, 74, y + 4);
        y += 13;

        const metaRows = [
            ['متابولیسم پایه (BMR):', data.bmr],
            ['کالری روزانه (TDEE):', data.tdee]
        ];

        metaRows.forEach(([label, value]) => {
            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text(label, pageW - margin, y, { align: 'right' });
            doc.setTextColor(22, 163, 74);
            doc.text(String(value), pageW - margin - 55, y, { align: 'right' });
            y += 8;
        });

        y += 3;
        hr();

        // ==== راهنمای کالری ====
        fillRect(margin, y - 2, contentW, 8, 255, 247, 237);
        rtl('راهنمای کالری روزانه', 13, 249, 115, 22, y + 4);
        y += 13;

        const calRows = [
            ['حفظ وزن:', data.maintain],
            ['افزایش وزن:', data.gain],
            ['کاهش وزن:', data.loss]
        ];

        calRows.forEach(([label, value]) => {
            doc.setFontSize(11);
            doc.setTextColor(71, 85, 105);
            doc.text(label, pageW - margin, y, { align: 'right' });
            doc.setTextColor(249, 115, 22);
            doc.text(String(value), pageW - margin - 40, y, { align: 'right' });
            y += 8;
        });

        y += 8;

        // ==== FOOTER ====
        hr(226, 232, 240);
        center('این گزارش توسط محاسبه‌گر BMI تولید شده است', 9, 100, 116, 139, y);
        y += 6;
        center('⚠️ این گزارش صرفاً جنبه اطلاع‌رسانی دارد و جایگزین مشاوره پزشکی نیست', 9, 220, 38, 38, y);

        // ذخیره PDF
        const safeDateStr = today.replace(/\//g, '-');
        doc.save('BMI-Report-' + safeDateStr + '.pdf');
        
        console.log('✅ PDF با موفقیت ایجاد شد');
        alert('✅ گزارش PDF با موفقیت دانلود شد!');

    } catch (err) {
        console.error('❌ خطا در تولید PDF:', err);
        alert('❌ خطا در تولید PDF:\n' + err.message);
    }
}

/* =========================================
 * Event Listeners
 * ========================================= */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 سیستم پروفایل و گزارش‌گیری آماده است');
    
    const pdfBtn = document.getElementById('pdf-btn');
    if (pdfBtn) {
        pdfBtn.onclick = function(e) {
            e.preventDefault();
            console.log('🖱️ کلیک روی دکمه PDF');
            generatePDFReport();
        };
        console.log('✅ دکمه PDF متصل شد');
    } else {
        console.warn('⚠️ دکمه PDF یافت نشد - ممکن است در صفحه نتایج نباشید');
    }
});
