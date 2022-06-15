const SkeletonPlugin = require('./webpackPlugin/skeletonPlugin')
const DrawStructure = require('./puppeteer/drawStructure')
const vue3Plugin = require('./vue3Plugin');

module.exports = {
  SkeletonPlugin, // 骨架屏插件
  DrawStructure, // 利用puppeteer生成所有路由的骨架屏
  vue3Plugin, // vue3插件，如果是vue3项目需要在main.js中引入
}