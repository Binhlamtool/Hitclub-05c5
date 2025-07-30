const axios = require('axios');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Lưu trữ lịch sử kết quả
const resultHistory = {
    taiXiu: [],
    md5: []
};

// Cấu hình
const API_BASE_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu';
const PLATFORM_ID = 'g8';
const GAME_ID = 'vgmn_104';

// Hàm tạo pattern từ lịch sử
function generatePattern(history) {
    if (history.length === 0) return "txtxtxtxt"; // Mặc định nếu không có lịch sử
    
    // Chỉ lấy 8 kết quả gần nhất
    const last8 = history.slice(-8);
    return last8.map(result => result === "Tài" ? "t" : "x").join("");
}

// Hàm lấy dữ liệu từ API
async function fetchTaiXiuData(endpoint) {
    try {
        const url = `${API_BASE_URL}?platform_id=${PLATFORM_ID}&gid=${GAME_ID}`;
        const response = await axios.get(url);
        
        if (response.data.status !== "OK" || response.data.code !== 200) {
            throw new Error(response.data.message || 'API request failed');
        }
        
        return endpoint === '/api/taixiu' 
            ? processTaiXiuData(response.data.data)
            : processMd5Data(response.data.data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
}

// Xử lý dữ liệu Tài Xỉu
function processTaiXiuData(data) {
    let result = {
        id: "binhtool90",
        phien: null,
        Xuc_xac_1: null,
        Xuc_xac_2: null,
        Xuc_xac_3: null,
        Tong: null,
        Ket_qua: null,
        pattern: generatePattern(resultHistory.taiXiu),
        Du_doan: null
    };

    for (const item of data) {
        if (item.cmd === 1008) {
            result.phien = item.sid;
        } else if (item.cmd === 1003) {
            result.Xuc_xac_1 = item.d1;
            result.Xuc_xac_2 = item.d2;
            result.Xuc_xac_3 = item.d3;
            result.Tong = item.d1 + item.d2 + item.d3;
            result.Ket_qua = result.Tong >= 11 ? "Tài" : "Xỉu";
            result.Du_doan = result.Tong >= 11 ? "Tài" : "Xỉu";
            
            // Cập nhật lịch sử
            resultHistory.taiXiu.push(result.Ket_qua);
        }
    }

    return result;
}

// Xử lý dữ liệu MD5
function processMd5Data(data) {
    let result = {
        id: "binhtool90",
        phien: null,
        Xuc_xac_1: null,
        Xuc_xac_2: null,
        Xuc_xac_3: null,
        Tong: null,
        Ket_qua: null,
        pattern: generatePattern(resultHistory.md5),
        Du_doan: null,
        md5: null,
        resultString: null,
        reducedResult: null
    };

    for (const item of data) {
        if (item.cmd === 2007) {
            result.phien = item.sid;
        } else if (item.cmd === 2006) {
            result.Xuc_xac_1 = item.d1;
            result.Xuc_xac_2 = item.d2;
            result.Xuc_xac_3 = item.d3;
            result.Tong = item.d1 + item.d2 + item.d3;
            result.Ket_qua = result.Tong >= 11 ? "Tài" : "Xỉu";
            result.Du_doan = result.Tong >= 11 ? "Tài" : "Xỉu";
            result.md5 = item.md5;
            result.resultString = item.rs;
            result.reducedResult = item.rrs;
            
            // Cập nhật lịch sử
            resultHistory.md5.push(result.Ket_qua);
        }
    }

    return result;
}

// API Routes
app.get('/api/taixiu', async (req, res) => {
    try {
        const data = await fetchTaiXiuData('/api/taixiu');
        res.json({
            status: 'OK',
            code: 200,
            data: data,
            message: 'Tai Xiu data fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            code: 500,
            message: error.message
        });
    }
});

app.get('/api/md5', async (req, res) => {
    try {
        const data = await fetchTaiXiuData('/api/md5');
        res.json({
            status: 'OK',
            code: 200,
            data: data,
            message: 'MD5 data fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            code: 500,
            message: error.message
        });
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
