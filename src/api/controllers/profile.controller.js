const httpStatus = require('http-status');
const { omit } = require('lodash');
const puppeteer = require('puppeteer');


function get_hrefs(browser, searchUrl, xpath, pageNum) {
	return new Promise(async (resolve) => {

		const page = await browser.newPage();
		await page.goto(searchUrl + '&start=' + pageNum*10);
		await page.waitForSelector(xpath);

		const hrefs = await page.evaluate(
	      () => Array.from(
	        document.querySelectorAll('div.g div.r a'),
	        a => a.getAttribute('href')
	      )
	    );

		if (pageNum == 1) {
			const t = await page.evaluate( () => {
				debugger
				return 'aa'
			})
		}
	    resolve(hrefs);
	})
}

function hasSameUrl(arr, url) {
	let flag = false; // true if given arrary has same url
	for (let i = 0; i < arr.length; i += 1) {
		if (arr[i] == url) {
			flag = true;
			break;
		}
	}

	return flag;
}

function get_social_links(hrefs, socialDomains, socialLinks) {
	let filtered_links = [];
	return new Promise((resolve) => {
		for (let i = 0; i < hrefs.length; i += 1) {
			for (let j = 0; j < socialDomains.length; j += 1){
				const url = hrefs[i].replace('https://www.', '').replace('https://', '')
				if (url.indexOf(socialDomains[j]) == 0 && 
					url.indexOf('/company/') == -1 &&
					url.indexOf('/status/') == -1
				) {
					console.log('href: ', hrefs[i])
					if (!hasSameUrl(socialLinks, hrefs[i])) {
						console.log('filter: ',filtered_links)
						filtered_links.push(hrefs[i])
					}
				}
			}
		}

		resolve(filtered_links)
	})
}

/**
 * Get profile list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const response = { 'status': true };
    const socialDomains = [
    	'linkedin.com',
    	'twitter.com',
    	'instagram.com',
    	'gmail.com',
    ]

	// const firstName = 'rodeny';
	// const lastName = 'steele';
	// const email = 'dinsmoresteele.com';

	const firstName = 'collin';
	const lastName = 'vargo';
	const email = 'quicktutor.com';

	const searchUrl = `https://www.google.ca/search?q=${firstName}+${lastName}+${email}&ie=UTF-8`
	let socialLinks = [];

	const browser = await puppeteer.launch({headless: true});
	const xpath = "div.g div.r a"
	const pageNums = [0, 1];

 	let hrefs = await get_hrefs(browser, searchUrl, xpath, 0);
	let filtered_links = await get_social_links(hrefs, socialDomains, socialLinks);
	socialLinks = socialLinks.concat(filtered_links);
 	console.log("GGGG: ", socialLinks)

	hrefs = await get_hrefs(browser, searchUrl, xpath, 1);
 	filtered_links = await get_social_links(hrefs, socialDomains, socialLinks);
	socialLinks = socialLinks.concat(filtered_links);

	await browser.close();

    res.json(socialLinks);
  } catch (error) {
    next(error);
  }
};
