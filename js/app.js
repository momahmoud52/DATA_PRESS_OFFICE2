// ✅ استبدال Tabletop بخدمة opensheet
const SHEET_URL = "https://opensheet.elk.sh/1UuIlKcWEpnRz690m4XS08waT3DNx7H3oIlwkITGKOBs/Sheet1";
let sheetData = [];

window.addEventListener("DOMContentLoaded", () => {
  fetch(SHEET_URL)
    .then(response => response.json())
    .then(data => {
      sheetData = data;
      if (document.getElementById("loginBtn")) {
        document.getElementById("loginBtn").addEventListener("click", handleLogin);
      } else {
        loadDashboard();
      }
    })
    .catch(err => {
      console.error("فشل تحميل البيانات:", err);
      alert("حدث خطأ أثناء تحميل البيانات من Google Sheets.");
    });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  }
});

function handleLogin() {
  const name = document.getElementById("nameInput").value.trim().toLowerCase();
  const nid = document.getElementById("nidInput").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  const user = sheetData.find(row =>
    (row["الاسم بالعربي"]?.toLowerCase() === name || row["Name"]?.toLowerCase() === name) &&
    row["الرقم القومي"] === nid
  );

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "dashboard.html";
  } else {
    errorMsg.textContent = "البيانات غير صحيحة أو غير موجودة.";
  }
}

function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const dashboard = document.getElementById("dashboard");

  if (!user) {
    document.body.innerHTML = "<h3 style='text-align:center;'>الرجاء تسجيل الدخول مرة أخرى</h3>";
    return;
  }

  for (const [key, value] of Object.entries(user)) {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${key}</strong><br>${value}`;
    dashboard.appendChild(div);
  }
}
