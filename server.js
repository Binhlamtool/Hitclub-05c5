const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const API_URL = "https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=g8&gid=vgmn_104";

// Endpoint 1: Lọc kết quả MD5
app.get("/api/md5", async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    const items = Array.isArray(response.data) ? response.data : [];

    // Lọc đúng cấu trúc md5: có d1, d2, d3, iJp và KHÔNG có sid
    const md5Result = items.find(
      item =>
        typeof item.d1 === "number" &&
        typeof item.d2 === "number" &&
        typeof item.d3 === "number" &&
        typeof item.iJp === "boolean" &&
        item.sid === undefined
    );

    if (md5Result) {
      res.json({
        status: "success",
        type: "md5",
        result: {
          d1: md5Result.d1,
          d2: md5Result.d2,
          d3: md5Result.d3,
          iJp: md5Result.iJp
        }
      });
    } else {
      res.json({ status: "not_found", message: "Không tìm thấy kết quả MD5 phù hợp." });
    }
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Endpoint 2: Lọc kết quả HŨ
app.get("/api/hu", async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    const items = Array.isArray(response.data) ? response.data : [];

    // Lọc đúng cấu trúc hu: có sid, d1, d2, d3, iJp
    const huResult = items.find(
      item =>
        typeof item.sid === "number" &&
        typeof item.d1 === "number" &&
        typeof item.d2 === "number" &&
        typeof item.d3 === "number" &&
        typeof item.iJp === "boolean"
    );

    if (huResult) {
      res.json({
        status: "success",
        type: "hu",
        result: {
          sid: huResult.sid,
          d1: huResult.d1,
          d2: huResult.d2,
          d3: huResult.d3,
          iJp: huResult.iJp
        }
      });
    } else {
      res.json({ status: "not_found", message: "Không tìm thấy kết quả HŨ phù hợp." });
    }
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server đang chạy tại http://localhost:${PORT}`));
