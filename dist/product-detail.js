import { loadSiteContent } from "./content-client.js";

const fallbackProducts = {
  chainsaw: {
    name: "锂电链锯",
    model: "JY-CH1201",
    category: "Cutting System / 切割系统",
    image: "assets/chainsaw.webp",
    summary: "面向庭院修枝与木料切割的 21V 无刷动力方案，兼顾切割效率、快速维护与握持稳定性。",
    featureTitle: "更快调节，更稳定地完成每一次切割。",
    description: "免工具张紧结构缩短维护路径，自动泵油与电子刹车让连续作业更从容。产品可配置 12 英寸与 16 英寸导板，为家用和中强度作业提供灵活选择。",
    specs: [["额定电压", "21V"], ["链速", "10 m/s"], ["导板", "12″ / 16″"], ["有效切割", "280 / 350 mm"], ["电机", "无刷"], ["油壶容量", "120 ml"]],
    uses: ["庭院树枝修整", "木料快速切割", "农场与果园维护"],
    series: [
      { model: "JY-CH1201", name: "12″ / 16″ 无刷链锯", image: "assets/chainsaw.webp", specs: ["21V", "10 m/s", "无刷动力"] },
      { model: "JY-CH0702", name: "8″ 迷你链锯", image: "assets/series/chainsaw-8.webp", specs: ["21V", "9 m/s", "200 mm"] },
      { model: "JY-CH0701", name: "6″ 迷你链锯", image: "assets/series/chainsaw-6-compact.webp", specs: ["21V", "7 m/s", "150 mm"] },
      { model: "JY-CH0602", name: "6″ 迷你链锯", image: "assets/series/chainsaw-6-brushless.webp", specs: ["21V", "6–7 m/s", "双版本可选"] },
      { model: "JY-CH2601 HS", name: "6″ / 8″ 迷你链锯", image: "assets/series/chainsaw-6-classic.webp", specs: ["21V", "7 m/s", "无刷动力"] },
      { model: "JY-CH0403", name: "4″ 迷你链锯", image: "assets/series/chainsaw-4.webp", specs: ["12V", "5 m/s", "100 mm"] },
      { model: "JY-CH0901", name: "10″ 迷你链锯", image: "assets/series/chainsaw-10.webp", specs: ["21V", "12.5 m/s", "210 mm"] },
      { model: "JY-CH0601", name: "6″ 数显迷你链锯", image: "assets/series/chainsaw-6-display.webp", specs: ["21V", "6–7 m/s", "电量显示"] },
      { model: "JY-CH0603", name: "6″ 迷你链锯", image: "assets/series/chainsaw-6-basic.webp", specs: ["21V", "7 m/s", "轻量机身"] },
    ],
  },
  blower: {
    name: "锂电吹风机",
    model: "JY-LB2401",
    category: "Airflow System / 风力系统",
    image: "assets/blower.webp",
    summary: "以高风速与大风量覆盖落叶清理、庭院维护和户外设备除尘。",
    featureTitle: "大风量输出，也能保持无绳机动性。",
    description: "无刷版本最高可达 630 CFM，配合多档调速在续航与清扫效率之间快速切换，适合面积更大的庭院和户外场地。",
    specs: [["额定电压", "21V"], ["电机转速", "32,000 rpm"], ["最高风速", "240 km/h"], ["最大风量", "630 CFM"], ["电机", "无刷"], ["调速", "多档"]],
    uses: ["庭院落叶清扫", "车库与工位除尘", "户外场地维护"],
    series: [
      { model: "JY-LB2201", name: "210 CFM 锂电吹风机", image: "assets/series/blower-210.webp", specs: ["21V", "150 km/h", "210 CFM"] },
      { model: "JY-LB2401", name: "630 CFM 无刷吹风机", image: "assets/series/blower-630.webp", specs: ["21V", "240 km/h", "630 CFM"] },
      { model: "JY-LB2601", name: "迷你锂电吹风机", image: "assets/series/blower-mini.webp", specs: ["21V", "225 km/h", "440 CFM"] },
    ],
  },
  trimmer: {
    name: "割草机系列",
    model: "JY-LM2602",
    category: "Grass Trimming / 割草系统",
    image: "assets/trimmer.webp",
    summary: "轻量化长杆结构配合无刷动力，为草坪边缘、灌木周边与狭窄区域提供灵活修剪。",
    featureTitle: "从边缘到角落，保持顺手的修剪路径。",
    description: "300 mm 切割范围与 2 合 1 配置兼顾效率和通过性；电量显示帮助使用者更直观地安排作业节奏。",
    specs: [["额定电压", "21V"], ["电机转速", "19,500 rpm"], ["切割直径", "300 mm"], ["最大功率", "850 W"], ["电机", "无刷"], ["功能", "2 in 1"]],
    uses: ["草坪边缘整理", "围栏与树木周边修剪", "家庭庭院维护"],
    series: [
      { model: "JY-LM2601", name: "锂电割草机", image: "assets/series/trimmer-lm2601.webp", specs: ["21V", "10,500 rpm", "700 W"] },
      { model: "JY-LM2602", name: "无刷锂电割草机", image: "assets/series/trimmer-lm2602.webp", specs: ["21V", "19,500 rpm", "850 W"] },
      { model: "JY-LM2401", name: "轻量锂电割草机", image: "assets/series/trimmer-lm2401.webp", specs: ["21V", "10,500 rpm", "700 W"] },
      { model: "JY-LM2402", name: "无刷割草机", image: "assets/series/trimmer-lm2402.webp", specs: ["21V", "19,500 rpm", "850 W"] },
    ],
  },
  hedge: {
    name: "绿篱机系列",
    model: "JY-HT SERIES",
    category: "Hedge Trimming / 绿篱系统",
    image: "assets/series/hedge-compact.webp",
    summary: "以紧凑型修剪头与长刀片无刷机型组成独立绿篱产品线，覆盖局部整形、灌木维护与连续绿篱修剪。",
    featureTitle: "从精细整形到长距离修剪，形成完整绿篱解决方案。",
    description: "紧凑型机身适合灌木轮廓和细节修整，20 英寸无刷机型提供更大的作业覆盖。两款产品均采用 21V 锂电平台，兼顾机动性与维护便利。",
    specs: [["额定电压", "21V"], ["产品数量", "2 款"], ["最高冲程", "1,500 SPM"], ["最长刀片", "480 mm"], ["电机", "有刷 / 无刷"], ["应用", "灌木 / 绿篱"]],
    uses: ["庭院绿篱整形", "灌木细节修剪", "连续绿篱维护"],
    series: [
      { model: "JY-HT2401", name: "紧凑型绿篱机", image: "assets/series/hedge-compact.webp", specs: ["21V", "1250 SPM", "130 / 220 mm"], description: "双刀头组合面向灌木轮廓、草边和局部细节修整。短机身便于单手控制，也更容易进入枝叶密集区域。" },
      { model: "JY-HT2601", name: "20″ 锂电绿篱机", image: "assets/series/hedge-20.webp", specs: ["21V", "1500 SPM", "480 mm"], description: "480 mm 长刀片适合连续绿篱的快速整形。环形辅助手柄提供多角度握持，兼顾覆盖效率与操控稳定性。" },
    ],
  },
  mower: {
    name: "智能割草机器人",
    model: "VISUAL + RTK",
    category: "Smart Lawn / 智能草坪",
    image: "assets/mower.webp",
    summary: "视觉识别与 RTK 定位双系统协同，实现无边界割草、区域管理、智能避障和 App 控制。",
    featureTitle: "看见边界，理解环境，自主完成草坪养护。",
    description: "双目视觉识别与厘米级 RTK 定位共同建立工作区域，支持多区域任务规划和七类对象识别。无需铺设传统边界线，降低安装与后期调整成本。",
    specs: [["导航系统", "Visual + RTK"], ["边界方式", "无边界"], ["剪草高度", "25–70 mm"], ["工作速度", "40 × 20 cm/s"], ["续航覆盖", "700㎡ / 4Ah"], ["控制方式", "App / 区域管理"]],
    uses: ["独立住宅草坪", "景观庭院", "多区域草坪管理"],
    series: [
      { model: "VISUAL + RTK", name: "双系统智能割草机器人", image: "assets/mower.webp", specs: ["视觉 + RTK", "25–70 mm", "700㎡ / 4Ah"] },
    ],
  },
  pole: {
    name: "高空作业系列",
    model: "JY-POLE SERIES",
    category: "Elevated Work / 高空作业",
    image: "assets/series/pole-saw.webp",
    summary: "由延长杆、高枝锯和高枝绿篱机组成的 21V 高空维护方案，覆盖树冠修枝与高位绿篱整形。",
    featureTitle: "把地面上的稳定操控，延伸到更高的作业位置。",
    description: "模块化长杆结构降低登高作业频率，可调角度帮助刀头贴合不同枝条和绿篱方向；同一 21V 电池平台让多种高空任务快速切换。",
    specs: [["额定电压", "21V"], ["系列产品", "3 款"], ["最长杆长", "2.5 m"], ["最高链速", "7 m/s"], ["最高功率", "800 W"], ["刀头", "锯链 / 绿篱刀"]],
    uses: ["果树与树冠修枝", "高位绿篱整形", "庭院高空维护"],
    series: [
      { model: "JY-CH0702", name: "延长杆系统", image: "assets/series/pole-extension.webp", specs: ["21V", "7 m/s", "2 / 2.5 m"], description: "可伸缩长杆与角度可调刀头，将迷你链锯的灵活性延伸到树冠位置，适合家庭庭院中的高枝修剪。" },
      { model: "JY-PCH01", name: "锂电高枝锯", image: "assets/series/pole-saw.webp", specs: ["21V", "7 m/s", "20,000 rpm", "800 W", "150 / 200 mm"], description: "高转速电机与 150 / 200 mm 切割配置兼顾通过性和切割效率，可调角度结构让使用者从地面完成不同方向的树枝处理。" },
      { model: "JY-PHT01", name: "锂电高枝绿篱机", image: "assets/series/pole-trimmer.webp", specs: ["21V", "1,500 SPM", "400 mm", "500 W"], description: "400 mm 刀片与多角度刀头适合高位绿篱的顶部和侧面整形，长杆结构扩大作业范围并减少反复移动。" },
    ],
  },
  drill: {
    name: "锂电钻系列",
    model: "JY-ED24 SERIES",
    category: "Cordless Drilling / 锂电钻",
    image: "assets/series/drill-ed2402.png",
    summary: "有刷与无刷双版本覆盖安装、装配和日常维护，让 21V 电池平台延伸至通用工具场景。",
    featureTitle: "从园林维护到安装装配，共用一套无绳动力平台。",
    description: "双速调节覆盖拧紧与钻孔任务，紧凑握持结构便于长时间操作；无刷版本进一步提升扭矩、效率和耐久性。",
    specs: [["额定电压", "21V"], ["系列产品", "2 款"], ["转速", "450 / 1,500 rpm"], ["最大扭矩", "20 / 30 N·m"], ["最大功率", "500 / 700 W"], ["电机", "有刷 / 无刷"]],
    uses: ["设备安装与装配", "庭院设施维护", "家庭日常维修"],
    series: [
      { model: "JY-ED2401", name: "有刷锂电钻", image: "assets/series/drill-ed2401.png", specs: ["21V", "450 / 1,500 rpm", "20 N·m", "500 W"], description: "双速有刷方案满足日常钻孔和紧固需求，结构简洁、使用直观，适合高频基础安装与维修。" },
      { model: "JY-ED2402", name: "无刷锂电钻", image: "assets/series/drill-ed2402.png", specs: ["21V", "450 / 1,500 rpm", "30 N·m", "700 W"], description: "无刷电机将最大扭矩提升至 30 N·m，并以更高效率和更低维护需求应对强度更高的装配任务。" },
    ],
  },
  precision: {
    name: "精细切割工具",
    model: "JY-EC / EP SERIES",
    category: "Precision Cutting / 精细切割",
    image: "assets/series/pruner-ep2501.png",
    summary: "纸板切割机与电动修枝剪组成轻型精细切割组合，覆盖包装材料和园艺枝条处理。",
    featureTitle: "更轻巧的机身，处理更细致的切割任务。",
    description: "两款工具分别针对纸板与园艺枝条设计，强调单手操控、快速响应和便携使用，让精细切割任务更省力。",
    specs: [["系列产品", "2 款"], ["电压平台", "3.6–4.2V / 21V"], ["最高转速", "350 rpm"], ["最大剪切直径", "30 mm"], ["最大功率", "450 W"], ["用途", "纸板 / 园艺枝条"]],
    uses: ["包装纸板与瓦楞材料切割", "果树和灌木枝条修剪", "家庭与轻型专业维护"],
    series: [
      {
        model: "JY-EC2601",
        name: "电动纸板切割机",
        image: "assets/series/cardboard-cutter-ec2601.png",
        specs: ["3.6–4.2V", "2–3A", "350 rpm", "有刷"],
        parameters: [["额定电压", "3.6–4.2V"], ["空载电流", "2–3A"], ["电机转速", "350 rpm"], ["电机类型", "有刷"]],
        applications: ["瓦楞纸板裁切", "包装材料拆解", "轻型手工作业"],
        description: "紧凑式圆刀结构面向纸板与包装材料的连续裁切，机身便于单手握持，可减少传统手工刀具反复用力。",
      },
      {
        model: "JY-EP2501",
        name: "电动修枝剪",
        image: "assets/series/pruner-ep2501.png",
        specs: ["21V", "2.5–3A", "30 mm", "450 W"],
        parameters: [["额定电压", "21V"], ["空载电流", "2.5–3A"], ["最大剪切直径", "30 mm"], ["最大功率", "450 W"], ["动力系统", "无刷"]],
        applications: ["果树枝条修剪", "灌木整形", "庭院绿植维护"],
        description: "30 mm 最大剪切直径配合 21V 锂电平台，适合果树、灌木和庭院枝条的快速修剪，降低重复握剪带来的疲劳。",
      },
    ],
  },
  cultivator: {
    name: "锂电松土机系列",
    model: "JY-TC2501",
    category: "Soil Cultivation / 土壤耕作",
    image: "assets/series/cultivator-brushless.webp",
    summary: "有刷与无刷双版本面向花圃翻土、土壤松动和种植准备，形成独立的锂电耕作系列。",
    featureTitle: "从硬土松动到种植准备，让庭院耕作更轻便。",
    description: "340 rpm 输出配合 160 / 210 mm 耕深配置，在家庭花圃和小型种植区域中兼顾通过性、翻土效率与操控稳定性。",
    specs: [["额定电压", "21V"], ["电机转速", "340 rpm"], ["耕作深度", "160 / 210 mm"], ["耕作宽度", "230 mm"], ["最大功率", "600 / 800 W"], ["电机", "有刷 / 无刷"]],
    uses: ["花圃与菜园松土", "种植前土壤准备", "小型庭院地块维护"],
    series: [
      {
        model: "JY-TC2501",
        name: "锂电松土机（有刷）",
        image: "assets/series/cultivator-brushed.webp",
        specs: ["21V", "340 rpm", "160 × 230 mm", "600 W"],
        parameters: [["额定电压", "21V"], ["电机转速", "340 rpm"], ["耕作深度 × 宽度", "160 × 230 mm"], ["最大功率", "600 W"], ["电机类型", "有刷"]],
        applications: ["花圃表层松土", "小型菜园整地", "种植前土壤翻松"],
        description: "有刷版本以 600 W 最大功率覆盖日常花圃和家庭菜园松土，结构直接、操控轻便，适合常规庭院耕作。",
      },
      {
        model: "JY-TC2501",
        name: "锂电松土机（无刷）",
        image: "assets/series/cultivator-brushless.webp",
        specs: ["21V", "340 rpm", "210 × 230 mm", "800 W"],
        parameters: [["额定电压", "21V"], ["电机转速", "340 rpm"], ["耕作深度 × 宽度", "210 × 230 mm"], ["最大功率", "800 W"], ["电机类型", "无刷"]],
        applications: ["较深土层松动", "菜园与种植区整地", "连续庭院耕作"],
        description: "无刷版本将最大功率提升至 800 W，并提供 210 × 230 mm 耕作范围，适合更深土层和强度更高的连续整地任务。",
      },
    ],
  },
  snow: {
    name: "无刷锂电除雪机",
    model: "JY-SS2601",
    category: "All Season / 全季节工具",
    image: "assets/snow-shovel.webp",
    summary: "40V 无刷动力覆盖门前车道与步道积雪，让锂电平台从绿地延伸至冬季。",
    featureTitle: "更轻便的冬季清理，不再依赖燃油设备。",
    description: "紧凑结构兼顾推行灵活性与抛雪能力，适合住宅周边日常积雪处理；电量显示便于实时掌握剩余作业时间。",
    specs: [["额定电压", "40V"], ["输出转速", "2,600 rpm"], ["除雪深度", "17 cm"], ["除雪宽度", "40 cm"], ["最大功率", "3,400 W"], ["电机", "无刷"]],
    uses: ["住宅车道清雪", "庭院步道维护", "门廊与露台清理"],
    series: [
      { model: "JY-SS2601", name: "40V 无刷除雪机", image: "assets/series/snow-shovel.webp", specs: ["40V", "2,600 rpm", "17 × 40 cm", "3,400 W", "无刷"], parameters: [["额定电压", "40V"], ["输出转速", "2,600 rpm"], ["除雪深度 × 宽度", "17 × 40 cm"], ["最大功率", "3,400 W"], ["电机类型", "无刷"]], applications: ["住宅车道清雪", "庭院步道维护", "门廊与露台清理"] },
    ],
  },
  washer: {
    name: "锂电清洗机",
    model: "JY-WG2601",
    category: "Cleaning System / 清洁系统",
    image: "assets/washer.webp",
    summary: "便携式取水与多档喷型设计，为车辆、庭院家具和户外装备提供随时可用的清洗能力。",
    featureTitle: "摆脱固定水源，把清洁带到需要的地方。",
    description: "无刷电机配合六档喷型，在便携性与清洁力之间取得平衡；数字显示让压力和电量状态更直观。",
    specs: [["额定电压", "21V"], ["电机转速", "24,000 rpm"], ["最大功率", "500 W"], ["最大压力", "4 Bar"], ["电机", "无刷"], ["喷型", "6 in 1"]],
    uses: ["车辆与自行车清洗", "庭院家具维护", "露营与户外装备清洁"],
    series: [
      { model: "JY-WG2201", name: "便携式锂电清洗机", image: "assets/series/washer-wg2201.webp", specs: ["21V", "2 Bar", "5 L/min"] },
      { model: "JY-WG2301", name: "多喷型锂电清洗机", image: "assets/series/washer-wg2301.webp", specs: ["21V", "2 Bar", "5 L/min"] },
      { model: "JY-WG2601", name: "无刷锂电清洗机", image: "assets/series/washer-wg2601.webp", specs: ["21V", "4 Bar", "500 W"] },
    ],
  },
};

const catalogParameters = {
  "JY-CH1201": [["额定电压", "21V"], ["链速", "10 m/s"], ["导板", "12″ / 16″"], ["最大切割直径", "280 / 350 mm"], ["油壶容量", "120 ml"], ["刹车", "电子刹车"], ["电机类型", "无刷"]],
  "JY-CH0701": [["额定电压", "21V"], ["链速", "7 m/s"], ["导板", "6″"], ["最大切割直径", "150 mm"], ["电机类型", "有刷"]],
  "JY-CH0702": [["额定电压", "21V"], ["链速", "9 m/s"], ["导板", "8″"], ["最大切割直径", "200 mm"], ["电机类型", "无刷"]],
  "JY-CH0602": [["额定电压", "21V"], ["链速", "6 / 7 m/s"], ["导板", "6″"], ["最大切割直径", "150 mm"], ["电机类型", "有刷 / 无刷"]],
  "JY-CH2601 HS": [["额定电压", "21V"], ["链速", "7 m/s"], ["导板", "6″ / 8″"], ["最大切割直径", "150 / 200 mm"], ["电机类型", "无刷"]],
  "JY-CH0403": [["额定电压", "12V"], ["链速", "5 m/s"], ["导板", "4″"], ["最大切割直径", "100 mm"], ["电机类型", "有刷"]],
  "JY-CH0901": [["额定电压", "21V"], ["链速", "12.5 m/s"], ["导板", "10″"], ["最大切割直径", "210 mm"], ["电机类型", "无刷"]],
  "JY-CH0601": [["额定电压", "21V"], ["链速", "6 / 7 m/s"], ["导板", "6″"], ["最大切割直径", "150 mm"], ["电机类型", "有刷 / 无刷"]],
  "JY-CH0603": [["额定电压", "21V"], ["链速", "7 m/s"], ["导板", "6″"], ["最大切割直径", "150 mm"], ["电机类型", "有刷"]],
  "JY-LB2201": [["额定电压", "21V"], ["电机转速", "17,000 / 28,000 rpm"], ["最高风速", "130 / 150 km/h"], ["最大风量", "180 / 210 CFM"], ["电机类型", "有刷 / 无刷"]],
  "JY-LB2401": [["额定电压", "21V"], ["电机转速", "28,000 / 32,000 rpm"], ["最高风速", "210 / 240 km/h"], ["最大风量", "550 / 630 CFM"], ["电机类型", "有刷 / 无刷"]],
  "JY-LB2601": [["额定电压", "21V"], ["电机转速", "34,500 / 34,000 rpm"], ["最高风速", "162 / 225 km/h"], ["最大风量", "180 / 440 CFM"], ["电机类型", "有刷 / 无刷"]],
  "JY-HT2401": [["额定电压", "21V"], ["冲程速度", "1,250 SPM"], ["切割宽度", "130 mm"], ["刀片长度", "220 mm"], ["电机类型", "有刷"]],
  "JY-HT2601": [["额定电压", "21V"], ["冲程速度", "1,500 SPM"], ["刀片长度", "480 mm"], ["电机类型", "有刷"]],
  "JY-LM2601": [["额定电压", "21V"], ["电机转速", "10,500 rpm"], ["最大切割直径", "300 mm"], ["最大功率", "700 W"], ["电机类型", "有刷"]],
  "JY-LM2602": [["额定电压", "21V"], ["电机转速", "19,500 rpm"], ["最大切割直径", "300 mm"], ["最大功率", "850 W"], ["电机类型", "无刷"]],
  "JY-LM2401": [["额定电压", "21V"], ["电机转速", "10,500 rpm"], ["最大切割直径", "300 mm"], ["最大功率", "700 W"], ["电机类型", "有刷"]],
  "JY-LM2402": [["额定电压", "21V"], ["电机转速", "19,500 rpm"], ["最大切割直径", "300 mm"], ["最大功率", "850 W"], ["电机类型", "无刷"]],
  "VISUAL + RTK": [["导航系统", "Visual + RTK 双系统"], ["识别能力", "7 类对象识别"], ["边界方式", "无边界 / 无需 RTK 配件"], ["剪草高度", "25–70 mm"], ["作业效率", "40 × 20 cm/s"], ["续航覆盖", "700㎡ / 4Ah"], ["控制方式", "App / 区域管理"]],
  "JY-CH0702|延长杆系统": [["额定电压", "21V"], ["链速", "7 m/s"], ["电机转速", "20,000 rpm"], ["最大功率", "800 W"], ["杆长", "2 / 2.5 m"]],
  "JY-PCH01": [["额定电压", "21V"], ["最大切割直径", "150 / 200 mm"], ["电机转速", "20,000 rpm"], ["链速", "7 m/s"], ["最大功率", "800 W"]],
  "JY-PHT01": [["额定电压", "21V"], ["冲程速度", "1,500 SPM"], ["最大切割直径", "400 mm"], ["最大功率", "500 W"]],
  "JY-ED2401": [["额定电压", "21V"], ["电机转速", "450 / 1,500 rpm"], ["最大扭矩", "20 N·m"], ["最大功率", "500 W"], ["电机类型", "有刷"]],
  "JY-ED2402": [["额定电压", "21V"], ["电机转速", "450 / 1,500 rpm"], ["最大扭矩", "30 N·m"], ["最大功率", "700 W"], ["电机类型", "无刷"]],
  "JY-EC2601": [["额定电压", "3.6–4.2V"], ["空载电流", "2–3A"], ["电机转速", "350 rpm"], ["电机类型", "有刷"]],
  "JY-EP2501": [["额定电压", "21V"], ["空载电流", "2.5–3A"], ["最大剪切直径", "30 mm"], ["最大功率", "450 W"]],
  "JY-TC2501|锂电松土机（有刷）": [["额定电压", "21V"], ["电机转速", "340 rpm"], ["耕作深度 × 宽度", "160 × 230 mm"], ["最大功率", "600 W"], ["电机类型", "有刷"]],
  "JY-TC2501|锂电松土机（无刷）": [["额定电压", "21V"], ["电机转速", "340 rpm"], ["耕作深度 × 宽度", "210 × 230 mm"], ["最大功率", "800 W"], ["电机类型", "无刷"]],
  "JY-SS2601": [["额定电压", "40V"], ["电机转速", "2,600 rpm"], ["除雪深度 × 宽度", "17 × 40 cm"], ["最大功率", "3,400 W"], ["电机类型", "无刷"]],
  "JY-WG2201": [["额定电压", "21V"], ["电机转速", "20,000 rpm"], ["最大压力", "2 Bar"], ["喷射范围", "20 m / 2 m（高位）"], ["最大流量", "5 L/min"], ["电机类型", "有刷"]],
  "JY-WG2301": [["额定电压", "21V"], ["电机转速", "20,000 rpm"], ["最大压力", "2 Bar"], ["喷射范围", "20 m / 2 m（高位）"], ["最大流量", "5 L/min"], ["电机类型", "有刷"]],
  "JY-WG2601": [["额定电压", "21V"], ["电机转速", "24,000 rpm"], ["最大功率", "500 W"], ["最大压力", "4 Bar"], ["电机类型", "无刷"]],
};

const managedContent = await loadSiteContent();
const managedContact = managedContent.contact || {};
const managedProducts = Array.isArray(managedContent.products) ? managedContent.products : [];
const products = managedProducts.length
  ? Object.fromEntries(managedProducts.map((item) => [item.id, {
      name: "未命名产品",
      model: "JIAYI",
      category: "JIAYI POWER / 产品",
      image: "assets/jiayi-logo.svg",
      summary: "",
      featureTitle: item.name || "JIAYI POWER",
      description: "",
      specs: [],
      uses: [],
      series: [],
      ...(fallbackProducts[item.id] || {}),
      ...item,
    }]))
  : fallbackProducts;

const requestedProductId = new URLSearchParams(window.location.search).get("id") || "mower";
const defaultProductId = products.mower ? "mower" : Object.keys(products)[0];
const productId = products[requestedProductId] ? requestedProductId : defaultProductId;
const product = products[productId];

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
};

setText("[data-product-name]", product.name);
setText("[data-product-model]", product.model);
setText("[data-product-category]", `${product.category}${product.year ? ` · ${product.year}` : ""}`);
setText("[data-product-summary]", product.summary);
document.title = `${product.name} · JIAYI POWER`;

const contactLink = document.querySelector("[data-product-contact]");
if (contactLink && managedContact.email) contactLink.href = `mailto:${managedContact.email}?subject=${encodeURIComponent(`JIAYI POWER ${product.name} Product Inquiry`)}`;
const footerEmail = document.querySelector("[data-product-footer-email]");
if (footerEmail && managedContact.email) { footerEmail.textContent = managedContact.email; footerEmail.href = `mailto:${managedContact.email}`; }

const productImage = document.querySelector("[data-product-image]");
if (productImage) {
  productImage.src = product.image;
  productImage.alt = `${product.name}交互式立体展示`;
}

setText("[data-series-name]", product.name);
setText("[data-series-summary]", `共收录 ${product.series.length} 款${product.name}型号。每款产品均提供产品概要、核心参数与应用场景，可切换查看并拖拽观察。`);

const parameterLabels = {
  chainsaw: ["额定电压", "链速", "导板 / 有效切割", "动力 / 功能"],
  blower: ["额定电压", "最高风速", "最大风量", "动力 / 功能"],
  trimmer: ["额定电压", "电机转速", "最大功率", "切割配置"],
  hedge: ["额定电压", "冲程速度", "刀片 / 剪切范围", "动力 / 功能"],
  mower: ["导航系统", "剪草高度", "覆盖面积", "控制方式"],
  pole: ["额定电压", "链速 / 冲程", "杆长 / 刀片", "最大功率", "切割范围"],
  drill: ["额定电压", "空载转速", "最大扭矩", "最大功率", "电机类型"],
  precision: ["额定电压", "空载电流", "转速 / 剪切直径", "最大功率"],
  cultivator: ["额定电压", "电机转速", "耕作范围", "最大功率", "电机类型"],
  snow: ["额定电压", "输出转速", "除雪范围", "最大功率", "电机类型"],
  washer: ["额定电压", "最大压力", "最大流量 / 功率", "动力 / 喷型"],
};

const inferParameterLabel = (value, index) => {
  if (/无刷|有刷|电量|轻量|版本|功能|显示|in 1/i.test(value)) return "动力 / 配置";
  if (/RTK|视觉/.test(value)) return "导航系统";
  if (/^\d+(?:\.\d+)?V$/i.test(value)) return "额定电压";
  if (/km\/h/i.test(value)) return "最高风速";
  if (/CFM/i.test(value)) return "最大风量";
  if (/m\/s/i.test(value)) return "链速";
  if (/SPM/i.test(value)) return "冲程速度";
  if (/rpm/i.test(value)) return "电机转速";
  if (/N[·.]?m/i.test(value)) return "最大扭矩";
  if (/\bW\b/i.test(value)) return "最大功率";
  if (/Bar/i.test(value)) return "最大压力";
  if (/L\/min/i.test(value)) return "最大流量";
  if (/㎡/.test(value)) return "续航覆盖";
  if (/mm|cm|″/.test(value)) return productId === "pole" ? "杆长 / 刀片范围" : productId === "mower" ? "剪草高度" : "切割 / 作业范围";
  return parameterLabels[productId]?.[index] || `核心参数 ${index + 1}`;
};

const normalizeParameter = (entry) => Array.isArray(entry)
  ? { label: entry[0] || "", value: entry[1] || "" }
  : { label: entry?.label || "", value: entry?.value || "" };
const getParameters = (item) => {
  const source = item.parameters?.length
    ? item.parameters
    : catalogParameters[`${item.model}|${item.name}`] || catalogParameters[item.model] || (item.specs || []).map((value, index) => [inferParameterLabel(value, index), value]);
  return source.map(normalizeParameter);
};
const getApplications = (item) => item.applications || product.uses;

const seriesGrid = document.querySelector("[data-series-grid]");
if (seriesGrid) {
  seriesGrid.innerHTML = product.series.map((item, index) => {
    const description = item.description || `${item.name}围绕${product.uses?.[0] || "真实作业"}等场景开发，以 ${(item.specs || []).join("、")} 为核心配置，在动力输出、操控与维护效率之间取得平衡。`;
    const parameters = getParameters(item);
    const applications = getApplications(item);
    const slug = `${item.model}-${index + 1}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `
      <article class="series-detail${index % 2 ? " series-detail--reverse" : ""}" id="model-${slug}">
        <div class="series-detail__copy">
          <span class="series-detail__index">${String(index + 1).padStart(2, "0")}</span>
          <p class="series-detail__model">${item.model}</p>
          <h3>${item.name}</h3>
          <div class="model-tabs" data-model-tabs>
            <div class="model-tabs__controls" role="tablist" aria-label="${item.model} 产品信息">
              <button type="button" role="tab" id="tab-${slug}-overview" aria-controls="panel-${slug}-overview" aria-selected="true" data-model-tab="overview">产品概要</button>
              <button type="button" role="tab" id="tab-${slug}-specs" aria-controls="panel-${slug}-specs" aria-selected="false" data-model-tab="specs" tabindex="-1">核心参数</button>
              <button type="button" role="tab" id="tab-${slug}-use" aria-controls="panel-${slug}-use" aria-selected="false" data-model-tab="use" tabindex="-1">应用场景</button>
            </div>
            <div class="model-tabs__panels">
              <div class="model-tab-panel is-active" id="panel-${slug}-overview" role="tabpanel" aria-labelledby="tab-${slug}-overview" data-model-panel="overview">
                <p class="series-detail__description">${description}</p>
              </div>
              <div class="model-tab-panel" id="panel-${slug}-specs" role="tabpanel" aria-labelledby="tab-${slug}-specs" data-model-panel="specs" hidden>
                <dl class="model-spec-table">${parameters.map(({ label, value }) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
              </div>
              <div class="model-tab-panel" id="panel-${slug}-use" role="tabpanel" aria-labelledby="tab-${slug}-use" data-model-panel="use" hidden>
                <ul class="model-use-list">${applications.map((use, useIndex) => `<li><span>${String(useIndex + 1).padStart(2, "0")}</span>${use}</li>`).join("")}</ul>
              </div>
            </div>
          </div>
        </div>
        <div class="series-detail__viewer" tabindex="0" role="application" aria-label="可拖拽观察 ${item.model} ${item.name}" data-series-viewer>
          <div class="series-detail__toolbar"><span><i></i> Interactive View</span><small>拖拽 / 方向键</small></div>
          <div class="series-detail__grid" aria-hidden="true"></div>
          <div class="series-detail__orbit" aria-hidden="true"></div>
          <div class="series-detail__object" data-series-object>
            <span class="series-detail__shadow" aria-hidden="true"></span>
            <img src="${item.image}" alt="${item.model} ${item.name}" loading="lazy" draggable="false" />
          </div>
        </div>
      </article>
    `;
  }).join("");
}

const switcher = document.querySelector("[data-product-switcher]");
if (switcher) {
  switcher.innerHTML = Object.entries(products).map(([id, item]) => `
    <a class="switcher-card${id === productId ? " is-current" : ""}" href="product-detail.html?id=${id}" ${id === productId ? 'aria-current="page"' : ""}>
      <span>${item.category.split(" /")[0]}</span>
      <img src="${item.image}" alt="" loading="lazy" />
      <strong>${item.name}</strong>
      <small>${item.model}</small>
    </a>
  `).join("");
}

document.querySelectorAll("[data-model-tabs]").forEach((group) => {
  const tabs = [...group.querySelectorAll("[data-model-tab]")];
  const panels = [...group.querySelectorAll("[data-model-panel]")];

  const activate = (tab) => {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const selected = panel.dataset.modelPanel === tab.dataset.modelTab;
      panel.hidden = !selected;
      panel.classList.toggle("is-active", selected);
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      activate(tabs[nextIndex]);
    });
  });
});

const viewer = document.querySelector("[data-viewer]");
const viewerObject = document.querySelector("[data-viewer-object]");
const viewerGlare = document.querySelector("[data-viewer-glare]");

if (viewer && viewerObject) {
  let rotateX = -5;
  let rotateY = -10;
  let startX = 0;
  let startY = 0;
  let startRotateX = rotateX;
  let startRotateY = rotateY;
  let dragging = false;

  const render = () => {
    viewerObject.style.setProperty("--rotate-x", `${rotateX}deg`);
    viewerObject.style.setProperty("--rotate-y", `${rotateY}deg`);
    if (viewerGlare) {
      viewerGlare.style.setProperty("--glare-x", `${50 + rotateY * 1.2}%`);
      viewerGlare.style.setProperty("--glare-y", `${45 - rotateX * 1.2}%`);
    }
  };

  const reset = () => {
    rotateX = -5;
    rotateY = -10;
    viewerObject.classList.remove("is-dragging");
    render();
  };

  viewer.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startRotateX = rotateX;
    startRotateY = rotateY;
    viewerObject.classList.add("is-dragging");
    viewer.setPointerCapture(event.pointerId);
  });
  viewer.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    rotateY = Math.max(-32, Math.min(32, startRotateY + (event.clientX - startX) * 0.13));
    rotateX = Math.max(-20, Math.min(20, startRotateX - (event.clientY - startY) * 0.1));
    render();
  });
  const stopDragging = (event) => {
    dragging = false;
    viewerObject.classList.remove("is-dragging");
    if (viewer.hasPointerCapture?.(event.pointerId)) viewer.releasePointerCapture(event.pointerId);
  };
  viewer.addEventListener("pointerup", stopDragging);
  viewer.addEventListener("pointercancel", stopDragging);
  viewer.addEventListener("dblclick", reset);
  document.querySelector("[data-viewer-reset]")?.addEventListener("click", reset);
  viewer.querySelector(".viewer-stage")?.addEventListener("keydown", (event) => {
    const delta = event.shiftKey ? 6 : 3;
    if (event.key === "ArrowLeft") rotateY -= delta;
    else if (event.key === "ArrowRight") rotateY += delta;
    else if (event.key === "ArrowUp") rotateX -= delta;
    else if (event.key === "ArrowDown") rotateX += delta;
    else return;
    event.preventDefault();
    rotateX = Math.max(-20, Math.min(20, rotateX));
    rotateY = Math.max(-32, Math.min(32, rotateY));
    render();
  });
  render();
}

document.querySelectorAll("[data-series-viewer]").forEach((seriesViewer) => {
  const object = seriesViewer.querySelector("[data-series-object]");
  if (!object) return;
  let rotateX = -4;
  let rotateY = -8;
  let startX = 0;
  let startY = 0;
  let startRotateX = rotateX;
  let startRotateY = rotateY;
  let dragging = false;

  const render = () => {
    object.style.setProperty("--series-rx", `${rotateX}deg`);
    object.style.setProperty("--series-ry", `${rotateY}deg`);
  };
  seriesViewer.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startRotateX = rotateX;
    startRotateY = rotateY;
    object.classList.add("is-dragging");
    seriesViewer.setPointerCapture(event.pointerId);
  });
  seriesViewer.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    rotateY = Math.max(-28, Math.min(28, startRotateY + (event.clientX - startX) * 0.11));
    rotateX = Math.max(-16, Math.min(16, startRotateX - (event.clientY - startY) * 0.08));
    render();
  });
  const stop = (event) => {
    dragging = false;
    object.classList.remove("is-dragging");
    if (seriesViewer.hasPointerCapture?.(event.pointerId)) seriesViewer.releasePointerCapture(event.pointerId);
  };
  seriesViewer.addEventListener("pointerup", stop);
  seriesViewer.addEventListener("pointercancel", stop);
  seriesViewer.addEventListener("dblclick", () => {
    rotateX = -4;
    rotateY = -8;
    render();
  });
  seriesViewer.addEventListener("keydown", (event) => {
    const delta = event.shiftKey ? 6 : 3;
    if (event.key === "ArrowLeft") rotateY -= delta;
    else if (event.key === "ArrowRight") rotateY += delta;
    else if (event.key === "ArrowUp") rotateX -= delta;
    else if (event.key === "ArrowDown") rotateX += delta;
    else return;
    event.preventDefault();
    rotateX = Math.max(-16, Math.min(16, rotateX));
    rotateY = Math.max(-28, Math.min(28, rotateY));
    render();
  });
  render();
});

if (window.location.hash) {
  const hashId = decodeURIComponent(window.location.hash.slice(1));
  requestAnimationFrame(() => document.getElementById(hashId)?.scrollIntoView());
}
