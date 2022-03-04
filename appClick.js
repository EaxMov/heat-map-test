class AppClick {
  heatmapInstance = null //热力图实例
  screen = null // dom容器
  list = [] // 数据列表
  objectsHash = {} // 数据转化为map对象
  canvas = null // 背景图片容器
  scale = 1 // 缩放
  vnode = {} // 需要渲染的节点
  rootHashCode = null // 根节点hash值
  onload = () => {}
  // 获取容器对象
  constructor(screen) {
    this._hrefLinkCss()
    this._loadScript('./heatmap.min.js',() => {
      this.initHeatMap()
      this.onload()
    })
    this.screen = screen
  }
  // 初始化数据
  init(data) {
    const { scale, screenshot, serialized_objects } = data.gzip_payload.activities[0]
    this.rootHashCode = serialized_objects.rootObject
    this.scale = scale
    this.renderScreen(screenshot)
    this.renderTag(serialized_objects.objects)
  }
  // 初始化热力图
  initHeatMap() {
    this.heatmapInstance = h337.create({
      container: this.screen,
      radius: 10, // [0,+∞)
      opacity: 0.8
    })
  }
  // 渲染屏幕图
  renderScreen(screenshot) {
    const url = 'data:image/png;base64, '.concat(screenshot)
    const Img = new Image()
    Img.src = url
    Img.onload = () => {
      if (!this.canvas) {
        this.canvas = document.createElement('canvas')
        this.canvas.width = Img.width
        this.canvas.height = Img.height
        this.screen.style.width = `${Img.width}px`
        this.screen.style.height = `${Img.height}px`
        this.screen.prepend(this.canvas)
      }
      this.canvas.getContext('2d').drawImage(Img, 0, 0, Img.width, Img.height)
    }
  }
  // 初始化标签
  renderTag(objects) {
    this.list = objects
    const needCreadNode = this._getHashCodeRelative(objects)
    this.clearNode(needCreadNode)
    this.createTags(needCreadNode)
  }
  // 渲染标签
  createTags(nodeList) {
    const renderVnode = []
    const renderHeatMap = []
    nodeList.forEach((item) => {
      if (this.vnode[item.hashCode]) return
      const div = document.createElement('div')
      div.style.width = `${item.width * this.scale}px`
      div.style.height = `${item.height * this.scale}px`
      div.style.top = `${item._top * this.scale}px`
      div.style.left = `${item._left * this.scale}px`
      div.setAttribute('uuid', item.hashCode)
      div.setAttribute('class', 'app-click-render-ghost-rect')
      this.vnode[item.hashCode] = div
      renderVnode.push(div)
      renderHeatMap.push(item)
    })
    this.screen.append(...renderVnode)
    this.renderHeatMap(renderHeatMap)
  }
  // 清空没用的标签
  clearNode(nodeList) {
    for (const key in this.vnode) {
      const uuid = this.vnode[key].getAttribute('uuid')
      const isNeedDelete = !nodeList.find((item) => item.hashCode == uuid)
      if (isNeedDelete) {
        this.vnode[key].remove()
        delete this.vnode[key]
      }
    }
  }
  // 渲染热力图
  renderHeatMap(list) {
    const points = []
    list.forEach((item) => {
      points.push({
        x: item.translationX || item._left * 0.3333334,
        y: item.translationY || item._top * 0.3333334,
        value: item.visibility
      })
    })
    this.heatmapInstance.setData({
      max: 100,
      data: points
    })
  }
  // 所有hashCode对照表
  _getHashCodeRelative(list) {
    this.objectsHash = []
    const needCreateNode = []
    list.forEach((item) => {
      item.subviews.forEach((hash) => {
        this.objectsHash[hash] = item
      })
    })
    list.forEach((item) => {
      item._left = item.left
      item._top = item.top
      // 过滤本身且父元素不是点击的标签，并重新根据关系计算元素宽高，定位
      if (item.importantForAccessibility && item.clickable) {
        const root = this._filterRect(item.hashCode, item)
        if (
          root.importantForAccessibility &&
          !root.clickable &&
          root.hashCode != item.hashCode &&
          root.hashCode == this.rootHashCode
        ) {
          needCreateNode.push(item)
        }
      }
    })
    return needCreateNode
  }
  // 计算标签
  _filterRect(hashCode, rect) {
    const parent = this.objectsHash[hashCode]
    if (parent) {
      rect._left += parent.left - parent.scrollX
      rect._top += parent.top - parent.scrollY
      return this._filterRect(parent.hashCode, rect)
    }
    rect.height = rect.height - rect.scrollY
    rect.width = rect.width - rect.scrollX
    return this.list.find((item) => item.hashCode == hashCode)
  }
   _hrefLinkCss() {
    document.write('<link rel="stylesheet" href="./style.css">')
  }
  _loadScript(url, callback) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    if(typeof(callback) != "undefined"){
      if (script.readyState) {
        script.onreadystatechange = function () {
          if (script.readyState == "loaded" || script.readyState == "complete") {
          script.onreadystatechange = null;
          callback();
          }
        };
      } else {
        script.onload = function () {
          callback();
        };
      }
    }
      script.src = url;
      document.body.appendChild(script);
    }

}
