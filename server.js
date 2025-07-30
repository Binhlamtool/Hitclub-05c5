import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

let patternHistory = [];
let lastTaiXiu = null;
let lastMd5 = null;

function getKetQua(tong) {
  return tong >= 11 ? 'Tài' : 'Xỉu';
}

function getPattern() {
  return patternHistory.map(t => t >= 11 ? 't' : 'x').join('');
}

function predictNext() {
  if (patternHistory.length < 3) return 'Không đủ dữ liệu';
  const last3 = patternHistory.slice(-3).map(t => t >= 11 ? 't' : 'x').join('');
  const map = {
    'ttt': 'Xỉu',
    'xxx': 'Tài',
    'txt': 'Xỉu',
    'xtx': 'Tài'
  };
  return map[last3] || 'Tài';
}

async function fetchData() {
  try {
    const res = await axios.get('https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=g8&gid=vgmn_101');
    const items = res.data.data;

    let phienThuong = null, kqThuong = null;
    let phienMd5 = null, kqMd5 = null;

    for (const item of items) {
      switch (item.cmd) {
        case 1008:
          phienThuong = item.sid;
          break;
        case 1003:
          kqThuong = item;
          break;
        case 2007:
          phienMd5 = item.sid;
          break;
        case 2006:
          kqMd5 = item;
          break;
      }
    }

    // Gộp bàn thường
    if (phienThuong && kqThuong) {
      const tong = kqThuong.d1 + kqThuong.d2 + kqThuong.d3;
      const ket_qua = getKetQua(tong);
      patternHistory.push(tong);
      if (patternHistory.length > 10) patternHistory.shift();

      lastTaiXiu = {
        id: "binhtool90",
        phien: phienThuong,
        xuc_xac_1: kqThuong.d1,
        xuc_xac_2: kqThuong.d2,
        xuc_xac_3: kqThuong.d3,
        tong,
        ket_qua,
        pattern: getPattern(),
        du_doan: predictNext()
      };
    }

    // Gộp bàn MD5
    if (phienMd5 && kqMd5) {
      const tong = kqMd5.d1 + kqMd5.d2 + kqMd5.d3;
      const ket_qua = getKetQua(tong);
      patternHistory.push(tong);
      if (patternHistory.length > 10) patternHistory.shift();

      lastMd5 = {
        id: "binhtool90",
        phien: phienMd5,
        xuc_xac_1: kqMd5.d1,
        xuc_xac_2: kqMd5.d2,
        xuc_xac_3: kqMd5.d3,
        tong,
        ket_qua,
        pattern: getPattern(),
        du_doan: predictNext()
      };
    }

  } catch (e) {
    console.error('Lỗi khi fetch:', e.message);
  }
}

setInterval(fetchData, 5000);

// API Bàn thường
app.get('/api/taixiu', (req, res) => {
  if (lastTaiXiu) return res.json(lastTaiXiu);
  res.json({ message: 'Chưa có dữ liệu bàn thường' });
});

// API MD5
app.get('/api/md5', (req, res) => {
  if (lastMd5) return res.json(lastMd5);
  res.json({ message: 'Chưa có dữ liệu bàn md5' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
