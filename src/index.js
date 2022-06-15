const SkeletonPlugin = require('./webpackPlugin/SkeletonPlugin')
const DrawStructure = require('./puppeteer/drawStructure')

module.exports.SkeletonPlugin = SkeletonPlugin; // 骨架屏插件
module.exports.DrawStructure = DrawStructure; // 利用puppeteer生成所有路由的骨架屏
