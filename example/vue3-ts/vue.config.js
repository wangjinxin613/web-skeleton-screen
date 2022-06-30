const { SkeletonPlugin } = require('web-skeleton-screen')
const path = require('path')

module.exports = {
    // 基本路径
    publicPath: '/',
    // 文件名哈希
    filenameHashing: true,
    // 生产环境的 source map,设置为 false 以加速生产环境构建
    productionSourceMap: false,
    // webpack 相关
    configureWebpack: {
        plugins: [
            new SkeletonPlugin({
              staticDir: path.resolve(process.cwd(), 'dist'), // 打包后生成的路径
              configPath: path.resolve(process.cwd(), 'wss.config.js'),
            }),
        ]
    },
    // 样式解析配置
    chainWebpack: (config) => {
        const oneOfsMap = config.module.rule("less").oneOfs.store;
        oneOfsMap.forEach(item => {
            item
                .use("style-resources-loader")
                .loader("style-resources-loader")
                .options({
                    patterns: ""
                })
                .end()
        })
    },
}