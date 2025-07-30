import axios from 'axios';

const API_URL = "https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=g8&gid=vgmn_104";

async function fetchGameData() {
  try {
    const response = await axios.get(API_URL);
    const data = response.data?.data || [];

    const maPhienHu = data.find(item => item.cmd === 1008)?.sid || null;
    const maPhienMD5 = data.find(item => item.cmd === 2007)?.sid || null;

    const ketQuaHu = data.find(item => item.cmd === 1003 && item.d1 !== undefined && item.d2 !== undefined && item.d3 !== undefined);
    const ketQuaMD5 = data.find(item => item.cmd === 2006 && item.d1 !== undefined && item.d2 !== undefined && item.d3 !== undefined);

    const formatKetQua = (result) => {
      if (!result) return null;
      const tong = result.d1 + result.d2 + result.d3;
      return {
        d1: result.d1,
        d2: result.d2,
        d3: result.d3,
        tong: tong,
        ket_qua: tong >= 11 ? "Tài" : "Xỉu"
      };
    };

    const output = {
      id: "binhtool90",
      hu: {
        phien: maPhienHu,
        ket_qua: formatKetQua(ketQuaHu)
      },
      md5: {
        phien: maPhienMD5,
        ket_qua: formatKetQua(ketQuaMD5),
        md5: ketQuaMD5?.md5 || null
      }
    };

    console.log("✅ Kết quả phân tích:");
    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    console.error("❌ Lỗi khi fetch dữ liệu:", error.message);
  }
}

// Gọi hàm
fetchGameData();
