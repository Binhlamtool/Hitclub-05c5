const axios = require('axios');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình API
const API_BASE_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu';
const PLATFORM_ID = 'g8';
const GAME_ID = 'vgmn_104';

// Hàm phân tích kết quả các phiên trước để lấy pattern
function extractPatternFromResults(results) {
    if (results.length < 13) return null;
    
    return results.slice(-13).map(result => {
        return result.Tong >= 11 ? 't' : 'x';
    }).join('');
}

// Hàm dự đoán kết quả tiếp theo
function predictNextResult(pattern) {
    if (!pattern || pattern.length < 5) return null;
    
    // Phân tích 5 kết quả gần nhất
    const last5 = pattern.slice(-5);
    const taiCount = (last5.match(/t/g) || []).length;
    const xiuCount = (last5.match(/x/g) || []).length;
    
    // Logic dự đoán đơn giản
    if (taiCount >= 4) return 'Xỉu';
    if (xiuCount >= 4) return 'Tài';
    
    return null;
}

// Hàm xử lý dữ liệu Tài Xỉu
async function processTaiXiuData(data) {
    const results = [];
    let currentRound = null;
    
    // Thu thập kết quả các phiên trước
    for (const item of data) {
        if (item.cmd === 1003) {
            const total = item.d1 + item.d2 + item.d3;
            results.push({
                Xuc_xac_1: item.d1,
                Xuc_xac_2: item.d2,
                Xuc_xac_3: item.d3,
                Tong: total,
                Ket_qua: total >= 11 ? 'Tài' : 'Xỉu'
            });
        } else if (item.cmd === 1008) {
            currentRound = {
                phien: item.sid,
                bigBet: item.gi[0].B,
                smallBet: item.gi[0].S
            };
        }
    }
    
    // Chỉ xử lý khi có kết quả phiên hiện tại
    if (results.length === 0) return null;
    
    const latestResult = results[results.length - 1];
    const pattern = extractPatternFromResults(results);
    const prediction = pattern ? predictNextResult(pattern) : null;
    
    return {
        id: "binhtool90",
        phien: currentRound?.phien || null,
        ...latestResult,
        pattern: pattern || 'Chưa đủ dữ liệu',
        Du_doan: prediction || 'Chưa thể dự đoán'
    };
}

// Hàm xử lý dữ liệu MD5
async function processMd5Data(data) {
    const results = [];
    let currentRound = null;
    
    // Thu thập kết quả các phiên trước
    for (const item of data) {
        if (item.cmd === 2006) {
            const total = item.d1 + item.d2 + item.d3;
            results.push({
                Xuc_xac_1: item.d1,
                Xuc_xac_2: item.d2,
                Xuc_xac_3: item.d3,
                Tong: total,
                Ket_qua: total >= 11 ? 'Tài' : 'Xỉu',
                md5: item.md5,
                resultString: item.rs,
                reducedResult: item.rrs
            });
        } else if (item.cmd === 2007) {
            currentRound = {
                phien: item.sid,
                bets: item.bs
            };
        }
    }
    
    // Chỉ xử lý khi có kết quả phiên hiện tại
    if (results.length === 0) return null;
    
    const latestResult = results[results.length - 1];
    const pattern = extractPatternFromResults(results);
    const prediction = pattern ? predictNextResult(pattern) : null;
    
    return {
        id: "binhtool90",
        phien: currentRound?.phien || null,
        ...latestResult,
        pattern: pattern || 'Chưa đủ dữ liệu',
        Du_doan: prediction || 'Chưa thể dự đoán'
    };
}

// API Endpoints
app.get('/api/taixiu', async (req, res) => {
    try {
        const url = `${API_BASE_URL}?platform_id=${PLATFORM_ID}&gid=${GAME_ID}`;
        const response = await axios.get(url);
        
        if (response.data.status !== "OK") {
            throw new Error(response.data.message || 'API request failed');
        }
        
        const processedData = await processTaiXiuData(response.data.data);
        
        if (!processedData) {
            return res.status(404).json({
                status: 'ERROR',
                code: 404,
                message: 'Không tìm thấy dữ liệu phiên hiện tại'
            });
        }
        
        res.json({
            status: 'OK',
            code: 200,
            data: processedData,
            message: 'Dữ liệu Tài Xỉu'
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
        const url = `${API_BASE_URL}?platform_id=${PLATFORM_ID}&gid=${GAME_ID}`;
        const response = await axios.get(url);
        
        if (response.data.status !== "OK") {
            throw new Error(response.data.message || 'API request failed');
        }
        
        const processedData = await processMd5Data(response.data.data);
        
        if (!processedData) {
            return res.status(404).json({
                status: 'ERROR',
                code: 404,
                message: 'Không tìm thấy dữ liệu phiên hiện tại'
            });
        }
        
        res.json({
            status: 'OK',
            code: 200,
            data: processedData,
            message: 'Dữ liệu MD5'
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
