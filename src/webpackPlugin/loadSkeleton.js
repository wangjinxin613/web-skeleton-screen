function showSkeleton() {
  document.querySelectorAll('.__').forEach(el => {
    el.style.display = 'block'
    el.style.zIndex = 999;
  });
  document.querySelectorAll('._').forEach(el => {
    el.style.display = 'block'
    el.style.zIndex = 999;
  });
}

function hideSkeleton() {
  document.querySelectorAll('.__').forEach(el => {
    el.style.display = 'none'
    el.style.zIndex = -1;
  });
  document.querySelectorAll('._').forEach(el => {
    el.style.display = 'none'
    el.style.zIndex = -1;
  });
}

function largest_contentful_paint() {
  return new Promise((c, e) => {
      if (window.PerformanceObserver) {
          try {
              //有些浏览器不支持此类型
              let po = new PerformanceObserver((entryList) => {
                  const entries = entryList.getEntries();
                  for (let i = 0; i < entries.length; i++) {
                      //为了真实结果,不作处理
                      po.disconnect();
                      po = null;
                      c(void 0);
                      return;
                  }
              });
              po.observe({ type: 'largest-contentful-paint', buffered: true });
          } catch (err) {
              console.error(`LCP supported:`, err);
              c(void 0);
          }
      } else {
          c(void 0);
      }
  });
}

if (window.Promise) {
  Promise.all([onload(), largest_contentful_paint()]).then(async () => {
      hideSkeleton();
  });
} else {
  window.addEventListener('load', function () {
      setTimeout(hideSkeleton, 100);
  });
}

function mixinSkeleton(callback) {
  var filepath = `${getRouter()}`
  if (isBlack(filepath)) {
    return;
  }
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("get", `${_publicPath + '/' + _skeletonDir + filepath + '.' + window._skeletonHash}.wss`);
    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const html = xhr.responseText;
        if (html && html.indexOf('class="_ __"') !== -1) {
          skeletonHtmlInsert(html)
          typeof callback === 'function' && callback(html)
        }
      }
    }
    xhr.onerror = function (error) {
      console.log('get skeleton error', error)
      throw new Error(error);
    }

  } catch (error) {
    this.log('当前路由还未生成骨架屏', error);
  }

  function skeletonHtmlInsert(html) {
    const div = document.createElement('div');
    const body = document.body;
    div.id = 'skeleton';
    div.innerHTML = html;
    if (document.getElementById(div.id)) {
      document.getElementById(div.id).innerHTML = html;
    } else if (body === null) {
      console.log('body is null');
      setTimeout(() => {
        document.body.insertBefore(div, document.body.firstElementChild)
      }, 0)
    } else {
      body.insertBefore(div, body.firstElementChild);
    }
    if (html.indexOf('<script>') != -1) {
      const script = /\<script>([\s\S]*)<\/script>/.exec(html);
      if (script != null && script.length >= 1) {
        try {
          script[1] = script[1].replace('\n', '');
          eval(script[1]);
        } catch (error) {
        }
      }
    }

    /**
     * css长度单位按照当前屏幕尺寸进行适配
     * @param {*} value css长度，可能是px，也可能是rem等
     * @returns 适配后的新长度
     */
    function cssSizeFit(value, key) {
      // 骨架屏生成态时的屏幕宽度，是在生成骨架屏时注入的
      const view_width = document.getElementsByTagName("html")[0].getBoundingClientRect().width;
      const skeletonViewWidth = window._skeletonViewWidth ? window._skeletonViewWidth : view_width;
      let resValue = value;
      const originValue = value;
      // 将px转换成适配于当前屏幕尺寸的px
      if (value.indexOf('px') !== -1) {
        value = value.substr(0, value.length - 2);
        resValue = (Number(value) * view_width / skeletonViewWidth) + 'px';
      } else {
        // 当屏幕尺寸大于768时，html的fontSize不再增大，所以需要适配一下
        if (view_width > 768 && (key === 'left' || key === 'width')) {
          if (value.indexOf('rem') !== -1 && value.length > 3) {
            value = value.substr(0, value.length - 3);
            if (!isNaN(value)) {
              resValue = `calc(${originValue} + ${((Number(value) * ((view_width - 768) * 100) / 375)) + 'px'})`
              //el.style.left = `${((Number(left) * (view_width * 100) / 375))}px`
            }
          }
        }
      }
      return resValue
    }

    function fontSizeFit() {
      let view_width = document.getElementsByTagName("html")[0].getBoundingClientRect().width;
      let _html = document.getElementsByTagName("html")[0];
      if (view_width > 768) {
        _html.style.fontSize = (100 * 768) / 375 + "px"
      } else {
        _html.style.fontSize = (view_width * 100) / 375 + "px"
      }
      // 骨架屏节点元素尺寸、位置适配
      document.querySelectorAll('._').forEach(el => {
        el.style.left = cssSizeFit(el.style.left, 'left')
        el.style.top = cssSizeFit(el.style.top, 'top')
        el.style.width = cssSizeFit(el.style.width, 'width')
        el.style.height = cssSizeFit(el.style.height, 'height')
      });
    }
    fontSizeFit();
  }

  function getRouter() {
    let route = window.location.pathname;
    if (route.indexOf(_publicPath) !== -1) {
      route = route.replace(_publicPath, '')
    }
    if (route.charAt(route.length - 1) === '/') {
      route = route.slice(0, -1);
    }
    return route;
  }

  function isBlack(route) {
    if (Array.isArray(_skeletonBlackList)) {
      return _skeletonBlackList.indexOf(route) !== -1
    }
    return false;
  }
}


mixinSkeleton()
