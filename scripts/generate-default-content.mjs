import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const source = await readFile(resolve(root, "dist/product-detail.js"), "utf8");

const extractLiteral = (startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Unable to extract ${startMarker}`);
  const literal = source.slice(start + startMarker.length, end).trim().replace(/;$/, "");
  return Function(`"use strict"; return (${literal});`)();
};

const productMap = extractLiteral("const fallbackProducts =", "const catalogParameters =");
const parameterMap = extractLiteral("const catalogParameters =", "const visualPreview =");

const layoutById = { chainsaw: "wide", pole: "wide", mower: "full" };
const toKeyValueList = (items = []) => items.map((item) => Array.isArray(item)
  ? { label: item[0] || "", value: item[1] || "" }
  : item);
const featuredById = {
  mower: {
    image: "assets/mower-scene-clean.png",
    meta: "Visual + RTK",
    kicker: "无边界 · 区域管理 · App 控制",
    headline: "看见边界，自主完成草坪养护。",
    features: ["厘米级定位", "智能避障", "边界识别"],
  },
  chainsaw: {
    image: "assets/chainsaw-scene.webp",
    meta: "JY-CH1201",
    kicker: "10 m/s · 12″ / 16″",
    headline: "快速调链，稳定切割。",
    features: [],
  },
  snow: {
    image: "assets/snow-scene-original.png",
    meta: "40V · 3400W",
    kicker: "17 × 40 cm 除雪范围",
    headline: "从绿地，工作到雪季。",
    features: [],
  },
};

const productEntries = Object.entries(productMap);
const productOrder = new Map(productEntries.map(([id], index) => [id, index]));
const displayOrder = ["chainsaw", "blower", "trimmer", "hedge", "drill", "pole", "precision", "cultivator", "snow", "washer", "mower"];
const products = displayOrder
  .map((id) => [id, productMap[id]])
  .filter(([, product]) => product)
  .map(([id, product]) => ({
  id,
  order: productOrder.get(id),
  year: "2026",
  cardLayout: layoutById[id] || "standard",
  cardLabel: product.category.split(" /")[0],
  ...product,
  specs: toKeyValueList(product.specs),
  series: (product.series || []).map((item) => ({
    ...item,
    description: item.description || `${item.name || "该型号"}围绕${product.uses?.[0] || "真实作业"}等场景开发，以 ${(item.specs || []).join("、")} 为核心配置，在动力输出、操控与维护效率之间取得平衡。`,
    parameters: toKeyValueList(item.parameters || parameterMap[`${item.model}|${item.name}`] || parameterMap[item.model] || []),
    applications: item.applications || product.uses || [],
  })),
  featured: featuredById[id] || null,
  }));

const makeGallery = (directory, prefix, indices, portrait = []) => indices.map((number) => ({
  id: `${prefix}-${String(number).padStart(2, "0")}`,
  type: "image",
  url: `assets/about-gallery-v1/${directory}/${prefix}-${String(number).padStart(2, "0")}.jpg`,
  alt: `${prefix === "exhibition" ? "展会现场" : prefix === "factory" ? "工厂与设备" : prefix === "meeting" ? "团队会议" : "研发日常"} ${String(number).padStart(2, "0")}`,
  orientation: portrait.includes(number) ? "portrait" : "landscape",
}));

const factoryIndices = [...Array.from({ length: 41 }, (_, index) => index + 1), 50, 51, 52];
const factoryPortrait = [3, 10, 11, 12, 13, 26, 27, 29, 30, 31, 33, 34, 35, 37, 41];

const content = {
  version: 1,
  intro: {
    topMeta: "2026 / Outdoor Power Tools",
    eyebrow: "One platform. More possibilities.",
    title: "动力，藏于",
    accentTitle: "每一次生长",
    lead: "园林锂电工具研发与制造，让稳定动力贯穿修剪、清洁、耕作与智能养护。",
    buttonLabel: "进入嘉易动力",
    footerLocation: "Yongkang · Zhejiang · China",
    scrollLabel: "Click to explore",
    backgroundImage: "assets/intro-cover.webp",
  },
  page: {
    heroTitle: "把更稳定的动力，",
    heroAccent: "交给每一片生长",
    heroIntro: "嘉易动力专注园林锂电工具的研发与制造，从结构设计、动力匹配到规模交付，为全球品牌提供可持续扩展的产品解决方案。",
    aboutTitle: "不只是制造，",
    aboutAccent: "更是共同开发",
    aboutStatement: "永康市嘉易工贸有限公司立足浙江永康，定位为全球标杆品牌的“隐形动力专家”与共同开发伙伴。",
    rdKicker: "R&D Power / 研发能力",
    rdTitle: "把每一次结构判断，\n落实为可靠产品。",
    rdBody1: "研发流程贯穿产品设计、结构优化，以及电机、控制器与金属件的反复匹配，从性能、外观到使用体验持续迭代。",
    rdBody2: "团队以机械设计、三维造型和园林工具应用为核心能力，把真实作业中的问题转化为更可靠、更实用的产品方案。",
    rdImage1: "assets/series/rd-lab.webp",
    rdImage2: "assets/series/rd-office.webp",
    rdImage3: "assets/series/rd-team.webp",
  },
  products,
  featuredProductIds: ["mower", "chainsaw", "snow"],
  galleries: {
    exhibition: { title: "展会现场", mode: "accordion", items: makeGallery("exhibition", "exhibition", Array.from({ length: 10 }, (_, index) => index + 1)) },
    factory: { title: "工厂与设备", mode: "depth", items: makeGallery("factory", "factory", factoryIndices, factoryPortrait) },
    meeting: { title: "团队会议", mode: "grid", items: makeGallery("meeting", "meeting", [1]) },
    rd: { title: "研发日常", mode: "grid", items: makeGallery("rd", "rd", [1, 2, 3]) },
  },
  contact: {
    eyebrowLeft: "Let’s build the next tool.",
    eyebrowRight: "全球合作 / OEM · ODM",
    title: "下一款工具，",
    accentTitle: "从一次对话开始。",
    email: "sales@jiayipower.com",
    secondaryEmail: "jiayilithiumpowertools@outlook.com",
    phone: "+86 137 7306 1153",
    whatsapp: "8613773061153",
    address: "Yongkang, Zhejiang, China",
    streetAddress: "浙江省永康市玉桂路 21 号",
    website: "www.jiayipower.com",
    wechatLabel: "微信联系",
    wechatUrl: "wechat-contact.html",
    videoLabel: "官方视频号",
    videoUrl: "official-video.html",
    officialAccounts: [
      { name: "官方账号 01", description: "Official Channel", image: "" },
      { name: "官方账号 02", description: "Official Channel", image: "" },
      { name: "官方账号 03", description: "Official Channel", image: "" },
    ],
  },
};

await writeFile(resolve(root, "dist/default-content.json"), `${JSON.stringify(content, null, 2)}\n`);
console.log(`Generated default CMS content with ${products.length} products and ${factoryIndices.length + 14} gallery items.`);
