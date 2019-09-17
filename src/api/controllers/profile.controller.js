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
 * @Object browser:     puppeter browser object
 * @String searchUrl:   search url
 * @String xpath:       xpath of the href on google search page
 * @Integer pageNum:    page number of search page
 */
async function get_hrefs(browser, searchUrl, xpath, pageNum) {
    try {
        const page = await browser.newPage();
        await page.goto(searchUrl + '&start=' + pageNum*10);
        await page.waitForSelector(xpath);

        const hrefs = await page.evaluate(
          () => Array.from(
            document.querySelectorAll('div.g div.r a'),
            a => a.getAttribute('href')
          )
        );

        return hrefs;
    } catch (error) {
        console.log(`Error when crawling on ${searchUrl}`);
        return [];
    }
}

/**
 * Check if there is an existing value in the given array
 * @ params
 * @Arrary arr: arrary
 * @String val: value that needs to be check
 */
function hasExistingValue(dict, key) {
    let flag = false; // true if given arrary has same url
    if (dict.hasOwnProperty(key)) {
        flag = true;
    }

    return flag;
}


/**
 * Filter social profile links of person
 * @ params
 * @Object browser:         urls scraped from google search
 * @String socialDomains:   social media domains that you want to get
 * @String socialLinks:     social profile links of the requested person
 */
function get_social_links(hrefs, socialDomains, socialLinks) {
    let filtered_links = Object.assign({}, socialLinks);

    return new Promise((resolve) => {
        for (let i = 0; i < hrefs.length; i += 1) {
            for (let j = 0; j < socialDomains.length; j += 1){
                const domain = hrefs[i].replace('https://www.', '')
                                        .replace('https://', '');

                if (domain.indexOf(socialDomains[j]) == 0 && 
                    domain.indexOf('/company/') == -1 &&
                    domain.indexOf('/status/') == -1 &&
                    domain.indexOf('/public/') == -1
                ) {
                    const attr = `${socialDomains[j].replace('.com', '')}_url`
                    if (!hasExistingValue(socialLinks, attr)) {
                        filtered_links[attr] = hrefs[i]; 
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
        'facebook.com',
        'gmail.com',
    ]

    // input parameters
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    let email = req.body.domain; // domain or business email
    if (email && email != '' && email.indexOf('@') > -1) {
        email = email.split('@')[1];
    }

    const searchUrl = `https://www.google.ca/search?q=${firstName}+${lastName}+${email}`
    let socialLinks = {};

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const xpath = "div.g div.r a"
    const pageNums = [0, 1]
    let page;

    for (let index=0; index < pageNums.length ; index ++) {
        page = pageNums[index];
        try {
            // let hrefs = await get_hrefs(browser, searchUrl+`+${domain.replace('.com', '')}`, xpath, 0);
            let hrefs = await get_hrefs(browser, searchUrl, xpath, page);
            let filtered_links = await get_social_links(hrefs, socialDomains, socialLinks);
            socialLinks = { ...socialLinks, ...filtered_links }
        } catch (e) {
            console.log('There is a problem when crawling pages: ', e)
        }
    }

    await browser.close();

    res.json({
        ...socialLinks,
        full_name: `${firstName} ${lastName}`,
        email: [req.body.domain],

    });
  } catch (error) {
    next(error);
  }
};
