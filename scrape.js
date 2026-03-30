const puppeteer = require('puppeteer');
const https = require('https');

v
async function sendTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=HTML`;
    return new Promise((resolve) => {
        https.get(url, (res) => resolve());
    });
}

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
        await page.goto('https://p-bandai.com/hk/search?limit=20&offset=0&sortType=NewArrival', { waitUntil: 'networkidle0' });
        
        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.m-card'));
            return items.map(item => ({
                name: item.querySelector('.m-card__title')?.innerText.trim() || "",
                link: item.querySelector('a')?.href || ""
            })).filter(p => p.name.includes('MG') || p.name.toUpperCase().includes('METAL BUILD'));
        });

        if (products.length > 0) {
            let msg = "<b>📦 P-Bandai 新貨通知！</b>\n\n";
            products.forEach(p => {
                msg += `🔹 ${p.name}\n🔗 <a href="${p.link}">直接購買</a>\n\n`;
            });
            await sendTelegram(msg);
            console.log("通知已發送！");
        } else {
            console.log("今日無新貨。");
        }
    } catch (err) {
        await sendTelegram(`❌ 爬蟲出錯: ${err.message}`);
    } finally {
        await browser.close();
    }
})();
