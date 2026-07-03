export const scenes = [
  {
    id: "entrance",
    eyebrow: "玄关",
    title: "湿伞与爪印",
    body: "你推开门，雨声被留在身后。门垫上有一串湿漉漉的小爪印，摸鱼把一张卡片压在伞柄下。",
    puzzlePrompt: "先看哪一个线索？",
    choices: [
      {
        id: "umbrella-charm",
        label: "看伞架里的油纸伞",
        detail: "伞柄内侧刻着一个很小的日期，像是某次一起淋雨回家的晚上。",
        weights: { oldMemory: 2 },
      },
      {
        id: "paw-prints",
        label: "看门垫上的湿爪印",
        detail: "爪印停在门垫边缘，没有去远处，像是在等你跟上。",
        weights: { companionship: 2 },
      },
      {
        id: "rain-card",
        label: "看木门上的铜环",
        detail: "铜环被雨气润得发亮，轻轻一碰，门后那条路像是更远了一点。",
        weights: { future: 2 },
      },
    ],
    completionText:
      "雨从门外退了一步，铜环轻轻晃着，像把两个很浅的痕迹留在门边：一个圆，一个七字折角。摸鱼轻轻叫了一声，先带你走向雨里的庭院。",
    finalPreference: "companionship",
    hints: [
      "摸鱼低头闻了闻门垫。",
      "摸鱼在伞架、门垫和铜环之间来回看。",
      "先点一个玄关里具体的物件，就能继续往里走。",
    ],
  },
  {
    id: "living-room",
    eyebrow: "客厅",
    title: "暖灯与影子",
    body: "客厅只亮着一盏暖灯。照片、抱枕和摸鱼的小窝都被摆成了奇怪的角度，墙上影子像一句还没拼好的话。",
    puzzlePrompt: "你想调整哪件东西？",
    choices: [
      {
        id: "photo-frame",
        label: "看柜上的相框",
        detail: "照片里的你们靠得很近，背后也是一场雨。",
        weights: { oldMemory: 2 },
      },
      {
        id: "moyu-bed",
        label: "看摸鱼的小窝",
        detail: "小窝下面露出一张纸：普通的日子，也想和你一起慢慢过。",
        weights: { companionship: 3 },
      },
      {
        id: "lamp-direction",
        label: "看桌边的暖灯",
        detail: "灯影在墙上连成一条路，指向窗外的庭院。",
        weights: { future: 1, companionship: 1 },
      },
    ],
    completionText:
      "小窝边的纸角露出半行旧字，前面像五月的开头，后面被暖灯照得很轻。影子终于拼成一句悄悄话。",
    finalPreference: "companionship",
    hints: [
      "摸鱼趴到自己的小窝边。",
      "摸鱼在相框、小窝和暖灯之间慢慢转了一圈。",
      "客厅里可疑的是三件具体物品：相框、小窝、暖灯。",
    ],
  },
  {
    id: "window",
    eyebrow: "窗边",
    title: "雨痕与花窗",
    body: "雨水沿着花窗慢慢滑下。窗内有旧照片，窗外能看见庭院的微光。摸鱼坐在窗边，尾巴扫过一串水痕。",
    puzzlePrompt: "你先看窗边哪一个物件？",
    choices: [
      {
        id: "inside-photo",
        label: "看桌上的相框",
        detail: "照片背面写着：原来那天的雨声，我一直记得。",
        weights: { oldMemory: 3 },
      },
      {
        id: "moyu-tail",
        label: "看桌上的信封",
        detail: "信封没有封口，边角被摸鱼蹭得微微翘起，像藏着一句没说完的话。",
        weights: { companionship: 1, oldMemory: 1 },
      },
      {
        id: "outside-light",
        label: "看圆门里的灯",
        detail: "圆门深处有一点灯光，好像在等雨停。",
        weights: { future: 3 },
      },
    ],
    completionText:
      "信封被雨气压弯了一点，边缘上两个相同的小数挨在一起，像一双并排的爪印。花窗上的雨痕连成顺序，指向庭院和池塘。",
    finalPreference: "future",
    hints: [
      "摸鱼一直盯着桌角。",
      "摸鱼用爪子碰了碰相框和信封，又看向窗外圆门里的灯。",
      "窗边可点的物件是相框、信封和圆门里的灯。",
    ],
  },
  {
    id: "courtyard-pond",
    eyebrow: "庭院与池塘",
    title: "倒影与石径",
    body: "庭院里雨声更清楚。池塘倒映着廊灯，石径上有几处被摸鱼踩湿的脚印。",
    puzzlePrompt: "你先靠近哪里？",
    choices: [
      {
        id: "courtyard-lantern",
        label: "看廊下的灯笼",
        detail: "灯笼晃了一下，暖光落在雨里。摸鱼像是想让你记住这点光。",
        weights: { future: 3 },
      },
      {
        id: "courtyard-bridge",
        label: "看小桥",
        detail: "桥面被雨水洗得发亮，像把此岸和另一边轻轻连了起来。",
        weights: { companionship: 2 },
      },
      {
        id: "courtyard-moon",
        label: "看月亮",
        detail: "云后的月亮露出一点光，水面也跟着亮了一下。",
        weights: { oldMemory: 2 },
      },
    ],
    completionText:
      "水里的月亮又亮了一次，和天上的那枚遥遥相对。摸鱼看了看你，像是在提醒：有些痕迹会出现两遍。",
    finalPreference: "future",
    hints: [
      "摸鱼停在第一块湿石头旁。",
      "摸鱼看了看池塘倒影，又看了看你。",
      "按摸鱼停下的位置观察池边线索，就能找到后面的路。",
    ],
  },
  {
    id: "bedroom",
    eyebrow: "卧室",
    title: "灯下的小秘密",
    body: "卧室里没有谜案，只有一盏很暖的灯。前面所有雨声、爪印和卡片，终于拼成一句没有说出口的话。",
    puzzlePrompt: "最后先打开哪一个物件？",
    choices: [
      {
        id: "to-memory",
        label: "看床边的小灯",
        detail: "灯罩透出很软的光，像把一路上的雨声都轻轻收了起来。",
        weights: { oldMemory: 2 },
      },
      {
        id: "to-together",
        label: "看书桌上的信纸",
        detail: "信纸压在桌灯旁边，字迹很轻，像是只想让你一个人慢慢读。",
        weights: { companionship: 2 },
      },
      {
        id: "to-future",
        label: "看柜上的小木盒",
        detail: "小木盒安静地放在柜上，盒盖边缘露出一点暖色的光。",
        weights: { future: 2 },
      },
    ],
    completionText:
      "小木盒没有锁孔，只有八个空格。摸鱼把纸推近了一点：先是被等候的人，后是一路跟回家的小尾巴。",
    finalPreference: null,
    hints: [
      "摸鱼把最后一张卡片放到床边。",
      "摸鱼在小灯、信纸和木盒之间停了很久。",
      "最后一步也只需要点一个具体物件；之后仍然能回来找另外两处微光。",
    ],
  },
];

export const endings = {
  oldMemory: {
    title: "雨窗里的旧照片",
    badge: "旧忆",
    body: "你找到的是被雨声保存下来的回忆。那些一起走过的日子，没有被时间冲淡，只是安静地等在窗边。",
    poeticHint: "去窗边或卧室看看，那里有一段被旧时光轻轻压住的心意。",
    clearHint: "摸鱼闻到的方向在卧室和窗边之间。找一个安静、靠近光的角落。",
  },
  companionship: {
    title: "暖灯下的普通日子",
    badge: "相伴",
    body: "你找到的是很多普通日子里最珍贵的部分：有人在灯下等你，有摸鱼在旁边打盹，也有以后的每一个晚上。",
    poeticHint: "去客厅或玄关看看，那里有一份适合慢慢靠近的心意。",
    clearHint: "摸鱼一直在客厅和玄关之间打转。找一个你们今晚很容易经过的地方。",
  },
  future: {
    title: "池边未落的雨",
    badge: "来日",
    body: "你找到的是雨停以后的远方。今晚先把心意藏在池边，等天亮以后，我们去更远的地方。",
    poeticHint: "去庭院或池塘边看看，那里有一段还没有被雨打湿的来日。",
    clearHint: "摸鱼看向庭院和池塘边。找一处不会被雨淋坏、但能看见水光的位置。",
  },
};
