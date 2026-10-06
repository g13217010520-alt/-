# JIAYI POWER 企业官网 · 基础版本

本项目是一个多页面企业网站，并包含由可视化编辑器与 Pages CMS 组成的统一内容后台：

- `index.html`：沉浸式品牌开场。
- `company.html`：完整企业官网，包含产品、重点项目、研发历程、优势与联系模块。
- `product-detail.html?id=mower`：十一类产品共用的动态详情页，支持主产品与全部型号拖拽立体查看、每款型号独立的概要/参数/应用场景页签、连续大幅型号详情和品类切换。
- `admin.html`：统一后台入口，自动进入可视化编辑器。
- `visual-admin.html`：直接点击真实网页修改常用内容；复杂产品和媒体管理可一键打开 Pages CMS。

## 本地预览

在本目录运行：

```powershell
npm run dev
```

然后打开 `http://127.0.0.1:4173`。公开页面也可以直接双击 `dist/index.html` 浏览基础效果；后台 API 需要使用 Cloudflare Pages 环境。

## 内容管理后台

后台地址为 `/admin.html`。GitHub 仓库中的 `dist/default-content.json` 是唯一内容源：Pages CMS 直接管理完整数据与媒体，可视化后台通过受保护的 Cloudflare Function 提交同一个文件。提交后由现有 GitHub Actions 自动部署到 Cloudflare Pages。

首次启用所需的 GitHub Token 与后台登录密钥见 [CMS_SETUP.md](CMS_SETUP.md)。旧的 KV/R2 接口仍保留兼容，但公开网站和统一后台不再依赖它们。

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
