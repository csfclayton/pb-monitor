const https = require('https');

// 直接讀取 Secret
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;

async function testTelegram() {
    console.log("正在發送測試訊息...");
    console.log(`使用的 Chat ID: ${CHAT_ID}`);

    const message = "✅ 萬能測試成功！你的 GitHub Actions 同 Telegram 已經通咗喇！";
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;

    return new Promise((resolve) => {
        https.get(url, (res) => {
            console.log('狀態碼 (StatusCode):', res.statusCode);
            if (res.statusCode === 200) {
                console.log("成功！請檢查你的 Telegram。");
            } else if (res.statusCode === 401) {
                console.log("失敗：Token 錯誤 (401)，請檢查 TG_TOKEN。");
            } else if (res.statusCode === 400) {
                console.log("失敗：Chat ID 錯誤 (400)，請檢查 TG_CHAT_ID。");
            } else {
                console.log("失敗：未知錯誤，狀態碼:", res.statusCode);
            }
            resolve();
        });
    });
}

testTelegram();
