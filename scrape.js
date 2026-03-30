const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    // 模擬真實用家，避免被擋
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log("正在開啟 P-Bandai 網頁...");
        await page.goto('https://p-bandai.com/hk/shop/tamashiiwebshop', { 
            waitUntil: 'networkidle2', timeout: 90000 
        });
        
        // 等多 5 秒確保 AJAX 內容出齊
        await new Promise(r => setTimeout(r, 5000));

        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.m-card'));
            return items.map(item => ({
                name: item.querySelector('.m-card__title')?.innerText.trim() || "未知名稱",
                link: item.querySelector('a')?.href || ""
            }));
        });

        console.log(`總共掃描到 ${products.length} 件商品。`);

        // 過濾 MG 或 Metal Build
        const filtered = products.filter(p => {
            const n = p.name.toUpperCase();
            return n.includes('MG') || n.includes('1/100') || n.includes('METAL BUILD');
        });

        if (filtered.length > 0) {
            console.log("FOUND_ITEMS_START");
            filtered.forEach(p => console.log(`- [ ] ${p.name} \n  🔗 ${p.link}`));
            console.log("FOUND_ITEMS_END");
        } else {
            console.log("NO_MATCHED_ITEMS");
            // 如果無 MG，就印出頭 3 件商品名睇吓佢見到乜
            console.log("DEBUG_FIRST_3_ITEMS:");
            products.slice(0, 3).forEach(p => console.log(`- ${p.name}`));
        }
    } catch (err) {
        console.error("ERROR:" + err.message);
    } finally {
        await browser.close();
    }
})();
