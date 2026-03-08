const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    // Use 1920x1080 and scale factor 1 for 1080p PDF, or scale factor 2 for 4K. 
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    const filePath = `file://${path.join(__dirname, 'index.html')}`;
    console.log(`Loading ${filePath}...`);
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    // Hide controls and force standard scale
    await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = `
            .controls, .nav-dots, .header-nav, .fullscreen-btn, .tv-frame { display: none !important; }
            body > .presentation-container { 
                transform: scale(1) !important; 
                width: 1920px !important; 
                height: 1080px !important; 
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                margin: 0 !important;
            }
            body { background: #0b1120 !important; overflow: hidden !important; margin: 0; }
        `;
        document.head.appendChild(style);
    });

    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < 17; i++) {
        console.log(`Capturing slide ${i + 1}/17...`);
        // Go to slide
        await page.evaluate((index) => {
            if (typeof goTo === 'function') {
                // Ensure all charts are initialized just in case
                if (typeof initCharts === 'function') initCharts(index);
                goTo(index);

                // Force reveal all step-reveals immediately on this slide
                const currentSlide = document.querySelectorAll('.slide')[index];
                if (currentSlide) {
                    currentSlide.querySelectorAll('.step-reveal').forEach(el => {
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                        el.style.transition = 'none';
                    });
                }
            }
        }, i);

        // Wait 1.5s for charts to animate/render and transitions to settle
        await new Promise(r => setTimeout(r, 1500));

        // Take screenshot
        const imgBuffer = await page.screenshot({ type: 'jpeg', quality: 95 });

        // Add to PDF
        const image = await pdfDoc.embedJpg(imgBuffer);
        const pdfPage = pdfDoc.addPage([1920, 1080]);
        pdfPage.drawImage(image, {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
        });
    }

    await browser.close();

    console.log("Saving PDF...");
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('AI_Logistics_Presentation.pdf', pdfBytes);
    console.log("Done! Saved as AI_Logistics_Presentation.pdf");
})().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
