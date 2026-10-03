# JIAYI POWER 企业官网 · 基础版本

本项目是一个多页面企业网站，并包含基于 Cloudflare Pages Functions、KV 与 R2 的内容管理后台：

- `index.html`：沉浸式品牌开场。
- `company.html`：完整企业官网，包含产品、重点项目、研发历程、优势与联系模块。
- `product-detail.html?id=mower`：十一类产品共用的动态详情页，支持主产品与全部型号拖拽立体查看、每款型号独立的概要/参数/应用场景页签、连续大幅型号详情和品类切换。
- `admin.html`：需要登录的内容管理后台，可管理产品、型号、排序、精选内容、照片、视频和联系方式。

## 本地预览

在本目录运行：

```powershell
npm run dev
```

然后打开 `http://127.0.0.1:4173`。公开页面也可以直接双击 `dist/index.html` 浏览基础效果；后台 API 需要使用 Cloudflare Pages 环境。

## 内容管理后台

后台地址为 `/admin.html`。结构化内容保存在 Cloudflare KV，上传的照片与视频保存在 R2，公开网站会自动读取已发布的后台数据；未配置或暂时不可用时会回退到 `dist/default-content.json`，避免影响页面访问。

首次启用所需的绑定、加密变量和初始化步骤见 [CMS_SETUP.md](CMS_SETUP.md)。

## 开发与检查

- 后台日常编辑：打开 `/admin.html`
- 内置初始内容：`dist/default-content.json`
- 页面结构：`dist/index.html`、`dist/company.html`
- 视觉样式：`dist/styles.css`
- 交互逻辑：`dist/app.js`
- 产品详情与系列数据：`dist/product-detail.js`
- 产品素材：`dist/assets/`

运行以下命令可重新生成内置内容并检查后台接口：

```powershell
npm run cms:defaults
npm run cms:test
npm run check
```

当前产品参数与联系方式整理自《2026 JIAYI CATALOG 嘉易图册》。
