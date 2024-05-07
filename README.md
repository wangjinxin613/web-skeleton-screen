# 无侵入式骨架屏全自动生成集成方案

## 背景

骨架屏是一种在页面数据加载时，先显示页面结构大致轮廓的过渡效果，让用户感知到页面正在加载，同时避免了用户看到空白页面的尴尬。然而，传统的骨架屏实现方式通常需要开发人员手动为每个页面设计并编写骨架屏代码，这不仅增加了开发成本，还可能导致骨架屏效果与真实页面结构不一致，影响用户体验。

为了解决这些问题，设计出了无侵入式骨架屏全自动生成集成方案。该方案旨在通过自动化工具和技术手段，实现对移动应用页面骨架屏的自动生成和集成，无需开发人员手动编写代码，降低了开发成本，同时保证了骨架屏效果与真实页面结构的一致性，提升了用户体验。

## 方案介绍

该方案适用于vue3+webview的项目，共有四个部分

1. vue插件部分，该模块的主要作用是在某个路由打开时（运行时）根据真实页面元素树生成骨架屏节点，并且生成之后准备存储到前端工程中
2. Node服务部分，该服务会随着项目运行自动启动一个nodejs服务，该服务监听源码目录文件修改，如果有文件修改，则会接收到前端发送的骨架屏代码。并存储到前端工程中
3. Webpack插件部分。此插件的主要作用是加载骨架屏，利用webpack 钩子函数向 index.html 注入一段js代码，这段代码的主要作用是请求当前打开路由对应的骨架屏代码，并且渲染到屏幕上，然后在合适的时机销毁骨架屏。
4. 骨架屏生成脚本部分，骨架瓶支持两种生成方式，静默生成或者命令生成，此模块主要利用  puppeteer 操作无头浏览器访问所有路由然后生成骨架屏代码文件。

## 使用方法

#### 1. 安装插件

``` shell
npm install web-skeleton-screen
```

#### 2. 接入webpack插件

```js
// vue.config.js
const { SkeletonPlugin } = require('web-skeleton-screen')

// webpack 相关
module.exports = {
  ...
  configureWebpack: {
    plugins: [
      new SkeletonPlugin({
        staticDir: path.resolve(process.cwd(), './dist'), // 打包后生成的路径
        configPath: path.resolve(process.cwd(), 'wss.config.js'), // 骨架屏的配置文件
      })
    ]
  },
}
```

#### 3. 接入vue3插件

```js
// src/main.js
import vue3Plugin from 'web-skeleton-screen/vue3Plugin';  

app.use(vue3Plugin, require('../wss.config.js')); // 参数为配置文件的内容，必须要传入
```

#### 4. 根目录创建配置文件 wss.config.js

```js
const config = {
  output: {
      filepath: 'skeleton_out',   // 生成骨架屏的存放文件夹名称
      injectSelector: '#app'  // 生成的骨架屏插入页面的节点
  },
  headless: true, // 是否是无头浏览器模式
  publicPath: '/', // 项目的跟路径
  basePort: 8080, // 项目dev环境的端口
  listenServerPort: 3566, // 监听服务端口
  src: 'src', // 源码目录，监听服务需要监听这个目录
  pollTime: 10000, // 多久轮询一次生成新的骨架屏，单位毫秒，默认为60秒
  // 是否在打包时将骨架屏代码生成静态的html, 推荐false
  staticGeneration: false,
  // url携带的参数 使用命令生成时有效
  urlParams: {
      token: 'af826ad2-085a-4062-8f9f-7a28151ddf8c',
      userId: 10868367
  },
  // 是否将骨架屏幕元素尺寸转换成rem
  toRem: true,
  /**
   * 俩个相邻或者相交元素合并限制，单位px
   * 骨架节点生成时，会依次比对以前生成的节点，是否存在相交情况
   */ 
  blockMerge: {
      // 是否开启节点合并功能，如果开启的话，会自动合并top和height一致或者left和width一致的相交元素，并且根据下述规则判断其他情况是否合并
      enable: true, 
      maxWidth: 30, // 目标节点的最大宽度
      maxHeight: 30, // 目标节点的最大高度
      maxX: 0, // 目标节点和比对节点之间的横坐标最大间距
      maxY: 0, // 目标节点和比对节点之间的纵坐标最大间距
  },
  /// 骨架屏路由生成黑名单 填路由
  blackList: [
      
  ],
  /// 监听黑名单，命中的路由禁用骨架屏监听生成功能
  listenBlackList: [
      
  ],
  /**
   * 针对某些节点可以选择忽略或者被忽略的节点不忽略
   * @param {*} node 节点dom
   * @param {*} url 路由，可以针对某个路由的操作
   * @param {*} draw 画骨架屏的方法
   * @returns true => 不忽略，会根据内置方法画这个节点的骨架屏 false => 忽略，不会画这个节点的骨架屏，当然也可以自行生成这个节点的骨架屏
   */
  includeElement: function (node, url, draw) {
      // 弹窗忽略
      if(node.id === 'modal') {
          return false;
      }
      url = url.replace('/share', '');
      const routers = dealRouteIncludeElement(node, draw);
      if(routers[url] && typeof routers[url] === 'function') {
          return routers[url]();
      }
      // 针对不同路由的处理
      function dealRouteIncludeElement(node, draw) {
          return {
              '/download': () => {
                if(node.className === 'van-swipe my-swipe') return true;
                if(node.className === 'download-btn') return true;
              },
              '/facebookDownload' : () => {
                if(node.className === 'code-viewer') {
                  draw({
                    width : '2.35rem',
                    height: '0.34rem',
                    top: '4.12rem',
                    left: '0.7rem',
                    radius: '0.17rem',
                  })
                  return false;
                };
              }
          }
      }
  },
}

module.exports = config;
```

#### 5. 如果需要全局生成命令，可在package.json中加一条命令配置，运行该命令可以一次性生成所有路由的骨架屏

```json
{
  "scripts": {
    "createSkeleton": "wss start -c wss.config.js"
  }
}
```

### 骨架屏生成的三种方式

#### 1. 全局统一生成

执行以下命令，此命令会生成所有路由的骨架屏文件（黑名单除外）

```shell
npm run createSkeleton
```

#### 2. 开发阶段静默生成

当项目启动时，会静默启动监听服务，当打开某个页面时，会定期（10秒）轮询触发生成新的骨架屏代码，监听文件修改，如果有文件修改则会生成新的骨架屏代码。

如果不想让某个路由启动监听生成功能，可以在配置文件中配置监听黑名单，也可以在url中传入参数?noListen=1不启动监听功能

#### 3. 控制台生成

如果想针对于某个页面的生成，可以在控制台输入以下方法生成骨架屏

```js
createSkeleton()
```

### 配置

配置文件在项目的根目录wss.config.js，可以配置黑名单、以及生成骨架屏时针对某个路由某个节点的特殊处理。

### 暴露方法，可以直接在运行时浏览器控制台调用

```js
// 生成骨架屏（dev有效）
window.createSkeleton()

// 预览骨架屏（dev有效）
window.previewSkeleton()

// 显示骨架屏，显示后需要自行隐藏否则不会消失
window.showSkeleton()

// 隐藏骨架屏
window.hideSkeleton()
```
