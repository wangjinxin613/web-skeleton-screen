const config = {
    output: {
        filepath: 'skeleton_out',   // 生成骨架屏的存放文件夹名称
        injectSelector: '#app'  // 生成的骨架屏插入页面的节点
    },
    headless: true,
    publicPath: '',
    basePort: 8080, // 项目dev环境的端口
    listenServerPort: 3568, // 监听服务端口
    src: 'src', // 源码目录，监听服务需要监听这个目录
    pollTime: 5000, // 多久轮询一次生成新的骨架屏，单位毫秒，默认为60秒
    // 是否在打包时将骨架屏代码生成静态的html, 推荐false
    staticGeneration: false,
    // url携带的参数
    urlParams: {
       
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
    },
}

module.exports = config;
