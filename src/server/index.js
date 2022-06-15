const path = require('path')
const http = require('http')
const url = require('url')
const fs = require('fs');
const querystring = require('querystring');
const ip = require('ip');
const defaultPort = 3566;
const currDir = process.cwd()
const fse = require('fs-extra')
const { promisify } = require('util')
const chokidar = require('chokidar')

var hasChange = false; // 文件是否有修改
var allRoutes = []; // 当前项目的所有路由

// 创建骨架屏html，并且将其存于目标目录中
async function whiteSkeletonScreenHtml(filepath, html) {
    if (filepath.indexOf('/') !== -1) {
        let filepathArray = filepath.split('/');
        filepathArray.pop();
        const dirPath = path.resolve(currDir, filepathArray.join('/'));
        if (!fs.existsSync(dirPath)) {
            console.log('\n' + '创建目录' + dirPath);
            await fse.ensureDirSync(dirPath)
        }
    }
    await promisify(fs.writeFile)(path.resolve(currDir, `${filepath}.html`), html, 'utf-8')
    return successMsg('写入骨架屏成功')
}

function errorMsg(msg, code = 500) {
    return JSON.stringify({
        code: code,
        msg: msg
    })
}

function successMsg(msg) {
    return JSON.stringify({
        code: 200,
        msg: msg
    })
}

function listenFileChange(src) {
    const listenPath = path.resolve(currDir, src);
    chokidar.watch(listenPath, {
        persistent: true,
        ignored: /(^|[\/\\])\../, // 忽略点文件
        cwd: '.', // 表示当前目录
        depth: 10 // 只监听当前目录不包括子目录
    }).on('change', (changePath) => {
        if(changePath.indexOf('main.') === -1) {
            setTimeout(() => {
                hasChange = true;
            }, 4000)
        }
    });
}

function start(config) {
    const { publicPath = '', output: { filepath = 'out' } = {}, src = 'src', listenServerPort = defaultPort } = config;
    listenFileChange(src);
    return new Promise((resolve, reject) => {
        async function onRequest(request, response) {
            const pathname = url.parse(request.url).pathname.substring(1);
            const arg = url.parse(request.url).query;
            const params = querystring.parse(arg);
            response.writeHead(200, { "Content-Type": "text/plain;charset=utf-8", "Access-Control-Allow-Origin": "*" });
            if (pathname === 'whiteSkeleton') {
                const { url, html } = params;
                if (!url && url != '') {
                    response.write(errorMsg('缺少url参数'))
                } else if (!html) {
                    response.write(errorMsg('缺少html参数'))
                } else {
                    response.write(await whiteSkeletonScreenHtml(filepath + '/' + url, html))
                }
            } else if (pathname === 'listen') {
                const { url, html } = params;
                if (hasChange) {
                    if (!url && url != '') {
                        response.write(errorMsg('缺少url参数', 501))
                    } else if (!html) {
                        response.write(errorMsg('缺少html参数', 501))
                    } else {
                        response.write(await whiteSkeletonScreenHtml(filepath + '/' + url, html))
                    }
                    hasChange = false;
                } else {
                    response.write(errorMsg('文件未更改，此次不生成', 502))
                }
            } else if (pathname === 'hasChange') {
                response.write(JSON.stringify({
                    hasChange: hasChange
                }))
            } else if (pathname === 'uploadRoutes') {
                const { routes } = params;
                if (routes) {
                    try{
                        allRoutes = JSON.parse(routes);
                        response.write(successMsg('routes上报成功'))
                    }catch(e){
                        response.write(errorMsg(e))
                    }
                } else {
                    response.write(errorMsg('缺少routes参数', 501))
                }
            } else if (pathname === 'routes') {
                response.write(JSON.stringify(allRoutes || []))
            }  else {
                response.write("not found");
            }
            response.end();
        }
        const server = http.createServer(onRequest);
        let port = listenServerPort;
        function startServer() {
            server.listen(port, function () {
                resolve(port);
                return;
            });
        }
        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                port++;
                server.close();
                startServer();
            }
        });
        startServer();
    })
}

module.exports = {
    start
};

// start(require('../../wss.config.js'))