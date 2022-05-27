const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const ppteer = require('./pp');
const defaultHtml = require('./default.html');
const evalScripts = require('./evalDOM');
var mkdirp = require('mkdirp');
const { log, getAgrType, Spinner, calcText, genArgs } = require('./utils');

const currDir = process.cwd();

class DrawPageStructure {
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
    for(let item of filepath.split('/')) {
      if (item.indexOf('.') === -1) {
        dirName += item + '/';
      }
    }
    if(!fs.existsSync(dirName)){ 
      await mkdirp(dirName);
    }
    // if(fs.existsSync(filepath)) {
    //   let fileHTML = fs.readFileSync(filepath);
    //   let $ = cheerio.load(fileHTML, {
    //     decodeEntities: false
    //   });
    //   $(this.injectSelector).html(html);
    //   fs.writeFileSync(filepath, $.html('html'));
    // } else {
      fs.writeFileSync(filepath, html);
    // }
  }
  // 针对每一个页面的配置
  pageDeal(routePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const { spinner, pp } = this;
        if (!routePath || routePath === '') {
          log.error('please provide the path !', 1);
          resolve(false);
        }
        const pageUrl = this.baseUrl + routePath;
        spinner.text = `正在打开页面：${pageUrl}...`;
        const page = await pp.openPage(pageUrl, this.extraHTTPHeaders);
        spinner.text = '正在生成骨架屏...';
        const html = await this.generateSkeletonHTML(page);
        const resFilePath = path.join(currDir, this.filepath + routePath + '.html');
        if (this.filepath) {
          spinner.text = `正在写入骨架屏代码到文件：${resFilePath}...`;
          await this.writeToFilepath(resFilePath, html);
        }
        spinner.clear().succeed(`skeleton screen has created and output to ${calcText(resFilePath)}`);
        resolve(true);
      } catch (error) {
        console.log(error);
        resolve(false)
      }
    })

  }
  async start() {
    try {
      const { routes } = this;
      const spinner = Spinner('magentaBright');
      this.spinner = spinner;
      spinner.text = '启动浏览器...';
      const pp = await ppteer({
        device: this.device,
        headless: this.headless
      });
      this.pp = pp;
      if (Array.isArray(routes) && routes.length > 0) {
        await Promise.all(
          routes.map(route => {
            return this.pageDeal(route);
          })
        )
      }
      if (this.headless) {
        await pp.browser.close();
        process.exit(0);
      }
    } catch (error) {
      console.log(error);
      // this.pp.browser.close();
      process.exit(0);
    }
  }
}

module.exports = DrawPageStructure;
