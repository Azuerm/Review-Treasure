# 前端面试复习 PWA - 项目指南

## 项目概述

前端面试知识复习工具，支持导入 Markdown 题库、卡片式复习、错题本、收藏、学习打卡统计。PWA 可离线使用。

## 技术栈

- Vue 3 (组合式 API + `<script setup>`)
- Vite 8 + vite-plugin-pwa
- Vant 4 (移动端 UI，组件自动导入)
- Pinia 4 (状态管理)
- Vue Router 4 (哈希模式)
- localStorage 持久化（无后端）

## 开发命令

```bash
npm run dev          # 本地开发 (localhost:5173)
npm run dev:host     # 局域网访问
npm run build        # 生产构建 → dist/
npm run preview      # 预览构建结果
```

无测试、无 lint、无类型检查脚本。

## 项目结构

```
src/
├── main.js              # 入口，挂载 Pinia + Router
├── App.vue              # 根组件，含底部导航栏
├── router/index.js      # 路由定义（哈希模式）
├── stores/library.js    # 唯一 Store，封装所有业务逻辑
├── utils/
│   ├── storage.js       # localStorage 读写封装
│   ├── mdParser.js      # Markdown → 卡片解析器
│   └── tags.js          # 技术标签自动识别
└── views/               # 9 个页面组件
    ├── Home.vue         # 首页：知识库列表 + 统计概览
    ├── Import.vue       # 导入 Markdown 题库
    ├── Review.vue       # 卡片复习（翻牌评分）
    ├── EditCard.vue     # 编辑卡片
    ├── WrongBook.vue    # 错题本
    ├── Favorites.vue    # 收藏夹
    ├── Search.vue       # 搜索
    ├── Calendar.vue     # 学习打卡日历
    └── Stats.vue        # 统计图表
```

## 架构要点

### 数据流

1. **存储层** (`utils/storage.js`)：所有数据存在 `localStorage` 的 `frontend-review-data` 键下，结构为 `{ libraries, cards, studyLogs, dailyGoal }`
2. **状态层** (`stores/library.js`)：Pinia Store 封装全部业务方法，对 storage 层的二次封装
3. **视图层** (`views/`)：通过 `useLibraryStore()` 调用 Store 方法

### 卡片评分系统

- `score: 0` 未学习 → `1` 模糊 → `2` 已掌握 → `3` 完全掌握
- 错题本：`score < 2` 的卡片
- 待复习：`score < 2` 且按分数和复习次数排序

### Markdown 解析规则

`mdParser.js` 将 Markdown 按 `数字. 问题内容` 格式拆分为卡片：
- 顶层编号（如 `1. 什么是闭包？`）识别为问题
- 问题后的列表、段落识别为答案
- 代码块会保留在答案中
- 标签通过 `tags.js` 的关键词匹配自动打标

### Vant 组件自动导入

`vite.config.js` 配置了 `unplugin-vue-components` + `VantResolver`，无需手动 import Vant 组件，直接在模板中使用 `<van-xxx>` 即可。JS API（如 `showDialog`）仍需手动 import。

### PWA 配置

- 基础路径：`/Review-Treasure/`
- Service Worker 自动更新
- CDN 资源（jsdelivr）使用 CacheFirst 缓存策略，30 天过期

## 编码约定

- 全部使用 Vue 3 组合式 API + `<script setup>` 语法
- 中文界面，所有 UI 文案使用中文
- 样式使用 `<style scoped>`，全局样式在 `style.css` 和 `App.vue` 中
- 路由使用 `name` 导航，不使用路径字符串
- 路由参数：`libraryId` 和 `cardId` 通过 `params` 传递
- `meta.showTabbar` 控制底部导航栏显示

## 注意事项

- 所有数据仅存 localStorage，清除浏览器数据会丢失全部内容
- 卡片 ID 基于问题文本的哈希值生成（`tags.js` 中的 `generateId`），重复导入同一问题不会产生重复卡片
- 无单元测试，修改后需手动验证功能
