const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled' // 隱藏自動化特徵
        ]
    });
    const page = await browser.newPage();
    
    // 設定隨機的真實瀏覽器 User-Agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    try {
        console.log("正在開啟網頁...");
        // 增加等待時間並使用 'networkidle0' 確保所有請求完成
        await page.goto('https://p-bandai.com/hk/search?limit=20&offset=0&sortType=NewArrival', { 
            waitUntil: 'networkidle0', 
            timeout: 90000 
        });

        // 模擬捲動頁面，觸發延遲加載的圖片或內容
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(r => setTimeout(r, 3000)); // 等待 3 秒讓內容渲染

        // 嘗試多種可能的選擇器 (P-Bandai 有時會更改結構)
        const selector = '.m-card, .product-card, [class*="card"]';
        const found = await page.waitForSelector(selector, { timeout: 15000 }).catch(() => null);

        if (!found) {
            console.log("警告：依然找不到商品卡片。可能是被機器人檢測阻擋或網頁結構已改。");
            // 截圖除錯（這會存在 GitHub Action 的執行紀錄中，方便你檢查畫面）
            await page.screenshot({ path: 'debug_screenshot.png' });
        }

        const products = await page.evaluate(() => {
            // 同時抓取多種可能的卡片類名
            const items = Array.from(document.querySelectorAll('.m-card, .product-list-item')); 
            return items.map(item => {
                const name = item.querySelector('.m-card__title, .title')?.innerText.trim() || "";
                const price = item.querySelector('.m-card__price, .price')?.innerText.trim() || "";
                const link = item.querySelector('a')?.href || "";
                return { name, price, link };
            }).filter(p => {
                const n = p.name.toUpperCase();
                return n.includes('MG') || n.includes('METAL BUILD');
            });
        });

        console.log(`掃描完成。在所有商品中，符合關鍵字的有: ${products.length} 項。`);

        let csvContent = "\ufeff名稱,價格,連結\n"; 
        if (products.length > 0) {
            products.forEach(p => {
                csvContent += `"${p.name}","${p.price}","${p.link}"\n`;
            });
        } else {
            csvContent += `截至 ${new Date().toLocaleString()} 暫無 MG/Metal Build 更新,0,N/A\n`;
        }
        
        fs.writeFileSync('pb_updates.csv', csvContent);
        console.log("CSV 檔案更新完畢。");

    } catch (err) {
        console.error("發生錯誤: ", err);
        fs.writeFileSync('pb_updates.csv', `Error,${new Date().toISOString()},${err.message}`);
    } finally {
        await browser.close();
    }
})();
