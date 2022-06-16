/**
 * 具体的生成骨架屏的逻辑
 * 可传入以下参数，传入时需要使用genArgs.create方法包装
    init: {
        type: 'function',
        value: this.init.toString()
    },
    includeElement: {
        type: 'function',
        value: this.includeElement.toString()
    },
    background: {
        type: 'string',
        value: this.background
    },
    animation: {
        type: 'string',
        value: this.animation
    },
    rootNode: {
        type: 'string',
        value: this.rootNode
    },
    header: {
        type: 'object',
        value: JSON.stringify(this.header)
    },
    isSilent: {
        type: 'bool', // 是否是静默生成
        value: true
    },
    toRem: {
        type: 'bool', // 是否将尺寸转换成rem
        value: true
    },
    // 节点合并相关的配置
    blockMerge: {
        type: 'object',
        value: {
            enable: true, 
            maxWidth: 30, // 目标节点的最大宽度
            maxHeight: 30, // 目标节点的最大高度
            maxX: 0, // 目标节点和比对节点之间的横坐标最大间距
            maxY: 0,
        }
    }
 */

/**
 * 骨架屏生成规则
 * 1. 属于'audio', 'button', 'canvas', 'code', 'img', 'input', 'pre', 'svg', 'textarea', 'video', 'xmp'元素中的一种
 * 2. 文字元素可生成
 * 3. 带有背景图并且宽高不超过屏幕宽度的80%的元素可生成
 * 4. 带有背景并且存在边框或者阴影或者宽高不超过屏幕宽度的80%的元素可生成
 * 5. 生成原则是从最外层节点依次向内遍历，如果这个节点满足生成规则则直接生成放弃子节点，反之继续遍历子节点
 * 5. 如果父元素有overflow: hidden，子元素不可超过这个父元素的可视范围
 * 6. 如果配置开启了节点合并，节点是可以合并的
 * 7. 只有一个文字子节点并且该节点背景不存在时，按照文字所占区域生成
 */


module.exports = function evalDOM() {
  const ELEMENTS = ['audio', 'button', 'canvas', 'code', 'img', 'input', 'pre', 'svg', 'textarea', 'video', 'xmp'];
  const blocks = [];
  const win_w = window.innerWidth;
  const win_h = window.innerHeight;

  let agrsArr = arguments;
  if (!agrsArr.length) agrsArr = { length: 1, 0: {} };
  let agrs = agrsArr[0];

  if (agrsArr.length !== 1 || getArgtype(agrs) !== 'object') {
    agrs = parseAgrs([...agrsArr]);
  }

  const classProps = {
    position: 'fixed',
    zIndex: -1,
    background: agrs.background,
    background: `linear-gradient(100deg,rgba(255, 255, 255, 0) 40%,rgba(255, 255, 255, .5) 50%,rgba(255, 255, 255, 0) 60%) ${agrs.background ? agrs.background : '#eee'}`,
    'background-size': '200% 100%',
    'background-position-x': `180%`,
    animation: `1.5s skeleton_loading ease-in-out infinite`
  }

  createCommonClass(classProps);

  // 将px转化为rem
  function px2rem(value) {
    if (isNaN(value)) {
      return 0;
    } else {
      value = Number(value)
    }
    let view_width = document.getElementsByTagName("html")[0].getBoundingClientRect().width;
    return (value / ((view_width * 100) / 375)).toFixed(2);
  }

  // 根据传入数据转换成css尺寸
  function cssSize(value) {
    if (!isNaN(value)) {
      return agrs.toRem ? `${px2rem(value)}rem` : value + 'px'
    } else if (typeof value === 'undefined') {
      return 0;
    } else {
      return value;
    }
  }

  // 返回节点计算后的样式
  function drawBlockStyles({ width, height, top, left, zIndex = 999, radius, subClas, style = [], paddingTop, paddingRight, paddingBottom, paddingLeft }) {
    width = width < 0 ? 0 : width;
    height = height < 0 ? 0 : height;
    const styles = [
      'height:' + cssSize(height)
    ];
    if (!subClas) {
      styles.push(
        'top:' + cssSize(top),
        'left:' + cssSize(left),
        'width:' + cssSize(width),
        'padding-top: ' + cssSize(paddingTop),
        'padding-right: ' + cssSize(paddingRight),
        'padding-bottom: ' + cssSize(paddingBottom),
        'padding-left: ' + cssSize(paddingLeft),
      );
    }
    if (Array.isArray(style) && style.length > 0) {
      styles = styles.concat(style);
    }
    if (radius && radius != '0px') {
      let radiusValue = '';
      if (radius.indexOf('px') !== -1) {
        let arr = radius.split('px');
        if (arr.length > 0) {
          arr = arr.filter(v => v.trim() !== '' && !isNaN(v)).map(v => px2rem(v.trim()) + 'rem')
          radiusValue = arr.join(' ')
        }
      } else {
        radiusValue = radius;
      }
      styles.push('border-radius:' + radiusValue);
    }
    return styles.join(';');
  }

  function drawBlock(arg = {}) {
    const { subClas, maxPosition = {} } = arg;
    blocks.push(`<div class="_${subClas ? ' __' : ''}" style="${drawBlockStyles(arg)}"></div>`);
  }

  function wPercent(x) {
    if (isNaN(x)) return 0;
    return Number(parseFloat(x).toFixed(3));
  }

  function hPercent(x) {
    if (isNaN(x)) return 0;
    return Number(parseFloat(x).toFixed(3));
  }

  function noop() { }

  function getArgtype(arg) {
    return Object.prototype.toString.call(arg).toLowerCase().match(/\s(\w+)/)[1];
  }

  function getStyle(node, attr) {
    return (node.nodeType === 1 ? getComputedStyle(node)[attr] : '') || '';
  }

  function getRootNode(el) {
    if (!el) return el;
    return typeof el === 'object' ?
      el :
      (getArgtype(el) === 'string' ?
        document.querySelector(el) :
        null);
  }

  function includeElement(elements, node) {
    return ~elements.indexOf((node.tagName || '').toLowerCase());
  }

  function isHideStyle(node) {
    return getStyle(node, 'display') === 'none' ||
      getStyle(node, 'visibility') === 'hidden' ||
      getStyle(node, 'opacity') == 0 ||
      node.hidden;
  }

  function hasBgColor(node) {
    const bgStyle = getStyle(node, 'background');
    const bgColorReg = /rgba\([\s\S]+?0\)/ig;
    const hasBgColor = !bgColorReg.test(bgStyle) || ~bgStyle.indexOf('gradient');
    return hasBgColor;
  }

  function isCustomCardBlock(node) {
    const bgStyle = getStyle(node, 'background');
    const bgColorReg = /rgba\([\s\S]+?0\)/ig;
    const bdReg = /(0px)|(none)/;
    const hasBgColor = !bgColorReg.test(bgStyle) || ~bgStyle.indexOf('gradient');
    const hasNoBorder = ['top', 'left', 'right', 'bottom'].some(item => {
      return bdReg.test(getStyle(node, 'border-' + item));
    });
    const { w, h } = getRect(node);
    const customCardBlock = !!(hasBgColor && (!hasNoBorder || getStyle(node, 'box-shadow') != 'none') && w > 0 && h > 0 && w < 0.95 * win_w && h < 0.3 * win_h);
    return customCardBlock;
  }

  // 大尺寸的元素可以不生成，会影响页面效果
  function isBigNode(node) {
    const { t, l, w, h } = getRect(node);
    if ((w > win_w * 0.8 && h > win_w * 0.5) || (h > win_h * 0.8 && w > win_w * 0.5)) {
      return true;
    }
    return false;
  }

  function calcTextWidth(text, { fontSize, fontWeight } = {}) {
    if (!text) return 0;

    const div = document.createElement('div');
    div.innerHTML = text;
    div.style.cssText = [
      'position:absolute',
      'left:-99999px',
      `height:${fontSize}`,
      `font-size:${fontSize}`,
      `font-weight:${fontWeight}`,
      'opacity:0'
    ].join(';');
    document.body.appendChild(div);
    const w = getStyle(div, 'width');
    const h = getStyle(div, 'height');
    document.body.removeChild(div);
    return {
      w: parseInt(w),
      h: parseInt(h)
    };
  }

  function getRect(node) {
    if (!node) return {};
    const { top: t, left: l, width: w, height: h } = node.getBoundingClientRect();
    return { t, l, w, h };
  }

  function getPadding(node) {
    return {
      paddingTop: parseInt(getStyle(node, 'paddingTop')),
      paddingLeft: parseInt(getStyle(node, 'paddingLeft')),
      paddingBottom: parseInt(getStyle(node, 'paddingBottom')),
      paddingRight: parseInt(getStyle(node, 'paddingRight'))
    }
  }

  function createCommonClass(props) {
    const inlineStyle = [`<style> @keyframes skeleton_loading { to { background-position-x: -20%; } } ._{`];
    for (let prop in props) {
      inlineStyle.push(`${prop === 'zIndex' ? 'z-index' : prop}:${props[prop]};`);
    }
    inlineStyle.push('}.__{top:0%;left:0%;width:100%;background: #fff;}</style>');
    blocks.push(inlineStyle.join(''));
  }

  function parseAgrs(agrs = []) {
    let params = {};
    agrs.forEach(agr => {
      const sep = agr.indexOf(':');
      const [appName, name, type] = agr.slice(0, sep).split('-');
      const val = agr.slice(sep + 1);
      if (type === 'function') {
        params[name] = eval('(' + val + ')')
      } else if (type === 'object') {
        params[name] = JSON.parse(val)
      } else if (type === 'bool') {
        params[name] = val === 'true' ? true : false
      } else {
        params[name] = val
      }
    });
    return params;
  }

  function DrawPageframe(opts) {
    this.rootNode = getRootNode(opts.rootNode) || document.body;
    this.offsetTop = opts.offsetTop || 0;
    this.includeElement = opts.includeElement;
    this.init = opts.init;
    this.originStyle = {};
    return this instanceof DrawPageframe ? this : new DrawPageframe(opts);
  }

  DrawPageframe.prototype = {
    resetDOM: function () {
      this.init && this.init();
      this.originStyle = {
        scrollTop: window.scrollY,
        bodyOverflow: getStyle(document.body, 'overflow')
      };
      window.scrollTo(0, this.offsetTop);
      drawBlock({
        height: '100vh',
        zIndex: -1,
        background: '#fff',
        subClas: true
      });
      this.withHeader();
    },
    inHeader: function (node) {
      if (agrs.header) {
        const height = parseInt(agrs.header.height);
        if (height) {
          const { t, l, w, h } = getRect(node);
          return t <= height;
        }
      }
    },
    withHeader: function () {
      if (agrs.header) {
        const { height, background } = agrs.header;
        const hHeight = parseInt(height);
        const hBackground = background || agrs.background;
        if (hHeight) {
          drawBlock({
            height: hPercent(hHeight),
            zIndex: -1,
            background: hBackground,
            subClas: true
          });
        }
      }
    },
    showTip(text, {
      textColor
    } = {}) {
      if (agrs.isSilent) {
        return;
      }
      const { body } = document;
      const div = document.createElement('div');
      div.id = 'skeleton-tip';
      div.style.position = 'fixed';
      div.style.zIndex = 99999;
      div.style.left = 0;
      div.style.top = 0;
      div.style.width = '100%';
      div.style.background = 'rgba(119,126,146, 0.5)';
      div.style.color = textColor ? textColor : '#fff';
      div.style.textAlign = 'center';
      div.style.padding = '20px';
      div.style.fontSize = '16px';
      div.style.boxSizing = 'border-box';
      div.innerText = text;
      if (document.getElementById(div.id)) {
        document.getElementById(div.id).innerHTML = div;
      } else {
        body.appendChild(div);
      }
    },
    showBlocks: function () {
      if (blocks.length <= 2) {
        this.showTip('界面可能空白无法生成骨架屏')
        return '';
      }
      if (blocks.length) {
        const { body } = document;
        let view_width = document.getElementsByTagName("html")[0].getBoundingClientRect().width;
        blocks.unshift(`<script> window._skeletonViewWidth = ${view_width}; </script>`);
        // blocks.unshift(`<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"/>`);
        const blocksHTML = blocks.join('');
        if (!agrs.isSilent) {
          const div = document.createElement('div');
          div.innerHTML = blocksHTML;
          body.appendChild(div);
          window.scrollTo(0, this.originStyle.scrollTop);
          document.body.style.overflow = this.originStyle.bodyOverflow;
          showSkeleton();
          this.showTip('骨架屏生成成功，即将生成下一个', { textColor: 'green' })
        }
        return blocksHTML;
      }
    },

    getTurelyStyle(node) {
      let { t, l, w, h } = getRect(node);
      const {
        paddingTop,
        paddingLeft,
        paddingBottom,
        paddingRight
      } = getPadding(node);
      let background = getStyle(node, 'backgroundImage');
      let backgroundHasurl = background.match(/url\(.+?\)/);
      backgroundHasurl = backgroundHasurl && backgroundHasurl.length;

      if (hasBgColor(node) || backgroundHasurl) {
        return {
          width: wPercent(w),
          height: hPercent(h),
          top: hPercent(t),
          left: wPercent(l),
          radius: getStyle(node, 'border-radius'),
          // paddingLeft: paddingLeft,
          // paddingTop: paddingTop,
          // paddingRight: paddingRight,
          // paddingBottom: paddingBottom,
          realWidth: wPercent(w),
          realHeight: hPercent(h)
        }
      } else {
        let childNodes = node.childNodes;
        if (childNodes && childNodes.length === 1 && childNodes[0].nodeType === 3 && childNodes[0].textContent && childNodes[0].textContent.trim().length) {
          const textSize = calcTextWidth(childNodes[0].textContent, {
            fontSize: getStyle(node, 'font-size'),
            fontWeight: getStyle(node, 'font-weight'),
          })
          const text = childNodes[0].textContent;
          node.innerHTML = `<span style="width: ${textSize.w}px; height: ${textSize.h}px;">${text}</span>`
          const rect = getRect(node.childNodes[0]);
          t = rect.t;
          l = rect.l;
          w = rect.w;
          h = rect.h;
          node.innerHTML = text;
        }
      }
      return {
        width: wPercent(w - paddingLeft - paddingRight),
        height: hPercent(h - paddingTop - paddingBottom),
        top: hPercent(t + paddingTop),
        left: wPercent(l + paddingLeft),
        radius: getStyle(node, 'border-radius'),
        realWidth: wPercent(w - paddingLeft - paddingRight),
        realHeight: hPercent(h - paddingTop - paddingBottom)
      }
    },

    maxSize(style) {
      return {
        maxL: style.left,
        maxT: style.top,
        maxR: style.left + style.realWidth,
        maxB: style.top + style.realHeight,
      }
    },

    // 判读俩个元素之间知否有相交
    blockIntersect(blockStyle, compareBlockStyle) {
      const blockMerge = agrs.blockMerge;
      const maxX = blockMerge.maxX ? blockMerge.maxX : 0;
      const maxY = blockMerge.maxY ? blockMerge.maxY : 0;
      const blockMax = this.maxSize(blockStyle);
      const compareBlockMax = this.maxSize(compareBlockStyle);
      const blockArea = blockStyle.realWidth * blockStyle.realHeight;
      const compareBlockArea = compareBlockStyle.realWidth * compareBlockStyle.realHeight;
      let intersect = false; // X轴是否相交
      let mergeStyle = {};
      // X轴或者Y轴不相交
      if ((blockMax.maxL - compareBlockMax.maxR > maxX || compareBlockMax.maxL - blockMax.maxR > maxX)
        || (compareBlockMax.maxT - blockMax.maxB > maxY || blockMax.maxT - compareBlockMax.maxB > maxY)) {
        intersect = false;
      } else {
        intersect = true;
        mergeStyle = Object.assign(blockStyle, {
          left: Math.min(blockMax.maxL, compareBlockMax.maxL),
          top: Math.min(blockMax.maxT, compareBlockMax.maxT),
          width: Math.max(blockMax.maxR, compareBlockMax.maxR) - Math.min(blockMax.maxL, compareBlockMax.maxL),
          height: Math.max(blockMax.maxB, compareBlockMax.maxB) - Math.min(blockMax.maxT, compareBlockMax.maxT)
        })
        mergeStyle.realWidth = mergeStyle.width;
        mergeStyle.realHeight = mergeStyle.height;
        // 谁的面积越大，就取谁的圆角
        mergeStyle.radius = blockArea > compareBlockArea ? blockStyle.radius : compareBlockStyle.radius;
      }

      return {
        intersect,
        mergeStyle
      }
    },

    // 相交的小元素合并 
    blockStyleMerge(blockStyle) {
      const blockMerge = agrs.blockMerge;
      const maxWidth = blockMerge.maxWidth ? blockMerge.maxWidth : 0;
      const maxHeight = blockMerge.maxHeight ? blockMerge.maxHeight : 0;
      if (blockMerge && blockMerge.enable) {
        const allBlockStyles = this.allBlockStyles;
        const blockMax = this.maxSize(blockStyle)
        for (let compareBlock of allBlockStyles) {
          let compareMax = this.maxSize(compareBlock);
          let blockIntersect = this.blockIntersect(blockStyle, compareBlock);
          if (blockIntersect.intersect) {
            // 尺寸位置相等的同轴节点合并
            if ((blockMax.maxT === compareMax.maxT && blockMax.maxB === compareMax.maxB)
              || (blockMax.maxL === compareMax.maxL && blockMax.maxR === compareMax.maxR)) {
              blockStyle = blockIntersect.mergeStyle;
              continue;
            } else if (blockStyle.realWidth <= maxWidth && blockStyle.realHeight <= maxHeight) {
              // 符合条件的节点合并
              blockStyle = blockIntersect.mergeStyle;
              continue;
            }
          }

        }
      }
      return blockStyle;
    },


    // 父辈元素设置里overflow:hidden的元素 尺寸边界不得超过这个父辈元素
    overflowHiddenStyle(maxPosition, arg) {
      if (maxPosition && maxPosition.width && maxPosition.height) {
        arg.width = ((arg.realWidth + arg.left) > (maxPosition.realWidth + maxPosition.left)) ? (maxPosition.realWidth + maxPosition.left - arg.left) : (arg.realWidth + arg.left - Math.max(arg.left, maxPosition.left));
        arg.height = ((arg.realHeight + arg.top) > (maxPosition.realHeight + maxPosition.top)) ? (maxPosition.realHeight + maxPosition.top - arg.top) : (arg.realHeight + arg.top - Math.max(arg.top, maxPosition.top));
        arg.realWidth = arg.width;
        arg.realHeight = arg.height;
        arg.left = arg.left < maxPosition.left ? Math.max(arg.left, maxPosition.left) : arg.left;
        arg.top = arg.top < maxPosition.top ? Math.max(arg.top, maxPosition.top) : arg.top;
      }
      return arg;
    },

    startDraw: function () {
      let view_width = document.getElementsByTagName("html")[0].getBoundingClientRect().width;
      if (agrs.toRem && (view_width < 305 || view_width > 465)) {
        throw new Error('请在305～465像素宽度打开此页面以生成获得适配最好的骨架屏')
        return '';
      }
      const $this = this;
      this.resetDOM();
      const nodes = this.rootNode.childNodes;
      const { getTurelyStyle } = this;
      this.allBlockStyles = [];

      function deepFindNode(nodes) {
        if (nodes.length) {
          for (let i = 0; i < nodes.length; i++) {

            let node = nodes[i];
            const isIncludeElement = $this.includeElement(node, window.location.pathname, drawBlock);
            if (isHideStyle(node) || (getArgtype($this.includeElement) === 'function' && isIncludeElement == false)) continue;
            let childNodes = node.childNodes;
            let hasChildText = false;
            let background = getStyle(node, 'backgroundImage');
            let backgroundHasurl = background.match(/url\(.+?\)/);

            backgroundHasurl = backgroundHasurl && backgroundHasurl.length;

            for (let j = 0; j < childNodes.length; j++) {
              if (childNodes[j].nodeType === 3 && childNodes[j].textContent.trim().length) {
                hasChildText = true;
                break;
              }
            }

            if ((includeElement(ELEMENTS, node) ||
              (backgroundHasurl && !isBigNode(node)) ||
              (node.nodeType === 3 && node.textContent.trim().length) || (hasChildText && !isBigNode(node)) ||
              isCustomCardBlock(node) || isIncludeElement) && isIncludeElement !== 'skip' && !$this.inHeader(node)) {

              const { t, l, w, h } = getRect(node);

              if (w > 0 && h > 0 && l >= 0 && l < win_w && 800 > t && t >= 0) {
                let maxPosition = {};
                let blockStyle = getTurelyStyle(node);
                if (agrs.blockMerge && agrs.blockMerge.enable) {
                  blockStyle = $this.blockStyleMerge({
                    ...blockStyle,
                    node: node
                  });
                }
                if (node.nodeType === 1 && node.getAttribute("maxPosition")) {
                  maxPosition = node.getAttribute("maxPosition");
                  try {
                    maxPosition = JSON.parse(maxPosition);
                    blockStyle = $this.overflowHiddenStyle(maxPosition, blockStyle)
                    drawBlock(blockStyle);
                  } catch (error) {
                    console.log(error);
                    drawBlock(blockStyle);
                  }
                } else {
                  drawBlock(blockStyle);
                }
                $this.allBlockStyles.push({
                  ...blockStyle,
                  node: node
                })
              }
            } else if (childNodes && childNodes.length) {
              if (!hasChildText || isBigNode(node)) {
                const overflow = getStyle(node, 'overflow');
                if (node.nodeType === 1 && (overflow === 'hidden' || node.getAttribute("maxPosition"))) {
                  const position = overflow === 'hidden' ? JSON.stringify(getTurelyStyle(node)) : node.getAttribute("maxPosition");

                  for (el of childNodes) {
                    if (el.nodeType === 1) {
                      el.setAttribute("maxPosition", position)
                    }
                  }
                  deepFindNode(childNodes);
                } else {
                  deepFindNode(childNodes);
                }
              }
            }
          }
        }
      }

      deepFindNode(nodes);
      return this.showBlocks();
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const html = new DrawPageframe({
        init: agrs.init,
        rootNode: agrs.rootNode,
        includeElement: agrs.includeElement
      }).startDraw();
      resolve(html);
    } catch (e) {
      reject(e);
    }
  });

}
