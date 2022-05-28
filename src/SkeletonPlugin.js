const { outputSkeletonScreen, createLog } = require('./util')
const path = require('path')
const fs = require('fs')
const PLUGIN_NAME = 'pageSkeletonWebpackPlugin'

function SkeletonPlugin(options = {}) {
  let routes = [];
  let config = {};
  if(options?.configPath) {
    if(fs.existsSync(options?.configPath)) {
      config = require(options?.configPath) ?? {};
    }
  }
  Object.assign(options, {
    config,
    routes: config?.routes ?? []
  })
  this.options = options;
  this.log = createLog(options)
}

SkeletonPlugin.prototype.outputSkeletonScreen = async function () {
  try {
    await outputSkeletonScreen(this.originalHtml, this.options, this.log)
  } catch (err) {
    this.log.warn(err.toString())
  }
}

SkeletonPlugin.prototype.apply = function (compiler) {
  if (compiler.hooks) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const htmlWebpackPluginAfterHtmlProcessing = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing || htmlWebpackPlugin.getHooks(compilation).beforeEmit
      htmlWebpackPluginAfterHtmlProcessing.tapAsync(PLUGIN_NAME, (htmlPluginData, callback) => {
        this.originalHtml = htmlPluginData.html
        callback(null, htmlPluginData)
      })

      // compilation.hooks.buildModule.tap(
      //   PLUGIN_NAME,
      //   (module) => {
      //     console.log(module);
      //     module.useSourceMap = true;
      //   }
      // );

      // compilation.hooks.processAssets.tap(
      //   {
      //     name: PLUGIN_NAME,
      //     stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS, // see below for more stages
      //   },
      //   (assets) => {
      //     console.log('List of assets and their sizes:');
      //     Object.entries(assets).forEach(([pathname, source]) => {
      //       console.log(`— ${pathname}: ${source.size()} bytes`);
      //     });
      //   }
      // );

      // compilation.hooks
      //   .optimizeChunkAssets
      //   .tapAsync(PLUGIN_NAME, (chunks, callback) => {
      //     chunks.forEach(chunk => {
      //       console.log(chunk.files);
      //       chunk.files.forEach(file => {
      //         // compilation.assets[file] = new ConcatSource(
      //         //   '\/**Sweet Banner**\/',
      //         //   '\n',
      //         //   compilation.assets[file]
      //         // );
      //       });
      //     });

      //     callback();
      //   });
    })



    compiler.hooks.afterEmit.tap(PLUGIN_NAME, async () => {
      await this.outputSkeletonScreen()
    })
    
    // webpackDevServer.addDevServerEntrypoints(
    //  {
    //     devServer: {
    //       before : function(app, server) {
    //           app.get('/refresh', function(req, res, next) {
    //             let routes = extract(path.resolve(dir, 'entries.js'));
    //             console.log(req.query);
    //             console.log(routes);
    //             // whiteRoutes(
    //             //   routes
    //             // )
    //             next();
    //           })
    //         }
    //     }
    //   }, 
    //   {
    //     inline: true,
    //     before : function(app, server) {
    //       console.log(app);
    //       app.get('/refresh', function(req, res, next) {
    //         let routes = extract(path.resolve(dir, 'entries.js'));
    //         console.log(req.query);
    //         console.log(routes);
    //         // whiteRoutes(
    //         //   routes
    //         // )
    //         next();
    //       })
    //     }
    //   }
    // )

    // compiler.options.devServer.before = function(app, server) {
    //   app.get('/refresh', function(req, res, next) {
    //     let routes = extract(path.resolve(dir, 'entries.js'));
    //     console.log(req.query);
    //     console.log(routes);
    //     // whiteRoutes(
    //     //   routes
    //     // )
    //     next();
    //   })
    // }

  } else {
    compiler.plugin('after-emit', async (compilation, done) => {
      await this.outputSkeletonScreen()
      done()
    })
  }
}

module.exports = SkeletonPlugin
