# 嘉易网站后台：Pages CMS 使用说明

后台入口：`https://app.pagescms.org/`

本项目使用开源的 Pages CMS 直接管理 GitHub 仓库中的内容，不需要 Cloudflare KV、R2、数据库或额外服务器。后台保存后会提交到 GitHub 的 `main` 分支，并由现有 GitHub Actions 自动发布到 Cloudflare Pages。

## 一次性授权

1. 打开 `https://app.pagescms.org/`。
2. 点击使用 GitHub 登录，登录当前网站仓库所属的 GitHub 账号。
3. 安装 Pages CMS GitHub App。
4. 授权时选择 **Only select repositories（仅选择指定仓库）**。
5. 只勾选 `g13217010520-alt/-` 仓库并确认安装。
6. 返回 Pages CMS，选择该仓库和 `main` 分支。
7. 页面会自动读取仓库根目录的 `.pages.yml`，显示“嘉易官网内容”。

公开网站的 `/admin` 和 `/admin.html` 入口会自动跳转到 Pages CMS。

## 日常编辑

打开“嘉易官网内容”后，可以管理：

- 产品：新增、删除、拖动排序；修改标题、年份、分类、文案、参数、应用场景、产品概要和具体型号。
- 精选产品：在“精选产品”中填写产品 ID，并拖动调整展示顺序。
- 企业影像：在四个栏目中新增、删除、替换或排序图片和视频。
- 联系方式：修改邮箱、电话、WhatsApp、地址、微信入口、视频号入口和二维码。
- 图片与视频：通过“网站图片与视频”媒体库查看、替换或上传，文件保存在 `dist/assets/`；建议把新文件放到 `uploads/` 子目录。

编辑完成后点击保存。Pages CMS 会提交 GitHub，随后 GitHub Actions 自动部署。通常等待约 1–3 分钟，再刷新网站即可看到更新。

## 注意事项

- 图片建议使用 WebP 或压缩后的 JPG/PNG。
- 单个视频不建议超过 50 MB；GitHub 单文件硬限制为 100 MB。较大的视频建议上传到视频平台，再在网站中填写链接。
- 产品 ID 只使用小写英文字母、数字和连字符，并且创建后不要随意修改。
- 精选产品中的 ID 必须与产品列表里的产品 ID 完全一致。
- 如果保存后网站没有更新，到 GitHub 仓库的 **Actions** 页面检查部署任务是否成功。

## 不再需要的 Cloudflare 配置

Pages CMS 方案不依赖 `CMS_CONTENT`、`CMS_MEDIA`、`CMS_ADMIN_PASSWORD` 或 `CMS_SESSION_SECRET`。已有的 KV 命名空间可以保留，也可以以后在确认新后台运行稳定后删除。
