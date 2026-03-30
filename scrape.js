const puppeteer = require('puppeteer');
const https = require('https');

// 從 GitHub Secrets 安全讀取變數
const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;

async function sendTelegram(message) {
    if (!TELEGRAM_TOKEN || !CHAT_ID) {
        console.error("錯誤：未設定 Telegram Token 或 Chat ID");
        return;
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=HTML`;
    return new Promise((resolve) => {
        https.get(url, (res) => {
            console.log('Telegram 回傳狀態:', res.statusCode);
            resolve();
        }).on('error', (e) => {
            console.error('發送失敗:', e);
            resolve();
        });
    });
}

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
        console.log("正在檢查 P-Bandai...");
        await page.goto('https://p-bandai.com/hk/search?limit=20&offset=0&sortType=NewArrival', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.m-card'));
            
            // 將原本的 filter 註解掉，改成下面這行（抓取前 3 件商品，不管是什麼）
return items.slice(0, 3).map(item => ({
    name: item.querySelector('.m-card__title')?.innerText.trim() || "測試商品",
    link: item.querySelector('a')?.href || ""
}));
// .filter(p => p.name.includes('MG') ...); // 暫時不用 filter
            
            
            
            //return items.map(item => ({
            //    name: item.querySelector('.m-card__title')?.innerText.trim() || "",
            //    link: item.querySelector('a')?.href || ""
            //})).filter(p => {
            //    const n = p.name.toUpperCase();
            //    return n.includes('MG') || n.includes('METAL BUILD');
            //});
       // });

        if (products.length > 0) {
            let msg = `<b>🤖 P-Bandai 巡邏報告</b>\n發現 ${products.length} 件目標新貨：\n\n`;
            products.forEach(p => {
                msg += `📌 <b>${p.name}</b>\n🔗 <a href="${p.link}">即刻去搶</a>\n\n`;
            });
            await sendTelegram(msg);
            console.log("已發送 Telegram 通知！");
        } else {
            console.log("暫無 MG 或 Metal Build 更新。");
        }
    } catch (err) {
        console.error("執行出錯:", err);
        await sendTelegram(`⚠️ 監控機器人出錯: ${err.message}`);
    } finally {
        await browser.close();
    }
})();
