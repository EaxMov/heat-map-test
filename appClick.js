class AppClick {
  screen = null
  list = []
  objectsHash = {}
  image_hash = null
  canvas = null
  scale = 1
  vnode = {}
  rootHashCode = null
  // 获取容器对象
  constructor(screen) {
    this.screen = screen
    this._hrefLink()
  }
  // 初始化数据
  init(data) {
    const { image_hash, scale, screenshot, serialized_objects } = data.gzip_payload.activities[0]
    this.rootHashCode = serialized_objects.rootObject
    this.scale = scale
    this.renderScreen(screenshot)
    this.renderTag(serialized_objects.objects)
    this.image_hash = image_hash
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
    nodeList.forEach((item) => {
      if (this.vnode[item.hashCode]) return
      const div = document.createElement('div')
      div.style.width = `${item.width * this.scale}px`
      div.style.height = `${item.height * this.scale}px`
      div.style.top = `${item.top * this.scale}px`
      div.style.left = `${item.left * this.scale}px`
      div.setAttribute('uuid', item.hashCode)
      div.setAttribute('class', 'app-click-render-ghost-rect')
      this.vnode[item.hashCode] = div
      renderVnode.push(div)
    })
    this.screen.append(...renderVnode)
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
  _hrefLink() {
    document.write('<link rel="stylesheet" href="./style.css">')
  }
  // 所有hashCode对照表
  _getHashCodeRelative(list) {
    const needCreadNode = []
    list.forEach((item) => {
      item.subviews.forEach((hash) => {
        this.objectsHash[hash] = item
      })
    })
    list.forEach((item) => {
      // 过滤本身且父元素不是点击的标签，并重新根据关系计算元素宽高，定位
      if (item.importantForAccessibility && item.clickable) {
        const root = this._filterRect(item.hashCode, item)
        if (
          root.importantForAccessibility &&
          !root.clickable &&
          root.hashCode != item.hashCode &&
          root.hashCode == this.rootHashCode
        ) {
          needCreadNode.push(item)
        }
      }
    })
    return needCreadNode
  }
  // 计算标签
  _filterRect(hashCode, rect) {
    const parent = this.objectsHash[hashCode]
    if (parent) {
      rect.left += parent.left - parent.scrollX
      rect.top += parent.top - parent.scrollY
      return this._filterRect(parent.hashCode, rect)
    }
    rect.height = rect.height - rect.scrollY
    rect.width = rect.width - rect.scrollX
    return this.list.find((item) => item.hashCode == hashCode)
  }
}
