const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const SELF_URL = process.env.SELF_URL || `http://localhost:${PORT}`;

// Lưu lịch sử để tạo pattern
let history = [];

let latestResult = {
  id: "binhtool90",
  Phien: 0,
  Xuc_xac_1: 0,
  Xuc_xac_2: 0,
  Xuc_xac_3: 0,
  Tong: 0,
  Ket_qua: "",
  Pattern: "",
  Du_doan: ""
};

function getTaiXiu(sum) {
  return sum > 10 ? "t" : "x";
}

// Thuật toán dự đoán đơn giản từ pattern gần nhất
function duDoan(historyPattern) {
  if (historyPattern.endsWith("ttt")) return "Xỉu";
  if (historyPattern.endsWith("xxx")) return "Tài";
  return Math.random() > 0.5 ? "Tài" : "Xỉu"; // dự đoán ngẫu nhiên
}

function updateResult(d1, d2, d3, sid = null) {
  const total = d1 + d2 + d3;
  const result = total > 10 ? "Tài" : "Xỉu";
  const shorthand = getTaiXiu(total);

  if (sid !== latestResult.Phien) {
    history.push(shorthand);
    if (history.length > 20) history.shift();

    const pattern = history.join("");
    const duDoanText = duDoan(pattern);

    latestResult = {
      id: "binhtool90",
      Phien: sid || latestResult.Phien,
      Xuc_xac_1: d1,
      Xuc_xac_2: d2,
      Xuc_xac_3: d3,
      Tong: total,
      Ket_qua: result,
      Pattern: pattern,
      Du_doan: duDoanText
    };

    const timeStr = new Date().toISOString().replace("T", " ").slice(0, 19);
    console.log(
      `[🎲✅] Phiên ${latestResult.Phien} - ${d1}-${d2}-${d3} ➜ Tổng: ${total}, Kết quả: ${result} | ${timeStr}`
    );
  }
}

// API gốc
const API_TARGET_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=g8&gid=vgmn_101';

async function fetchGameData() {
  try {
    const response = await axios.get(API_TARGET_URL);
    const data = response.data;

    if (data.status === "OK" && Array.isArray(data.data) && data.data.length > 0) {
      const game = data.data[0];
      const sid = game.sid;
      const d1 = game.d1;
      const d2 = game.d2;
      const d3 = game.d3;

      if (sid !== latestResult.Phien && d1 !== undefined && d2 !== undefined && d3 !== undefined) {
        updateResult(d1, d2, d3, sid);
      }
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy dữ liệu từ API GET:", error.message);
  }
}

setInterval(fetchGameData, 5000);

app.get("/api/taixiu", (req, res) => {
  res.json(latestResult);
});

app.get("/", (req, res) => {
  res.json({ status: "HITCLUB Tài Xỉu đang chạy", phien: latestResult.Phien });
});

// Ping để Render không ngủ
setInterval(() => {
  if (SELF_URL.includes("http")) {
    axios.get(`${SELF_URL}/api/taixiu`).catch(() => {});
  }
}, 300000); // 5 phút ping 1 lần

app.listen(PORT, () => {
  console.log(`🚀 Server Hitclub Tài Xỉu đang chạy tại http://localhost:${PORT}`);
});
