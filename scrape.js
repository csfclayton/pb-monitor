const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // 在 GitHub Actions 環境中需要特定的 launch 參數
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://p-bandai.com/hk/search?limit=20&offset=0&sortType=NewArrival', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

        const products = await page.evaluate(() => {
            // 抓取 P-Bandai 的商品卡片
            const items = Array.from(document.querySelectorAll('.m-card')); 
            return items.map(item => {
                const name = item.querySelector('.m-card__title')?.innerText.trim() || "";
                const price = item.querySelector('.m-card__price')?.innerText.trim() || "";
                const link = item.querySelector('a')?.href || "";
                return { name, price, link };
            }).filter(p => p.name.includes('MG') || p.name.toUpperCase().includes('METAL BUILD'));
        });

        if (products.length > 0) {
            let csvContent = "\ufeff名稱,價格,連結\n"; // 加入 BOM 確保 Excel 開啟不亂碼
            products.forEach(p => {
                csvContent += `"${p.name}","${p.price}","${p.link}"\n`;
            });
            fs.writeFileSync('pb_updates.csv', csvContent);
            console.log(`成功找到 ${products.length} 項商品。`);
        } else {
            console.log("今日未發現 MG 或 Metal Build 更新。");
        }
    } catch (err) {
        console.error("爬取失敗: ", err);
    } finally {
        await browser.close();
    }
})();
