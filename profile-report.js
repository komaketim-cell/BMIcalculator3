/* =========================================
 * Profile & Report Manager
 * ذخیره پروفایل کاربری، تاریخچه نتایج
 * و گزارش PDF حرفه‌ای
 * =========================================
 * این فایل کاملاً مستقل است و به bmi.js
 * وابستگی یک‌طرفه دارد (تغییری در bmi.js نمی‌دهد)
 * ========================================= */

const ProfileManager = (() => {

    /* ---------- کلیدهای localStorage ---------- */
    const PROFILE_KEY   = "bmi_user_profile";
    const HISTORY_KEY   = "bmi_history";
    const MAX_HISTORY   = 50;   // حداکثر رکورد تاریخچه

    /* ==========================================
       ذخیره و بارگذاری پروفایل
       ========================================== */
    function saveProfile(data) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    }

    function loadProfile() {
        try {
            return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
        } catch {
            return null;
        }
    }

    /* ==========================================
       ذخیره و بارگذاری تاریخچه
       ========================================== */
    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveHistoryRecord(record) {
        const history = loadHistory();
        history.unshift(record);            // جدیدترین اول
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    /* ==========================================
       تبدیل عدد به اعداد فارسی
       ========================================== */
    function toFarsiNum(n) {
        return String(n).replace(/\d/g, d =>
            ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"][d]
        );
    }

    /* ==========================================
       تاریخ شمسی به‌صورت رشته
       ========================================== */
    function getCurrentJalaliStr() {
        // از مقادیر موجود در bmi.js استفاده می‌شود
        const y = typeof CURRENT_JALALI_YEAR  !== "undefined" ? CURRENT_JALALI_YEAR  : new Date().getFullYear();
        const m = typeof CURRENT_JALALI_MONTH !== "undefined" ? CURRENT_JALALI_MONTH : new Date().getMonth() + 1;
        const d = typeof CURRENT_JALALI_DAY   !== "undefined" ? CURRENT_JALALI_DAY   : new Date().getDate();
        const pad = n => String(n).padStart(2, "0");
        return `${y}/${pad(m)}/${pad(d)}`;
    }

    /* ==========================================
       پر کردن فیلدها از پروفایل ذخیره‌شده
       ========================================== */
    function autofillFromProfile() {
        const profile = loadProfile();
        if (!profile) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) el.value = val;
        };

        setVal("gender",      profile.gender);
        setVal("birth-year",  profile.birthYear);
        setVal("birth-month", profile.birthMonth);
        setVal("birth-day",   profile.birthDay);
        setVal("height",      profile.height);
    }

    /* ==========================================
       جمع‌آوری داده‌های ورودی فعلی و ذخیره
       به‌عنوان رکورد در تاریخچه
       ========================================== */
    function captureAndSave() {
        /* --- خواندن مقادیر از DOM --- */
        const gender     = document.getElementById("gender")?.value      || "";
        const birthYear  = +document.getElementById("birth-year")?.value  || 0;
        const birthMonth = +document.getElementById("birth-month")?.value || 0;
        const birthDay   = +document.getElementById("birth-day")?.value   || 0;
        const height     = +document.getElementById("height")?.value      || 0;
        const weight     = +document.getElementById("weight")?.value      || 0;

        /* --- خواندن نتایج از DOM (عناصر نتایج) --- */
        const bmiValue   = document.getElementById("bmi-value")?.textContent  || "—";
        const bmiStatus  = document.getElementById("bmi-status-text")?.textContent || "—";
        const bmrText    = document.getElementById("r-bmr")?.textContent      || "—";
        const tdeeText   = document.getElementById("r-tdee")?.textContent     || "—";

        /* --- ذخیره پروفایل (بدون وزن - ثابت است) --- */
        saveProfile({ gender, birthYear, birthMonth, birthDay, height });

        /* --- ذخیره رکورد تاریخچه --- */
        const record = {
            date:      getCurrentJalaliStr(),
            weight,
            bmi:       parseFloat(bmiValue) || 0,
            status:    bmiStatus,
            bmr:       bmrText,
            tdee:      tdeeText
        };
        saveHistoryRecord(record);

        console.log("✅ ProfileManager: پروفایل و رکورد تاریخچه ذخیره شدند");
    }

    /* ==========================================
       ساختار HTML گزارش PDF (کاملاً جدا از DOM)
       ========================================== */
    function buildReportHTML() {
        const profile = loadProfile();
        const history = loadHistory();

        /* --- اطلاعات آخرین نتیجه از DOM --- */
        const bmiVal    = document.getElementById("bmi-value")?.textContent      || "—";
        const bmiStatus = document.getElementById("bmi-status-text")?.textContent || "—";
        const bmiDiff   = document.getElementById("bmi-difference-text")?.textContent || "—";
        const healthy   = document.getElementById("r-healthy")?.textContent      || "—";
        const bmr       = document.getElementById("r-bmr")?.textContent          || "—";
        const tdee      = document.getElementById("r-tdee")?.textContent         || "—";
        const ageText   = document.getElementById("r-age")?.textContent          || "—";
        const genderTxt = document.getElementById("r-gender")?.textContent       || "—";
        const heightTxt = document.getElementById("r-height")?.textContent       || "—";
        const weightTxt = document.getElementById("r-weight")?.textContent       || "—";
        const maintain  = document.getElementById("maintain-calories")?.textContent || "—";
        const gain      = document.getElementById("gain-calories")?.textContent  || "—";
        const loss      = document.getElementById("loss-calories")?.textContent  || "—";

        /* --- رنگ وضعیت BMI --- */
        const bmiCircle = document.getElementById("bmi-circle");
        const statusColor = bmiCircle
            ? window.getComputedStyle(bmiCircle).backgroundColor
            : "#22C55E";

        /* --- تاریخچه (جدول) --- */
        let historyRows = "";
        if (history.length > 0) {
            historyRows = history.map((r, i) => `
                <tr style="${i % 2 === 0 ? "background:#f8fafc" : "background:#fff"}">
                    <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;direction:rtl">${r.date}</td>
                    <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center">${r.weight} kg</td>
                    <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center">${r.bmi.toFixed(2)}</td>
                    <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;direction:rtl">${r.status}</td>
                    <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;direction:rtl">${r.tdee}</td>
                </tr>
            `).join("");
        } else {
            historyRows = `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8">رکوردی ثبت نشده است</td></tr>`;
        }

        /* --- ساختار HTML گزارش --- */
        return `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
                    background: #fff;
                    color: #1e293b;
                    direction: rtl;
                    padding: 32px;
                    font-size: 13px;
                    line-height: 1.7;
                }
                .report-header {
                    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
                    color: #fff;
                    border-radius: 16px;
                    padding: 28px 32px;
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .report-header h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
                .report-header .sub { font-size: 13px; opacity: 0.85; }
                .report-date {
                    text-align: left;
                    font-size: 12px;
                    opacity: 0.85;
                }
                .section-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #7c3aed;
                    border-right: 4px solid #7c3aed;
                    padding-right: 12px;
                    margin: 20px 0 12px 0;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 8px;
                }
                .info-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 14px 16px;
                }
                .info-card .label {
                    font-size: 11px;
                    color: #64748b;
                    margin-bottom: 4px;
                }
                .info-card .value {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1e293b;
                }
                .bmi-highlight {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px 24px;
                    margin-bottom: 8px;
                }
                .bmi-circle-report {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    background: ${statusColor};
                }
                .bmi-circle-report .num {
                    font-size: 22px;
                    font-weight: 800;
                    color: #fff;
                    line-height: 1;
                }
                .bmi-circle-report .lbl {
                    font-size: 10px;
                    color: rgba(255,255,255,0.9);
                }
                .bmi-info-block .status {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                .bmi-info-block .diff {
                    font-size: 13px;
                    color: #475569;
                    margin-bottom: 4px;
                }
                .bmi-info-block .healthy {
                    font-size: 12px;
                    color: #64748b;
                }
                .calorie-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 8px;
                }
                .cal-card {
                    border-radius: 10px;
                    padding: 14px;
                    text-align: center;
                }
                .cal-card.maintain { background: #eff6ff; border: 1px solid #bfdbfe; }
                .cal-card.gain    { background: #f0fdf4; border: 1px solid #bbf7d0; }
                .cal-card.loss    { background: #fff7ed; border: 1px solid #fed7aa; }
                .cal-card .label  { font-size: 11px; color: #64748b; margin-bottom: 4px; }
                .cal-card .value  { font-size: 17px; font-weight: 700; }
                .cal-card.maintain .value { color: #2563eb; }
                .cal-card.gain .value     { color: #16a34a; }
                .cal-card.loss .value     { color: #ea580c; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 8px;
                    font-size: 12px;
                }
                thead th {
                    background: #7c3aed;
                    color: #fff;
                    padding: 10px 12px;
                    text-align: center;
                    font-weight: 600;
                    border: 1px solid #6d28d9;
                }
                .footer {
                    margin-top: 28px;
                    padding-top: 16px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                    font-size: 11px;
                    color: #94a3b8;
                }
            </style>
        </head>
        <body>
            <!-- هدر گزارش -->
            <div class="report-header">
                <div>
                    <h1>📊 گزارش سلامت بدن</h1>
                    <div class="sub">محاسبه‌گر BMI پیشرفته | استاندارد WHO</div>
                </div>
                <div class="report-date">
                    <div>تاریخ گزارش</div>
                    <strong>${getCurrentJalaliStr()}</strong>
                </div>
            </div>

            <!-- اطلاعات فردی -->
            <div class="section-title">👤 اطلاعات فردی</div>
            <div class="info-grid">
                <div class="info-card">
                    <div class="label">جنسیت</div>
                    <div class="value">${genderTxt}</div>
                </div>
                <div class="info-card">
                    <div class="label">سن</div>
                    <div class="value">${ageText}</div>
                </div>
                <div class="info-card">
                    <div class="label">قد</div>
                    <div class="value">${heightTxt}</div>
                </div>
                <div class="info-card">
                    <div class="label">وزن</div>
                    <div class="value">${weightTxt}</div>
                </div>
                <div class="info-card">
                    <div class="label">BMR (متابولیسم پایه)</div>
                    <div class="value">${bmr}</div>
                </div>
                <div class="info-card">
                    <div class="label">TDEE (کالری روزانه)</div>
                    <div class="value">${tdee}</div>
                </div>
            </div>

            <!-- نتیجه BMI -->
            <div class="section-title">⚖️ نتیجه BMI</div>
            <div class="bmi-highlight">
                <div class="bmi-circle-report">
                    <span class="num">${bmiVal}</span>
                    <span class="lbl">BMI</span>
                </div>
                <div class="bmi-info-block">
                    <div class="status">${bmiStatus}</div>
                    <div class="diff">${bmiDiff}</div>
                    <div class="healthy">محدوده سالم: ${healthy}</div>
                </div>
            </div>

            <!-- کالری‌ها -->
            <div class="section-title">🔥 توصیه کالری روزانه</div>
            <div class="calorie-grid">
                <div class="cal-card maintain">
                    <div class="label">حفظ وزن</div>
                    <div class="value">${maintain}</div>
                </div>
                <div class="cal-card gain">
                    <div class="label">افزایش وزن</div>
                    <div class="value">${gain}</div>
                </div>
                <div class="cal-card loss">
                    <div class="label">کاهش وزن</div>
                    <div class="value">${loss}</div>
                </div>
            </div>

            <!-- تاریخچه اندازه‌گیری‌ها -->
            <div class="section-title">📅 تاریخچه اندازه‌گیری‌ها</div>
            <table>
                <thead>
                    <tr>
                        <th>تاریخ</th>
                        <th>وزن (kg)</th>
                        <th>BMI</th>
                        <th>وضعیت</th>
                        <th>TDEE</th>
                    </tr>
                </thead>
                <tbody>
                    ${historyRows}
                </tbody>
            </table>

            <div class="footer">
                این گزارش توسط محاسبه‌گر BMI پیشرفته بر اساس استانداردهای WHO تولید شده است.<br>
                برای اطلاعات بیشتر با متخصص تغذیه مشورت کنید.
            </div>
        </body>
        </html>
        `;
    }

    /* ==========================================
       تولید و دانلود گزارش PDF
       ========================================== */
    function generatePDF() {
        /* --- بررسی اینکه آیا نتایج در DOM موجود است --- */
        const bmiVal = document.getElementById("bmi-value")?.textContent;
        if (!bmiVal || bmiVal === "—" || bmiVal === "") {
            alert("⚠️ ابتدا محاسبه را انجام دهید تا بتوانید گزارش دریافت کنید.");
            return;
        }

        /* --- بررسی وجود کتابخانه html2pdf --- */
        if (typeof html2pdf === "undefined") {
            alert("⚠️ کتابخانه PDF بارگذاری نشده است. اتصال اینترنت را بررسی کنید.");
            return;
        }

        /* --- ساختن یک iframe مخفی با محتوای گزارش --- */
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;";
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(buildReportHTML());
        iframeDoc.close();

        /* --- دکمه PDF در حالت loading --- */
        const pdfBtn = document.getElementById("pdf-btn");
        const originalText = pdfBtn ? pdfBtn.textContent : "";
        if (pdfBtn) {
            pdfBtn.textContent = "⏳ در حال ساخت PDF...";
            pdfBtn.disabled = true;
        }

        /* --- کمی صبر برای رندر iframe سپس PDF --- */
        setTimeout(() => {
            const options = {
                margin:       [8, 8, 8, 8],
                filename:     `گزارش-سلامت-${getCurrentJalaliStr().replace(/\//g, "-")}.pdf`,
                image:        { type: "jpeg", quality: 0.97 },
                html2canvas:  { scale: 2, useCORS: true, allowTaint: true },
                jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak:    { mode: ["avoid-all", "css", "legacy"] }
            };

            html2pdf()
                .set(options)
                .from(iframeDoc.body)
                .save()
                .then(() => {
                    document.body.removeChild(iframe);
                    if (pdfBtn) {
                        pdfBtn.textContent = originalText;
                        pdfBtn.disabled = false;
                    }
                    console.log("✅ PDF با موفقیت ایجاد شد");
                })
                .catch(err => {
                    document.body.removeChild(iframe);
                    if (pdfBtn) {
                        pdfBtn.textContent = originalText;
                        pdfBtn.disabled = false;
                    }
                    console.error("❌ خطا در ساخت PDF:", err);
                    alert("❌ خطا در ساخت PDF. لطفاً دوباره تلاش کنید.");
                });
        }, 600);
    }

    /* ==========================================
       نمایش تاریخچه در صفحه نتایج
       (اختیاری - فقط اگر عنصر history-container
        در HTML وجود داشته باشد)
       ========================================== */
    function renderHistoryWidget() {
        const container = document.getElementById("history-container");
        if (!container) return;   // اگر عنصر نباشد، هیچ کاری نمی‌کند

        const history = loadHistory();
        if (history.length === 0) {
            container.innerHTML = `<p style="color:#94a3b8;text-align:center;padding:12px">هنوز رکوردی ثبت نشده است</p>`;
            return;
        }

        container.innerHTML = history.slice(0, 5).map(r => `
            <div class="history-item">
                <span class="history-date">${r.date}</span>
                <span class="history-bmi">${r.bmi.toFixed(1)}</span>
                <span class="history-status">${r.status}</span>
                <span class="history-weight">${r.weight} kg</span>
            </div>
        `).join("");
    }

    /* ==========================================
       حذف تمام داده‌ها (ریست)
       ========================================== */
    function clearAllData() {
        if (confirm("⚠️ آیا مطمئن هستید؟ تمام تاریخچه و پروفایل حذف خواهند شد.")) {
            localStorage.removeItem(PROFILE_KEY);
            localStorage.removeItem(HISTORY_KEY);
            alert("✅ تمام داده‌ها پاک شدند.");
        }
    }

    /* ==========================================
       Public API
       ========================================== */
    return {
        autofillFromProfile,
        captureAndSave,
        generatePDF,
        renderHistoryWidget,
        loadHistory,
        loadProfile,
        clearAllData
    };

})();

/* ==========================================
   اتصال دکمه‌ها پس از بارگذاری DOM
   ========================================== */
document.addEventListener("DOMContentLoaded", () => {

    /* --- پر کردن خودکار فیلدها از پروفایل ذخیره‌شده --- */
    ProfileManager.autofillFromProfile();

    /* --- دکمه PDF --- */
    const pdfBtn = document.getElementById("pdf-btn");
    if (pdfBtn) {
        pdfBtn.addEventListener("click", ProfileManager.generatePDF);
    }

    /* --- دکمه حذف تاریخچه (اختیاری) --- */
    const clearBtn = document.getElementById("clear-history-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", ProfileManager.clearAllData);
    }

});
