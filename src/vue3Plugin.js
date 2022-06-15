// @ts-nocheck
const axios = require('axios');
const defaultPollTime = 60000;
const config = require('../wss.config')
const { genArgs } = require('./puppeteer/utils.js');
const evalDom = require('./evalDOM.js');

const {
    publicPath = '',
    output: { filepath = 'out' },
    pollTime = defaultPollTime,
    includeElement,
    blackList = [],
    listenBlackList = [],
    staticGeneration,
    toRem,
    blockMerge = {}
} = config;

function findQueryString(paraName, URL) {
    let url = URL || document.location.toString();
    let arrObj = url.split("?");

    if (arrObj.length > 1) {
        let arrPara = arrObj[1].split("&");
        let arr;

        for (let i = 0; i < arrPara.length; i++) {
            arr = arrPara[i].split("=");

            if (arr != null && arr[0] == paraName) {
                let res = arr[1];
                try {
                    res = decodeURIComponent(res);
                } catch (error) { }
                return res;
            }
        }
        return "";
    } else {
        return "";
    }
}
class SkeletonVue {

    constructor(app, options) {
        this.config = options?.config || {};
        this.app = app;
      
        if (process.env.NODE_ENV === 'development') {
            this.devInit();
        }
    }

    get route() {
        let route = window.location.pathname;
        if (route.indexOf(publicPath) !== -1) {
            route = route.replace(publicPath, '')
        }
        if (route.charAt(route.length - 1) === '/') {
            route = route.slice(0, -1);
        }
        return route;
    }

    async getAllRoutes() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const $router = this.app?.config?.globalProperties?.$router;
                let routers = [];
                if (typeof $router?.getRoutes === 'function') {
                    routers = routers.concat($router.getRoutes())
                }
                resolve(routers.map(v => v.path));
            }, 1000)
        })
    }

    log() {
        const logText = [];
        for (let i in arguments) {
            logText.push(arguments[i])
        }
        console.log('[skeleton] ' + logText.join(' '))
    }

    // 当前路由是否命中生成黑名单
    isBlack() {
        if (Array.isArray(blackList)) {
            return blackList.indexOf(this.route) !== -1
        }
        return false;
    }

    // 当前路由是否命中监听黑名单
    isListenBlack() {
        if (Array.isArray(listenBlackList)) {
            return listenBlackList.indexOf(this.route) !== -1
        }
        return true;
    }

    // 当前页面是否要开启骨架屏监听生成服务
    async isListen() {
        // 页面url参数传入?noListen=1时不监听
        if (findQueryString('noListen') === "1") {
            return false;
        }
        // 命中生成黑名单不监听
        if (this.isBlack()) return false;
        // 命中监听黑名单不监听
        if (this.isListenBlack()) return false;
        // 当前路由不在routers中不监听
        if ((await this.getAllRoutes()).indexOf(this.route) === -1) {
            return false;
        }
        return true;
    }

    async devInit() {
        window.createSkeleton = async () => {
            if (!this.isBlack()) {
                await this.createSkeleton();
            } else {
                this.log('当前路由处于黑名单中，请移除黑名单后再生成！')
            }
        };
        if (!this.isBlack()) {
            window.previewSkeleton = this.previewSkeleton.bind(this)
        }
        // 定时请求生成新的骨架屏幕代码
        if (await this.isListen()) {
            setTimeout(() => {
                this.createSkeletonPoll()
                this.log('此页面已经开启骨架屏监听生成', '生成频率为' + pollTime + '毫秒');
            }, 0)
        }
        this.uploadRoutes();
    }

    //上报路由列表
    async uploadRoutes() {
        return this.requestServer("/uploadRoutes", {
            routes: JSON.stringify(await this.getAllRoutes())
        })
    }

    // 预览骨架屏效果
    previewSkeleton() {
        mixinSkeleton(() => {
            showSkeleton()
            setTimeout(() => {
                window.hideSkeleton()
            }, 2000)
        })
    }

    // 定时请求生成新的骨架屏幕代码
    createSkeletonPoll() {
        clearTimeout(this.timer);
        const timer = setTimeout(() => {
            this.createSkeleton(true);
        }, (!isNaN(pollTime) && pollTime !== null) ? pollTime : defaultPollTime)
        this.timer = timer;
    }

    // 生成骨架屏
    async createSkeleton(isListen = false) {
     
        try {
            const html = await evalDom.apply(window, genArgs.create({
                background: {
                    type: 'string',
                    value: '#eee'
                },
                animation: {
                    type: 'string',
                    value: ""
                },
                isSilent: {
                    type: 'bool',
                    value: true
                },
                includeElement: {
                    type: 'function',
                    value: includeElement
                },
                toRem: {
                    type: 'bool',
                    value: toRem
                },
                blockMerge: {
                    type: 'object',
                    value: JSON.stringify((typeof blockMerge === 'object' && blockMerge !== null) ? blockMerge : {})
                }
            }));
            if (!html) {
                // this.log('页面可能空白无法生成骨架屏');
            } else {
                // if(isListen) {
                //     this.log('开始生成骨架屏');
                // }
                this.requestServer(isListen ? '/listen' : '/whiteSkeleton', {
                    url: this.route,
                    html: html
                }).then(res => {
                    if (res.code === 200) {
                        this.log('骨架屏生成成功', new Date());
                        if(!isListen) {
                            setTimeout(() => {
                                this.previewSkeleton()
                            }, 1500)
                        }
                    } else {
                        // this.log(res?.msg ?? '生成失败');
                    }
                }).catch(e => {
                    this.log('骨架屏存储失败', e);
                })
            }
        } catch (error) {
            this.log('骨架屏生成失败', error);
        }
        if (await this.isListen()) {
            this.createSkeletonPoll();
        }
    }

    getServerPort() {
        return window._skeletonServerPort || 3566;
    }

    requestServer(shortPath, data, method = 'get') {
        return new Promise((resolve, reject) => {
            const request = {
                method: method,
                url: location.protocol + '//' + location.hostname + ':' + this.getServerPort() + shortPath,
            }
            if (method === 'post') {
                Object.assign(request, {
                    data: data
                })
            } else {
                Object.assign(request, {
                    params: data
                })
            }
            axios(request).then(res => {
                resolve(res.data);
            }).catch(error => {
                reject(error)
            })
        })
    }

}

module.exports = {
    install: (app, options) => {
        new SkeletonVue(app)
    }
}