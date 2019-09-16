const httpStatus = require('http-status');
const { omit } = require('lodash');
var scrapy = require('node-scrapy');
var model = { value: '.bNg8Rb' };

// var scraper = require('google-search-scraper');
// const Profile = require('../models/profile.model');
const puppeteer = require('puppeteer');


/**
 * Get profile list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const response = { 'status': true };
    const socialDomains = [
    	'https://www.linkedin.com',
    	'https://www.twitter.com',
    	'https://www.instagram.com',
    	'https://www.gmail.com',
    ]

	const firstName = 'rodeny';
	const lastName = 'steele';
	const email = 'rs@dinsmoresteele.com';

	const searchUrl = `https://www.google.com/search?q=${firstName}+${lastName}+${email}&ie=UTF-8`
	let socialLinks = [];

	const browser = await puppeteer.launch({headless: false});
	const page = await browser.newPage();
	await page.goto(searchUrl);

	await page.waitForSelector("div.g div.r a");

	const hrefs1 = await page.evaluate(
      () => Array.from(
        document.querySelectorAll('div.g div.r a[href]'),
        a => a.getAttribute('href')
      )
    );

	console.log('@@@@@@ end @@@@@@@: ', hrefs1)
	


	await browser.close();

    res.json(response);
  } catch (error) {
    next(error);
  }
};
