const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    try {
        await page.goto('https://p-bandai.com/hk/search?limit=20&offset=0&sortType=NewArrival', { 
            waitUntil: 'networkidle2', timeout: 60000 
        });
        
        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.m-card'));
            return items.map(item => ({
                name: item.querySelector('.m-card__title')?.innerText.trim() || "",
                link: item.querySelector('a')?.href || ""
            })).filter(p => {
                const n = p.name.toUpperCase();
                return n.includes('MG') || n.includes('METAL BUILD');
            });
        });

        if (products.length > 0) {
            // 將結果印出嚟，等陣 GitHub Action 會攞呢段文字去開 Issue
            console.log("FOUND_ITEMS_START");
            products.forEach(p => {
                console.log(`- [ ] ${p.name} \n  🔗 ${p.link}`);
            });
            console.log("FOUND_ITEMS_END");
        } else {
            console.log("NO_NEW_ITEMS");
        }
    } catch (err) {
        console.error("ERROR:" + err.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
