const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const ppteer = require('./pp');
const defaultHtml = require('./default.html');
const evalScripts = require('./evalDOM');
const mkdirp = require('mkdirp');
const { log, getAgrType, Spinner, calcText, genArgs } = require('./utils');
const fse = require('fs-extra')
const { promisify } = require('util')

const currDir = process.cwd();

class DrawStructure {
  constructor({
    baseUrl,
    output = {},
    background,
    animation,
    rootNode,
    header,
    device,
    headless,
    extraHTTPHeaders,
    includeElement,
    init,
    routes = []
  } = {}) {
    let filepath = output.filepath;
    this.baseUrl = baseUrl;
    this.filepath = filepath;
    this.injectSelector = output.injectSelector || 'body';
    this.background = background || '#ecf0f2';
    this.animation = animation || '';
    this.rootNode = rootNode || '';
    this.header = header || '';
    this.device = device;
    this.headless = headless;
    this.extraHTTPHeaders = extraHTTPHeaders;
    this.includeElement = includeElement || function () { };
    this.init = init || function () { };
    this.routes = routes || [];

    if (this.headless === undefined) this.headless = true;
    if (header && getAgrType(header) !== 'object') {
      log.error('[header] should be an object !', 1);
    }
    if (!baseUrl) {
      log.error('Please configure baseUrl!', 1);
    }
    if (filepath) {
      if (!fs.existsSync(path.join(currDir, filepath))) {
        // log.error('[output.filepath:404] please provide the output filepath !', 1);
        fs.mkdirSync(path.join(currDir, filepath))
      }
    }
  }
  async generateSkeletonHTML(page) {
    let html = '';

    try {
      const agrs = genArgs.create({
        init: {
          type: 'function',
          value: this.init.toString()
        },
        includeElement: {
          type: 'function',
          value: this.includeElement.toString()
        },
        background: {
          type: 'string',
          value: this.background
        },
        animation: {
          type: 'string',
          value: this.animation
        },
        rootNode: {
          type: 'string',
          value: this.rootNode
        },
        header: {
          type: 'object',
          value: JSON.stringify(this.header)
        }
      });
      agrs.unshift(evalScripts);
      html = await page.evaluate.apply(page, agrs);
    } catch (e) {
      log.error('\n[page.evaluate] ' + e.message);
    }
    return html;
  }
  async writeToFilepath(filepath, html) {
    let dirName = '';
    for (let item of filepath.split('/')) {
      if (item.indexOf('.') === -1) {
        dirName += item + '/';
      }
    }
    if (!fs.existsSync(dirName)) {
      console.log('\n' + '创建目录' + dirName + '\n');
      await fse.ensureDirSync(dirName)
    }
    await promisify(fs.writeFile)(filepath, html, 'utf-8')
    return Promise.resolve()
  }
  // 判断打开的页面是否是错误的，比如404
  isPageError(page) {
    return new Promise(async (resolve, reject) => {
      try {
        const bodyClassName = await page.$eval('#t', (el) => {
          console.log(el);
          return el.className;
        });
        if (bodyClassName === 'neterror') {
          resolve(true);
        }
        resolve(false);
      } catch (error) {
        resolve(false);
      }
    })
  }
  async pageClose(page) {
    await page.close();
    await this.delay(200);
  }
  // 针对每一个页面的配置
  pageDeal(routePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const { pp } = this;
        if (!routePath || routePath === '') {
          log.error('please provide the path !', 1);
          resolve(false);
        }
        const spinner = Spinner('magentaBright');
        const pageUrl = this.baseUrl + routePath;
        spinner.text = `正在打开页面：${pageUrl}...`;
        let page = await pp.openPage(pageUrl, this.extraHTTPHeaders);
        await this.delay(500);
        if ((await this.isPageError(page))) {
          spinner.clear().fail(`网页打开失败：${pageUrl}`);
          await this.pageClose(page)
          resolve(false);
        } else {
          spinner.text = '正在生成骨架屏...';
          const html = await this.generateSkeletonHTML(page);
          const resFilePath = path.join(currDir, this.filepath + routePath + '.html');
          if (this.filepath && html !== '') {
            spinner.text = `正在写入骨架屏代码到文件：${resFilePath}...`;
            await this.writeToFilepath(resFilePath, html);
            spinner.clear().succeed(`骨架屏生成成功，路径： ${calcText(resFilePath)}`);
            if (!this.headless) {
              await this.delay(2000);
            }
            await this.pageClose(page)
            resolve(true);
          } else {
            spinner.clear().warn(`页面空白无法生成骨架屏幕：${routePath}`);
            if (!this.headless) {
              await this.delay(2000);
            }
            await this.pageClose(page)
            resolve(false);
          }
        }
      } catch (error) {
        console.log(`${routePath}生成骨架屏失败`);
        console.log(error);
        resolve(false)
      }
    })

  }
  async start() {
    try {
      const { routes } = this;
      // const spinner = Spinner('magentaBright');
      // this.spinner = spinner;
      // spinner.text = '启动浏览器...';
      const pp = await ppteer({
        device: this.device,
        headless: this.headless
      });
      this.pp = pp;
      if (Array.isArray(routes) && routes.length > 0) {
        // if (this.headless) {
        //   await Promise.all(
        //     routes.map(route => {
        //       return this.pageDeal(route);
        //     })
        //   )
        // } else {
        for (let route of routes) {
          await this.pageDeal(route);
        }
        // }
      }
      console.log('全部任务完成，关闭浏览器');
      await pp.browser.close();
      process.exit(0);
    } catch (error) {
      // this.pp.browser.close();
      process.exit(0);
    }
  }

  delay(time) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time)
    })
  }
}

module.exports = DrawStructure;
