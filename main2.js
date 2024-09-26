const puppeteer = require('puppeteer');

async function runScraper(email, password, coverLetter, categories) {
    const browser = await puppeteer.launch({ headless: false, ignoreHTTPSErrors: true, args: ['--no-sandbox'] });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');

        page.on('dialog', async dialog => {
            console.log(dialog.message());
            await dialog.accept();
        });

        await page.goto('https://internshala.com/', { waitUntil: 'networkidle2', timeout: 16000000 });

        await page.evaluate(() => {
            return new Promise(resolve => setTimeout(resolve, 2000));
        });

        await page.click('#header > div > nav > div.nav-cta-container > button.login-cta');
        await page.type('#modal_email', email);
        await page.type('#modal_password', password);
        await page.click('#modal_login_submit');
        await page.waitForNavigation({ timeout: 60000 });

        // Navigating to the general internship page
        await page.goto('https://internshala.com/internships/work-from-home-internships/part-time-true/', { waitUntil: 'networkidle2', timeout: 16000000 });

        // Select categories
        for (let category of categories) {
            await page.click('#select_category_chosen > ul > li > input');
            await page.type('#select_category_chosen > ul > li > input', category);
            await page.keyboard.press('Enter');
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 5000)));
        }

        // Generate the dynamic URL based on selected categories
        const categoryPath = categories.map(cat => cat.toLowerCase().replace(/ /g, '-')).join(',');
        const pageUrl = `https://internshala.com/internships/work-from-home-${categoryPath}-internships/part-time-true/`;

        let jobUrl = await page.evaluate(() => {
            const container = document.querySelector('#internship_list_container_1');
            if (!container) {
                return [];
            }
            const internships = container.querySelectorAll('.individual_internship');

            const jobList = [];

            internships.forEach((internship) => {
                const href = internship.getAttribute('data-href');
                const id = internship.getAttribute('id');
                const nameElement = internship.querySelector('h3.job-internship-name');
                const name = nameElement ? nameElement.textContent.trim() : null;
                const companyElement = internship.querySelector('p.company-name');
                const company = companyElement ? companyElement.textContent.trim() : null;

                if (name && company) {
                    jobList.push({ href, id, name, company });
                }
            });

            return jobList;
        });

        // Limit the number of internships to apply to (e.g., 2)
        jobUrl.splice(2, jobUrl.length);

        console.log(jobUrl);

        for await (let job of jobUrl) {
            let url = job.id;
            if (url) {
                console.log('Navigating to job page ' + job.name);
                await page.waitForSelector(`#${url}`);
                await page.click(`#${url}`);
                await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

                if (await page.$('#continue_button')) {
                    await page.click('#continue_button');
                }

                if (await page.$('#is_distance_learning')) {
                    await page.click('#is_distance_learning');
                }
                await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

                if (await page.$('#cover_letter_holder > div.ql-editor.ql-blank')) {
                    await page.type('#cover_letter_holder > div.ql-editor.ql-blank', coverLetter);
                }
                if (await page.$('#submit')) {
                    console.log('Submit Button Found');
                    await page.click('#submit');
                }
                await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 4000)));
                await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 16000000 });
                await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 4000)));
            } else {
                console.log('URL not found');
            }
        }

    } catch (err) {
        console.error('Error running scraper:', err);
    } finally {
        await browser.close();
    }
}

module.exports = { runScraper };
