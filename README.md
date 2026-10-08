# JIAYI POWER 企业官网 · 基础版本

本项目是一个多页面企业网站，并包含由文字表单、实时预览与 Pages CMS 组成的统一内容后台：

- `index.html`：沉浸式品牌开场。
- `company.html`：完整企业官网，包含产品、重点项目、研发历程、优势与联系模块。
- `product-detail.html?id=mower`：十一类产品共用的动态详情页，支持主产品与全部型号拖拽立体查看、每款型号独立的概要/参数/应用场景页签、连续大幅型号详情和品类切换。
- `admin.html`：主要后台入口，通过文字表单管理页面、研发、产品、图片与联系方式，右侧网页作为实时预览。
- `manage.html`：便于记忆的后台入口，自动进入 `admin.html`。
- `visual-admin.html`：旧入口兼容页，会自动转到新的文字后台。

## 本地预览

在本目录运行：

```powershell
npm run dev
```

然后打开 `http://127.0.0.1:4173`。本地服务器只监听 `127.0.0.1`；当电脑已登录该仓库的 GitHub 凭据时，后台会显示“GitHub 发布已连接”，“发布修改”会提交内容文件并触发 Cloudflare 部署。直接双击 HTML 只能浏览页面，不能发布。

## 内容管理后台

后台地址为 `/admin.html`。GitHub 仓库中的 `dist/default-content.json` 是唯一内容源：文字后台和 Pages CMS 管理同一份数据，图片可直接上传，右侧预览不承担编辑。提交后由现有 GitHub Actions 自动部署到 Cloudflare Pages。

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
