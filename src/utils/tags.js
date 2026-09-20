const TECH_KEYWORDS = {
  'Vue': ['vue', 'vuex', 'pinia', 'vue-router', '组件', '插槽', 'slot', '生命周期', '组合式', 'setup', 'ref', 'reactive', 'computed', 'watch', 'provide', 'inject', 'teleport', 'suspense', 'directive', 'mixin'],
  'React': ['react', 'jsx', 'hooks', 'usestate', 'useeffect', 'usecontext', 'usereducer', 'memo', 'redux', 'next'],
  'JavaScript': ['javascript', 'js', 'es6', '闭包', '原型链', '作用域', 'promise', 'async', 'await', '事件循环', 'this', '箭头函数', '解构', 'class', '模块', 'module', 'typescript', 'ts'],
  'CSS': ['css', 'flex', 'grid', '布局', '盒模型', 'position', 'animation', 'transition', '媒体查询', '响应式', 'bem', 'sass', 'less', 'tailwind'],
  '浏览器': ['浏览器', '缓存', '跨域', 'cors', 'cookie', 'session', 'storage', 'dom', 'bom', '渲染', '回流', '重绘'],
  '网络': ['http', 'https', 'ajax', 'fetch', 'axios', 'websocket', '状态码'],
  '性能': ['性能', '优化', '懒加载', '虚拟列表', '防抖', '节流', 'webpack', 'vite'],
  '工程化': ['webpack', 'vite', 'babel', 'eslint', 'git', 'ci', 'cd', 'docker'],
  'Node': ['node', 'nodejs', 'express', 'koa', 'nest', 'ssr']
}

export function detectTags(text) {
  const lowerText = text.toLowerCase()
  const tags = []
  for (const [tag, keywords] of Object.entries(TECH_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      tags.push(tag)
    }
  }
  if (tags.length === 0) tags.push('其他')
  return tags
}

export function generateId(title, index) {
  let hash = 0
  const str = title + index
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
