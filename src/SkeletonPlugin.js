const { outputSkeletonScreen, createLog } = require('./util')
const PLUGIN_NAME = 'pageSkeletonWebpackPlugin'

function SkeletonPlugin(options = {}) {
  this.options = options;
  this.log = createLog(options)
}

SkeletonPlugin.prototype.outputSkeletonScreen = async function () {
  try {
    await outputSkeletonScreen(this.originalHtml, this.options, this.log.info)
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
    })

    compiler.hooks.afterEmit.tap(PLUGIN_NAME, async () => {
      await this.outputSkeletonScreen()
    })
    
  } else {
    compiler.plugin('after-emit', async (compilation, done) => {
      await this.outputSkeletonScreen()
      done()
    })
  }
}

module.exports = SkeletonPlugin
