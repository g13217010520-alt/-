# 嘉易网站统一后台：可视化编辑 + Pages CMS

统一入口：`https://jiayipower.com/admin.html`

本项目使用一个统一内容源：GitHub 仓库中的 `dist/default-content.json`。可视化后台负责直接点击网页修改首屏、产品详情、具体型号、参数和企业影像；Pages CMS 负责新增产品、媒体上传和批量管理。两边保存后都会提交到 GitHub 的 `main` 分支，并由现有 GitHub Actions 自动发布到 Cloudflare Pages。

## 后台模式

- 可视化编辑：打开 `/admin.html`，修改入口首屏、企业主页、产品卡片与详情、具体型号参数、企业影像和联系方式。
- 高级内容管理：在可视化后台点击“高级管理”，或直接打开 `https://app.pagescms.org/g13217010520-alt/-/main/file/website_content`。

## 可视化后台一次性配置

在 Cloudflare Pages 项目的环境变量中配置：

- `CMS_ADMIN_PASSWORD`：后台登录密码。
- `CMS_SESSION_SECRET`：不少于 32 个字符的随机字符串。
- `GITHUB_CONTENT_TOKEN`：GitHub Fine-grained personal access token，只授权 `g13217010520-alt/-` 仓库的 Contents Read and write 权限。

可选配置（默认值已经对应当前仓库）：

- `GITHUB_CONTENT_REPO=g13217010520-alt/-`
- `GITHUB_CONTENT_BRANCH=main`
- `GITHUB_CONTENT_PATH=dist/default-content.json`

Token 只保存在 Cloudflare 服务端，不会发送到浏览器。保存时会携带 GitHub 文件 SHA；如果 Pages CMS 或其他用户已经更新过文件，可视化后台会拒绝覆盖并提示刷新。

## Pages CMS 一次性授权

1. 打开 `https://app.pagescms.org/`。
2. 点击使用 GitHub 登录，登录当前网站仓库所属的 GitHub 账号。
3. 安装 Pages CMS GitHub App。
4. 授权时选择 **Only select repositories（仅选择指定仓库）**。
5. 只勾选 `g13217010520-alt/-` 仓库并确认安装。
6. 返回 Pages CMS，选择该仓库和 `main` 分支。
7. 页面会自动读取仓库根目录的 `.pages.yml`，显示“嘉易官网内容”。

公开网站的 `/admin` 和 `/admin.html` 入口会进入统一可视化后台；右下角“高级管理”打开 Pages CMS。

## 日常编辑

在可视化后台中可直接点击网页区域进行编辑；产品卡片会进入详情页，点击具体型号可修改参数和应用场景，点击影像分类可增加、删除、替换或排序图片。打开 Pages CMS 的“嘉易官网内容”后，还可以管理：

- 产品：新增、删除、拖动排序；修改标题、年份、分类、文案、参数、应用场景、产品概要和具体型号。
- 精选产品：在“精选产品”中填写产品 ID，并拖动调整展示顺序。
- 企业影像：在四个栏目中新增、删除、替换或排序图片和视频。
- 联系方式：修改邮箱、电话、WhatsApp、地址、微信入口、视频号入口和二维码。
- 图片与视频：通过“网站图片与视频”媒体库查看、替换或上传，文件保存在 `dist/assets/`；建议把新文件放到 `uploads/` 子目录。

任一后台保存后都会提交 GitHub，随后 GitHub Actions 自动部署。通常等待约 1–3 分钟，再刷新网站即可看到更新。

## 注意事项

- 图片建议使用 WebP 或压缩后的 JPG/PNG。
- 单个视频不建议超过 50 MB；GitHub 单文件硬限制为 100 MB。较大的视频建议上传到视频平台，再在网站中填写链接。
- 产品 ID 只使用小写英文字母、数字和连字符，并且创建后不要随意修改。
- 精选产品中的 ID 必须与产品列表里的产品 ID 完全一致。
- 如果保存后网站没有更新，到 GitHub 仓库的 **Actions** 页面检查部署任务是否成功。

## 不再需要的 Cloudflare 存储

统一方案不依赖 `CMS_CONTENT` KV 或 `CMS_MEDIA` R2。已有绑定可以暂时保留，确认 GitHub 保存与 Pages CMS 均稳定后再删除。可视化后台仍使用 `CMS_ADMIN_PASSWORD` 和 `CMS_SESSION_SECRET` 保护 GitHub 写入接口。
