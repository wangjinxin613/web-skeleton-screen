const fs = require('fs');
const path = require('path');
const ppteer = require('./pp');
const evalScripts = require('../evalDOM');
const { log, getAgrType, Spinner, calcText, genArgs } = require('./utils.js');
const fse = require('fs-extra')
const { promisify } = require('util')
const request = require('request')
var ip = require('ip');
const currDir = process.cwd();

class DrawStructure {
  constructor(config) {
    const {
      output = {},
      background,
      animation,
      rootNode,
      header,
      device,
      headless,
      extraHTTPHeaders,
      includeElement,
      publicPath,
      init,
      blackList,
      basePort,
      urlParams,
      toRem,
      blockMerge
    } = config
    this.config = config;
    let filepath = output.filepath || 'out';
    this.baseUrl = 'http://' + ip.address() + ':' + (basePort || 8080) + (publicPath || '');
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
    this.listenServerPort = (config && config.listenServerPort) || 3566;
    this.blackList = blackList || [];
    this.urlParams = {
      ...urlParams || {},
      noListen: 1,
    };
    this.toRem = toRem;
    this.blockMerge = blockMerge || {};

    if (this.headless === undefined) this.headless = true;
    if (header && getAgrType(header) !== 'object') {
      log.error('[header] should be an object !', 1);
    }
    if (!this.baseUrl) {
      log.error('Please configure baseUrl!', 1);
    }
    console.log('你的项目运行地址为：' + this.baseUrl);
    if (filepath) {
      if (!fs.existsSync(path.join(currDir, filepath))) {
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
        },
        toRem: {
          type: 'bool',
          value: this.toRem
        },
        blockMerge: {
          type: 'object',
          value: JSON.stringify(this.blockMerge)
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
    const dirNameArr = filepath.split('/');
    if (dirNameArr.length > 1) {
      dirNameArr.pop();
    }
    const dirPath = path.join(currDir, dirNameArr.join('/'))
    if (!fs.existsSync(dirPath)) {
      console.log('\n' + '创建目录' + dirPath);
      await fse.ensureDirSync(dirPath)
    }
    await promisify(fs.writeFile)(path.join(currDir, filepath + '.html'), html, 'utf-8')
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
  createUrlParams(url, params) {
    let paramsStr = [];
    for (let key of Object.keys(params)) {
      paramsStr.push(`${key}=${params[key]}`);
    }
    if (url.indexOf('?') !== -1) {
      return url + '&' + paramsStr.join('&');
    } else {
      return url + '?' + paramsStr.join('&');
    }
  }
  // 针对每一个页面的配置
  pageDeal(routePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const { pp, blackList } = this;
        if (!routePath || routePath === '') {
          console.log('please provide the path !');
          resolve(false);
          return;
        }
        if (blackList.indexOf(routePath) !== -1) {
          console.log(`${routePath} 命中黑名单，跳过这个路由！`);
          resolve(false);
          return;
        }
        const spinner = Spinner('magentaBright');
        let pageUrl = this.baseUrl + routePath;
        // 参数处理
        pageUrl = this.createUrlParams(pageUrl, this.urlParams);
        spinner.text = `正在打开页面：${this.baseUrl + routePath}...`;
        let page = await pp.openPage(pageUrl, this.extraHTTPHeaders);
        await this.delay(1500);
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
            await this.writeToFilepath(this.filepath + routePath, html);
            spinner.clear().succeed(`骨架屏生成成功，路径： ${resFilePath}，预览 ${pageUrl}`);
            if (!this.headless) {
              await this.delay(2000);
            } else {
              await this.delay(500);
            }
            await this.pageClose(page)
            resolve(true);
          } else {
            spinner.clear().warn(`页面空白无法生成骨架屏幕：${routePath}`);
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
      const pp = await ppteer({
        device: this.device,
        headless: this.headless
      });
      this.pp = pp;
      const spinner = Spinner('magentaBright');
      spinner.text = `正在获取路由列表`;
      const routes = await this.getAllRoutes();
      if (Array.isArray(routes) && routes.length > 0) {
        spinner.clear().succeed(`路由列表获取成功`);
        for (let route of routes) {
          await this.pageDeal(route);
        }
      }
      console.log('全部任务完成，关闭浏览器');
      await pp.browser.close();
      process.exit(0);
    } catch (error) {
      console.log(error);
      // this.pp.browser.close();
      process.exit(0);
    }
  }

  requestUrl(shortUrl) {
    return 'http://' + ip.address() + ":" + this.listenServerPort + shortUrl;
  }

  async getAllRoutes() {
    const { pp } = this;
    return new Promise((resolve, reject) => {
      request(this.requestUrl('/routes'), async (err, response, body) => {
        try {
          if (!err && response.statusCode == 200) {
            var res = JSON.parse(body);
            if (Array.isArray(res)) {
              if (res.length > 0) {
                resolve(res);
              } else {
                // 获取的路由为空，需要打开一下网页上传路由
                let page = await pp.openPage(this.baseUrl, this.extraHTTPHeaders);
                await this.delay(500);
                this.pageClose(page);
                this.tryReGetRoutes = this.tryReGetRoutes ? this.tryReGetRoutes + 1 : 1;
                if (this.tryReGetRoutes <= 2) {
                  resolve(await this.getAllRoutes());
                } else {
                  console.log('获取路由失败！！！');
                  await pp.browser.close();
                  process.exit(0);
                }
              }
            }
          }
        } catch (error) {
          console.log('获取路由失败，请确保项目已经启动', error);
          reject([]);
        }
      })
    })
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
