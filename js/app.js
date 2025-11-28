/* file: js/app.js */
/* هدف: كود منظم؛ تغيير SHEET_URL لتوجيه إلى الشيت المطلوب. */

/*
  لتغيير رابط شيت: غيّر قيمة SHEET_URL إلى:
  https://opensheet.elk.sh/ID_الخاص_بـ_GoogleSheet/اسم_الورقة
*/
const SHEET_URL = "https://opensheet.elk.sh/17_QwpZ_e10lzPPQ5IVnHyLMk2_yy9uXrEy8KSlnnH54/Sheet1";

const App = (function () {
  let sheetData = [];

  /* fetchSheet: جلب بيانات الشيت مرة واحدة */
  async function fetchSheet() {
    try {
      const res = await fetch(SHEET_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("شبكة: فشل استجابة الشيت");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("الشيت لا تُرجع مصفوفة");
      sheetData = data;
      return data;
    } catch (err) {
      console.error("fetchSheet:", err);
      throw err;
    }
  }

  /* sanitize: منع XSS عند عرض قيم المستخدم */
  function sanitize(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>"'`=\/]/g, s =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'/':'&#x2F;','=':'&#x3D;','`':'&#x60;' }[s])
    );
  }

  /* -----------------------------------------------------
     🔥 findUser: النسخة المعدلة (يدعم Name و الاسم بالعربي)
     ----------------------------------------------------- */
  
  function findUser(name, nid) {
    const inputName = name.trim().toLowerCase();
    const inputNID = nid.trim();

    return sheetData.find(row => {
      const arabicName = String(row["الاسم بالعربي"] || "").trim().toLowerCase();
      const englishName = String(row["Name"] || "").trim().toLowerCase();
      const nationalID = String(row["الرقم الكودي"] || "").trim();

      return (
        (inputName === arabicName || inputName === englishName) &&
        inputNID === nationalID
      );
    });
  }

  /* saveUser: حفظ بيانات المستخدم في localStorage (مبسطة) */
  function saveUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  /* getSavedUser: استرجاع المستخدم */
  function getSavedUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }

  /* clearUser: حذف وحذف الصفحة */
  function clearUserAndRedirect() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }

  /* setupLogin: يربط حدث ال submit للنموذج ويعالج التحقق */
  function setupLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    const errorMsg = document.getElementById("errorMsg");

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      errorMsg.textContent = "";

      const name = document.getElementById("nameInput").value || "";
      const nid = document.getElementById("nidInput").value || "";

      if (!name.trim() || !nid.trim()) {
        errorMsg.textContent = "الرجاء إدخال الاسم والرقم القومي.";
        return;
      }

      if (!sheetData.length) {
        try {
          await fetchSheet();
        } catch {
          errorMsg.textContent = "خطأ في تحميل بيانات الشيت. حاول لاحقًا.";
          return;
        }
      }

      const user = findUser(name, nid);
      if (user) {
        saveUser(user);
        window.location.href = "dashboard.html";
      } else {
        errorMsg.textContent = "البيانات غير صحيحة أو غير موجودة.";
      }
    });
  }

  /* renderTable: تحويل كائن المستخدم إلى جدول HTML */
  function renderTable(user, container) {
    container.innerHTML = "";
    // ===== صور المستخدم =====
const photosWrapper = document.createElement("div");
photosWrapper.className = "user-photos";

if (user["صورة شخصية"]) {
  const personalBox = document.createElement("div");
  personalBox.className = "user-photo-box";
  personalBox.innerHTML = `
    <h3>الصورة الشخصية</h3>
    <img src="${sanitize(user["صورة شخصية"])}" alt="الصورة الشخصية">
  `;
  photosWrapper.appendChild(personalBox);
}

if (user["صورة البطاقة"]) {
  const idBox = document.createElement("div");
  idBox.className = "user-photo-box";
  idBox.innerHTML = `
    <h3>صورة البطاقة</h3>
    <img src="${sanitize(user["صورة البطاقة"])}" alt="صورة البطاقة">
  `;
  photosWrapper.appendChild(idBox);
}

container.appendChild(photosWrapper);
// ===== بطاقة PDF =====
if (user["ملف البطاقة PDF"]) {
  const pdfBox = document.createElement("div");
  pdfBox.className = "pdf-box";

  const pdfURL = sanitize(user["ملف البطاقة PDF"]);

  pdfBox.innerHTML = `
    <h3>ملف البطاقة (PDF)</h3>
    <iframe class="pdf-frame" src="${pdfURL}"></iframe>
    <a href="${pdfURL}" target="_blank" class="pdf-download">تحميل ملف PDF</a>
  `;

  container.appendChild(pdfBox);
}



    const summary = document.createElement("div");
    summary.className = "user-summary";

    const badge = document.createElement("div");
    badge.className = "user-badge";

    const avatar = document.createElement("div");
    avatar.className = "user-avatar";
    avatar.textContent = (String(user["الاسم بالعربي"] || user["Name"] || "؟").trim().charAt(0) || "?").toUpperCase();
    badge.appendChild(avatar);

    const nameWrap = document.createElement("div");
    nameWrap.innerHTML = `<div><strong>${sanitize(user["الاسم بالعربي"] || user["Name"] || "")}</strong></div>
                          <div style="color:#666;font-size:0.95rem">${sanitize(user["الرقم القومي"] || "")}</div>`;
    badge.appendChild(nameWrap);
    summary.appendChild(badge);
    container.appendChild(summary);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    tr.innerHTML = "<th>البيانات</th><th>المعلومات</th>";
    thead.appendChild(tr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const key in user) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="البيانات"><strong>${sanitize(key)}</strong></td>
        <td data-label="المعلومات">${sanitize(user[key])}</td>
      `;
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  /* setupDashboard */
  function setupDashboard() {
    const container = document.getElementById("dashboard");
    if (!container) return;

    const user = getSavedUser();
    if (!user) {
      window.location.href = "index.html";
      return;
    }
/* تحويل رابط Google Drive إلى رابط مباشر PDF */
function convertDriveToPDF(url) {
  if (!url) return "";

  // استخراج ID من الرابط
  const match = url.match(/\/d\/(.*?)\//);
  if (!match || !match[1]) return url; // إذا ليس رابط Drive، نعيده كما هو

  const fileId = match[1];

  // رابط مباشر PDF
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

    renderTable(user, container);

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        clearUserAndRedirect();
      });
    }
  }

  /* init */
  async function init() {
    fetchSheet().catch(err => console.warn("Sheet load warning:", err));
    setupLogin();

    if (document.getElementById("dashboard")) {
      setupDashboard();
    }
  }

  return { init };
})();

window.addEventListener("DOMContentLoaded", () => {
  App.init();
});

/* JS: استبدل / أضف هذه الوظائف في ملف js/app.js (ضعها قبل نهاية الملف) */

/* ===== Loader helpers ===== */
function showLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  loader.classList.remove("hidden");
  loader.setAttribute("aria-hidden", "false");
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  // احتفظ بتأخير صغير لتجربة مستخدم أفضل
  setTimeout(() => {
    loader.classList.add("hidden");
    loader.setAttribute("aria-hidden", "true");
  }, 250);
}

/* ===== تعديل init لتنتظر الشيت قبل إخفاء اللودر ===== */
async function init() {
  // أظهر اللودر فوراً
  showLoader();

  // جرب تحميل الشيت وانتظر النتيجة (لكن لا تمنع الصفحة من العمل لو فشل)
  try {
    await fetchSheet();
  } catch (err) {
    // لو فشل التحميل لا نتوقف؛ نعرض رسالة لاحقاً داخل الواجهة عند الحاجة
    console.warn("Sheet load failed (init):", err);
  }

  // أعدادات الصفحة
  setupLogin();

  if (document.getElementById("dashboard")) {
    setupDashboard();
  }

  // أخفِ اللودر الآن لأن الشيت (أو محاولة جلبه) انتهت
  hideLoader();
}

/* fallback: إذا كانت صفحة كلها قد تم تحميلها قبل انتهاء fetchSheet */
window.addEventListener("load", () => {
  // بعد حدث load نتأكد من إخفاء اللودر بعد مهلة قصيرة
  setTimeout(() => {
    hideLoader();
  }, 600);
});

/* استبدل سطر البدء السابق بـ: */
window.addEventListener("DOMContentLoaded", () => {
  App.init(); // App.init الآن يقوم بإظهار/إخفاء اللودر
});
