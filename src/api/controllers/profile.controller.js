const httpStatus = require('http-status');
const { omit } = require('lodash');
const puppeteer = require('puppeteer');
const emailFinder = require('../../lib/email-finder');
const multer = require('multer');
const csv = require('fast-csv');
const upload = multer({ dest: 'upload/' });
const fs = require('fs');

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
        // await page.waitForSelector(xpath);

        const hrefs = await page.evaluate(
          () => Array.from(
            document.querySelectorAll('div.g div.r a'),
            a => { return {href: a.getAttribute('href'), text: a.innerText} }
          )
        );
        console.log('@@::@::@:@:@ ', hrefs)
        return hrefs;
    } catch (error) {
        console.log(`Error when crawling on ${searchUrl}`, error);
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
function get_social_links(hrefs, socialDomains, socialLinks, username) {
    let filtered_links = Object.assign({}, socialLinks);
    return new Promise((resolve) => {
        try {
            for (let i = 0; i < hrefs.length; i += 1) {
                for (let j = 0; j < socialDomains.length; j += 1){
                    const domain = hrefs[i].href.replace('https://www.', '')
                                                .replace('https://', '');

                    if (domain.indexOf(socialDomains[j]) == 0 && 
                        domain.indexOf('/company/') == -1 &&
                        domain.indexOf('/status/') == -1 &&
                        domain.indexOf('/public/') == -1 &&
                        hrefs[i].text.toLowerCase().indexOf(username) > -1

                    ) {
                        const attr = `${socialDomains[j].replace('.com', '')}_url`
                        if (!hasExistingValue(socialLinks, attr)) {
                            filtered_links[attr] = hrefs[i].href; 
                        }
                    }
                }
            }
        } catch (err) {
            console.log('ERROR: ', err);
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
    let domain = req.body.domain; // domain or business email
    let email = [];

    if (domain && domain != '' && domain.indexOf('@') > -1) {
        domain = domain.split('@')[1];
    }

    const data = {
        name: firstName.trim() + ' ' + lastName.trim(),
        domain: domain
    };


    try {
        res = await emailFinder(data);
        console.log('@@@ email: @@: ', res, data)
        email = res;
    } catch (err) {
        console.log('@@@ err @@: ', err, data)
    }

    const searchUrl = `https://www.google.ca/search?q=${firstName}+${lastName}+${domain}`
    let socialLinks = {};

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        dumpio: true
    });
    const xpath = "div.g div.r a"
    const pageNums = [0, 1]
    let page;

    for (let index=0; index < pageNums.length ; index ++) {
        page = pageNums[index];
        try {
            let hrefs = await get_hrefs(browser, searchUrl, xpath, page);
            let filtered_links = await get_social_links(hrefs,
                                                        socialDomains,
                                                        socialLinks,
                                                        firstName+' '+lastName);
            socialLinks = { ...socialLinks, ...filtered_links }
        } catch (e) {
            console.log('There is a problem when crawling pages: ', e)
        }
    }

    await browser.close();

    res.json({
        ...socialLinks,
        full_name: `${firstName} ${lastName}`,
        email: email,

    });
  } catch (error) {
    next(error);
  }
};


const parse_upload_csv = (file) => {
    return new Promise((resolve, reject) => {
        const fileRows = [];

        try {
            // open uploaded file
            csv.fromPath(file.path)
                .on("data", function (data) {
                  fileRows.push(data); // push each row
                })
                .on("end", function () {
                  resolve(fileRows)
                  fs.unlinkSync(file.path);   // remove temp file
                  //process "fileRows" and respond
                })
        } catch (err) {
            reject(err);
        }
    })
}


exports.csv_upload = async (req, res, next) => {
    const fileRows = await parse_upload_csv(req.file)
    const output = [];
    // social media domains that you want to get by business email
    const socialDomains = [
      'linkedin.com',
      'twitter.com',
      'instagram.com',
      'facebook.com',
      'gmail.com',
    ]

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      dumpio: true
    });

    for (var tindex = 0; tindex < fileRows.length; tindex += 1) {
        try {
          // input parameters
          const firstName = fileRows[tindex][0];
          const lastName = fileRows[tindex][2];
          let domain = fileRows[tindex][3]; // domain or business email
          let email = [];

          if (domain && domain != '' && domain.indexOf('@') > -1) {
              domain = domain.split('@')[1];
          }

          const data = {
              name: firstName.trim() + ' ' + lastName.trim(),
              domain: domain
          };


          try {
              res = await emailFinder(data);
              console.log('@@@ email: @@: ', res, data)
              email = res;
          } catch (err) {
              console.log('@@@ err @@: ', err, data)
          }

          const searchUrl = `https://www.google.ca/search?q=${firstName}+${lastName}+${domain}`
          let socialLinks = {};

          const xpath = "div.g div.r a"
          const pageNums = [0, 1]
          let page;

          for (let index=0; index < pageNums.length ; index ++) {
              page = pageNums[index];
              try {
                  let hrefs = await get_hrefs(browser, searchUrl, xpath, page);
                  let filtered_links = await get_social_links(hrefs,
                                                              socialDomains,
                                                              socialLinks,
                                                              firstName+' '+lastName);
                  socialLinks = { ...socialLinks, ...filtered_links }
              } catch (e) {
                  console.log('There is a problem when crawling pages: ', e)
              }
          }


          output.push({
              ...socialLinks,
              full_name: `${firstName} ${lastName}`,
              email: email,

          });
        } catch (error) {
          next(error);
        }
    }

    await browser.close();

    res.json(output)
}