import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const API_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=g8&gid=vgmn_104';

function getKetQua(sum) {
  return sum >= 11 ? 'Tài' : 'Xỉu';
}

function getPattern(d1, d2, d3) {
  return d1 + d2 + d3 >= 11 ? 't' : 'x';
}

app.get('/api/banthuong', async (req, res) => {
  try {
    const response = await fetch(API_URL);
    const json = await response.json();
    const data = json.data;

    // Tìm object chứa d1, d2, d3 và không có md5 (bàn thường)
    const result = data.find(item =>
      typeof item.d1 === 'number' &&
      typeof item.d2 === 'number' &&
      typeof item.d3 === 'number' &&
      !item.md5
    );

    if (!result) return res.status(404).json({ error: 'Không tìm thấy dữ liệu bàn thường' });

    const tong = result.d1 + result.d2 + result.d3;

    res.json({
      id: 'binhtool90',
      phien: result.sid || null,
      xuc_xac_1: result.d1,
      xuc_xac_2: result.d2,
      xuc_xac_3: result.d3,
      tong: tong,
      ket_qua: getKetQua(tong),
      pattern: getPattern(result.d1, result.d2, result.d3),
      du_doan: getKetQua(tong) === 'Tài' ? 'Xỉu' : 'Tài'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu bàn thường' });
  }
});

app.get('/api/md5', async (req, res) => {
  try {
    const response = await fetch(API_URL);
    const json = await response.json();
    const data = json.data;

    // Tìm object có d1, d2, d3 và có cả md5 (bàn MD5)
    const result = data.find(item =>
      typeof item.d1 === 'number' &&
      typeof item.d2 === 'number' &&
      typeof item.d3 === 'number' &&
      item.md5
    );

    if (!result) return res.status(404).json({ error: 'Không tìm thấy dữ liệu md5' });

    const tong = result.d1 + result.d2 + result.d3;

    res.json({
      id: 'binhtool90',
      phien: result.sid || null,
      xuc_xac_1: result.d1,
      xuc_xac_2: result.d2,
      xuc_xac_3: result.d3,
      tong: tong,
      ket_qua: getKetQua(tong),
      pattern: getPattern(result.d1, result.d2, result.d3),
      du_doan: getKetQua(tong) === 'Tài' ? 'Xỉu' : 'Tài',
      md5: result.md5
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu md5' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
