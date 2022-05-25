
const config = {
  output: {
    filepath: 'out',   // 生成骨架屏的存放文件夹名称
    injectSelector: '#app'  // 生成的骨架屏插入页面的节点
  },
  headless: false,
  // header: {
  //   height: 40,
  //   background: '#3388ff'
  // },
  background: '#eee',
  animation: 'opacity 1s linear infinite;',
  baseUrl: 'http://192.168.1.4:8082/embed',
  // includeElement: function(node, draw) {
  // 定制某个节点画出来的样子，带上return false
  // if(node.id == 'ui-alert') {
  // 跳过该节点及其子节点
  // return false;
  // }
  // if(node.tagName.toLowerCase() === 'img') {
  // 对该图片生成宽100%，高8%，颜色为红色的色块
  // draw({
  // width: 100,
  // height: 8,
  // left: 0,
  // top: 0,
  // zIndex: 99999999,
  // background: 'red'
  // });
  // return false;
  // } 
  // },
  // writePageStructure: function(html) {
  // 自己处理生成的骨架屏
  // fs.writeFileSync(filepath, html);
  // console.log(html)
  // },
  init: function () {
    // document.querySelectorAll('.m-icon').forEach(item => item.parentNode.removeChild(item));
    // 生成骨架屏之前的操作，比如删除干扰节点
  }
}

const routes = [
  { 
    "path": "/invitation/invitationTest", 
    "name": "任务", 
    "meta": { "title": "Tarefa" }, 
    "props": { "default": false }, 
    "children": [], 
    "instances": {}, 
    "leaveGuards": {}, 
    "updateGuards": {}, 
    "enterCallbacks": {}, 
    "components": {} 
  }, 
  { 
    "path": "/member/MemberHelpNotesItem", 
    "name": "邀请好友", 
    "meta": { "title": "Lista de visitantes" }, 
    "props": { "default": false }, 
    "children": [],
    "instances": {}, 
    "leaveGuards": {}, 
    "updateGuards": {}, 
    "enterCallbacks": {},
    "components": {} 
  }];

config.routes = routes;

module.exports = config;
