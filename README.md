# 自动生成骨架屏插件（web-skeleton-screen）

### 如何使用该插件

1. 安装插件

2. 接入webpack插件

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

3. 接入vue3插件

```js
// src/main.js
import vue3Plugin from 'web-skeleton-screen/vue3Plugin';  

app.use(vue3Plugin, require('../wss.config.js')); // 参数为配置文件的内容，必须要传入
```

4. 根目录创建配置文件

```js
// wss.config.js
const config = {
  output: {
      filepath: 'skeleton_out',   // 生成骨架屏的存放文件夹名称
      injectSelector: '#app'  // 生成的骨架屏插入页面的节点
  },
  headless: true,
  publicPath: '/share',
  basePort: 8082, // 项目dev环境的端口
  listenServerPort: 3566, // 监听服务端口
  src: 'src', // 源码目录，监听服务需要监听这个目录
  pollTime: 10000, // 多久轮询一次生成新的骨架屏，单位毫秒，默认为60秒
  // 是否在打包时将骨架屏代码生成静态的html, 推荐false
  staticGeneration: false,
  // url携带的参数
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
  /// 骨架屏路由生成黑名单
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

5. 如果需要全局生成命令，可在package.json中加一条命令配置，运行该命令可以一次性生成所有路由的骨架屏

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

#### 2. 文件监听生成

当项目启动时，会静默启动监听服务，当打开某个页面时，会定期（10秒）轮询触发生成新的骨架屏代码，监听文件修改，如果有文件修改则会生成新的骨架屏代码。

如果不想让某个路由启动监听生成功能，可以在配置文件中配置监听黑名单，也可以在url中传入参数?noListen=1不启动监听功能

#### 3. 控制台生成

如果想针对于某个页面的生成，可以在控制台输入以下方法生成骨架屏

```js
createSkeleton()
```

### 配置

配置文件在项目的根目录wss.config.js，可以配置黑名单、以及生成骨架屏时针对某个路由某个节点的特殊处理。

### 暴露方法

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

