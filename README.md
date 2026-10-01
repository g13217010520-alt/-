# JIAYI POWER 企业官网 · 基础版本

本项目是一个无需安装依赖的多页面静态网站：

- `index.html`：沉浸式品牌开场。
- `company.html`：完整企业官网，包含产品、重点项目、研发历程、优势与联系模块。
- `product-detail.html?id=mower`：十一类产品共用的动态详情页，支持主产品与全部型号拖拽立体查看、每款型号独立的概要/参数/应用场景页签、连续大幅型号详情和品类切换。

## 本地预览

在本目录运行：

```powershell
npm run dev
```

然后打开 `http://127.0.0.1:4173`。也可以直接双击 `dist/index.html` 浏览基础效果。

## 后续修改

- 页面文案：`dist/index.html`、`dist/company.html`
- 视觉样式：`dist/styles.css`
- 交互逻辑：`dist/app.js`
- 产品详情与系列数据：`dist/product-detail.js`
- 产品素材：`dist/assets/`

当前产品参数与联系方式整理自《2026 JIAYI CATALOG 嘉易图册》。
