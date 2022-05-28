const ppteer = require('fast-install-puppeteer');
const { log, getAgrType } = require('./utils');

const devices = {
  mobile: [375, 667, 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'],
  ipad: [1024, 1366, 'Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1'],
  pc: [1200, 1000, 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1']
};

async function pp({ device = 'mobile', headless = true }) {
  const browser = await ppteer.launch({ headless, ignoreHTTPSErrors: true, handleSIGINT: true, devtools: false});
  function openPage(url, extraHTTPHeaders) {
    return new Promise(async (resolve, reject) => {
      const page = await browser.newPage();
      try {
        let deviceSet = devices[device];
        page.setUserAgent(deviceSet[2]);
        page.setViewport({ width: deviceSet[0], height: deviceSet[1] });
        if (extraHTTPHeaders && getAgrType(extraHTTPHeaders) === 'object') {
          await page.setExtraHTTPHeaders(new Map(Object.entries(extraHTTPHeaders)));
        }
        /// 十秒后页面没打开 重试
        const timer = setTimeout(async () => {
          await page.goto(url, {
            waitUntil: 'domcontentloaded'
          });
          setTimeout(() => {
            resolve(page)
          }, 1000)
        }, 10 * 1000)
        await page.goto(url, {
          timeout: 60 * 1000,
          waitUntil: 'networkidle0'
        });
        clearTimeout(timer);
        resolve(page);
      } catch (e) {
        // log.error('打开一个新页面失败'+ url +'\n');
        log.error('\n' + e.message);
        resolve(page)
      }
    })
  }
  browser.on('disconnected', () => {
    // log.error('浏览器已关闭' + '\n');
    process.exit(0);
  })

  return {
    browser,
    openPage
  }
};

module.exports = pp;