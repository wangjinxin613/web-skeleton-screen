'use strict'

const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')
const weblog = require('webpack-log')

const outputSkeletonScreen = async (originHtml, options, log) => {
  const { pathname, staticDir, routes } = options
  return Promise.all(routes.map(async (route) => {
    const filePath = path.join(pathname, `${route}.html`)
    if(fs.existsSync(filePath)) {
      const html = await promisify(fs.readFile)(filePath, 'utf-8')
      const finalHtml = htmlMerge(originHtml, html);
      const outputDir = path.join(staticDir, route)
      const outputFile = path.join(outputDir, 'index.html')
      if(finalHtml !== '') {
        await fse.ensureDir(outputDir)
        await promisify(fs.writeFile)(outputFile, finalHtml, 'utf-8')
        log.info(`write ${outputFile} successfully in ${route}`)
      }
    }
    return Promise.resolve()
  }))
}

function htmlMerge(toHtml, fromHtml) {
  if(fromHtml.indexOf('<style>') != -1) {
    const style = /\<style>(.*?)<\/style>/.exec(fromHtml);
    if(toHtml.indexOf('<style>') != -1 && style.length >= 1) {
      toHtml = toHtml.replace(/\<style>/, `<style>${style[1]}`);
    } else {
      toHtml = toHtml.replace(/\<head>/, `<head>${style[0]}`);
    }
    let body = fromHtml.replace(/\<style>.*?\<\/style>/, '');
    const bodyRes = /\<body>(.*?)<\/body>/.exec(body);
    if(Array.isArray(bodyRes) && bodyRes.length >=1 ) {
      body = bodyRes[1];
    }
    // const entryDom = /\<div*\s[iI][dD]=(["']?)app(["']?)>/.exec(toHtml);
    toHtml = toHtml.replace(/\<body>/, `<body>${body}`);
    toHtml = toHtml.replace(/\<\/html>/, `${injectJsStr()}</html>`)
    return toHtml;
  }
  return '';
}

function injectJsStr() {
  return  `
  <script>
  window.showSkeleton = function() {
    document.querySelectorAll('._').forEach(el => el.style.display = 'block');
  }
  window.hideSkeleton = function() {
    document.querySelectorAll('._').forEach(el => el.style.display = 'none');
  }
  window.onload = function() {
    setTimeout(() => {
      window.hideSkeleton();
    }, 1000)  
  }
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
    name: 'wss',
    timestamp: options.logTime
  })
}

module.exports = {
  outputSkeletonScreen,
  createLog
}
