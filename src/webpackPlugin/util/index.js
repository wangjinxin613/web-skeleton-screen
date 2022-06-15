'use strict'

const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')
const weblog = require('webpack-log')

// 遍历读取某个目录的所有文件
function foreachDirFiles(dir) {
  let result = [];
  function readDir(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir)
      .forEach((fileName) => {
        const filePath = path.join(dir, fileName)
        const stat = fs.lstatSync(filePath)
        if (stat.isDirectory()) {
          readDir(filePath)
        } else if (fileName.length >= 6 && fileName.substr(fileName.length - 5, 5) === '.html') {
          result.push(filePath)
        }
      });
  }
  readDir(dir);
  return result;
}

const outputSkeletonScreen = async (originHtml, options, log) => {
  const { config, staticDir } = options
  const pathname = path.join(process.cwd(), config?.output?.filepath ?? 'out');
  const files = foreachDirFiles(pathname);
  const blackList = config?.blackList ?? [];
  return Promise.all(files.map(async (filePath) => {
    const routeName = filePath.split(pathname)[1];
    if (fs.existsSync(filePath) && routeName.length >= 5) {
      const route = routeName.substr(0, routeName.length - 5);
      if (blackList.indexOf(route) === -1) {
        const html = await promisify(fs.readFile)(filePath, 'utf-8')
        const finalHtml = htmlMerge(originHtml, html);
        const outputDir = path.join(staticDir, route)
        const outputFile = path.join(outputDir, 'index.html')
        if (finalHtml !== '') {
          await fse.ensureDir(outputDir)
          await promisify(fs.writeFile)(outputFile, finalHtml, 'utf-8')
          log.info(`write ${outputFile} successfully in ${route}`)
        }
      }
    }
    return Promise.resolve()
  }))
}

function htmlMerge(toHtml, fromHtml) {
  if (fromHtml.indexOf('<style>') != -1) {
    const style = /\<style>([\s\S]*)<\/style>/.exec(fromHtml);
    if (toHtml.indexOf('<style>') != -1 && style != null && style.length >= 1) {
      toHtml = toHtml.replace(/\<style>/, `<style>${style[1]}`);
    } else {
      toHtml = toHtml.replace(/\<head>/, `<head>${style[0]}`);
    }
    let body = fromHtml.replace(/\<style>[\s\S]*\<\/style>/, '');
    // body = fromHtml.replace(/\<script>[\s\S]*\<\/script>/, '')
    toHtml = toHtml.replace(/\<body>/, `<body><div id="skeleton">${body}</div>`);
    toHtml = toHtml.replace(/\<\/html>/, `${injectJsStr()}</html>`)
    return toHtml;
  }
  return '';
}

function injectJsStr() {
  return `
  <script>
    window.showSkeleton = function() {
        document.querySelectorAll('.__').forEach(el => {
            el.style.display = 'block'
            el.style.zIndex = 999;
        });
        document.querySelectorAll('._').forEach(el => {
            el.style.display = 'block'
            el.style.zIndex = 999;
        });    
    }
    window.hideSkeleton = function() {
        document.querySelectorAll('.__').forEach(el => {
            el.style.display = 'none'
            el.style.zIndex = -1;
        });
        document.querySelectorAll('._').forEach(el => {
            el.style.display = 'none'
            el.style.zIndex = -1;
        });
    }
    const timer = setTimeout(() => {
        hideSkeleton();
    }, 100000)
    window.addEventListener('load', function () {
        setTimeout(() => {
            hideSkeleton();
            timer && clearTimeout(timer);
        }, 250)
    });
</script>
  `;
}

function createLog(options) {
  let logLevel = options.logLevel || 'info'
  if (options.quiet === true) {
    logLevel = 'silent'
  }
  if (options.noInfo === true) {
    logLevel = 'warn'
  }

  return weblog({
    level: logLevel,
    name: '骨架屏',
    timestamp: options.logTime
  })
}


module.exports = {
  outputSkeletonScreen,
  createLog,
  foreachDirFiles
}
