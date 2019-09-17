const httpStatus = require('http-status');
const { omit } = require('lodash');
const puppeteer = require('puppeteer');

function wait(interval) {
	return new Promise(async (resolve) => {
		await setTimeout(() => {
			return true
		}, interval * 1000)
	})
}

/**
 * Get hrefs from google search
 * @ params
 * @Object browser: 	puppeter browser object
 * @String searchUrl: 	search url
 * @String xpath: 		xpath of the href on google search page
 * @Integer pageNum: 	page number of search page
 */
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

	    resolve(hrefs);
	})
}

/**
 * Check if there is an existing value in the given array
 * @ params
 * @Arrary arr: arrary
 * @String val: value that needs to be check
 */
function hasExistingValue(arr, val) {
	let flag = false; // true if given arrary has same url
	for (let i = 0; i < arr.length; i += 1) {
		if (arr[i] == val) {
			flag = true;
			break;
		}
	}

	return flag;
}


/**
 * Filter social profile links of person
 * @ params
 * @Object browser: 		urls scraped from google search
 * @String socialDomains: 	social media domains that you want to get
 * @String socialLinks: 	social profile links of the requested person
 */
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
					if (!hasExistingValue(socialLinks, hrefs[i])) {
						filtered_links.push(hrefs[i])
					}
				}
			}
		}

		resolve(filtered_links)
	})
}

/**
 * Get profile page
 * @Method: GET
 */

 exports.index = (req, res, next) => {
 	try {
		res.render('pages/profile');
	} catch (error) {
	    next(error);
	}
 }

/**
 * Get profile list
 * @Method: POST
 */
exports.list = async (req, res, next) => {
  try {
    const response = { 'status': true };

    // social media domains that you want to get by business email
    const socialDomains = [
    	'linkedin.com',
    	'twitter.com',
    	'instagram.com',
    	'gmail.com',
    ]

    // input parameters
	const firstName = req.body.first_name;
	const lastName = req.body.last_name;
	let email = req.body.email;
	if (email && email != '') {
		email = email.split('@')[1];
	}

	const searchUrl = `https://www.google.ca/search?q=${firstName}+${lastName}+${email}&ie=UTF-8`
	let socialLinks = [];

	const browser = await puppeteer.launch({headless: true});
	const xpath = "div.g div.r a"
	const pageNums = [0, 1];

 	let hrefs = await get_hrefs(browser, searchUrl, xpath, 0);
	let filtered_links = await get_social_links(hrefs, socialDomains, socialLinks);
	socialLinks = socialLinks.concat(filtered_links);

	await wait(2);

	hrefs = await get_hrefs(browser, searchUrl, xpath, 1);
 	filtered_links = await get_social_links(hrefs, socialDomains, socialLinks);
 	console.log(filtered_links, email, firstName, lastName)
	socialLinks = socialLinks.concat(filtered_links);

	await browser.close();

    res.json(socialLinks);
  } catch (error) {
    next(error);
  }
};
