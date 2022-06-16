const { outputSkeletonScreen, createLog, foreachDirFiles } = require('./util')
const path = require('path')
const fs = require('fs')
const PLUGIN_NAME = 'pageSkeletonWebpackPlugin'
const server = require('../server/index');
const ip = require('ip');
const { promisify } = require('util')
const md5 = require('md5');
const chokidar = require('chokidar')

function SkeletonPlugin(options = {}) {
  let config = {};
  if (options && options.configPath) {
    if (fs.existsSync(options.configPath)) {
      const configRes = require(options.configPath);
      if (configRes) {
        config = configRes;
      }
    }
  }
  Object.assign(options, {
    config,
  })
  this.options = options;
  this.log = createLog(options);
  this.hash = md5(new Date()).substring(0, 8);
}

SkeletonPlugin.prototype.outputSkeletonScreen = async function () {
  try {
    await outputSkeletonScreen(this.originalHtml, this.options, this.log)
  } catch (err) {
    this.log.warn(err.toString())
  }
}

// 开启骨架屏监听服务，监听文件变化，定期生成骨架屏
SkeletonPlugin.prototype.startServer = async function () {
  server.start(this.options.config).then(port => {
    this.serverPort = Number(port);
    console.log("Skeleton Server has started in http://" + ip.address() + ":" + port + ". This service can monitor file changes and update the skeleton screen regularly");
  }).catch(err => {
    console.log("Skeleton Server Startup failed" + err)
  })
}

/**
 * 获取loadSkeleton.js的代码字符串，并且需要注入一些变量
 * 通过webpack将此代码注入到index.html中，用于动态加载骨架屏
 */
SkeletonPlugin.prototype.getLoadSkeletonJsStr = async function (config) {
  let sourceStr = (await promisify(fs.readFile)(path.join(__dirname, './loadSkeleton.js'), 'utf-8'));
  const fileDir = config.output && config.output.filepath || 'out';
  const publicPath = config.publicPath || '';
  const blackList = config.blackList || [];
  sourceStr =
    `window._publicPath = '${publicPath}';
    window._skeletonDir = '${fileDir}';
    window._skeletonBlackList = [${blackList.map(v => `'${v}'`)}];
    window._skeletonHash = '${this.hash}';
    ` + sourceStr;
  if (process.env.NODE_ENV === 'development') {
    sourceStr =
      `window._skeletonServerPort = ${this.serverPort};
    ` + sourceStr;
  }
  return sourceStr;
}

SkeletonPlugin.prototype.apply = function (compiler) {
  const { config = {}, staticDir, src = 'src' } = this.options
  const fileDir = config.output && config.output.filepath || 'out';
  const publicPath = config.publicPath || '';
  const pathname = path.join(process.cwd(), fileDir);
  const staticGeneration = config.staticGeneration || false;

  if (process.env.NODE_ENV === 'development') {
    this.startServer();

    // 解决生成骨架屏代码后不会热更新的bug
    chokidar.watch(pathname, {
      persistent: true,
      ignored: /(^|[\/\\])\../, // 忽略点文件
      cwd: '.', // 表示当前目录
      depth: 10 // 只监听当前目录不包括子目录
    }).on('change', async (changePath) => {
      const srcPath = path.resolve(process.cwd(), src);
      for (let vo of fs.readdirSync(srcPath)) {
        const d = fs.statSync(path.resolve(srcPath, vo))
        if (d.isFile() && vo.indexOf('main.') !== -1) {
          const someFile = path.resolve(srcPath, vo);
          fs.writeFileSync(someFile, (await promisify(fs.readFile)(someFile, 'utf-8')), 'utf-8');
          break;
        }
      }
    });
  }
  if (compiler.hooks) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const htmlWebpackPluginAfterHtmlProcessing = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing;
      if (htmlWebpackPluginAfterHtmlProcessing) {
        htmlWebpackPluginAfterHtmlProcessing.tapAsync(PLUGIN_NAME, (htmlPluginData, callback) => {
          let html = htmlPluginData.html;
          if (!(process.env.NODE_ENV === 'production' && staticGeneration)) {
            const scriptStr = `<script src="${publicPath}/js/loadSkeleton.${this.hash}.js"></script>`;
            if (html.indexOf('<\/title>') != -1) {
              html = html.replace(/\<\/title>/, `</title>${scriptStr}`);
            } else if (html.indexOf('<head>') != -1) {
              html = html.replace(/\<\/head>/, `${scriptStr}</head>`);
            } else {
              html = html.replace(/\<body>/, `${scriptStr}<body>`);
            }
          }
          this.originalHtml = html
          htmlPluginData.html = html;
          callback(null, htmlPluginData)
        })
      } else {
        console.log('Please introduce HTML webpack plugin in webpack')
      }

      /// 将骨架屏代码注入到编译后的结果中
      if (!(process.env.NODE_ENV === 'production' && staticGeneration)) {
        compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, async (callback) => {
          const filesPath = foreachDirFiles(pathname);
          for (let path of filesPath) {
            const routeName = path.split(pathname)[1];
            if (routeName.indexOf('.html') !== -1) {
              const route = routeName.substr(0, routeName.length - 5);
              if (fs.existsSync(path)) {
                let sourceStr = (await promisify(fs.readFile)(path, 'utf-8'));
                sourceStr = sourceStr.replace(/\<meta[\s\S]*\/\>/, '');
                compilation.assets[fileDir + route + '.' + this.hash + '.wss'] = {
                  size() { return sourceStr.length },
                  source() {
                    return sourceStr;
                  },
                };
              }
            }
          }

          // 将loadSkeleton.js注入编译后资源
          const jsStr = await this.getLoadSkeletonJsStr(config);
          compilation.assets[`js/loadSkeleton.${this.hash}.js`] = {
            size() { return jsStr.length },
            source() {
              return jsStr;
            },
          };
          callback();
        });
      }
    })

    compiler.hooks.afterEmit.tap(PLUGIN_NAME, async () => {
      if (staticGeneration && process.env.NODE_ENV === 'production') {
        await this.outputSkeletonScreen()
      }
    })

  } else {
    compiler.plugin('after-emit', async (compilation, done) => {
      if (staticGeneration && process.env.NODE_ENV === 'production') {
        await this.outputSkeletonScreen()
      }
      done()
    })
  }
}

module.exports = SkeletonPlugin
