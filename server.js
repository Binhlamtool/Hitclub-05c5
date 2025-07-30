const axios = require('axios');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const API_BASE_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu';
const PLATFORM_ID = 'g8';
const GAME_ID = 'vgmn_104';

// Helper function to fetch data from API
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

// Process Tai Xiu data
function processTaiXiuData(data) {
    let result = {
        currentRound: null,
        currentBet: null,
        result: null
    };

    for (const item of data) {
        if (item.cmd === 1008) {
            result.currentRound = {
                sid: item.sid,
                bigBet: {
                    users: item.gi[0].B.tU,
                    amount: item.gi[0].B.tB
                },
                smallBet: {
                    users: item.gi[0].S.tU,
                    amount: item.gi[0].S.tB
                }
            };
        } else if (item.cmd === 1003) {
            result.result = {
                d1: item.d1,
                d2: item.d2,
                d3: item.d3,
                total: item.d1 + item.d2 + item.d3,
                isJackpot: item.iJp,
                jackpotValue: item.tJpV
            };
        }
    }

    return result;
}

// Process MD5 data
function processMd5Data(data) {
    let result = {
        currentRound: null,
        result: null
    };

    for (const item of data) {
        if (item.cmd === 2007) {
            result.currentRound = {
                sid: item.sid,
                bets: item.bs.map(bet => ({
                    eid: bet.eid,
                    betCount: bet.bc,
                    amount: bet.v
                }))
            };
        } else if (item.cmd === 2006) {
            result.result = {
                d1: item.d1,
                d2: item.d2,
                d3: item.d3,
                total: item.d1 + item.d2 + item.d3,
                isJackpot: item.iJp,
                jackpotValue: item.tJpV,
                md5: item.md5,
                resultString: item.rs,
                reducedResult: item.rrs
            };
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
