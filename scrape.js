const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // 模擬真實瀏覽器，避免被阻擋
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    try {
        console.log("正在開啟網頁...");
        await page.goto('https://p-bandai.com/hk/search?limit=20&offset=0&sortType=NewArrival', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

        // 等待商品列表載入（確保畫面不是空的）
        await page.waitForSelector('.m-card', { timeout: 10000 }).catch(() => console.log("未找到商品卡片選擇器"));

        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.m-card')); 
            return items.map(item => {
                const name = item.querySelector('.m-card__title')?.innerText.trim() || "";
                const price = item.querySelector('.m-card__price')?.innerText.trim() || "";
                const link = item.querySelector('a')?.href || "";
                return { name, price, link };
            }).filter(p => {
                const n = p.name.toUpperCase();
                return n.includes('MG') || n.includes('METAL BUILD');
            });
        });

        console.log(`抓取完成，共發現 ${products.length} 項符合條件的商品。`);

        // 重點修正：無論有沒有找到商品，都先建立一個空的或基本的 CSV，避免 Git 報錯
        let csvContent = "\ufeff名稱,價格,連結\n"; 
        if (products.length > 0) {
            products.forEach(p => {
                csvContent += `"${p.name}","${p.price}","${p.link}"\n`;
            });
        } else {
            csvContent += "今日暫無更新,0,N/A\n";
        }
        
        fs.writeFileSync('pb_updates.csv', csvContent);
        console.log("CSV 檔案已寫入。");

    } catch (err) {
        console.error("執行過程中發生錯誤: ", err);
        // 即使出錯也建立一個錯誤記錄檔，防止 Actions 因找不到檔案而中斷
        fs.writeFileSync('pb_updates.csv', `Error,${new Date().toISOString()},${err.message}`);
    } finally {
        await browser.close();
    }
})();
