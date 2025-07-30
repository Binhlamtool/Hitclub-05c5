const axios = require('axios');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Lưu trữ lịch sử kết quả thực tế
const actualPatterns = {
    taiXiu: "txtxtxtxtxtxtx", // Pattern thực tế từ game
    md5: "txtxtxtxtxtxtx"    // Pattern thực tế từ game
};

// Cấu hình
const API_BASE_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu';
const PLATFORM_ID = 'g8';
const GAME_ID = 'vgmn_104';

// Hàm lấy pattern thực tế từ API
function getActualPattern(data, gameType) {
    let pattern = "";
    
    // Lấy 13 kết quả gần nhất từ data
    const results = [];
    for (const item of data) {
        if ((gameType === 'taiXiu' && item.cmd === 1003) || 
            (gameType === 'md5' && item.cmd === 2006)) {
            const total = item.d1 + item.d2 + item.d3;
            results.push(total >= 11 ? "t" : "x");
        }
    }
    
    // Chỉ lấy 13 kết quả gần nhất
    const last13 = results.slice(-13);
    if (last13.length > 0) {
        pattern = last13.join("");
        actualPatterns[gameType] = pattern; // Cập nhật pattern thực
    }
    
    return actualPatterns[gameType];
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
    const actualPattern = getActualPattern(data, 'taiXiu');
    
    let result = {
        id: "binhtool90",
        phien: null,
        Xuc_xac_1: null,
        Xuc_xac_2: null,
        Xuc_xac_3: null,
        Tong: null,
        Ket_qua: null,
        pattern: actualPattern, // Sử dụng pattern thực tế
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
            result.Du_doan = predictNext(actualPattern); // Dự đoán từ pattern thực
        }
    }

    return result;
}

// Xử lý dữ liệu MD5
function processMd5Data(data) {
    const actualPattern = getActualPattern(data, 'md5');
    
    let result = {
        id: "binhtool90",
        phien: null,
        Xuc_xac_1: null,
        Xuc_xac_2: null,
        Xuc_xac_3: null,
        Tong: null,
        Ket_qua: null,
        pattern: actualPattern, // Sử dụng pattern thực tế
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
            result.Du_doan = predictNext(actualPattern); // Dự đoán từ pattern thực
            result.md5 = item.md5;
            result.resultString = item.rs;
            result.reducedResult = item.rrs;
        }
    }

    return result;
}

// Hàm dự đoán từ pattern thực
function predictNext(pattern) {
    if (!pattern || pattern.length < 5) return "Tài/Xỉu ngẫu nhiên";
    
    // Phân tích pattern
    const last5 = pattern.slice(-5);
    const taiCount = (last5.match(/t/g) || []).length;
    const xiuCount = (last5.match(/x/g) || []).length;
    
    // Dự đoán đơn giản dựa trên tỷ lệ
    if (taiCount >= 4) return "Xỉu"; // Theo quy luật cân bằng
    if (xiuCount >= 4) return "Tài"; // Theo quy luật cân bằng
    
    return Math.random() > 0.5 ? "Tài" : "Xỉu";
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
