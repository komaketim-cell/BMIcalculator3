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

        let y = 20; // موقعیت عمودی

        // تابع کمکی برای افزودن متن راست‌چین
        const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
            doc.setFontSize(fontSize);
            doc.setTextColor(...color);
            doc.text(text, 200, y, { align: 'right' });
            y += fontSize * 0.5 + 2;
        };

        // تابع افزودن جداکننده
        const addLine = () => {
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, 195, y);
            y += 8;
        };

        // تابع افزودن باکس رنگی
        const addBox = (bgColor, height = 10) => {
            doc.setFillColor(...bgColor);
            doc.rect(15, y - 5, 180, height, 'F');
        };

        // Header
        addBox([79, 70, 229, 20]);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('گزارش تحلیل شاخص توده بدنی', 200, y, { align: 'right' });
        y += 10;
        doc.setFontSize(10);
        doc.text(`تاریخ: ${today}`, 200, y, { align: 'right' });
        y += 15;

        // بخش اطلاعات فردی
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text('اطلاعات فردی', 200, y, { align: 'right' });
        y += 8;
        addLine();

        const personalInfo = [
            ['جنسیت:', data.gender],
            ['سن:', data.age],
            ['قد:', data.height],
            ['وزن:', data.weight]
        ];

        personalInfo.forEach(([label, value]) => {
            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text(label, 200, y, { align: 'right' });
            doc.setTextColor(0, 0, 0);
            doc.text(value, 150, y, { align: 'right' });
            y += 6;
        });

        y += 5;

        // بخش BMI (هایلایت)
        addBox([238, 242, 255]);
        y += 3;
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text('نتایج شاخص توده بدنی (BMI)', 200, y, { align: 'right' });
        y += 10;

        // مقدار BMI
        doc.setFontSize(32);
        doc.setTextColor(79, 70, 229);
        doc.text(data.bmi, 105, y, { align: 'center' });
        y += 12;

        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text(data.status, 105, y, { align: 'center' });
        y += 15;

        // تحلیل
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        const diffLines = doc.splitTextToSize(data.diff, 170);
        diffLines.forEach(line => {
            doc.text(line, 200, y, { align: 'right' });
            y += 5;
        });
        y += 3;
        doc.text(`محدوده سالم: ${data.healthy}`, 200, y, { align: 'right' });
        y += 10;

        // بخش متابولیسم
        addBox([240, 253, 244]);
        y += 3;
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text('اطلاعات متابولیسم', 200, y, { align: 'right' });
        y += 10;

        const metabolismInfo = [
            ['متابولیسم پایه (BMR):', data.bmr],
            ['کالری روزانه (TDEE):', data.tdee]
        ];

        metabolismInfo.forEach(([label, value]) => {
            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text(label, 200, y, { align: 'right' });
            doc.setTextColor(34, 197, 94);
            doc.text(value, 120, y, { align: 'right' });
            y += 7;
        });

        y += 5;

        // بخش کالری
        addBox([255, 247, 237]);
        y += 3;
        doc.setFontSize(14);
        doc.setTextColor(249, 115, 22);
        doc.text('راهنمای کالری روزانه', 200, y, { align: 'right' });
        y += 10;

        const calorieInfo = [
            ['حفظ وزن:', data.maintain],
            ['افزایش وزن:', data.gain],
            ['کاهش وزن:', data.loss]
        ];

        calorieInfo.forEach(([label, value]) => {
            doc.setFontSize(11);
            doc.setTextColor(71, 85, 105);
            doc.text(label, 200, y, { align: 'right' });
            doc.setTextColor(249, 115, 22);
            doc.text(value, 140, y, { align: 'right' });
            y += 7;
        });

        y += 10;

        // Footer
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(15, y, 195, y);
        y += 8;

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('این گزارش توسط محاسبه‌گر BMI تولید شده است', 105, y, { align: 'center' });
        y += 5;
        doc.setTextColor(220, 38, 38);
        const warningText = doc.splitTextToSize('⚠️ این گزارش صرفاً جنبه اطلاع‌رسانی دارد و جایگزین مشاوره پزشکی نیست', 170);
        warningText.forEach(line => {
            doc.text(line, 105, y, { align: 'center' });
            y += 4;
        });

        // ذخیره PDF
        doc.save(`BMI-Report-${today.replace(/\//g, '-')}.pdf`);
        
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
