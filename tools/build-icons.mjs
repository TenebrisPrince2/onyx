// scratch/build-icons.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = 'c:/Users/arcon/Desktop/onyx 1.0';

const CATEGORY_ORDER = [
  "Еда",
  "Транспорт",
  "Покупки",
  "Развлечения",
  "Здоровье",
  "Спорт",
  "Дом",
  "Коммунальные услуги",
  "Красота",
  "Дети",
  "Образование",
  "Финансы",
  "Здания",
  "Люди",
  "Устройства",
  "Инструменты",
  "Природа",
  "Животные",
  "Фигуры",
  "Другое"
];

// Категория 1: Еда (36 иконок, 4 строки по 9)
const FOOD_ROWS = [
  ["apple", "bottle-wine", "candy", "chef-hat", "cup-to-go", "ham", "kebab", "salad", "utensils"],
  ["avocado", "bowl-chopsticks", "candy-cane", "cherry", "egg", "hamburger", "pepper-chilli", "sandwich", "wine"],
  ["banana", "cake", "carrot", "coffee", "egg-fried", "hand-platter", "pie", "shopping-basket", "bottle-champagne"],
  ["beer", "cake-slice", "cheese", "croissant", "grape", "ice-cream-cone", "pizza", "strawberry", "peach"]
];

// Категория 2: Транспорт (20 иконок, 4 строки по 5)
const TRANSPORT_ROWS = [
  ["bike", "circle-parking", "motorbike", "ship", "train-front"],
  ["bus", "ev-charger", "plane", "ship-cargo", "train-track"],
  ["car", "forklift", "rocket", "truck", "tram-front"],
  ["car-taxi-front", "fuel", "scooter", "tractor", "helicopter"]
];

// Категория 3: Покупки (24 иконки, 4 строки по 6)
const SHOPPING_ROWS = [
  ["bag-hand", "handbag", "jacket", "shirt", "sneaker", "watch"],
  ["coat-hanger", "hat-beanie", "lingerie", "shopping-bag", "socks", "dress"],
  ["hat-bowler", "shirt-t", "shorts-boxer", "store", "glasses", "high-heel"],
  ["shirt-folded-buttons", "skirt", "top-crop", "vest", "sweater", "hat-top"]
];

// Категория 4: Развлечения (16 иконок, 4 строки по 4, в ячейке 1.4 roller-coaster)
const ENTERTAINMENT_ROWS = [
  ["balloon", "drama", "mic-vocal", "roller-coaster"],
  ["bowling", "ferris-wheel", "music-4", "theater"],
  ["chess-knight", "film", "popcorn", "projector"],
  ["clapperboard", "gamepad-2", "pumpkin", "barbecue"]
];

// Категория 5: Здоровье (12 иконок, 4 строки по 3)
const HEALTH_ROWS = [
  ["accessibility", "dna", "stethoscope"],
  ["activity", "heart", "syringe"],
  ["ambulance", "pill", "tablets"],
  ["hugeicons:dental-tooth", "pill-bottle", "hospital"]
];

// Категория 6: Спорт (20 иконок, 4 строки по 5)
const SPORT_ROWS = [
  ["award", "dumbbell", "ice-hockey", "skis", "volleyball"],
  ["baseball", "football", "ice-skate", "soccer-ball", "waves-ladder"],
  ["basketball", "football-helmet", "medal", "tennis-ball", "mask-snorkel"],
  ["bat-ball", "golf-driver", "motor-racing-helmet", "trophy", "beach-ball"]
];

// Категория 7: Дом (24 иконки, 4 строки по 6)
const HOME_ROWS = [
  ["armchair", "blender", "fence", "lamp", "rocking-chair", "wardrobe"],
  ["bath", "cabinet-filing", "heater", "lamp-desk", "shower-head", "washing-machine"],
  ["bed", "door-closed", "iron", "microwave", "sofa", "houses"],
  ["bed-double", "door-open", "ironing-board", "refrigerator", "toilet", "mirror-rectangular"]
];

// Категория 8: Коммунальные услуги (12 иконок, 4 строки по 3)
const UTILITIES_ROWS = [
  ["antenna", "plug", "trash"],
  ["droplet", "radio-tower", "house-wifi"],
  ["flame", "zap", "house-plug"],
  ["globe", "phone-call", "recycle"]
];

// Категория 9: Красота (8 иконок, 4 строки по 2)
const BEAUTY_ROWS = [
  ["barber-pole", "mustache"],
  ["bottle-dispenser", "scissors"],
  ["bottle-perfume", "scissors-hair-comb"],
  ["hairdryer", "soap-dispenser-droplet"]
];

// Категория 10: Дети (8 иконок, 4 строки по 2)
const KIDS_ROWS = [
  ["baby", "stroller"],
  ["bottle-baby", "baby-pacifier"],
  ["diaper", "toy-brick"],
  ["pram", "backpack"]
];

// Категория 11: Образование (8 иконок, 4 строки по 2)
const EDUCATION_ROWS = [
  ["book-bookmark", "library-big"],
  ["book-open-text", "microscope"],
  ["brain", "arrow-big-up"],
  ["graduation-cap", "book-lock"]
];

// Категория 12: Финансы (24 иконки, 4 строки по 6)
const FINANCE_ROWS = [
  ["banknote", "coins-stack", "dollar-sign", "handshake", "receipt-text", "wallet-minimal"],
  ["briefcase-business", "credit-card", "gem", "landmark", "scale", "credit-card-reader"],
  ["chart-candlestick", "crown", "goal", "percent", "wallet", "tab-check"],
  ["coins", "currency", "hand-coins", "piggy-bank", "wallet-cards", "russian-ruble"]
];

// Категория 13: Здания (16 иконок, 4 строки по 4)
const BUILDINGS_ROWS = [
  ["barn", "factory", "hotel", "university"],
  ["building-complex", "farm", "house-plus", "warehouse"],
  ["castle", "house", "houses", "house-roof"],
  ["church", "hospital", "school", "dome"]
];

// Категория 14: Люди (8 иконок, 4 строки по 2)
const PEOPLE_ROWS = [
  ["person-standing", "square-user-round"],
  ["speech", "ear"],
  ["user", "user-star"],
  ["users", "user-group"]
];

// Категория 15: Устройства (20 иконок, 4 строки по 5)
const DEVICES_ROWS = [
  ["camera", "headset", "monitor", "printer", "tv"],
  ["cpu", "keyboard", "monitor-smartphone", "smartphone", "video"],
  ["drone", "laptop", "mouse", "tablet", "router"],
  ["headphones", "mic", "phone", "tablet-smartphone", "projector"]
];

// Категория 16: Инструменты (16 иконок, 4 строки по 4)
const TOOLS_ROWS = [
  ["axe", "drill", "paint-bucket", "ruler"],
  ["bolt", "hammer", "paint-roller", "shovel"],
  ["broom", "paintbrush", "pencil", "wrench"],
  ["brush-cleaning", "paintbrush-vertical", "pencil-ruler", "gavel"]
];

// Категория 17: Природа (19 иконок + 1 пустая ячейка, 4 строки по 5)
const NATURE_ROWS = [
  ["cactus", "flower-stem", "mountain-snow", "sprout", "waves-horizontal"],
  ["cloud", "flower-lotus", "flower-rose-single", "tree-palm", "tent-tree"],
  ["flame-kindling", "leaf", "shrub", "tree-pine", "trees"],
  ["barbecue", "flower", "moon", "snowflake", null]
];

// Категория 18: Животные (20 иконок, 4 строки по 5)
const ANIMALS_ROWS = [
  ["bird", "butterfly", "elephant-face", "paw-print", "turtle"],
  ["bone", "cat", "fish", "rat", "rabbit"],
  ["bug", "cow-head", "horse-head", "shrimp", "bear-face"],
  ["panda", "bull-head", "dog", "owl", "squirrel"]
];

// Категория 19: Фигуры (28 иконок, 4 строки по 7)
const SHAPES_ROWS = [
  ["astroid", "boxes", "club", "cylinder", "line-squiggle", "shapes", "star"],
  ["badge", "circle", "cone", "diamond", "octagon", "spade", "triangle"],
  ["blocks", "circle-dashed", "cross", "hexagon", "pentagon", "sparkle", "ungroup"],
  ["box", "circle-small", "cuboid", "hexagons-7", "pyramid", "square", "sparkles"]
];

// Категория 20: Другое (36 иконок, 4 строки по 9)
const OTHER_ROWS = [
  ["archive", "bow-arrow", "ear", "galaxy", "hand-heart", "pac-man", "recycle", "waves-ladder", "umbrella"],
  ["atom", "bubbles", "fingerprint-pattern", "ghost", "hand-helping", "peace-sign", "refresh-ccw", "siren", "yarn-ball"],
  ["bell", "cigarette", "flag", "gift", "hand-metal", "planet", "shield-half", "telescope", "yin-yang"],
  ["biceps-flexed", "compass", "folder", "hand-fist", "megaphone", "police-cap", "sigma", "pen-box", "clover"]
];

const ALL_CATEGORY_ICONS = [
  ...FOOD_ROWS.flat().filter(Boolean),
  ...TRANSPORT_ROWS.flat().filter(Boolean),
  ...SHOPPING_ROWS.flat().filter(Boolean),
  ...ENTERTAINMENT_ROWS.flat().filter(Boolean),
  ...HEALTH_ROWS.flat().filter(Boolean),
  ...SPORT_ROWS.flat().filter(Boolean),
  ...HOME_ROWS.flat().filter(Boolean),
  ...UTILITIES_ROWS.flat().filter(Boolean),
  ...BEAUTY_ROWS.flat().filter(Boolean),
  ...KIDS_ROWS.flat().filter(Boolean),
  ...EDUCATION_ROWS.flat().filter(Boolean),
  ...FINANCE_ROWS.flat().filter(Boolean),
  ...BUILDINGS_ROWS.flat().filter(Boolean),
  ...PEOPLE_ROWS.flat().filter(Boolean),
  ...DEVICES_ROWS.flat().filter(Boolean),
  ...TOOLS_ROWS.flat().filter(Boolean),
  ...NATURE_ROWS.flat().filter(Boolean),
  ...ANIMALS_ROWS.flat().filter(Boolean),
  ...SHAPES_ROWS.flat().filter(Boolean),
  ...OTHER_ROWS.flat().filter(Boolean)
];

const UI_ICONS = [
  'x', 'plus', 'chevron-left', 'chevron-right', 'chevron-down', 'chevrons-down',
  'trash', 'pencil', 'search', 'chart-pie', 'settings', 'grip-vertical',
  'lock', 'delete', 'check', 'arrow-left-right', 'arrow-left', 'arrow-right',
  'arrow-up', 'arrow-up-right', 'arrow-down-left', 'ellipsis-vertical',
  'palette', 'circle-slash', 'wallet', 'credit-card', 'piggy-bank',
  'circle-dollar-sign', 'house', 'target', 'headphones', 'shapes',
  'star', 'receipt', 'send', 'orbit', 'music', 'gamepad-2', 'phone',
  'archive', 'compass', 'activity', 'award', 'pill', 'bug', 'folder',
  'fingerprint-pattern', 'hand', 'hard-hat', 'circle-dashed', 'layout-grid',
  'signature', 'chart-candlestick', 'book-open', 'headset', 'refresh-cw',
  'users', 'waves-horizontal', 'globe', 'syringe', 'sparkle',
  'trending-up', 'trending-down', 'shield', 'heart', 'mic'
];

function cleanBody(body) {
  if (!body) return '';
  let s = body.trim();
  if (s.startsWith('<g fill="none"') && s.endsWith('</g>')) {
    s = s.replace(/^<g[^>]*>/, '').replace(/<\/g>$/, '');
  }
  return s;
}

async function fetchIconBodies(iconList) {
  const unique = [...new Set(iconList)];
  const result = {};

  const needHugeTooth = unique.includes('hugeicons:dental-tooth') || unique.includes('dental-tooth');
  const needHugePolice = unique.includes('police-cap') || unique.includes('hugeicons:police-cap');
  const lucideList = unique.filter(i => !i.includes('dental-tooth') && !i.includes('police-cap'));

  // If peace-sign requested, make sure we ask for peace
  if (lucideList.includes('peace-sign') && !lucideList.includes('peace')) {
    lucideList.push('peace');
  }
  // If pen-box requested, make sure we ask for square-pen
  if (lucideList.includes('pen-box') && !lucideList.includes('square-pen')) {
    lucideList.push('square-pen');
  }

  const chunk = 35;
  for (let i = 0; i < lucideList.length; i += chunk) {
    const slice = lucideList.slice(i, i + chunk);
    const [resLucide, resLab] = await Promise.all([
      fetch('https://api.iconify.design/lucide.json?icons=' + slice.join(',')).then(r => r.json()).catch(() => ({})),
      fetch('https://api.iconify.design/lucide-lab.json?icons=' + slice.join(',')).then(r => r.json()).catch(() => ({}))
    ]);

    for (const name of slice) {
      if (resLucide.icons && resLucide.icons[name]) {
        result[name] = cleanBody(resLucide.icons[name].body);
      } else if (resLab.icons && resLab.icons[name]) {
        result[name] = cleanBody(resLab.icons[name].body);
      } else if (resLucide.aliases && resLucide.aliases[name]) {
        const parent = resLucide.aliases[name].parent;
        if (resLucide.icons && resLucide.icons[parent]) {
          result[name] = cleanBody(resLucide.icons[parent].body);
        }
      }
    }
  }

  if (result['peace'] && !result['peace-sign']) {
    result['peace-sign'] = result['peace'];
  }
  if (result['square-pen'] && !result['pen-box']) {
    result['pen-box'] = result['square-pen'];
  }

  if (needHugeTooth) {
    const resHuge = await fetch('https://api.iconify.design/hugeicons.json?icons=dental-tooth').then(r => r.json()).catch(() => ({}));
    if (resHuge.icons && resHuge.icons['dental-tooth']) {
      let b = resHuge.icons['dental-tooth'].body.replace(/stroke-width="[^"]*"/g, '');
      result['hugeicons:dental-tooth'] = cleanBody(b);
      result['dental-tooth'] = cleanBody(b);
    }
  }

  if (needHugePolice) {
    const resHuge = await fetch('https://api.iconify.design/hugeicons.json?icons=police-cap').then(r => r.json()).catch(() => ({}));
    if (resHuge.icons && resHuge.icons['police-cap']) {
      let b = resHuge.icons['police-cap'].body.replace(/stroke-width="[^"]*"/g, '');
      result['hugeicons:police-cap'] = cleanBody(b);
      result['police-cap'] = cleanBody(b);
    }
  }

  return result;
}

async function main() {
  console.log('Fetching icons for 11 categories...');
  const allNeeded = [...ALL_CATEGORY_ICONS, ...UI_ICONS];
  const fetched = await fetchIconBodies(allNeeded);

  // Дозагрузим существующие SVG из текущего domain/icons-data.js, если какие-то UI не скачались
  try {
    const currentData = readFileSync(resolve(projectRoot, 'domain/icons-data.js'), 'utf8');
    const m = currentData.match(/var LUCIDE_SVG = (\{[\s\S]*?\});/);
    if (m) {
      const existing = JSON.parse(m[1]);
      for (const [k, v] of Object.entries(existing)) {
        if (!fetched[k] && UI_ICONS.includes(k)) {
          fetched[k] = cleanBody(v);
        }
      }
    }
  } catch (e) {
    console.warn('Existing read error:', e.message);
  }

  for (const name of ALL_CATEGORY_ICONS) {
    if (!fetched[name]) {
      console.error('MISSING ICON:', name);
      process.exit(1);
    }
  }

  const ICON_CATEGORIES = [
    { name: "Еда", rows: FOOD_ROWS },
    { name: "Транспорт", rows: TRANSPORT_ROWS },
    { name: "Покупки", rows: SHOPPING_ROWS },
    { name: "Развлечения", rows: ENTERTAINMENT_ROWS },
    { name: "Здоровье", rows: HEALTH_ROWS },
    { name: "Спорт", rows: SPORT_ROWS },
    { name: "Дом", rows: HOME_ROWS },
    { name: "Коммунальные услуги", rows: UTILITIES_ROWS },
    { name: "Красота", rows: BEAUTY_ROWS },
    { name: "Дети", rows: KIDS_ROWS },
    { name: "Образование", rows: EDUCATION_ROWS },
    { name: "Финансы", rows: FINANCE_ROWS },
    { name: "Здания", rows: BUILDINGS_ROWS },
    { name: "Люди", rows: PEOPLE_ROWS },
    { name: "Устройства", rows: DEVICES_ROWS },
    { name: "Инструменты", rows: TOOLS_ROWS },
    { name: "Природа", rows: NATURE_ROWS },
    { name: "Животные", rows: ANIMALS_ROWS },
    { name: "Фигуры", rows: SHAPES_ROWS },
    { name: "Другое", rows: OTHER_ROWS }
  ];

  const ICON_SECTIONS = ICON_CATEGORIES.map(c => [c.name, c.rows.flat().filter(Boolean)]);

  const ICON_MIGRATION_MAP = {
    // Еда
    "food-apple": "apple",
    "food-bottle": "bottle-wine",
    "food-candy": "candy",
    "food-chef-hat": "chef-hat",
    "food-coffee-togo": "cup-to-go",
    "food-chicken-leg": "ham",
    "food-shashlik": "kebab",
    "food-salad": "salad",
    "food-cutlery": "utensils",
    "food-avocado": "avocado",
    "food-noodles-bowl": "bowl-chopsticks",
    "food-candy-cane": "candy-cane",
    "food-cherries": "cherry",
    "food-egg-whole": "egg",
    "food-burger": "hamburger",
    "food-chili": "pepper-chilli",
    "food-sandwich": "sandwich",
    "food-wine-glass": "wine",
    "food-banana": "banana",
    "food-birthday-cake": "cake",
    "food-carrot": "carrot",
    "food-coffee-cup": "coffee",
    "food-fried-egg": "egg-fried",
    "food-cloche-hand": "hand-platter",
    "food-pie": "pie",
    "food-grocery-basket": "shopping-basket",
    "food-beer-mug": "beer",
    "food-cake-slice": "cake-slice",
    "food-cheese": "cheese",
    "food-croissant": "croissant",
    "food-grapes": "grape",
    "food-ice-cream": "ice-cream-cone",
    "food-pizza": "pizza",
    "food-strawberry": "strawberry",

    // Транспорт
    "transport-bicycle": "bike",
    "transport-parking": "circle-parking",
    "transport-motorcycle": "motorbike",
    "transport-boat": "ship",
    "transport-high-speed-train": "train-front",
    "transport-bus": "bus",
    "transport-ev-charging": "ev-charger",
    "transport-airplane": "plane",
    "transport-cargo-ship": "ship-cargo",
    "transport-railroad": "train-track",
    "transport-car": "car",
    "transport-forklift": "forklift",
    "transport-rocket": "rocket",
    "transport-delivery-truck": "truck",
    "transport-metro-train": "tram-front",
    "transport-taxi": "car-taxi-front",
    "transport-gas-station": "fuel",
    "transport-kick-scooter": "scooter",
    "transport-tractor": "tractor",

    // Покупки
    "shop-handbag-clasp": "handbag",
    "shop-tote-bag": "bag-hand",
    "shop-jacket": "jacket",
    "shop-sweater": "sweater",
    "shop-sneaker": "sneaker",
    "shop-wristwatch": "watch",
    "shop-hanger": "coat-hanger",
    "shop-beanie": "hat-beanie",
    "shop-bikini": "lingerie",
    "shop-shopping-bag": "shopping-bag",
    "shop-socks": "socks",
    "shop-dress": "dress",
    "shop-sun-hat": "hat-bowler",
    "shop-tshirt": "shirt-t",
    "shop-boxers": "shorts-boxer",
    "shop-store": "store",
    "shop-eyeglasses": "glasses",
    "shop-high-heel": "high-heel",
    "shop-shirt-folded": "shirt-folded-buttons",
    "shop-skirt": "skirt",
    "shop-tank-top": "top-crop",

    // Развлечения
    "ent-balloon": "balloon",
    "ent-theater-masks": "drama",
    "ent-mic-wire": "mic-vocal",
    "ent-roller-coaster": "roller-coaster",
    "ent-bowling": "bowling",
    "ent-ferris-wheel": "ferris-wheel",
    "ent-music-notes": "music-4",
    "ent-stage-curtain": "theater",
    "ent-chess-knight": "chess-knight",
    "ent-film-strip": "film",
    "ent-popcorn": "popcorn",
    "ent-clapperboard": "clapperboard",
    "ent-gamepad": "gamepad-2",
    "ent-pumpkin": "pumpkin",

    // Здоровье
    "health-wheelchair": "accessibility",
    "health-dna": "dna",
    "health-stethoscope": "stethoscope",
    "health-pulse": "activity",
    "health-heart": "heart",
    "health-syringe": "syringe",
    "health-ambulance": "ambulance",
    "health-capsule": "pill",
    "health-pills-two": "tablets",
    "health-tooth": "hugeicons:dental-tooth",
    "dental-tooth": "hugeicons:dental-tooth",
    "health-pill-bottle": "pill-bottle",

    // Спорт
    "sport-ribbon-award": "award",
    "sport-dumbbell": "dumbbell",
    "sport-hockey": "ice-hockey",
    "sport-skis": "skis",
    "sport-volleyball": "volleyball",
    "sport-baseball": "baseball",
    "sport-rugby": "football",
    "sport-ice-skate": "ice-skate",
    "sport-soccer": "soccer-ball",
    "sport-pool-ladder": "waves-ladder",
    "sport-basketball": "basketball",
    "sport-football-helmet": "football-helmet",
    "sport-medal-one": "medal",
    "sport-tennis": "tennis-ball",
    "sport-racing-helmet": "motor-racing-helmet",
    "sport-trophy-cup": "trophy",

    // Дом
    "home-armchair": "armchair",
    "home-blender": "blender",
    "home-fence": "fence",
    "home-lamp-table": "lamp",
    "home-rocking-chair": "rocking-chair",
    "home-wardrobe": "wardrobe",
    "home-bathtub": "bath",
    "home-nightstand": "cabinet-filing",
    "home-radiator": "heater",
    "home-lamp-desk": "lamp-desk",
    "home-shower": "shower-head",
    "home-washing-machine": "washing-machine",
    "home-bed": "bed",
    "home-door": "door-closed",
    "home-iron": "iron",
    "home-microwave": "microwave",
    "home-couch": "sofa",
    "home-bed-double": "bed-double",
    "home-refrigerator": "refrigerator",
    "home-toilet": "toilet",

    // Коммунальные услуги
    "util-antenna": "antenna",
    "util-plug": "plug",
    "util-water-drop": "droplet",
    "util-tower": "radio-tower",
    "util-flame": "flame",
    "util-electricity": "zap",
    "util-globe-grid": "globe",
    "util-phone": "phone-call",

    // Красота
    "beauty-barber-pole": "barber-pole",
    "beauty-mustache": "mustache",
    "beauty-dispenser": "bottle-dispenser",
    "beauty-scissors": "scissors",
    "beauty-perfume": "bottle-perfume",
    "beauty-scissors-comb": "scissors-hair-comb",
    "beauty-hair-dryer": "hairdryer",
    "beauty-soap-dispenser": "soap-dispenser-droplet",

    // Дети
    "kids-baby": "baby",
    "kids-stroller": "stroller",
    "kids-bottle": "bottle-baby",
    "kids-diaper": "diaper",
    "kids-pram": "pram",

    // Образование
    "edu-book": "book-bookmark",
    "edu-library": "library-big",
    "edu-book-open": "book-open-text",
    "edu-microscope": "microscope",
    "edu-brain": "brain",
    "edu-arrow-up": "arrow-big-up",
    "edu-graduation-cap": "graduation-cap",
    "edu-book-lock": "book-lock",

    // UI и системные миграции
    "trash-2": "trash",
    "gear": "settings",
    "pie-chart": "chart-pie",
    "fin-wallet": "wallet",
    "fin-card": "credit-card",
    "fin-piggy-bank": "piggy-bank",
    "fin-usdt": "circle-dollar-sign",
    "build-house": "house",
    "fin-target": "target",
    "devices-headphones": "headphones"
  };

  const output = `/* domain/icons-data.js — Реестр иконок ONYX:
   Категории: Еда, Транспорт, Покупки, Развлечения, Здоровье, Спорт, Дом, Коммунальные услуги, Красота, Дети, Образование.
   Иконки: локальный SVG-набор без CDN. */
"use strict";

var CATEGORY_ORDER = ${JSON.stringify(CATEGORY_ORDER, null, 2)};

var ICON_CATEGORIES = ${JSON.stringify(ICON_CATEGORIES, null, 2)};

var ICON_SECTIONS = ${JSON.stringify(ICON_SECTIONS, null, 2)};

var LUCIDE_SVG = ${JSON.stringify(fetched, null, 2)};

var ICON_MIGRATION_MAP = ${JSON.stringify(ICON_MIGRATION_MAP, null, 2)};

if (typeof window !== 'undefined') {
  window.CATEGORY_ORDER = CATEGORY_ORDER;
  window.ICON_CATEGORIES = ICON_CATEGORIES;
  window.ICON_SECTIONS = ICON_SECTIONS;
  window.LUCIDE_SVG = LUCIDE_SVG;
  window.ICON_MIGRATION_MAP = ICON_MIGRATION_MAP;
}
`;

  const dest = resolve(projectRoot, 'domain/icons-data.js');
  writeFileSync(dest, output, 'utf8');
  console.log('SUCCESS! Generated domain/icons-data.js with ' + Object.keys(fetched).length + ' SVGs across ' + ICON_CATEGORIES.length + ' categories.');
}

main().catch(e => { console.error(e); process.exit(1); });
