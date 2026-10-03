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
const parameterMap = extractLiteral("const catalogParameters =", "const managedContent =");

const layoutById = { chainsaw: "wide", pole: "wide", mower: "full" };
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

const products = Object.entries(productMap).map(([id, product], index) => ({
  id,
  order: index,
  year: "2026",
  cardLayout: layoutById[id] || "standard",
  cardLabel: product.category.split(" /")[0],
  ...product,
  series: (product.series || []).map((item) => ({
    ...item,
    parameters: item.parameters || parameterMap[`${item.model}|${item.name}`] || parameterMap[item.model] || [],
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
