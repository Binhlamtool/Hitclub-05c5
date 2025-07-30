import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

let history = []; // Lưu lịch sử kết quả (pattern)
let lastTaiXiu = null;
let lastMd5 = null;

function getKetQua(tong) {
  return tong >= 11 ? 'Tài' : 'Xỉu';
}

function getPattern(historyArr) {
  return historyArr.map(t => getKetQua(t) === 'Tài' ? 't' : 'x').join('');
}

function predictNext(historyArr) {
  if (historyArr.length < 3) return 'Không đủ dữ liệu';
  const recent = historyArr.slice(-3).map(t => getKetQua(t)).join('');
  const patternCounts = { 'txx': 'Tài', 'xtt': 'Xỉu', 'ttt': 'Xỉu', 'xxx': 'Tài' };
  return patternCounts[recent] || 'Tài';
}

async function fetchData() {
  try {
    const res = await axios.get('https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=g8&gid=vgmn_101');
    const data = res.data.data;

    for (let d of data) {
      const cmd = d.cmd;

      // Bàn thường
      if (cmd === 1003) {
        const tong = d.d1 + d.d2 + d.d3;
        const ket_qua = getKetQua(tong);
        history.push(tong);
        if (history.length > 10) history.shift();

        lastTaiXiu = {
          id: "binhtool90",
          phien: d.sid || d.sid_md5 || 0,
          xuc_xac_1: d.d1,
          xuc_xac_2: d.d2,
          xuc_xac_3: d.d3,
          tong,
          ket_qua,
          pattern: getPattern(history),
          du_doan: predictNext(history)
        };
      }

      // Bàn md5
      if (cmd === 2006) {
        const tong = d.d1 + d.d2 + d.d3;
        const ket_qua = getKetQua(tong);
        history.push(tong);
        if (history.length > 10) history.shift();

        lastMd5 = {
          id: "binhtool90",
          phien: d.sid || d.sid_md5 || 0,
          xuc_xac_1: d.d1,
          xuc_xac_2: d.d2,
          xuc_xac_3: d.d3,
          tong,
          ket_qua,
          pattern: getPattern(history),
          du_doan: predictNext(history)
        };
      }
    }

  } catch (err) {
    console.error('Lỗi fetch:', err.message);
  }
}

setInterval(fetchData, 5000);

app.get('/api/taixiu', (req, res) => {
  if (!lastTaiXiu) return res.json({ message: 'Chưa có dữ liệu' });
  res.json(lastTaiXiu);
});

app.get('/api/md5', (req, res) => {
  if (!lastMd5) return res.json({ message: 'Chưa có dữ liệu' });
  res.json(lastMd5);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
