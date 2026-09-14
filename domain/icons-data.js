/* domain/icons-data.js — Реестр иконок ONYX:
   Категории: Еда, Транспорт, Покупки, Развлечения, Здоровье, Спорт, Дом, Коммунальные услуги, Красота, Дети, Образование.
   Иконки: локальный SVG-набор без CDN. */
"use strict";

var CATEGORY_ORDER = [
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

var ICON_CATEGORIES = [
  {
    "name": "Еда",
    "rows": [
      [
        "apple",
        "bottle-wine",
        "candy",
        "chef-hat",
        "cup-to-go",
        "ham",
        "kebab",
        "salad",
        "utensils"
      ],
      [
        "avocado",
        "bowl-chopsticks",
        "candy-cane",
        "cherry",
        "egg",
        "hamburger",
        "pepper-chilli",
        "sandwich",
        "wine"
      ],
      [
        "banana",
        "cake",
        "carrot",
        "coffee",
        "egg-fried",
        "hand-platter",
        "pie",
        "shopping-basket",
        "bottle-champagne"
      ],
      [
        "beer",
        "cake-slice",
        "cheese",
        "croissant",
        "grape",
        "ice-cream-cone",
        "pizza",
        "strawberry",
        "peach"
      ]
    ]
  },
  {
    "name": "Транспорт",
    "rows": [
      [
        "bike",
        "circle-parking",
        "motorbike",
        "ship",
        "train-front"
      ],
      [
        "bus",
        "ev-charger",
        "plane",
        "ship-cargo",
        "train-track"
      ],
      [
        "car",
        "forklift",
        "rocket",
        "truck",
        "tram-front"
      ],
      [
        "car-taxi-front",
        "fuel",
        "scooter",
        "tractor",
        "helicopter"
      ]
    ]
  },
  {
    "name": "Покупки",
    "rows": [
      [
        "bag-hand",
        "handbag",
        "jacket",
        "shirt",
        "sneaker",
        "watch"
      ],
      [
        "coat-hanger",
        "hat-beanie",
        "lingerie",
        "shopping-bag",
        "socks",
        "dress"
      ],
      [
        "hat-bowler",
        "shirt-t",
        "shorts-boxer",
        "store",
        "glasses",
        "high-heel"
      ],
      [
        "shirt-folded-buttons",
        "skirt",
        "top-crop",
        "vest",
        "sweater",
        "hat-top"
      ]
    ]
  },
  {
    "name": "Развлечения",
    "rows": [
      [
        "balloon",
        "drama",
        "mic-vocal",
        "roller-coaster"
      ],
      [
        "bowling",
        "ferris-wheel",
        "music-4",
        "theater"
      ],
      [
        "chess-knight",
        "film",
        "popcorn",
        "projector"
      ],
      [
        "clapperboard",
        "gamepad-2",
        "pumpkin",
        "barbecue"
      ]
    ]
  },
  {
    "name": "Здоровье",
    "rows": [
      [
        "accessibility",
        "dna",
        "stethoscope"
      ],
      [
        "activity",
        "heart",
        "syringe"
      ],
      [
        "ambulance",
        "pill",
        "tablets"
      ],
      [
        "hugeicons:dental-tooth",
        "pill-bottle",
        "hospital"
      ]
    ]
  },
  {
    "name": "Спорт",
    "rows": [
      [
        "award",
        "dumbbell",
        "ice-hockey",
        "skis",
        "volleyball"
      ],
      [
        "baseball",
        "football",
        "ice-skate",
        "soccer-ball",
        "waves-ladder"
      ],
      [
        "basketball",
        "football-helmet",
        "medal",
        "tennis-ball",
        "mask-snorkel"
      ],
      [
        "bat-ball",
        "golf-driver",
        "motor-racing-helmet",
        "trophy",
        "beach-ball"
      ]
    ]
  },
  {
    "name": "Дом",
    "rows": [
      [
        "armchair",
        "blender",
        "fence",
        "lamp",
        "rocking-chair",
        "wardrobe"
      ],
      [
        "bath",
        "cabinet-filing",
        "heater",
        "lamp-desk",
        "shower-head",
        "washing-machine"
      ],
      [
        "bed",
        "door-closed",
        "iron",
        "microwave",
        "sofa",
        "houses"
      ],
      [
        "bed-double",
        "door-open",
        "ironing-board",
        "refrigerator",
        "toilet",
        "mirror-rectangular"
      ]
    ]
  },
  {
    "name": "Коммунальные услуги",
    "rows": [
      [
        "antenna",
        "plug",
        "trash"
      ],
      [
        "droplet",
        "radio-tower",
        "house-wifi"
      ],
      [
        "flame",
        "zap",
        "house-plug"
      ],
      [
        "globe",
        "phone-call",
        "recycle"
      ]
    ]
  },
  {
    "name": "Красота",
    "rows": [
      [
        "barber-pole",
        "mustache"
      ],
      [
        "bottle-dispenser",
        "scissors"
      ],
      [
        "bottle-perfume",
        "scissors-hair-comb"
      ],
      [
        "hairdryer",
        "soap-dispenser-droplet"
      ]
    ]
  },
  {
    "name": "Дети",
    "rows": [
      [
        "baby",
        "stroller"
      ],
      [
        "bottle-baby",
        "baby-pacifier"
      ],
      [
        "diaper",
        "toy-brick"
      ],
      [
        "pram",
        "backpack"
      ]
    ]
  },
  {
    "name": "Образование",
    "rows": [
      [
        "book-bookmark",
        "library-big"
      ],
      [
        "book-open-text",
        "microscope"
      ],
      [
        "brain",
        "arrow-big-up"
      ],
      [
        "graduation-cap",
        "book-lock"
      ]
    ]
  },
  {
    "name": "Финансы",
    "rows": [
      [
        "banknote",
        "coins-stack",
        "dollar-sign",
        "handshake",
        "receipt-text",
        "wallet-minimal"
      ],
      [
        "briefcase-business",
        "credit-card",
        "gem",
        "landmark",
        "scale",
        "credit-card-reader"
      ],
      [
        "chart-candlestick",
        "crown",
        "goal",
        "percent",
        "wallet",
        "tab-check"
      ],
      [
        "coins",
        "currency",
        "hand-coins",
        "piggy-bank",
        "wallet-cards",
        "russian-ruble"
      ]
    ]
  },
  {
    "name": "Здания",
    "rows": [
      [
        "barn",
        "factory",
        "hotel",
        "university"
      ],
      [
        "building-complex",
        "farm",
        "house-plus",
        "warehouse"
      ],
      [
        "castle",
        "house",
        "houses",
        "house-roof"
      ],
      [
        "church",
        "hospital",
        "school",
        "dome"
      ]
    ]
  },
  {
    "name": "Люди",
    "rows": [
      [
        "person-standing",
        "square-user-round"
      ],
      [
        "speech",
        "ear"
      ],
      [
        "user",
        "user-star"
      ],
      [
        "users",
        "user-group"
      ]
    ]
  },
  {
    "name": "Устройства",
    "rows": [
      [
        "camera",
        "headset",
        "monitor",
        "printer",
        "tv"
      ],
      [
        "cpu",
        "keyboard",
        "monitor-smartphone",
        "smartphone",
        "video"
      ],
      [
        "drone",
        "laptop",
        "mouse",
        "tablet",
        "router"
      ],
      [
        "headphones",
        "mic",
        "phone",
        "tablet-smartphone",
        "projector"
      ]
    ]
  },
  {
    "name": "Инструменты",
    "rows": [
      [
        "axe",
        "drill",
        "paint-bucket",
        "ruler"
      ],
      [
        "bolt",
        "hammer",
        "paint-roller",
        "shovel"
      ],
      [
        "broom",
        "paintbrush",
        "pencil",
        "wrench"
      ],
      [
        "brush-cleaning",
        "paintbrush-vertical",
        "pencil-ruler",
        "gavel"
      ]
    ]
  },
  {
    "name": "Природа",
    "rows": [
      [
        "cactus",
        "flower-stem",
        "mountain-snow",
        "sprout",
        "waves-horizontal"
      ],
      [
        "cloud",
        "flower-lotus",
        "flower-rose-single",
        "tree-palm",
        "tent-tree"
      ],
      [
        "flame-kindling",
        "leaf",
        "shrub",
        "tree-pine",
        "trees"
      ],
      [
        "barbecue",
        "flower",
        "moon",
        "snowflake",
        null
      ]
    ]
  },
  {
    "name": "Животные",
    "rows": [
      [
        "bird",
        "butterfly",
        "elephant-face",
        "paw-print",
        "turtle"
      ],
      [
        "bone",
        "cat",
        "fish",
        "rat",
        "rabbit"
      ],
      [
        "bug",
        "cow-head",
        "horse-head",
        "shrimp",
        "bear-face"
      ],
      [
        "panda",
        "bull-head",
        "dog",
        "owl",
        "squirrel"
      ]
    ]
  },
  {
    "name": "Фигуры",
    "rows": [
      [
        "astroid",
        "boxes",
        "club",
        "cylinder",
        "line-squiggle",
        "shapes",
        "star"
      ],
      [
        "badge",
        "circle",
        "cone",
        "diamond",
        "octagon",
        "spade",
        "triangle"
      ],
      [
        "blocks",
        "circle-dashed",
        "cross",
        "hexagon",
        "pentagon",
        "sparkle",
        "ungroup"
      ],
      [
        "box",
        "circle-small",
        "cuboid",
        "hexagons-7",
        "pyramid",
        "square",
        "sparkles"
      ]
    ]
  },
  {
    "name": "Другое",
    "rows": [
      [
        "archive",
        "bow-arrow",
        "ear",
        "galaxy",
        "hand-heart",
        "pac-man",
        "recycle",
        "waves-ladder",
        "umbrella"
      ],
      [
        "atom",
        "bubbles",
        "fingerprint-pattern",
        "ghost",
        "hand-helping",
        "peace-sign",
        "refresh-ccw",
        "siren",
        "yarn-ball"
      ],
      [
        "bell",
        "cigarette",
        "flag",
        "gift",
        "hand-metal",
        "planet",
        "shield-half",
        "telescope",
        "yin-yang"
      ],
      [
        "biceps-flexed",
        "compass",
        "folder",
        "hand-fist",
        "megaphone",
        "police-cap",
        "sigma",
        "pen-box",
        "clover"
      ]
    ]
  }
];

var ICON_SECTIONS = [
  [
    "Еда",
    [
      "apple",
      "bottle-wine",
      "candy",
      "chef-hat",
      "cup-to-go",
      "ham",
      "kebab",
      "salad",
      "utensils",
      "avocado",
      "bowl-chopsticks",
      "candy-cane",
      "cherry",
      "egg",
      "hamburger",
      "pepper-chilli",
      "sandwich",
      "wine",
      "banana",
      "cake",
      "carrot",
      "coffee",
      "egg-fried",
      "hand-platter",
      "pie",
      "shopping-basket",
      "bottle-champagne",
      "beer",
      "cake-slice",
      "cheese",
      "croissant",
      "grape",
      "ice-cream-cone",
      "pizza",
      "strawberry",
      "peach"
    ]
  ],
  [
    "Транспорт",
    [
      "bike",
      "circle-parking",
      "motorbike",
      "ship",
      "train-front",
      "bus",
      "ev-charger",
      "plane",
      "ship-cargo",
      "train-track",
      "car",
      "forklift",
      "rocket",
      "truck",
      "tram-front",
      "car-taxi-front",
      "fuel",
      "scooter",
      "tractor",
      "helicopter"
    ]
  ],
  [
    "Покупки",
    [
      "bag-hand",
      "handbag",
      "jacket",
      "shirt",
      "sneaker",
      "watch",
      "coat-hanger",
      "hat-beanie",
      "lingerie",
      "shopping-bag",
      "socks",
      "dress",
      "hat-bowler",
      "shirt-t",
      "shorts-boxer",
      "store",
      "glasses",
      "high-heel",
      "shirt-folded-buttons",
      "skirt",
      "top-crop",
      "vest",
      "sweater",
      "hat-top"
    ]
  ],
  [
    "Развлечения",
    [
      "balloon",
      "drama",
      "mic-vocal",
      "roller-coaster",
      "bowling",
      "ferris-wheel",
      "music-4",
      "theater",
      "chess-knight",
      "film",
      "popcorn",
      "projector",
      "clapperboard",
      "gamepad-2",
      "pumpkin",
      "barbecue"
    ]
  ],
  [
    "Здоровье",
    [
      "accessibility",
      "dna",
      "stethoscope",
      "activity",
      "heart",
      "syringe",
      "ambulance",
      "pill",
      "tablets",
      "hugeicons:dental-tooth",
      "pill-bottle",
      "hospital"
    ]
  ],
  [
    "Спорт",
    [
      "award",
      "dumbbell",
      "ice-hockey",
      "skis",
      "volleyball",
      "baseball",
      "football",
      "ice-skate",
      "soccer-ball",
      "waves-ladder",
      "basketball",
      "football-helmet",
      "medal",
      "tennis-ball",
      "mask-snorkel",
      "bat-ball",
      "golf-driver",
      "motor-racing-helmet",
      "trophy",
      "beach-ball"
    ]
  ],
  [
    "Дом",
    [
      "armchair",
      "blender",
      "fence",
      "lamp",
      "rocking-chair",
      "wardrobe",
      "bath",
      "cabinet-filing",
      "heater",
      "lamp-desk",
      "shower-head",
      "washing-machine",
      "bed",
      "door-closed",
      "iron",
      "microwave",
      "sofa",
      "houses",
      "bed-double",
      "door-open",
      "ironing-board",
      "refrigerator",
      "toilet",
      "mirror-rectangular"
    ]
  ],
  [
    "Коммунальные услуги",
    [
      "antenna",
      "plug",
      "trash",
      "droplet",
      "radio-tower",
      "house-wifi",
      "flame",
      "zap",
      "house-plug",
      "globe",
      "phone-call",
      "recycle"
    ]
  ],
  [
    "Красота",
    [
      "barber-pole",
      "mustache",
      "bottle-dispenser",
      "scissors",
      "bottle-perfume",
      "scissors-hair-comb",
      "hairdryer",
      "soap-dispenser-droplet"
    ]
  ],
  [
    "Дети",
    [
      "baby",
      "stroller",
      "bottle-baby",
      "baby-pacifier",
      "diaper",
      "toy-brick",
      "pram",
      "backpack"
    ]
  ],
  [
    "Образование",
    [
      "book-bookmark",
      "library-big",
      "book-open-text",
      "microscope",
      "brain",
      "arrow-big-up",
      "graduation-cap",
      "book-lock"
    ]
  ],
  [
    "Финансы",
    [
      "banknote",
      "coins-stack",
      "dollar-sign",
      "handshake",
      "receipt-text",
      "wallet-minimal",
      "briefcase-business",
      "credit-card",
      "gem",
      "landmark",
      "scale",
      "credit-card-reader",
      "chart-candlestick",
      "crown",
      "goal",
      "percent",
      "wallet",
      "tab-check",
      "coins",
      "currency",
      "hand-coins",
      "piggy-bank",
      "wallet-cards",
      "russian-ruble"
    ]
  ],
  [
    "Здания",
    [
      "barn",
      "factory",
      "hotel",
      "university",
      "building-complex",
      "farm",
      "house-plus",
      "warehouse",
      "castle",
      "house",
      "houses",
      "house-roof",
      "church",
      "hospital",
      "school",
      "dome"
    ]
  ],
  [
    "Люди",
    [
      "person-standing",
      "square-user-round",
      "speech",
      "ear",
      "user",
      "user-star",
      "users",
      "user-group"
    ]
  ],
  [
    "Устройства",
    [
      "camera",
      "headset",
      "monitor",
      "printer",
      "tv",
      "cpu",
      "keyboard",
      "monitor-smartphone",
      "smartphone",
      "video",
      "drone",
      "laptop",
      "mouse",
      "tablet",
      "router",
      "headphones",
      "mic",
      "phone",
      "tablet-smartphone",
      "projector"
    ]
  ],
  [
    "Инструменты",
    [
      "axe",
      "drill",
      "paint-bucket",
      "ruler",
      "bolt",
      "hammer",
      "paint-roller",
      "shovel",
      "broom",
      "paintbrush",
      "pencil",
      "wrench",
      "brush-cleaning",
      "paintbrush-vertical",
      "pencil-ruler",
      "gavel"
    ]
  ],
  [
    "Природа",
    [
      "cactus",
      "flower-stem",
      "mountain-snow",
      "sprout",
      "waves-horizontal",
      "cloud",
      "flower-lotus",
      "flower-rose-single",
      "tree-palm",
      "tent-tree",
      "flame-kindling",
      "leaf",
      "shrub",
      "tree-pine",
      "trees",
      "barbecue",
      "flower",
      "moon",
      "snowflake"
    ]
  ],
  [
    "Животные",
    [
      "bird",
      "butterfly",
      "elephant-face",
      "paw-print",
      "turtle",
      "bone",
      "cat",
      "fish",
      "rat",
      "rabbit",
      "bug",
      "cow-head",
      "horse-head",
      "shrimp",
      "bear-face",
      "panda",
      "bull-head",
      "dog",
      "owl",
      "squirrel"
    ]
  ],
  [
    "Фигуры",
    [
      "astroid",
      "boxes",
      "club",
      "cylinder",
      "line-squiggle",
      "shapes",
      "star",
      "badge",
      "circle",
      "cone",
      "diamond",
      "octagon",
      "spade",
      "triangle",
      "blocks",
      "circle-dashed",
      "cross",
      "hexagon",
      "pentagon",
      "sparkle",
      "ungroup",
      "box",
      "circle-small",
      "cuboid",
      "hexagons-7",
      "pyramid",
      "square",
      "sparkles"
    ]
  ],
  [
    "Другое",
    [
      "archive",
      "bow-arrow",
      "ear",
      "galaxy",
      "hand-heart",
      "pac-man",
      "recycle",
      "waves-ladder",
      "umbrella",
      "atom",
      "bubbles",
      "fingerprint-pattern",
      "ghost",
      "hand-helping",
      "peace-sign",
      "refresh-ccw",
      "siren",
      "yarn-ball",
      "bell",
      "cigarette",
      "flag",
      "gift",
      "hand-metal",
      "planet",
      "shield-half",
      "telescope",
      "yin-yang",
      "biceps-flexed",
      "compass",
      "folder",
      "hand-fist",
      "megaphone",
      "police-cap",
      "sigma",
      "pen-box",
      "clover"
    ]
  ]
];

var LUCIDE_SVG = {
  "hat-glasses": "<path d=\"M14 18a2 2 0 0 0-4 0\"/><path d=\"m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11\"/><path d=\"M2 11h20\"/><circle cx=\"17\" cy=\"18\" r=\"3\"/><circle cx=\"7\" cy=\"18\" r=\"3\"/>",
  "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "eye-off": "<path d=\"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49\"/><path d=\"M14.084 14.158a3 3 0 0 1-4.242-4.242\"/><path d=\"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143\"/><path d=\"m2 2 20 20\"/>",
  "apple": "<path d=\"M12 6.528V3a1 1 0 0 1 1-1h0\"/><path d=\"M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10a3 3 0 0 0 3.648.648a5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21\"/>",
  "bottle-wine": "<path d=\"M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a6 6 0 0 0 1.2 3.6l.6.8A6 6 0 0 1 17 13v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8a6 6 0 0 1 1.2-3.6l.6-.8A6 6 0 0 0 10 5z\"/><path d=\"M17 13h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4\"/>",
  "candy": "<path d=\"M10 7v10.9m4-11.8V17m2-10V3a1 1 0 0 1 1.707-.707a2.5 2.5 0 0 0 2.152.717a1 1 0 0 1 1.131 1.131a2.5 2.5 0 0 0 .717 2.152A1 1 0 0 1 21 8h-4\"/><path d=\"M16.536 7.465a5 5 0 0 0-7.072 0l-2 2a5 5 0 0 0 0 7.07a5 5 0 0 0 7.072 0l2-2a5 5 0 0 0 0-7.07\"/><path d=\"M8 17v4a1 1 0 0 1-1.707.707a2.5 2.5 0 0 0-2.152-.717a1 1 0 0 1-1.131-1.131a2.5 2.5 0 0 0-.717-2.152A1 1 0 0 1 3 16h4\"/>",
  "chef-hat": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589a5 5 0 0 0-9.186 0a4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1ZM6 17h12\"/>",
  "cup-to-go": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 7h16m-1.8 4l.8-4l-.8-4c-.1-.5-.6-1-1.2-1H7c-.6 0-1.1.4-1.2 1C5.5 4.4 5 7 5 7l.8 4M18 18H6l-1-7h14ZM7.2 18l.6 3c.1.5.6 1 1.2 1h6c.6 0 1.1-.4 1.2-1l.6-3\"/>",
  "ham": "<path d=\"M13.144 21.144A7.274 10.445 45 1 0 2.856 10.856\"/><path d=\"M13.144 21.144A7.274 4.365 45 0 0 2.856 10.856a7.274 4.365 45 0 0 10.288 10.288m3.421-10.709L18.6 8.4a2.501 2.501 0 1 0 1.65-4.65a2.5 2.5 0 1 0-4.66 1.66l-2.024 2.025M8.5 16.5l-1-1\"/>",
  "kebab": "<path d=\"m12 12l4.2-4.2c.4-.4.4-1 .1-1.5a2.9 2.9 0 1 1 4.8.8\"/><path d=\"M15.3 11.3c.9.9.9 2.5 0 3.4l-1.6 1.6c-.9.9-2.5.9-3.4 0c.9.9.9 2.5 0 3.4l-1.6 1.6c-.9.9-2.5.9-3.4 0l-2.6-2.6c-.9-.9-.9-2.5 0-3.4l1.6-1.6c.9-.9 2.5-.9 3.4 0c-.9-.9-.9-2.5 0-3.4l1.6-1.6c.9-.9 2.5-.9 3.4 0Zm-5 5l-2.6-2.6M9 15l-2 2m-5 5l2-2\"/>",
  "salad": "<path d=\"M7 21h10m-5 0a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9\"/><path d=\"M11.38 12a2.4 2.4 0 0 1-.4-4.77a2.4 2.4 0 0 1 3.2-2.77a2.4 2.4 0 0 1 3.47-.63a2.4 2.4 0 0 1 3.37 3.37a2.4 2.4 0 0 1-1.1 3.7a2.5 2.5 0 0 1 .03 1.1M13 12l4-4\"/><path d=\"M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2\"/>",
  "utensils": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20m14-7V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2zm0 0v7\"/>",
  "avocado": "<path d=\"M22 7a4.95 4.95 0 0 0-8.6-3.4c-1.5 1.6-1.6 1.8-5 2.6a8 8 0 1 0 9.4 9.5c.7-3.4 1-3.6 2.6-5c1-1 1.6-2.3 1.6-3.7\"/><circle cx=\"10\" cy=\"14\" r=\"3.5\"/>",
  "bowl-chopsticks": "<path d=\"m13 2l-3 11M22 2l-8 11\"/><ellipse cx=\"12\" cy=\"12\" rx=\"10\" ry=\"5\"/><path d=\"M22 12a10 10 0 0 1-20 0\"/>",
  "candy-cane": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m10.8 5l2.111 4.223M17.75 7L15 2.1M4.874 14.647l2.12 4.24M5.7 21a2 2 0 0 1-3.5-2l8.6-14a6 6 0 0 1 10.4 6a2 2 0 1 1-3.464-2a2 2 0 1 0-3.464-2zM7.906 9.712l2.005 4.411\"/>",
  "cherry": "<path d=\"M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3c-2.5-2-5 .24-5 3m10 0a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3c-2.5-2-5 .24-5 3\"/><path d=\"M7 14c3.22-2.91 4.29-8.75 5-12c1.66 2.38 4.94 9 5 12\"/><path d=\"M22 9c-4.29 0-7.14-2.33-10-7c5.71 0 10 4.67 10 7\"/>",
  "egg": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12\"/>",
  "hamburger": "<path d=\"M12 16H4a2 2 0 1 1 0-4h16a2 2 0 1 1 0 4h-4.25M5 12a2 2 0 0 1-2-2a9 7 0 0 1 18 0a2 2 0 0 1-2 2M5 16a2 2 0 0 0-2 2a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a2 2 0 0 0-2-2q0 0 0 0\"/><path d=\"m6.67 12l6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2\"/>",
  "pepper-chilli": "<path d=\"M18 7V4a2 2 0 0 0-4 0m0 6s2 0 4 2c2-2 4-2 4-2\"/><path d=\"M22 10c0 6.6-5.4 12-12 12c-4.4 0-8-2.7-8-6v-.4C3.3 17.1 5 18 7 18c3.9 0 7-3.6 7-8c0-1.7 1.3-3 3-3h2c1.7 0 3 1.3 3 3\"/>",
  "sandwich": "<path d=\"m2.37 11.223l8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9\"/><path d=\"m6.67 15l6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2\"/><rect width=\"20\" height=\"4\" x=\"2\" y=\"11\" rx=\"1\"/>",
  "wine": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 22h8M7 10h10m-5 5v7m0-7a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5\"/>",
  "banana": "<path d=\"M4 13c3.5-2 8-2 10 2a5.5 5.5 0 0 1 8 5\"/><path d=\"M5.15 17.89c5.52-1.52 8.65-6.89 7-12C11.55 4 11.5 2 13 2c3.22 0 5 5.5 5 8c0 6.5-4.2 12-10.49 12C5.11 22 2 22 2 20c0-1.5 1.14-1.55 3.15-2.11\"/>",
  "cake": "<path d=\"M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8\"/><path d=\"M4 16s.5-1 2-1s2.5 2 4 2s2.5-2 4-2s2.5 2 4 2s2-1 2-1M2 21h20M7 8v3m5-3v3m5-3v3M7 4h.01M12 4h.01M17 4h.01\"/>",
  "carrot": "<path d=\"M15 16a1 1 0 0 0-7-7q-4 4-5.987 12.385a.5.5 0 0 0 .602.602Q11 20 15 16l-3-3\"/><path d=\"M15 9q4 4 7 0q-3-4-7 0q4-4 0-7q-4 3 0 7m-7 6l-2.58-2.58\"/>",
  "coffee": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 2v2m4-2v2m2 4a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1M6 2v2\"/>",
  "egg-fried": "<circle cx=\"11.5\" cy=\"12.5\" r=\"3.5\"/><path d=\"M3 8c0-3.5 2.5-6 6.5-6c5 0 4.83 3 7.5 5s5 2 5 6c0 4.5-2.5 6.5-7 6.5c-2.5 0-2.5 2.5-6 2.5s-7-2-7-5.5c0-3 1.5-3 1.5-5C3.5 10 3 9 3 8\"/>",
  "hand-platter": "<path d=\"M12 3V2m3.4 15.4l3.2-2.8a2 2 0 1 1 2.8 2.9l-3.6 3.3c-.7.8-1.7 1.2-2.8 1.2h-4c-1.1 0-2.1-.4-2.8-1.2l-1.302-1.464A1 1 0 0 0 6.151 19H5\"/><path d=\"M2 14h12a2 2 0 0 1 0 4h-2m-8-8h16M5 10a7 7 0 0 1 14 0\"/><path d=\"M5 14v6a1 1 0 0 1-1 1H2\"/>",
  "pie": "<path d=\"M7 2C5.5 4 8.5 5 7 7m5-5c-1.5 2 1.5 3 0 5m5-5c-1.5 2 1.5 3 0 5m4 9s-2-5-9-5s-9 5-9 5l1.7 5.1c.2.5.7.9 1.3.9h12c.5 0 1.1-.4 1.3-.9Z\"/><path d=\"M2 16c1.7 0 1.6 1 3.3 1s1.7-1 3.4-1s1.6 1 3.3 1s1.7-1 3.3-1c1.7 0 1.6 1 3.3 1s1.7-1 3.3-1M8.5 16l1.5 6m5.5-6L14 22\"/>",
  "shopping-basket": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m15 11l-1 9m5-9l-4-7M2 11h20M3.5 11l1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4M4.5 15.5h15M5 11l4-7m0 7l1 9\"/>",
  "bottle-champagne": "<path d=\"M8 2h.01M12 3h.01M19 8l-3-3M9.7 21.3a2.4 2.4 0 0 1-3.4 0l-3.6-3.6a2.41 2.41 0 0 1 0-3.4l6.27-6.27A3.5 3.5 0 0 1 11.45 7h1.1a3.5 3.5 0 0 0 2.47-1.03l3.62-3.61a1.21 1.21 0 0 1 1.72 0l1.28 1.28a1.2 1.2 0 0 1 0 1.72l-3.62 3.61A3.5 3.5 0 0 0 17 11.45v1.1a3.5 3.5 0 0 1-1.03 2.48Z\"/><path d=\"m9.06 8l3.23 3.24a1 1 0 0 1 0 1.41L8.65 16.3a1 1 0 0 1-1.41 0L4 13.06M21 12h.01m.99 4h.01\"/>",
  "beer": "<path d=\"M17 11h1a3 3 0 0 1 0 6h-1m-8-5v6m4-6v6m1-10.5c-1 0-1.44.5-3 .5s-2-.5-3-.5s-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5s1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5\"/><path d=\"M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8\"/>",
  "cake-slice": "<path d=\"M16 13H3m13 4H3m4.2-9.1l-3.388 2.5A2 2 0 0 0 3 12.01V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-8.654c0-2-2.44-6.026-6.44-8.026a1 1 0 0 0-1.082.057L10.4 5.6\"/><circle cx=\"9\" cy=\"7\" r=\"2\"/>",
  "cheese": "<path d=\"M21 19v-7c-1-6-7-9-7-9l-2.1 1.5a2 2 0 0 1-3 2.2L3 11v9c0 .6.4 1 1 1h3a2 2 0 0 1 4 0h8M9 12H3\"/><path d=\"M9 12c0-.8 1.3-1.5 3-1.5s3 .7 3 1.5a3 3 0 1 1-6 0m12 0h-6\"/><circle cx=\"19\" cy=\"19\" r=\"2\"/>",
  "croissant": "<path d=\"M10.2 18H4.774a1.5 1.5 0 0 1-1.352-.97a11 11 0 0 1 .132-6.487M18 10.2V4.774a1.5 1.5 0 0 0-.97-1.352a11 11 0 0 0-6.486.132\"/><path d=\"M18 5a4 3 0 0 1 4 3a2 2 0 0 1-2 2a10 10 0 0 0-5.139 1.42M5 18a3 4 0 0 0 3 4a2 2 0 0 0 2-2a10 10 0 0 1 1.42-5.14\"/><path d=\"M8.709 2.554a10 10 0 0 0-6.155 6.155a1.5 1.5 0 0 0 .676 1.626l9.807 5.42a2 2 0 0 0 2.718-2.718l-5.42-9.807a1.5 1.5 0 0 0-1.626-.676\"/>",
  "grape": "<path d=\"M22 5V2l-5.89 5.89\"/><circle cx=\"16.6\" cy=\"15.89\" r=\"3\"/><circle cx=\"8.11\" cy=\"7.4\" r=\"3\"/><circle cx=\"12.35\" cy=\"11.65\" r=\"3\"/><circle cx=\"13.91\" cy=\"5.85\" r=\"3\"/><circle cx=\"18.15\" cy=\"10.09\" r=\"3\"/><circle cx=\"6.56\" cy=\"13.2\" r=\"3\"/><circle cx=\"10.8\" cy=\"17.44\" r=\"3\"/><circle cx=\"5\" cy=\"19\" r=\"3\"/>",
  "ice-cream-cone": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m7 11l4.08 10.35a1 1 0 0 0 1.84 0L17 11m0-4A5 5 0 0 0 7 7m10 0a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4\"/>",
  "pizza": "<path d=\"m12 14l-1 1m2.75 3.25l-1.25 1.42m5.275-14.016a15.68 15.68 0 0 0-12.121 12.12M18.8 9.3a1 1 0 0 0 2.1 7.7\"/><path d=\"M21.964 20.732a1 1 0 0 1-1.232 1.232l-18-5a1 1 0 0 1-.695-1.232A19.68 19.68 0 0 1 15.732 2.037a1 1 0 0 1 1.232.695z\"/>",
  "strawberry": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m17 7l3.5-3.5M17 2v5h5M2.1 17.1a4 4 0 0 0 4.8 4.8l9-2.1a6.32 6.32 0 0 0 2.9-10.9L15 5.2A6.5 6.5 0 0 0 4.1 8.3Zm6.4-7.6h.01m3.99-1h.01m-5.01 5h.01m3.99-1h.01m3.99-1h.01m-9.01 6h.01m3.99-1h.01m3.99-1h.01\"/>",
  "peach": "<path d=\"M14 2a2 2 0 0 0-2 2v2\"/><path d=\"M12 6.5A6 6 0 0 1 22 11c0 6.1-4.5 11-10 11S2 17.1 2 11a6 6 0 0 1 12 0\"/>",
  "bike": "<circle cx=\"18.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"5.5\" cy=\"17.5\" r=\"3.5\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><path d=\"M12 17.5V14l-3-3l4-3l2 3h2\"/>",
  "circle-parking": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M9 17V7h4a3 3 0 0 1 0 6H9\"/>",
  "motorbike": "<path d=\"m18 14l-1-3M3 9l6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81\"/><path d=\"M8 17h3a1 1 0 0 0 1-1a6 6 0 0 1 6-6a1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5\"/><circle cx=\"19\" cy=\"17\" r=\"3\"/><circle cx=\"5\" cy=\"17\" r=\"3\"/>",
  "ship": "<path d=\"M12 2v2m0 5.189V13m7-1V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6\"/><path d=\"M19.38 19A11.6 11.6 0 0 0 21 13l-8.188-3.639a2 2 0 0 0-1.624 0L3 13.001a11.6 11.6 0 0 0 2.81 7.76\"/><path d=\"M2 20c.6.5 1.2 1 2.5 1c2.5 0 2.5-2 5-2c1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2c1.3 0 1.9.5 2.5 1\"/>",
  "train-front": "<path d=\"M8 3.1V7a4 4 0 0 0 8 0V3.1M9 15l-1-1m7 1l1-1\"/><path d=\"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Zm-1 0l-2 3m10-3l2 3\"/>",
  "bus": "<path d=\"M8 6v6m7-6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2s-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/><path d=\"M9 18h5\"/><circle cx=\"16\" cy=\"18\" r=\"2\"/>",
  "ev-charger": "<path d=\"M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5m-4 16V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16m-1 0h13M3 7h11\"/><path d=\"m9 11l-2 3h3l-2 3\"/>",
  "plane": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8L4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1l3 2l2 3l1-1v-3l3-2l3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2\"/>",
  "ship-cargo": "<path d=\"M12 15v-3m0-10v2m4.5 8V9a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-13a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1a1 1 0 0 1 1 1v3\"/><path d=\"M19.38 19c1.076-1.815 1.636-4.89 1.628-6.008a1 1 0 0 0-1-.992H3.984a1 1 0 0 0-1 .984c-.03 1.86.97 5.621 2.826 7.776\"/><path d=\"M2 20c.6.5 1.2 1 2.5 1c2.5 0 2.5-2 5-2c1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2c1.3 0 1.9.5 2.5 1\"/>",
  "train-track": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 17L17 2M2 14l8 8M5 11l8 8M8 8l8 8M11 5l8 8M14 2l8 8M7 22L22 7\"/>",
  "car": "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"/><circle cx=\"7\" cy=\"17\" r=\"2\"/><path d=\"M9 17h6\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/>",
  "forklift": "<path d=\"M12 12H5a2 2 0 0 0-2 2v5m12 0h7m-6 0V2M6 12V7a2 2 0 0 1 2-2h2.172a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 16 10.828M7 19h4\"/><circle cx=\"13\" cy=\"19\" r=\"2\"/><circle cx=\"5\" cy=\"19\" r=\"2\"/>",
  "rocket": "<path d=\"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09\"/><path d=\"M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z\"/><path d=\"M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05\"/>",
  "truck": "<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/>",
  "tram-front": "<rect width=\"16\" height=\"16\" x=\"4\" y=\"3\" rx=\"2\"/><path d=\"M4 11h16m-8-8v8m-4 8l-2 3m12 0l-2-3m-8-4h.01M16 15h.01\"/>",
  "car-taxi-front": "<path d=\"M10 2h4m7 6l-2 2l-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10L3 8m4 6h.01M17 14h.01\"/><rect width=\"18\" height=\"8\" x=\"3\" y=\"10\" rx=\"2\"/><path d=\"M5 18v2m14-2v2\"/>",
  "fuel": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5m-4 16V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16m-1 0h13M3 9h11\"/>",
  "scooter": "<path d=\"M21 4h-3.5l2 11.05M6.95 17h5.142c.523 0 .95-.406 1.063-.916a6.5 6.5 0 0 1 5.345-5.009\"/><circle cx=\"19.5\" cy=\"17.5\" r=\"2.5\"/><circle cx=\"4.5\" cy=\"17.5\" r=\"2.5\"/>",
  "tractor": "<path d=\"m10 11l11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20m-4 0h-5\"/><path d=\"M18 5a1 1 0 0 0-1 1v5.573M3 4h8.129a1 1 0 0 1 .99.863L13 11.246M4 11V4m3 11h.01M8 10.1V4\"/><circle cx=\"18\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"15\" r=\"5\"/>",
  "helicopter": "<path d=\"M11 17v4m3-18v8a2 2 0 0 0 2 2h5.865M17 17v4\"/><path d=\"M18 17a4 4 0 0 0 4-4a8 6 0 0 0-8-6a6 5 0 0 0-6 5v3a2 2 0 0 0 2 2zM2 10v5M6 3h16M7 21h14M8 13H2\"/>",
  "bag-hand": "<path d=\"M8 8c0-2.8 1.8-5 4-5s4 2.2 4 5m5 10.6l-2-9.8c-.1-.5-.5-.8-1-.8H6c-.5 0-.9.3-1 .8l-2 9.8v.4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM12 12v4\"/><path d=\"M18 8A6 6 0 0 1 6 8\"/>",
  "handbag": "<path d=\"M2.048 18.566A2 2 0 0 0 4 21h16a2 2 0 0 0 1.952-2.434l-2-9A2 2 0 0 0 18 8H6a2 2 0 0 0-1.952 1.566z\"/><path d=\"M8 11V6a4 4 0 0 1 8 0v5\"/>",
  "jacket": "<path d=\"M8 4c0 1.1 1.8 2 4 2s4-.9 4-2V3c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1Z\"/><path d=\"M8 4c0 2 4 5 4 10v8m0-8c0-5 4-8 4-10M6 19H3c-.6 0-1-.4-1-1V7c0-1.1.8-2.3 1.9-2.6L8 3\"/><path d=\"M18 9v12c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9\"/><path d=\"m16 3l4.1 1.4C21.2 4.7 22 5.9 22 7v11c0 .6-.4 1-1 1h-3M6 15l2-2m10 2l-2-2\"/>",
  "shirt": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23\"/>",
  "sneaker": "<path d=\"M14.1 7.9L12.5 10m4.9.1L16 12M2 16a2 2 0 0 0 2 2h13c2.8 0 5-2.2 5-5a2 2 0 0 0-2-2c-.8 0-1.6-.2-2.2-.7l-6.2-4.2c-.4-.3-.9-.2-1.3.1c0 0-.6.8-1.2 1.1a3.5 3.5 0 0 1-4.2.1C4.4 7 3.7 6.3 3.7 6.3A.92.92 0 0 0 2 7Z\"/><path d=\"M2 11c0 1.7 1.3 3 3 3h7\"/>",
  "watch": "<path d=\"M12 10v2.2l1.6 1m2.53-5.54l-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05m.02 8.7l.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05\"/><circle cx=\"12\" cy=\"12\" r=\"6\"/>",
  "coat-hanger": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5a3 3 0 1 1 5.1 2.1l-1.5 1.5A2 2 0 0 0 12 10v1M4 21a2 2 0 0 1-1.1-3.7L12 11l9.2 6.4A2 2 0 0 1 20 21Z\"/>",
  "hat-beanie": "<path d=\"M10.4 6.2C6.7 6.9 4 10.1 4 14v1\"/><circle cx=\"12\" cy=\"5\" r=\"2\"/><path d=\"M20 15v-1c0-3.9-2.7-7.1-6.4-7.8\"/><rect width=\"20\" height=\"5\" x=\"2\" y=\"15\" rx=\"1\"/><path d=\"M6 15v5m4-5v5m4-5v5m4-5v5\"/>",
  "lingerie": "<path d=\"M5 2v2a2 2 0 0 0-2 2v2c0 1.7 1.3 3 3 3h2a2 2 0 0 0 2-2h4a2 2 0 0 0 2 2h2c1.7 0 3-1.3 3-3V6a2 2 0 0 0-2-2\"/><path d=\"M10 9c0-2.8-2.2-5-5-5m14-2v2c-2.8 0-5 2.2-5 5M3 15a7 7 0 0 1 7 7h4a7 7 0 0 1 7-7Z\"/>",
  "shopping-bag": "<path d=\"M16 10a4 4 0 0 1-8 0M3.103 6.034h17.794\"/><path d=\"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z\"/>",
  "socks": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9.6 20.4L9 21a3.38 3.38 0 1 1-4.9-4.9l3.5-3.5C8.4 11.6 9 10.4 9 9V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v10a5.15 5.15 0 0 1-1.5 3.6L15 21a3.38 3.38 0 1 1-4.9-4.9l3.5-3.5c.8-1 1.4-2.2 1.4-3.6V2M9 6h12\"/>",
  "dress": "<path d=\"M16 2v3a5.14 5.14 0 0 1 .7 4.8l-.2.5a7.64 7.64 0 0 0 .4 6.3C17.7 17.9 19 20 19 20s-3.1 2-7 2s-7-2-7-2s1.3-2.1 2.1-3.5a7.64 7.64 0 0 0 .4-6.2l-.2-.5A5.66 5.66 0 0 1 8 5V2\"/><path d=\"M16 5c-1.8 0-3.3 1-4 2.5C11.3 6 9.8 5 8 5\"/>",
  "hat-bowler": "<path d=\"M6 13c0 1.7 2.7 3 6 3s6-1.3 6-3v-3a6 6 0 0 0-12 0Z\"/><path d=\"M6 9c0 1.7 2.7 3 6 3s6-1.3 6-3\"/><path d=\"M6 9.2C3.6 10.3 2 12 2 14c0 3.3 4.5 6 10 6s10-2.7 10-6c0-2-1.6-3.7-4-4.8\"/>",
  "shirt-t": "<path d=\"M6 11H3c-.6 0-1-.4-1-1V6c0-1.1.8-2.3 1.9-2.6L8 2a4 4 0 0 0 8 0l4.1 1.4C21.2 3.7 22 4.9 22 6v4c0 .6-.4 1-1 1h-3\"/><path d=\"M18 8v13c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V8\"/>",
  "shorts-boxer": "<path d=\"M10.7 15.8L9 20H4a2 2 0 0 1-2-2V5c0-.6.4-1 1-1h18c.6 0 1 .4 1 1v13a2 2 0 0 1-2 2h-5l-1.7-4.2M2 8h20\"/><path d=\"M16 8v4a4 4 0 0 1-8 0V8\"/>",
  "store": "<path d=\"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5m8.774-10.69a1.12 1.12 0 0 0-1.549 0a2.5 2.5 0 0 1-3.451 0a1.12 1.12 0 0 0-1.548 0a2.5 2.5 0 0 1-3.452 0a1.12 1.12 0 0 0-1.549 0a2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244\"/><path d=\"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05\"/>",
  "glasses": "<circle cx=\"6\" cy=\"15\" r=\"4\"/><circle cx=\"18\" cy=\"15\" r=\"4\"/><path d=\"M14 15a2 2 0 0 0-2-2a2 2 0 0 0-2 2m-7.5-2L5 7c.7-1.3 1.4-2 3-2m13.5 8L19 7c-.7-1.3-1.5-2-3-2\"/>",
  "high-heel": "<path d=\"M4 3c6 6 8.4 10.5 9.8 12c.9 1 2.5 1.3 3.7.6c.3-.2.5-.3.7-.6c.6.3 3.8 3.1 3.8 5c0 1-1 1-1 1h-7c-1 0-2-.5-2.6-1.5L10.1 17c-.9-1.6-2.2-3-3.7-4.2L4 11a5 5 0 0 1 0-8\"/><path d=\"m2.56 9.3l.6 1.1C4.2 12.6 5 16.5 5 21\"/>",
  "shirt-folded-buttons": "<path d=\"M19 21H5a2 2 0 0 1-2-2V4c0-.6.4-1 1-1h12c.6 0 1 .4 1 1v15a2 2 0 1 0 4 0V7c0-.6-.4-1-1-1h-3\"/><path d=\"M7 3v1a3 3 0 1 0 6 0V3m-3 8h.01M10 15h.01\"/>",
  "skirt": "<path d=\"M6 3h12v4H6zm0 4c0 1.7-.4 3.3-1 4.4C3.8 13.6 2 17 2 17s1.8 1.2 4.5 2.1\"/><path d=\"m8 16l-2 4s2.7 1 6 1s6-1 6-1l-2-4\"/><path d=\"M17.5 19.1C20.2 18.2 22 17 22 17s-1.8-3.4-3-5.6c-.6-1.1-1-2.7-1-4.4\"/>",
  "top-crop": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5c-1.7 0-3-1.3-3-3V5h-4v1a3 3 0 1 1-6 0V5H5v4c0 1.7-1.3 3-3 3Z\"/>",
  "vest": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 4a2 2 0 0 0 4 0V3h4v3c0 1.7 1.3 3 3 3v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9c1.7 0 3-1.3 3-3V3h4Z\"/>",
  "sweater": "<path d=\"M6 19H3c-.6 0-1-.4-1-1V6c0-1.1.8-2.3 1.9-2.6L8 2a4 4 0 0 0 8 0l4.1 1.4C21.2 3.7 22 4.9 22 6v12c0 .6-.4 1-1 1h-3\"/><path d=\"M18 8v13c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V8\"/><path d=\"m6 10l2 2l2-2l2 2l2-2l2 2l2-2M6 16l2 2l2-2l2 2l2-2l2 2l2-2\"/>",
  "hat-top": "<ellipse cx=\"12\" cy=\"5\" rx=\"7\" ry=\"3\"/><path d=\"M5 5c0 1 1 4 1 6v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-2 1-5 1-6\"/><path d=\"M18 11c0 1.7-2.7 3-6 3s-6-1.3-6-3\"/><path d=\"M6 11.2C3.6 12.3 2 14 2 16c0 3.3 4.5 6 10 6s10-2.7 10-6c0-2-1.6-3.7-4-4.8\"/>",
  "balloon": "<path d=\"M12 16v1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v1M12 6a2 2 0 0 1 2 2\"/><path d=\"M18 8c0 4-3.5 8-6 8s-6-4-6-8a6 6 0 0 1 12 0\"/>",
  "drama": "<path d=\"M10 11h.01M14 6h.01M18 6h.01M6.5 13.1h.01M22 5c0 9-4 12-6 12s-6-3-6-12q0-3 6-3c6 0 6 1 6 3\"/><path d=\"M17.4 9.9c-.8.8-2 .8-2.8 0m-4.5-2.8C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6c4.5 7.8 9.5 8.4 11.2 7.4c.9-.5 1.9-2.1 1.9-4.7\"/><path d=\"M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4\"/>",
  "mic-vocal": "<path d=\"m11 7.601l-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12\"/><path d=\"M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2s-2.775-3.369-1.5-4.5\"/><circle cx=\"16\" cy=\"7\" r=\"5\"/>",
  "roller-coaster": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 19V5m4 14V6.8M14 19v-7.8M18 5v4m0 10v-6m4 6V9M2 19V9a4 4 0 0 1 4-4c2 0 4 1.33 6 4s4 4 6 4a4 4 0 1 0-3-6.65\"/>",
  "bowling": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 10h.01M6 13h.01M10 14h.01m1.08-7.93a8 8 0 1 0 .32 15.81M16 9h4m-5-4c0 1.5 1 2 1 4c0 2.5-2 4.5-2 7c0 2.6 1.9 6 1.9 6H20s2-3.4 2-6c0-2.5-2-4.5-2-7c0-2 1-2.5 1-4a3 3 0 1 0-6 0\"/>",
  "ferris-wheel": "<circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M12 2v4m-5.2 9l-3.5 2M20.7 7l-3.5 2M6.8 9L3.3 7m17.4 10l-3.5-2M9 22l3-8l3 8m-7 0h8\"/><path d=\"M18 18.7a9 9 0 1 0-12 0\"/>",
  "music-4": "<path d=\"M9 18V5l12-2v13M9 9l12-2\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"18\" cy=\"16\" r=\"3\"/>",
  "theater": "<path d=\"M2 10s3-3 3-8m17 8s-3-3-3-8\"/><path d=\"M10 2c0 4.4-3.6 8-8 8m12-8c0 4.4 3.6 8 8 8M2 10s2 2 2 5m18-5s-2 2-2 5M8 15h8M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1m4 0v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1\"/>",
  "chess-knight": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zm11.5-2c1-2 2.5-5 2.5-9a7 7 0 0 0-7-7H6.635a1 1 0 0 0-.768 1.64L7 5l-2.32 5.802a2 2 0 0 0 .95 2.526l2.87 1.456M15 5l1.425-1.425M17 8l1.53-1.53m-8.817 5.715L7 18\"/>",
  "film": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18m0-13.5h4m-4 9h4\"/>",
  "popcorn": "<path d=\"M18 8a2 2 0 0 0 0-4a2 2 0 0 0-4 0a2 2 0 0 0-4 0a2 2 0 0 0-4 0a2 2 0 0 0 0 4m4 14L9 8m5 14l1-14\"/><path d=\"M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z\"/>",
  "projector": "<path d=\"M5 7L3 5m6 1V3m4 4l2-2\"/><circle cx=\"9\" cy=\"13\" r=\"3\"/><path d=\"M11.83 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.17M16 16h2\"/>",
  "clapperboard": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m12.296 3.464l3.02 3.956M20.2 6L3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3zM3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm3.18-5.724l3.1 3.899\"/>",
  "gamepad-2": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 11h4M8 9v4m7-1h.01M18 10h.01m-.69-5H6.68a4 4 0 0 0-3.978 3.59l-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258q-.01-.075-.017-.151A4 4 0 0 0 17.32 5\"/>",
  "pumpkin": "<path d=\"M13 2c-1 1-1 2-1 2\"/><path d=\"M17 4c-.9 0-1.8.4-2.5 1.2a3.32 3.32 0 0 0-5 0C8.8 4.4 7.9 4 7 4c-2.8 0-5 4-5 9s2.2 9 5 9c.9 0 1.8-.4 2.5-1.2a3.32 3.32 0 0 0 5 0c.7.8 1.6 1.2 2.5 1.2c2.8 0 5-4 5-9s-2.2-9-5-9\"/><path d=\"M10 11L8 9l-2 2m12 0l-2-2l-2 2m-8 4l2 2l2-2l2 2l2-2l2 2l2-2\"/>",
  "barbecue": "<path d=\"M6 4c0-1 2-1 2-2m4 2c0-1 2-1 2-2m4 2c0-1 2-1 2-2M3 8a9.06 9 0 0 0 18 0Zm6.2 7.6l-1.3 2.6\"/><circle cx=\"7\" cy=\"20\" r=\"2\"/><path d=\"M9 20h8m-2.2-4.4L18 22\"/>",
  "accessibility": "<circle cx=\"16\" cy=\"4\" r=\"1\"/><path d=\"m18 19l1-7l-6 1M5 8l3-3l5.5 3l-2.36 3.5m-6.9 3a5 5 0 0 0 6.88 6\"/><path d=\"M13.76 17.5a5 5 0 0 0-6.88-6\"/>",
  "dna": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m10 16l1.5 1.5M14 8l-1.5-1.5M15 2c-1.798 1.998-2.518 3.995-2.807 5.993M16.5 10.5l1 1M17 6l-2.891-2.891M2 15c6.667-6 13.333 0 20-6m-2 0l.891.891M3.109 14.109L4 15m2.5-2.5l1 1M7 18l2.891 2.891M9 22c1.798-1.998 2.518-3.995 2.807-5.993\"/>",
  "stethoscope": "<path d=\"M11 2v2M5 2v2m0-1H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1\"/><path d=\"M8 15a6 6 0 0 0 12 0v-3\"/><circle cx=\"20\" cy=\"10\" r=\"2\"/>",
  "activity": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2\"/>",
  "heart": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676a.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\"/>",
  "syringe": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m18 2l4 4m-5 1l3-3m-1 5L8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5m-6 6l4 4m-8 4l-3 3M14 4l6 6\"/>",
  "ambulance": "<path d=\"M10 10H6m8 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m14 0h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14M8 8v4m1 6h6\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/>",
  "pill": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7m-2-12l7 7\"/>",
  "tablets": "<circle cx=\"7\" cy=\"7\" r=\"5\"/><circle cx=\"17\" cy=\"17\" r=\"5\"/><path d=\"M12 17h10M3.46 10.54l7.08-7.08\"/>",
  "pill-bottle": "<path d=\"M18 11h-4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h4\"/><path d=\"M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7\"/><rect width=\"16\" height=\"5\" x=\"4\" y=\"2\" rx=\"1\"/>",
  "hospital": "<path d=\"M12 7v4m2 10v-3a2 2 0 0 0-4 0v3m4-12h-4\"/><path d=\"M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2\"/><path d=\"M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16\"/>",
  "award": "<path d=\"m15.477 12.89l1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526\"/><circle cx=\"12\" cy=\"8\" r=\"6\"/>",
  "dumbbell": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829zM2.5 21.5l1.4-1.4M20.1 3.9l1.4-1.4M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829zM9.6 14.4l4.8-4.8\"/>",
  "ice-hockey": "<path d=\"M10 4v4c0 1.1-1.8 2-4 2s-4-.9-4-2V4\"/><ellipse cx=\"6\" cy=\"4\" rx=\"4\" ry=\"2\"/><path d=\"M4 17a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h4a6 6 0 0 0 5.2-3l8.5-14a1.94 1.94 0 1 0-3.4-2l-7.9 13c-.4.6-1 1-1.7 1ZM20.6 6.8l-3.3-2.1m-2.1 3.4l3.3 2.1M6 17v5\"/>",
  "skis": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m2 4l3-1M3 2l7 20m0-20L3 22m-1-2l3 1m17 1V6c0-2.2-2-4-2-4s-2 1.8-2 4c0-2.2-2-4-2-4s-2 1.8-2 4v16ZM18 6v16\"/>",
  "volleyball": "<path d=\"M11 7a16 16 20 0 1 10.98 4.362M12 12a13 13 0 0 1-8.66 5m13.49-3.366a16 16 0 0 1-9.267 7.328\"/><path d=\"M20.66 17A13 13 0 0 0 12 12a13 13 0 0 1 0-10M8.17 15.366a16 16 0 0 1-1.713-11.69\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/>",
  "baseball": "<path d=\"M2 12c5.5 0 10-4.5 10-10\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M22 12c-5.5 0-10 4.5-10 10M8 11.5l-1.5-2m5-1.5l-2-1.5m5 11l-2-1.5m5-1.5l-1.5-2\"/>",
  "football": "<path d=\"M21 3c-.8-.8-3-1.2-5.8-.9s-6 1.6-8.8 4.4s-4 6-4.4 8.8s.1 5 .9 5.8s3 1.2 5.8.9s6-1.6 8.8-4.4s4-6 4.4-8.8s-.1-5-.9-5.8M6.4 17.6L9 15\"/><path d=\"M8.7 21.9c-.8-3.3-3.4-5.8-6.7-6.7m6.1-1.3l2 2M11 11l2 2m.9-4.9l2 2m-.6-8c.8 3.3 3.4 5.8 6.6 6.6M15 9l2.6-2.6\"/>",
  "ice-skate": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11 2v9m0-4L8 8m3-5L4 5v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2a3.08 3.08 0 0 0-1.8-2.8L11 11l-3 1m-1 6v4m8-4v4M4 22h12c2.1 0 3.9-1.1 5-2.7\"/>",
  "soccer-ball": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M11.9 6.7s-3 1.3-5 3.6c0 0 0 3.6 1.9 5.9c0 0 3.1.7 6.2 0c0 0 1.9-2.3 1.9-5.9c0 .1-2-2.3-5-3.6m0 0V2m5 8.4s3-1.4 4.5-1.6M15 16.3s1.9 2.7 2.9 3.7m-9.1-3.7S6.9 19 6 20\"/><path d=\"M2.6 8.7C4 9 7 10.4 7 10.4\"/>",
  "waves-ladder": "<path d=\"M19 5a2 2 0 0 0-2 2v11\"/><path d=\"M2 18c.6.5 1.2 1 2.5 1c2.5 0 2.5-2 5-2c2.6 0 2.4 2 5 2c2.5 0 2.5-2 5-2c1.3 0 1.9.5 2.5 1M7 13h10M7 9h10\"/><path d=\"M9 5a2 2 0 0 0-2 2v11\"/>",
  "basketball": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M2.1 13.4A10.1 10.1 0 0 0 13.4 2.1M5 4.9l14 14.2m2.9-8.5a10.1 10.1 0 0 0-11.3 11.3\"/>",
  "football-helmet": "<path d=\"M7 14h.01M21.6 9c-1.3-4-5.1-7-9.6-7C6.5 2 2 6.5 2 12c0 2.6 1 5 3 7c1.4 1.3 3.6 1.4 4.9 0c.7-.7 1-1.6 1-2.5V13c0-1.7 1.3-3 3-3h6.8c.7 0 1-.4.9-1m.4 9H10.7\"/><path d=\"M11 14h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2c-2.8 0-5-2.2-5-5v-3\"/>",
  "medal": "<path d=\"M7.21 15L2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15M11 12L5.12 2.2M13 12l5.88-9.8M8 7h8\"/><circle cx=\"12\" cy=\"17\" r=\"5\"/><path d=\"M12 18v-2h-.5\"/>",
  "tennis-ball": "<path d=\"M2 12c5.5 0 10-4.5 10-10\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M22 12c-5.5 0-10 4.5-10 10\"/>",
  "mask-snorkel": "<path d=\"M13.5 14a2 2 0 0 1-1.4-.6l-.7-.8c-.8-.8-2-.8-2.8 0l-.7.8a2 2 0 0 1-1.4.6H6a4 4 0 0 1 0-8h8a4 4 0 0 1 0 8ZM12 18a2 2 0 0 1-4 0\"/><path d=\"M10 20a2 2 0 0 0 2 2h4c3.3 0 6-2.7 6-6V2h-4v14a2 2 0 0 1-2 2m2-8h4\"/><circle cx=\"4.5\" cy=\"21.5\" r=\".5\"/><path d=\"M3 17.5h.01\"/>",
  "bat-ball": "<circle cx=\"18\" cy=\"18\" r=\"4\"/><path d=\"m4 8l10 10m6.8-2.8c1.9-3.4 1.4-7.7-1.4-10.6c-3.5-3.5-9.1-3.5-12.5 0c-4.7 4.7-5.1 6.9-1.4 11.1l-2.9 2.9c-.8.8-.8 2 0 2.8s2 .8 2.8 0l2.9-2.9c2.6 2.3 4.5 3 6.6 2.1\"/>",
  "golf-driver": "<circle cx=\"6\" cy=\"9\" r=\"2\"/><path d=\"M6 11v2M22 2l-9.3 14.1c-.4.6-1 .9-1.7.9H4a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h2c1.6 0 3.1-.7 4.1-2.1l2.6-3.8\"/>",
  "motor-racing-helmet": "<path d=\"M22 12.2a10 10 0 1 0-19.4 3.2c.2.5.8 1.1 1.3 1.3l13.2 5.1c.5.2 1.2 0 1.6-.3l2.6-2.6c.4-.4.7-1.2.7-1.7Z\"/><path d=\"m21.8 18l-10.5-4a2 2.06 0 0 1 .7-4h9.8\"/>",
  "trophy": "<path d=\"M10 14.66V17a1 1 0 0 1-1 1a2 2 0 0 0-2 2v2m7-7.34V17a1 1 0 0 0 1 1a2 2 0 0 1 2 2v2m.916-12H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3M4 22h16\"/><path d=\"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z\"/><path d=\"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3\"/>",
  "beach-ball": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M19.1 4.9c-1.6-1.6-6 .3-9.9 4.2S3.4 17.4 5 19s6-.3 9.9-4.2c3.8-3.9 5.7-8.3 4.2-9.9\"/>",
  "armchair": "<path d=\"M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3\"/><path d=\"M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0zm2 2v2m14-2v2\"/>",
  "blender": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 14a2 2 0 0 0-1.963 1.615l-1.018 5.193A1 1 0 0 0 6 22h12a1 1 0 0 0 .981-1.192l-1.018-5.193A2 2 0 0 0 16 14zm9-12l-1 12m-7.994 0L7 2m.565 6.787A5 5 0 0 0 12 8a5 5 0 0 1 4.56-.75M19 2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 .688 1.5M12 18h.01\"/>",
  "fence": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 3L2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Zm2 5h4M6 18h4m2-15l-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Zm2 5h4m-4 10h4m2-15l-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z\"/>",
  "lamp": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 12v6m-7.923-7.385A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23ZM8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z\"/>",
  "rocking-chair": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m15 13l3.708 7.416M3 19a15 15 0 0 0 18 0M3 2l3.21 9.633A2 2 0 0 0 8.109 13H18m-9 0l-3.708 7.416\"/>",
  "wardrobe": "<rect width=\"18\" height=\"20\" x=\"3\" y=\"2\" rx=\"2\"/><path d=\"M8 10h.01M12 2v15m4-7h.01M3 17h18\"/>",
  "bath": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 4L8 6m9 13v2M2 12h20M7 19v2M9 5L7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5\"/>",
  "cabinet-filing": "<path d=\"M4 12h16\"/><rect width=\"16\" height=\"20\" x=\"4\" y=\"2\" rx=\"2\"/><path d=\"M10 6h4m-4 10h4\"/>",
  "heater": "<path d=\"M11 8c2-3-2-3 0-6m4.5 6c2-3-2-3 0-6M6 10h.01M6 14h.01M10 16v-4m4 4v-4m4 4v-4\"/><path d=\"M20 6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3M5 20v2m14-2v2\"/>",
  "lamp-desk": "<path d=\"M10.293 2.293a1 1 0 0 1 1.414 0l2.5 2.5l5.994 1.227a1 1 0 0 1 .506 1.687l-7 7a1 1 0 0 1-1.687-.506l-1.227-5.994l-2.5-2.5a1 1 0 0 1 0-1.414zm3.914 2.5l-3.414 3.414M3 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z\"/><path d=\"m9.086 6.5l-4.793 4.793a1 1 0 0 0-.18 1.17L7 18\"/>",
  "shower-head": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m4 4l2.5 2.5m7 0a4.95 4.95 0 0 0-7 7M15 5L5 15m9 2v.01M10 16v.01M13 13v.01M16 10v.01M11 20v.01M17 14v.01M20 11v.01\"/>",
  "washing-machine": "<path d=\"M3 6h3m11 0h.01\"/><rect width=\"18\" height=\"20\" x=\"3\" y=\"2\" rx=\"2\"/><circle cx=\"12\" cy=\"13\" r=\"5\"/><path d=\"M12 18a2.5 2.5 0 0 0 0-5a2.5 2.5 0 0 1 0-5\"/>",
  "bed": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9\"/>",
  "door-closed": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m-3 0h20M9 12h.01\"/>",
  "iron": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 7h.01M6 11h.01M10 11h.01M6 15h.01M10 15h.01M14 19v-7C14 6 9 2 8 2S2 6 2 12v7h14a2 2 0 0 0 2-2V8a2 2 0 0 1 4 0v9M3 22h10\"/>",
  "microwave": "<rect width=\"20\" height=\"15\" x=\"2\" y=\"4\" rx=\"2\"/><rect width=\"8\" height=\"7\" x=\"6\" y=\"8\" rx=\"1\"/><path d=\"M18 8v7M6 19v2m12-2v2\"/>",
  "sofa": "<path d=\"M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3\"/><path d=\"M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0zm2 2v2m16-2v2M12 4v9\"/>",
  "houses": "<path d=\"M6 17H3c-.6 0-1-.4-1-1V8.5L8 4l10 7.5V19c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1v-7.5L16 4l6 4.5V16c0 .6-.4 1-1 1h-3\"/><path d=\"M10 20v-6h4v6\"/>",
  "bed-double": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4m-8-6v6M2 18h20\"/>",
  "door-open": "<path d=\"M10 21H2m8-18H7a2 2 0 0 0-2 2v16m9-9h.01\"/><path d=\"M19 21V5a2 2 0 0 0-1.675-1.974l-6.163-1.013A1 1 0 0 0 10 3v18a1 1 0 0 0 1.124.992zm3 0h-3\"/>",
  "ironing-board": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 3a4 4 0 0 0 0 8h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 18l12-10M6 11l12 10\"/>",
  "refrigerator": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zm0 4h14m-4-3v6\"/>",
  "toilet": "<path d=\"M7 12h13a1 1 0 0 1 1 1a5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18\"/><path d=\"M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8\"/>",
  "mirror-rectangular": "<path d=\"M11 6L8 9m8-2l-8 8\"/><rect width=\"16\" height=\"20\" x=\"4\" y=\"2\" rx=\"2\"/>",
  "antenna": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 12L7 2m0 10l5-10m0 10l5-10m0 10l5-10M4.5 7h15M12 16v6\"/>",
  "plug": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 22v-5m3-9V2m2 6a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1zM9 8V2\"/>",
  "trash": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/>",
  "droplet": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7\"/>",
  "radio-tower": "<path d=\"M4.9 16.1C1 12.2 1 5.8 4.9 1.9m2.9 2.8a6.14 6.14 0 0 0-.8 7.5\"/><circle cx=\"12\" cy=\"9\" r=\"2\"/><path d=\"M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1m-9.6 2h5M8 22l4-11l4 11\"/>",
  "house-wifi": "<path d=\"M9.5 13.866a4 4 0 0 1 5 .01M12 17h.01\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/><path d=\"M7 10.754a8 8 0 0 1 10 0\"/>",
  "flame": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0a5 5 0 0 1 1-3a1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4\"/>",
  "zap": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15.914 4a1.5 1.5 0 0 0-2.474-1.561l-9 9A1.5 1.5 0 0 0 5.5 14h4.002a.5.5 0 0 1 .471.666L8.086 20a1.5 1.5 0 0 0 2.475 1.56l9-9A1.5 1.5 0 0 0 18.5 10h-3.997a.5.5 0 0 1-.472-.667z\"/>",
  "house-plug": "<path d=\"M10 12V8.964M14 12V8.964M15 12a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1z\"/><path d=\"M8.5 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-2\"/>",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2a14.5 14.5 0 0 0 0 20a14.5 14.5 0 0 0 0-20M2 12h20\"/>",
  "phone-call": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 2a9 9 0 0 1 9 9m-9-5a5 5 0 0 1 5 5m-4.168 5.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233a14 14 0 0 0 6.392 6.384\"/>",
  "recycle": "<path d=\"M7 19H4.815a1.83 1.83 0 0 1-1.57-.881a1.79 1.79 0 0 1-.004-1.784L7.196 9.5M11 19h8.203a1.83 1.83 0 0 0 1.556-.89a1.78 1.78 0 0 0 0-1.775l-1.226-2.12\"/><path d=\"m14 16l-3 3l3 3m-5.707-8.404L7.196 9.5L3.1 10.598m6.244-4.787l1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.78 1.78 0 0 1 1.546.888l3.943 6.843\"/><path d=\"m13.378 9.633l4.096 1.098l1.097-4.096\"/>",
  "barber-pole": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 6h10M7 22h10m-9 0V6a4 4 0 0 1 8 0v16M8 11.5l8-4M8 16l8-4m-8 8.5l8-4\"/>",
  "mustache": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M18.2 8.6a3.9 3.9 0 0 0-6.2-.2a3.75 3.75 0 0 0-6.2.2l-.6.8C4.5 10.4 3.3 11 2 11a5.55 5.55 0 0 0 10 3.2A5.45 5.45 0 0 0 22 11c-1.3 0-2.5-.6-3.2-1.6Z\"/>",
  "bottle-dispenser": "<circle cx=\"18.5\" cy=\"5.5\" r=\".5\"/><path d=\"M20 10h.01M9 2h7m-5 0v4\"/><rect width=\"4\" height=\"4\" x=\"9\" y=\"6\" rx=\"1\"/><path d=\"M9 10c-1.7 0-3 1.3-3 3v7a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-7c0-1.7-1.3-3-3-3Z\"/><path d=\"M6 14.5a6 6 0 0 1 5 0s2 1.25 5 0\"/>",
  "scissors": "<circle cx=\"6\" cy=\"6\" r=\"3\"/><path d=\"M8.12 8.12L12 12m8-8L8.12 15.88\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"M14.8 14.8L20 20\"/>",
  "bottle-perfume": "<path d=\"M6 3h12v4H6zm3 4h6v4H9z\"/><rect width=\"18\" height=\"10\" x=\"3\" y=\"11\" rx=\"2\"/>",
  "scissors-hair-comb": "<path d=\"M6 2C5 5 7 5 6 8m4-6c-1 3 1 3 0 6\"/><circle cx=\"4\" cy=\"20\" r=\"2\"/><path d=\"M5.4 18.6L8 16m2.8-2.8L14 10\"/><circle cx=\"12\" cy=\"20\" r=\"2\"/><path d=\"m2 10l8.6 8.6M18 2h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2m0-16h4m-4 4h4m-4 4h4m-4 4h4\"/>",
  "hairdryer": "<circle cx=\"8\" cy=\"8\" r=\"2\"/><path d=\"M18 11s-7 3-10 3A6 6 0 0 1 8 2c3 0 10 3 10 3Zm0-6l4-2v10l-4-2\"/><path d=\"m7 13.9l.8 5.1c.1.5.6 1 1.2 1h2c.6 0 .9-.4.8-1l-.9-5.5m.74 4.5s3.3-2 7.3-2a2 2 0 0 1 0 4H17a2 2 0 0 0-2 2\"/>",
  "soap-dispenser-droplet": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10.5 2v4M14 2H7a2 2 0 0 0-2 2m14.29 10.76A6.67 6.67 0 0 1 17 11a6.6 6.6 0 0 1-2.29 3.76c-1.15.92-1.71 2.04-1.71 3.19c0 2.22 1.8 4.05 4 4.05s4-1.83 4-4.05c0-1.16-.57-2.26-1.71-3.19M9.607 21H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h7V7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3\"/>",
  "baby": "<path d=\"M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5m1-4h.01\"/><path d=\"M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6a9 9 0 0 1-17.6 0a2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1m-3 5h.01\"/>",
  "stroller": "<path d=\"M14 12.95c1.6-1.6 4.1-1.6 5.7.05\"/><circle cx=\"11\" cy=\"6.5\" r=\"2.5\"/><path d=\"M18.3 17.2L5.45 4.5M19.7 17L13 18.1c-2.7.5-5.5-1-5.7-4.1c-.4-2.6-.9-5.7-1.3-8.3A2 2 0 0 0 2 6\"/><circle cx=\"8\" cy=\"19\" r=\"2\"/><circle cx=\"20\" cy=\"19\" r=\"2\"/>",
  "bottle-baby": "<path d=\"M20 11c1.1-1.4 1.3-3.3.7-4.9l.8-.8a1.5 1.5 0 0 0-2.8-2.8l-.8.8A5.33 5.33 0 0 0 13 4\"/><path d=\"M11.3 3.7a1 1 0 0 1 1.4 0l7.6 7.6a1 1 0 0 1 0 1.4l-1.6 1.6a1 1 0 0 1-1.4 0L9.7 6.7a1 1 0 0 1 0-1.4Z\"/><path d=\"m10 7l-7.3 7.3c-.9.9-.9 2.5 0 3.4l3.6 3.6c.9.9 2.5.9 3.4 0L17 14M4 13l2 2m1-5l2 2\"/>",
  "baby-pacifier": "<path d=\"M10.1 7.4a1.95 1.95 0 0 0 3.7-1.5c-.8-2-3.2-3-5.2-2.2c-2.9 1.2-4.8 3.7-5.4 6.5a1.95 1.95 0 0 0 0 3.6A9.05 9.05 0 0 0 7 19.42m10.1-.02c2-1.3 3.3-3.4 3.8-5.6a2 2 0 0 0 0-3.6a9.83 9.83 0 0 0-3.2-5M8 12h.01M16 12h.01\"/><circle cx=\"12\" cy=\"16\" r=\"2\"/><path d=\"M10 16h-.5A2.5 2.5 0 0 0 7 18.5v1A2.5 2.5 0 0 0 9.5 22h5a2.5 2.5 0 0 0 2.5-2.5v-1a2.5 2.5 0 0 0-2.5-2.5H14\"/>",
  "diaper": "<path d=\"M2 9h4m16 0h-4M9 20a7 7 0 0 1-7-7V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a7 7 0 0 1-7 7Z\"/><path d=\"M2 13a7 7 0 0 1 7 7m6 0a7 7 0 0 1 7-7\"/>",
  "toy-brick": "<rect width=\"18\" height=\"12\" x=\"3\" y=\"8\" rx=\"1\"/><path d=\"M10 8V5c0-.6-.4-1-1-1H6a1 1 0 0 0-1 1v3m14 0V5c0-.6-.4-1-1-1h-3a1 1 0 0 0-1 1v3\"/>",
  "pram": "<path d=\"M18.7 4.4L14.5 10M13 10V2a8.1 8.1 0 0 1 8 8v1c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3v-1h18M8.2 18.4l3.3-4.4\"/><circle cx=\"7\" cy=\"20\" r=\"2\"/><path d=\"M15.8 18.4L5.6 4.8A1.94 1.94 0 0 0 2 6\"/><circle cx=\"17\" cy=\"20\" r=\"2\"/>",
  "backpack": "<path d=\"M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm4 0h8m-8 8h8\"/><path d=\"M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2\"/>",
  "book-bookmark": "<path d=\"M10 2v7.751a.25.25 0 0 0 .407.195l2.28-1.834a.5.5 0 0 1 .627 0l2.28 1.834A.25.25 0 0 0 16 9.751V2\"/><path d=\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20\"/>",
  "library-big": "<rect width=\"8\" height=\"18\" x=\"3\" y=\"3\" rx=\"1\"/><path d=\"M7 3v18m13.4-2.1c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z\"/>",
  "book-open-text": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 5v16m4-8h2m-2-4h2m2.001 10A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2a5 5 0 0 1 4-2zM6 13h2M6 9h2\"/>",
  "microscope": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18h8M3 22h18m-7 0a7 7 0 1 0 0-14h-1m-4 6h2m-2-2a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Zm3-6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3\"/>",
  "brain": "<path d=\"M12 18V5m3 8a4.17 4.17 0 0 1-3-4a4.17 4.17 0 0 1-3 4m8.598-6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5\"/><path d=\"M17.997 5.125a4 4 0 0 1 2.526 5.77\"/><path d=\"M18 18a4 4 0 0 0 2-7.464\"/><path d=\"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517\"/><path d=\"M6 18a4 4 0 0 1-2-7.464\"/><path d=\"M6.003 5.125a4 4 0 0 0-2.526 5.77\"/>",
  "arrow-big-up": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-7.086-7.086a1 1 0 0 0-1.414 0l-7.086 7.086a.707.707 0 0 0 .5 1.207H8a1 1 0 0 1 1 1z\"/>",
  "graduation-cap": "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0zM22 10v6\"/><path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\"/>",
  "book-lock": "<path d=\"M18 6V4a2 2 0 1 0-4 0v2m6 9v6a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20\"/><path d=\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10\"/><rect width=\"8\" height=\"5\" x=\"12\" y=\"6\" rx=\"1\"/>",
  "banknote": "<rect width=\"20\" height=\"12\" x=\"2\" y=\"6\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M6 12h.01M18 12h.01\"/>",
  "coins-stack": "<ellipse cx=\"12\" cy=\"6\" rx=\"9\" ry=\"3\"/><path d=\"M3 10c0 1.7 4 3 9 3s9-1.3 9-3M3 14c0 1.7 4 3 9 3s9-1.3 9-3\"/><path d=\"M3 6v12c0 1.7 4 3 9 3s9-1.3 9-3V6\"/>",
  "dollar-sign": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 2v20m5-17H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\"/>",
  "handshake": "<path d=\"m11 17l2 2a1 1 0 1 0 3-3\"/><path d=\"m14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4\"/><path d=\"m21 3l1 11h-2M3 3L2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8\"/>",
  "receipt-text": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 16H8m6-8H8m8 4H8M4 3a1 1 0 0 1 1-1a1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1a1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2a1 1 0 0 1-1-1z\"/>",
  "wallet-minimal": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 14h.01M7 7h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14\"/>",
  "briefcase-business": "<path d=\"M12 12h.01M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m14 7a18.15 18.15 0 0 1-20 0\"/><rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\"/>",
  "credit-card": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\"/><path d=\"M2 10h20M6 14h2\"/>",
  "gem": "<path d=\"M10.5 3L8 9l4 13l4-13l-2.5-6\"/><path d=\"M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3zM2 9h20\"/>",
  "landmark": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 18v-7m1.119-8.795a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949zM14 18v-7m4 7v-7M3 22h18M6 18v-7\"/>",
  "scale": "<path d=\"M12 3v18m7-13l3 8a5 5 0 0 1-6 0zV7\"/><path d=\"M3 7h1a17 17 0 0 0 8-2a17 17 0 0 0 8 2h1M5 8l3 8a5 5 0 0 1-6 0zV7m2 14h10\"/>",
  "credit-card-reader": "<path d=\"M15 16v1m1.963-9.266A1 1 0 0 0 15.999 7H8.003a1 1 0 0 0-.964.734L4.073 18.467A2 2 0 0 0 6 21h12a2 2 0 0 0 1.927-2.532z\"/><path d=\"M2.678 8.5A2 2 0 0 1 2 7V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-.676 1.499M9 21l2-14\"/>",
  "chart-candlestick": "<path d=\"M9 5v4\"/><rect width=\"4\" height=\"6\" x=\"7\" y=\"9\" rx=\"1\"/><path d=\"M9 15v2m8-14v2\"/><rect width=\"4\" height=\"8\" x=\"15\" y=\"5\" rx=\"1\"/><path d=\"M17 13v3M3 3v16a2 2 0 0 0 2 2h16\"/>",
  "crown": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294zM5 21h14\"/>",
  "goal": "<path d=\"M12 13V2l8 4l-8 4\"/><path d=\"M20.561 10.222a9 9 0 1 1-12.55-5.29\"/><path d=\"M8.002 9.997a5 5 0 1 0 8.9 2.02\"/>",
  "percent": "<path d=\"M19 5L5 19\"/><circle cx=\"6.5\" cy=\"6.5\" r=\"2.5\"/><circle cx=\"17.5\" cy=\"17.5\" r=\"2.5\"/>",
  "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\"/><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\"/>",
  "tab-check": "<path d=\"m9 12l2 2l4-4\"/><path d=\"M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14m2 0H2\"/>",
  "coins": "<path d=\"M13.744 17.736a6 6 0 1 1-7.48-7.48M15 6h1v4\"/><path d=\"m6.134 14.768l.866-.5l2 3.464\"/><circle cx=\"16\" cy=\"8\" r=\"6\"/>",
  "currency": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"m3 3l3 3m15-3l-3 3M3 21l3-3m15 3l-3-3\"/>",
  "hand-coins": "<path d=\"M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17\"/><path d=\"m7 21l1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9M2 16l6 6\"/><circle cx=\"16\" cy=\"9\" r=\"2.9\"/><circle cx=\"6\" cy=\"5\" r=\"3\"/>",
  "piggy-bank": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm5-7h.01M2 8v1a2 2 0 0 0 2 2h1\"/>",
  "wallet-cards": "<path d=\"M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21M3 7h18\"/><rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/>",
  "russian-ruble": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 11h8a4 4 0 0 0 0-8H9v18m-3-6h8\"/>",
  "barn": "<path d=\"M22 12H2l2-6l8-4l8 4Z\"/><path d=\"M10 8h4v4h-4zM7 22l10-10v10L7 12Z\"/><path d=\"M21 12v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8\"/>",
  "factory": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 16h.01M16 16h.01M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zm5-3h.01\"/>",
  "hotel": "<path d=\"M10 22v-6.57M12 11h.01M12 7h.01M14 15.43V22m1-6a5 5 0 0 0-6 0m7-5h.01M16 7h.01M8 11h.01M8 7h.01\"/><rect width=\"16\" height=\"20\" x=\"4\" y=\"2\" rx=\"2\"/>",
  "university": "<path d=\"M14 21v-3a2 2 0 0 0-4 0v3m8-9h.01M18 16h.01\"/><path d=\"M22 7a1 1 0 0 0-1-1h-2a2 2 0 0 1-1.143-.359L13.143 2.36a2 2 0 0 0-2.286-.001L6.143 5.64A2 2 0 0 1 5 6H3a1 1 0 0 0-1 1v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2zM6 12h.01M6 16h.01\"/><circle cx=\"12\" cy=\"10\" r=\"2\"/>",
  "building-complex": "<path d=\"M10 12h4m-4-4h4m0 13v-3a2 2 0 0 0-4 0v3\"/><path d=\"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2\"/><path d=\"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16\"/>",
  "farm": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 14V4.5a2.5 2.5 0 0 0-5 0V14m5-6l6-5l8 6m-2-5v10m-8-4h4v4h-4zM2 14h20M2 22l5-8m0 8l5-8m10 8H12l5-8m-2 4h7\"/>",
  "house-plus": "<path d=\"M12.35 21H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v2.35\"/><path d=\"M14.8 12.4a1 1 0 0 0-.8-.4h-4a1 1 0 0 0-1 1v8m6-3h6m-3-3v6\"/>",
  "warehouse": "<path d=\"M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11\"/><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8zM6 13h12M6 17h12\"/>",
  "castle": "<path d=\"M10 5V3m4 2V3m1 18v-3a3 3 0 0 0-6 0v3m9-18v8m0-6H6m16 6H2\"/><path d=\"M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9m4-6v8\"/>",
  "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>",
  "house-roof": "<path d=\"M2.6 10.4a2.12 2.12 0 1 0 3.02 2.98L12 7l6.4 6.4a2.12 2.12 0 1 0 2.979-3.021L13.7 2.7a2.4 2.4 0 0 0-3.404.004Z\"/><path d=\"M20 14v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6\"/><path d=\"M14 22v-6a2 2 0 0 0-4 0v6\"/>",
  "church": "<path d=\"M10 9h4m-2-2v5m2 9v-3a2 2 0 0 0-4 0v3\"/><path d=\"m18 9l3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9\"/><path d=\"M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14\"/>",
  "school": "<path d=\"M14 21v-3a2 2 0 0 0-4 0v3m8-16.067V21M4 6l7.106-3.79a2 2 0 0 1 1.788 0L20 6\"/><path d=\"m6 11l-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11M6 4.933V21\"/><circle cx=\"12\" cy=\"9\" r=\"2\"/>",
  "dome": "<path d=\"M10 21v-3a2 2 0 0 1 4 0v3M12 2v2m6 8v9\"/><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1zM4 12a8 8 0 0 1 16 0M6 12v9\"/>",
  "person-standing": "<circle cx=\"12\" cy=\"5\" r=\"1\"/><path d=\"m9 20l3-6l3 6M6 8l6 2l6-2m-6 2v4\"/>",
  "square-user-round": "<path d=\"M18 21a6 6 0 0 0-12 0\"/><circle cx=\"12\" cy=\"11\" r=\"4\"/><rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/>",
  "speech": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.8 5.8 0 0 1 .029 2.758L2 20m17.8-2.2a7.5 7.5 0 0 0 .003-10.603M17 15a3.5 3.5 0 0 0-.025-4.975\"/>",
  "ear": "<path d=\"M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0\"/><path d=\"M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4\"/>",
  "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>",
  "user-star": "<path d=\"M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535zM8 15H7a4 4 0 0 0-4 4v2\"/><circle cx=\"10\" cy=\"7\" r=\"4\"/>",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/>",
  "user-group": "<path d=\"M17 21v-1a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1m12-11h1a2 2 0 0 1 2 2v1M5 10H4a2 2 0 0 0-2 2v1\"/><circle cx=\"12\" cy=\"11\" r=\"3\"/><circle cx=\"18\" cy=\"4\" r=\"2\"/><circle cx=\"6\" cy=\"4\" r=\"2\"/>",
  "camera": "<path d=\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\"/><circle cx=\"12\" cy=\"13\" r=\"3\"/>",
  "headset": "<path d=\"M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z\"/><path d=\"M21 16v2a4 4 0 0 1-4 4h-5\"/>",
  "monitor": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"3\" rx=\"2\"/><path d=\"M8 21h8m-4-4v4\"/>",
  "printer": "<path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6\"/><rect width=\"12\" height=\"8\" x=\"6\" y=\"14\" rx=\"1\"/>",
  "tv": "<path d=\"m17 2l-5 5l-5-5\"/><rect width=\"20\" height=\"15\" x=\"2\" y=\"7\" rx=\"2\"/>",
  "cpu": "<path d=\"M12 20v2m0-20v2m5 16v2m0-20v2M2 12h2m-2 5h2M2 7h2m16 5h2m-2 5h2M20 7h2M7 20v2M7 2v2\"/><rect width=\"16\" height=\"16\" x=\"4\" y=\"4\" rx=\"2\"/><rect width=\"8\" height=\"8\" x=\"8\" y=\"8\" rx=\"1\"/>",
  "keyboard": "<path d=\"M10 8h.01M12 12h.01M14 8h.01M16 12h.01M18 8h.01M6 8h.01M7 16h10m-9-4h.01\"/><rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\"/>",
  "monitor-smartphone": "<path d=\"M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8m-2 4v-3.96v3.15M7 19h5\"/><rect width=\"6\" height=\"10\" x=\"16\" y=\"12\" rx=\"2\"/>",
  "smartphone": "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\"/><path d=\"M12 18h.01\"/>",
  "video": "<path d=\"m16 13l5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5\"/><rect width=\"14\" height=\"12\" x=\"2\" y=\"6\" rx=\"2\"/>",
  "drone": "<path d=\"M10 10L7 7m3 7l-3 3m7-7l3-3m-3 7l3 3M14.205 4.139a4 4 0 1 1 5.439 5.863M19.637 14a4 4 0 1 1-5.432 5.868M4.367 10a4 4 0 1 1 5.438-5.862m-.01 15.724a4 4 0 1 1-5.429-5.873\"/><rect width=\"4\" height=\"8\" x=\"10\" y=\"8\" rx=\"1\"/>",
  "laptop": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2zm2.054 10.987H3.946\"/>",
  "mouse": "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"7\"/><path d=\"M12 6v4\"/>",
  "tablet": "<rect width=\"16\" height=\"20\" x=\"4\" y=\"2\" rx=\"2\" ry=\"2\"/><path d=\"M12 18h.01\"/>",
  "router": "<rect width=\"20\" height=\"8\" x=\"2\" y=\"14\" rx=\"2\"/><path d=\"M6.01 18H6m4.01 0H10m5-8v4m2.84-6.83a4 4 0 0 0-5.66 0m8.48-2.83a8 8 0 0 0-11.31 0\"/>",
  "headphones": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3\"/>",
  "mic": "<path d=\"M12 19v3m7-12v2a7 7 0 0 1-14 0v-2\"/><rect width=\"6\" height=\"13\" x=\"9\" y=\"2\" rx=\"3\"/>",
  "phone": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233a14 14 0 0 0 6.392 6.384\"/>",
  "tablet-smartphone": "<rect width=\"10\" height=\"14\" x=\"3\" y=\"8\" rx=\"2\"/><path d=\"M5 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2.4M8 18h.01\"/>",
  "axe": "<path d=\"m14 12l-8.381 8.38a1 1 0 0 1-3.001-3L11 9\"/><path d=\"M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z\"/>",
  "drill": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3a1 1 0 0 1 1-1zm3-8H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1l-.81 3.242a1 1 0 0 1-.97.758H8m6-10h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3m4-2h4M5 10l-2 8m4 0l2-8\"/>",
  "paint-bucket": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11 7L6 2m12.992 10H2.041m19.104 6.38A3.34 3.34 0 0 1 20 16.5a3.3 3.3 0 0 1-1.145 1.88c-.575.46-.855 1.02-.855 1.595A2 2 0 0 0 20 22a2 2 0 0 0 2-2.025c0-.58-.285-1.13-.855-1.595M8.5 4.5l2.148-2.148a1.205 1.205 0 0 1 1.704 0l7.296 7.296a1.205 1.205 0 0 1 0 1.704l-7.592 7.592a3.615 3.615 0 0 1-5.112 0l-3.888-3.888a3.615 3.615 0 0 1 0-5.112L5.67 7.33\"/>",
  "ruler": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Zm-6.8-2.8l2-2m-5-1l2-2m-5-1l2-2m7 11l2-2\"/>",
  "bolt": "<path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/>",
  "hammer": "<path d=\"m15 12l-9.373 9.373a1 1 0 0 1-3.001-3L12 9m6 6l4-4\"/><path d=\"m21.5 11.5l-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5\"/>",
  "paint-roller": "<rect width=\"16\" height=\"6\" x=\"2\" y=\"2\" rx=\"2\"/><path d=\"M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2\"/><rect width=\"4\" height=\"6\" x=\"8\" y=\"16\" rx=\"1\"/>",
  "shovel": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M21.56 4.56a1.5 1.5 0 0 1 0 2.122l-.47.47a3 3 0 0 1-4.212-.03a3 3 0 0 1 0-4.243l.44-.44a1.5 1.5 0 0 1 2.121 0zM3 22a1 1 0 0 1-1-1v-3.586a1 1 0 0 1 .293-.707l3.355-3.355a1.205 1.205 0 0 1 1.704 0l3.296 3.296a1.205 1.205 0 0 1 0 1.704l-3.355 3.355a1 1 0 0 1-.707.293zm6-7l7.879-7.878\"/>",
  "broom": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13.5 10.5L22 2m-7.266 11.841a2 2 0 0 0-.314-2.42L12.58 9.58a2 2 0 0 0-2.421-.314l-7.657 4.461A1 1 0 0 0 2.3 15.3l6.403 6.403a1 1 0 0 0 1.571-.204zM5 18l2-2m.699-5.3l5.602 5.601\"/>",
  "paintbrush": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m14.622 17.897l-10.68-2.913M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0zM9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15\"/>",
  "pencil": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4\"/>",
  "wrench": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z\"/>",
  "brush-cleaning": "<path d=\"m16 22l-1-4m4-4a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1\"/><path d=\"M19 14H5l-1.973 6.767A1 1 0 0 0 4 22h16a1 1 0 0 0 .973-1.233zM8 22l1-4\"/>",
  "paintbrush-vertical": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 2v2m4-2v4m3-4a1 1 0 0 1 1 1v9H6V3a1 1 0 0 1 1-1zM6 12a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h2a1 1 0 0 1 1 1v2.9a2 2 0 1 0 4 0V17a1 1 0 0 1 1-1h2a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1\"/>",
  "pencil-ruler": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 7L8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13m1-7l2-2m8 12l2-2m-3-3l4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4\"/>",
  "gavel": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m14 13l-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381M16 16l6-6m-.5.5l-8-8M8 8l6-6M8.5 7.5l8 8\"/>",
  "cactus": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 8v6a2 2 0 0 0 2 2h2m6-2h2a2 2 0 0 0 2-2V6M9 22V5a3 3 0 1 1 6 0v17m-8 0h10\"/>",
  "flower-stem": "<path d=\"M9 8h1m2-3v1m3 2h-1\"/><circle cx=\"12\" cy=\"8\" r=\"2\"/><path d=\"M12 11a3 3 0 1 1-3-3a3 3 0 1 1 3-3a3 3 0 1 1 3 3a3 3 0 1 1-3 3m0-1v12m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5\"/>",
  "mountain-snow": "<path d=\"m8 3l4 8l5-5l5 15H2z\"/><path d=\"M4.14 15.08q3.93-2.355 7.86.42c2.74 1.94 5.49 2 8.23.19\"/>",
  "sprout": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4a4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3M4 9a5 5 0 0 1 8 4a5 5 0 0 1-8-4m1 12h14\"/>",
  "waves-horizontal": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 12q2.5 2 5 0t5 0t5 0t5 0M2 19q2.5 2 5 0t5 0t5 0t5 0M2 5q2.5 2 5 0t5 0t5 0t5 0\"/>",
  "cloud": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9\"/>",
  "flower-lotus": "<path d=\"M12 20c0-5.5-4.5-10-10-10c0 5.5 4.5 10 10 10\"/><path d=\"M9.7 8.3c-1.8-2-3.8-3.1-3.8-3.1s-.8 2.5-.5 5.4\"/><path d=\"M15 12.9V12c0-4.4-3-8-3-8s-3 3.6-3 8v.9\"/><path d=\"M18.6 10.6c.3-2.9-.5-5.4-.5-5.4s-2 1-3.8 3.1\"/><path d=\"M12 20c5.5 0 10-4.5 10-10c-5.5 0-10 4.5-10 10\"/>",
  "flower-rose-single": "<path d=\"M18 9.52a4.04 4.04 0 1 1 2-3.47\"/><circle cx=\"17\" cy=\"7.8\" r=\"2\"/><path d=\"m14 2.5l-2 1.3a6 6 0 1 0 6 10.4l2-1.2a4 4 0 0 0-4-6.95\"/><path d=\"M9.77 12C4 15 2 22 2 22\"/><path d=\"M13 20s-5 3-9.2-2c0 0 5.2-3 9.2 2\"/>",
  "tree-palm": "<path d=\"M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1l1 1h4m3-.86A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1l-1 1h-3\"/><path d=\"M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25l.7-.7l.71-.71l2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35\"/><path d=\"M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14\"/>",
  "tent-tree": "<circle cx=\"4\" cy=\"4\" r=\"2\"/><path d=\"m14 5l3-3l3 3m-6 5l3-3l3 3m-3 4V2m0 12H7l-5 8h20Zm-9 0v8m1-8l5 8\"/>",
  "flame-kindling": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2M5 22l14-4M5 18l14 4\"/>",
  "leaf": "<path d=\"M11 20a10 10 0 0 0 10-10a25.9 25.9 0 0 0-1.04-7.281a1 1 0 0 0-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0 0 11 20\"/><path d=\"M2 21a5 5 0 0 1 2.911-4.544C7.613 15.212 8.351 15.24 11 13\"/>",
  "shrub": "<path d=\"M12 22v-5.172a2 2 0 0 0-.586-1.414L9.5 13.5m5 1L12 17\"/><path d=\"M17 8.8A6 6 0 0 1 13.8 20H10A6.5 6.5 0 0 1 7 8a5 5 0 0 1 10 0z\"/>",
  "tree-pine": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m17 14l3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7zm-5 8v-3\"/>",
  "trees": "<path d=\"M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0m-3 6v6m6-3v3\"/><path d=\"M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5\"/>",
  "flower": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 16.5A4.5 4.5 0 1 1 7.5 12A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5a4.5 4.5 0 1 1-4.5 4.5m0-9V9m-4.5 3H9m7.5 0H15m-3 4.5V15M8 8l1.88 1.88m4.24 0L16 8m-8 8l1.88-1.88m4.24 0L16 16\"/>",
  "moon": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"/>",
  "snowflake": "<path d=\"m10 20l-1.25-2.5L6 18m4-14L8.75 6.5L6 6m8 14l1.25-2.5L18 18M14 4l1.25 2.5L18 6\"/><path d=\"m17 21l-3-6h-4m7-12l-3 6l1.5 3M2 12h6.5L10 9m10 1l-1.5 2l1.5 2\"/><path d=\"M22 12h-6.5L14 15M4 10l1.5 2L4 14m3 7l3-6l-1.5-3M7 3l3 6h4\"/>",
  "bird": "<path d=\"M16 7h.01M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20\"/><path d=\"m20 7l2 .5l-2 .5M10 18v3m4-3.25V21m-7-3a6 6 0 0 0 3.84-10.61\"/>",
  "butterfly": "<path d=\"M15.8 2C12 3.8 12 9 12 9s0-5.2-3.8-7M12 9v11\"/><path d=\"M20 5c-3.5 0-6.5 3.9-8 6.3C10.5 8.9 7.5 5 4 5a2 2 0 0 0-2 2c0 2.3.6 4.4 1.5 5.6C4 13.5 4.9 14 6 14h2c-.9.4-2.1.9-2.6 1.5c-1.6 1.6-.9 3.4.7 4.9c1.6 1.6 3.4 2.3 4.9.7c.3-.3 1-1.1 1-1.1s.6.8 1 1.1c1.6 1.6 3.4.9 4.9-.7c1.6-1.6 2.3-3.4.7-4.9c-.5-.5-1.7-1.1-2.6-1.5h2c1.1 0 2-.5 2.5-1.4c.9-1.2 1.5-3.3 1.5-5.6a2 2 0 0 0-2-2\"/>",
  "elephant-face": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11 10a4 4 0 0 0 4 4a2 2 0 0 1 0 4a7 7 0 0 1-2.8-.6c-.5-.2-.9 0-1 .6l-.1 1l-.9.9c-.4.4-.3.9.2 1.2c1.4.6 3 .9 4.6.9c3.3 0 6-2.7 6-6V8a4 4 0 0 0-4-4h-4.6c-.7-1.2-2-2-3.4-2H6C4.3 2 3 3.3 3 5v1a7 7 0 0 0 7 7h2.4m3.1-3H15\"/>",
  "paw-print": "<circle cx=\"11\" cy=\"4\" r=\"2\"/><circle cx=\"18\" cy=\"8\" r=\"2\"/><circle cx=\"20\" cy=\"16\" r=\"2\"/><path d=\"M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045q-.64-2.065-2.7-2.705A3.5 3.5 0 0 1 5.5 10Z\"/>",
  "turtle": "<path d=\"m12 10l2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4zM4.82 7.9L8 10m7.18-2.1L12 10\"/><path d=\"M16.93 10H20a2 2 0 0 1 0 4H2\"/>",
  "bone": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5a.5.5 0 0 1-.5-.5a2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z\"/>",
  "cat": "<path d=\"M12 5c.67 0 1.35.09 2 .26c1.78-2 5.03-2.84 6.42-2.26c1.4.58-.42 7-.42 7c.57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44c0 0-1.89-6.42-.5-7s4.72.23 6.5 2.23A9 9 0 0 1 12 5m-4 9v.5m8-.5v.5\"/><path d=\"M11.25 16.25h1.5L12 17z\"/>",
  "fish": "<path d=\"M6.5 12c.94-3.46 4.94-6 8.5-6s6.06 2.54 7 6c-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6M18 12v.5\"/><path d=\"M16 17.93a9.77 9.77 0 0 1 0-11.86m-9 4.6C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5c-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33\"/><path d=\"M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4m0 11.86l-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98\"/>",
  "rat": "<path d=\"M13 22H4a2 2 0 0 1 0-4h12m-2.764 0a3 3 0 0 0-2.2-5M16 9h.01\"/><path d=\"M16.82 3.94a3 3 0 1 1 3.237 4.868l1.815 2.587a1.5 1.5 0 0 1-1.5 2.1l-2.872-.453a3 3 0 0 0-3.5 3\"/><path d=\"M17 4.988a3 3 0 1 0-5.2 2.052A7 7 0 0 0 4 14.015A4 4 0 0 0 8 18\"/>",
  "rabbit": "<path d=\"M13 16a3 3 0 0 1 2.24 5M18 12h.01\"/><path d=\"M18 21h-8a4 4 0 0 1-4-4a7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3\"/><path d=\"M20 8.54V4a2 2 0 1 0-4 0v3m-8.388 5.524a3 3 0 1 0-1.6 4.3\"/>",
  "bug": "<path d=\"M12 20v-9m2-4a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4zm.12-3.12L16 2\"/><path d=\"M21 21a4 4 0 0 0-3.81-4M21 5a4 4 0 0 1-3.55 3.97M22 13h-4M3 21a4 4 0 0 1 3.81-4M3 5a4 4 0 0 0 3.55 3.97M6 13H2M8 2l1.88 1.88M9 7.13V6a3 3 0 1 1 6 0v1.13\"/>",
  "cow-head": "<path d=\"M17.8 15.1a10 10 0 0 0 .9-7.1h.3c1.7 0 3-1.3 3-3V3h-3c-1.3 0-2.4.8-2.8 1.9a10 10 0 0 0-8.4 0C7.4 3.8 6.3 3 5 3H2v2c0 1.7 1.3 3 3 3h.3a10 10 0 0 0 .9 7.1M9 9.5v.5m6-.5v.5\"/><path d=\"M15 22a4 4 0 1 0-3-6.6A4 4 0 1 0 9 22Zm-6-4h.01M15 18h.01\"/>",
  "horse-head": "<path d=\"M11.5 12H11m-6 3a4 4 0 0 0 4 4h7.8l.3.3a3 3 0 0 0 4-4.46L12 7c0-3-1-5-1-5S8 3 8 7c-4 1-6 3-6 3\"/><path d=\"M6.14 17.8S4 19 2 22\"/>",
  "shrimp": "<path d=\"M10 2a3.28 3.28 0 0 0 3.227 1.798l6.17-.561A1 1 0 1 1 19.614 8H8.5a6.44 6.44 0 0 0-5.63 9.75A6.5 6.5 0 0 0 8.5 21c1.38 0 2-.5 2.5-1\"/><path d=\"M10 8a8.5 8.5 0 0 0 0 8\"/><path d=\"M11 22c-.5-.5-1.12-1-2.5-1a1 1 0 0 1 0-5H12a7 7 0 0 0 7-7V8m-6 4h.01\"/><path d=\"M8 16c-2 0-4.5-4-4-6\"/>",
  "bear-face": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m6 7l.5.5M18 7l-.5.5m3.3-3.3c-1.6-1.6-4.1-1.6-5.7 0l-1 1a13.6 13.6 0 0 0-4.2 0l-1-1a4 4 0 0 0-5.8 5.55A7 7 0 0 0 2 13.5C2 18.2 6.5 22 12 22s10-3.8 10-8.5a7 7 0 0 0-1.1-3.8c1.5-1.6 1.5-4-.1-5.5M10 12v-.5m4 .5v-.5m0 4.5h-4m2 0v2\"/>",
  "panda": "<path d=\"M11.25 17.25h1.5L12 18zM15 12l2 2m.902-7.401a8 8 0 0 0-.5-.5\"/><path d=\"M2 14.5C2 19.47 6.48 22 12 22s10-2.53 10-7.5a10 10 0 0 0-1.3-4.83a4.5 4.5 0 1 0-7.05-5.5a8 8 0 0 0-3.3 0a4.5 4.5 0 1 0-7.04 5.5A10 10 0 0 0 2 14.5\"/><path d=\"M6.099 6.599a8 8 0 0 1 .5-.5M9 12l-2 2\"/>",
  "bull-head": "<path d=\"M7 10a5 5 0 0 1-4-8a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4a5 5 0 0 1-4 8\"/><path d=\"M6.4 15c-.3-.6-.4-1.3-.4-2c0-4 3-3 3-7m1 6.5v1.6m7.6.9c.3-.6.4-1.3.4-2c0-4-3-3-3-7m-1 6.5v1.6\"/><path d=\"M15 22a4 4 0 1 0-3-6.7A4 4 0 1 0 9 22Zm-6-4h.01M15 18h.01\"/>",
  "dog": "<path d=\"M11.25 16.25h1.5L12 17zM16 14v.5\"/><path d=\"M4.42 11.247A13.2 13.2 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.7 11.7 0 0 0-.493-3.309M8 14v.5\"/><path d=\"M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5c-1.931.722-3.576-.297-3.656-1c-.113-.994 1.177-6.53 4-7c1.923-.321 3.651.845 3.651 2.235A7.5 7.5 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277c2.823.47 4.113 6.006 4 7c-.08.703-1.725 1.722-3.656 1c-1.261-.472-1.855-1.45-2.239-2.5\"/>",
  "owl": "<ellipse cx=\"12\" cy=\"9\" rx=\"8\" ry=\"7\"/><path d=\"M12 9a4 4 0 1 1 8 0v12h-4C9.4 21 4 15.6 4 9a4 4 0 1 1 8 0v1M8 9h.01M16 9h.01\"/><path d=\"M20 21a3.9 3.9 0 1 1 0-7.8m-10 6.2V22m4-1.15V22\"/>",
  "squirrel": "<path d=\"M15.236 22a3 3 0 0 0-2.2-5\"/><path d=\"M16 20a3 3 0 0 1 3-3h1a2 2 0 0 0 2-2v-2a4 4 0 0 0-4-4V4m0 9h.01\"/><path d=\"M18 6a4 4 0 0 0-4 4a7 7 0 0 0-7 7c0-5 4-5 4-10.5a4.5 4.5 0 1 0-9 0a2.5 2.5 0 0 0 5 0C7 10 3 11 3 17c0 2.8 2.2 5 5 5h10\"/>",
  "astroid": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12.983 21.186a1 1 0 0 1-1.966 0a10 10 0 0 0-8.203-8.203a1 1 0 0 1 0-1.966a10 10 0 0 0 8.203-8.203a1 1 0 0 1 1.966 0a10 10 0 0 0 8.203 8.203a1 1 0 0 1 0 1.966a10 10 0 0 0-8.203 8.203\"/>",
  "boxes": "<path d=\"M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3zM7 16.5l-4.74-2.85M7 16.5l5-3m-5 3v5.17m5-8.17V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5zm5 3l-5-3m5 3l4.74-2.85M17 16.5v5.17\"/><path d=\"M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3l5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0zM12 8L7.26 5.15M12 8l4.74-2.85M12 13.5V8\"/>",
  "club": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17.28 9.05a5.5 5.5 0 1 0-10.56 0A5.5 5.5 0 1 0 12 17.66a5.5 5.5 0 1 0 5.28-8.6ZM12 17.66V22\"/>",
  "cylinder": "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"/><path d=\"M3 5v14a9 3 0 0 0 18 0V5\"/>",
  "line-squiggle": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 3.5c5-2 7 2.5 3 4C1.5 10 2 15 5 16c5 2 9-10 14-7s.5 13.5-4 12c-5-2.5.5-11 6-2\"/>",
  "shapes": "<path d=\"M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z\"/><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\"/><circle cx=\"17.5\" cy=\"17.5\" r=\"3.5\"/>",
  "star": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z\"/>",
  "badge": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3.85 8.62a4 4 0 0 1 4.78-4.77a4 4 0 0 1 6.74 0a4 4 0 0 1 4.78 4.78a4 4 0 0 1 0 6.74a4 4 0 0 1-4.77 4.78a4 4 0 0 1-6.75 0a4 4 0 0 1-4.78-4.77a4 4 0 0 1 0-6.76\"/>",
  "circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/>",
  "cone": "<path d=\"m20.9 18.55l-8-15.98a1 1 0 0 0-1.8 0l-8 15.98\"/><ellipse cx=\"12\" cy=\"19\" rx=\"9\" ry=\"3\"/>",
  "diamond": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0Z\"/>",
  "octagon": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z\"/>",
  "spade": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 18v4M2 14.499a5.5 5.5 0 0 0 9.591 3.675a.6.6 0 0 1 .818.001A5.5 5.5 0 0 0 22 14.5c0-2.29-1.5-4-3-5.5l-5.492-5.312a2 2 0 0 0-3-.02L5 8.999c-1.5 1.5-3 3.2-3 5.5\"/>",
  "triangle": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/>",
  "blocks": "<path d=\"M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2\"/><rect width=\"8\" height=\"8\" x=\"14\" y=\"2\" rx=\"1\"/>",
  "circle-dashed": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10.1 2.182a10 10 0 0 1 3.8 0m0 19.636a10 10 0 0 1-3.8 0m7.509-18.097a10 10 0 0 1 2.69 2.7M2.182 13.9a10 10 0 0 1 0-3.8m18.097 7.509a10 10 0 0 1-2.7 2.69M21.818 10.1a10 10 0 0 1 0 3.8M3.721 6.391a10 10 0 0 1 2.7-2.69m-.03 16.578a10 10 0 0 1-2.69-2.7\"/>",
  "cross": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a1 1 0 0 1 1-1h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4a1 1 0 0 1-1-1V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a1 1 0 0 1-1 1z\"/>",
  "hexagon": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16\"/>",
  "pentagon": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10.83 2.38a2 2 0 0 1 2.34 0l8 5.74a2 2 0 0 1 .73 2.25l-3.04 9.26a2 2 0 0 1-1.9 1.37H7.04a2 2 0 0 1-1.9-1.37L2.1 10.37a2 2 0 0 1 .73-2.25z\"/>",
  "sparkle": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\"/>",
  "ungroup": "<rect width=\"10\" height=\"7\" x=\"11\" y=\"14\" rx=\"2\"/><rect width=\"10\" height=\"7\" x=\"3\" y=\"3\" rx=\"2\"/>",
  "box": "<path d=\"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"m3.3 7l8.7 5l8.7-5M12 22V12\"/>",
  "circle-small": "<circle cx=\"12\" cy=\"12\" r=\"6\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/>",
  "cuboid": "<path d=\"M10 22v-8M2.336 8.89L10 14l11.715-7.029\"/><path d=\"M22 14a2 2 0 0 1-.971 1.715l-10 6a2 2 0 0 1-2.138-.05l-6-4A2 2 0 0 1 2 16v-6a2 2 0 0 1 .971-1.715l10-6a2 2 0 0 1 2.138.05l6 4A2 2 0 0 1 22 8z\"/>",
  "hexagons-7": "<path d=\"M5.3 4.3v3.9L2 10.1v3.8l3.3 1.9v3.9l3.4 1.9l3.3-1.9l3.3 1.9l3.4-1.9v-3.9l3.3-1.9v-3.8l-3.3-1.9V4.3l-3.4-1.9L12 4.3L8.7 2.4ZM12 8.2V4.3m6.7 3.9l-3.4 1.9m0 3.8l3.4 1.9M12 19.7v-3.9m-3.3-1.9l-3.4 1.9m0-7.6l3.4 1.9\"/><path d=\"m8.7 13.9l3.3 1.9l3.3-1.9v-3.8L12 8.2l-3.3 1.9Z\"/>",
  "pyramid": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2.5 16.88a1 1 0 0 1-.32-1.43l9-13.02a1 1 0 0 1 1.64 0l9 13.01a1 1 0 0 1-.32 1.44l-8.51 4.86a2 2 0 0 1-1.98 0ZM12 2v20\"/>",
  "square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" rx=\"2\"/>",
  "sparkles": "<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4\"/><circle cx=\"4\" cy=\"20\" r=\"2\"/>",
  "archive": "<rect width=\"20\" height=\"5\" x=\"2\" y=\"3\" rx=\"1\"/><path d=\"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8m-10 4h4\"/>",
  "bow-arrow": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 3h4v4m-2.425 4.082a13 13 0 0 1 1.048 9.027a1.17 1.17 0 0 1-1.914.597L14 17m-7-7L3.29 6.29a1.17 1.17 0 0 1 .6-1.91a13 13 0 0 1 9.03 1.05M7 14a1.7 1.7 0 0 0-1.207.5l-2.646 2.646A.5.5 0 0 0 3.5 18H5a1 1 0 0 1 1 1v1.5a.5.5 0 0 0 .854.354L9.5 18.207A1.7 1.7 0 0 0 10 17v-2a1 1 0 0 0-1-1zm2.707.293L21 3\"/>",
  "galaxy": "<path d=\"M16.005 15.108a5.041 6.52 28.25 0 0-8.008-6.217a5.041 6.52 28.25 0 0 8.008 6.217A11.884 7.288-60.76 0 1 4.029 7.001M17 21h.01M7 3h.01\"/><path d=\"M7.997 8.891a11.885 7.288-60.756 0 1 11.977 8.107\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>",
  "hand-heart": "<path d=\"M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16\"/><path d=\"m14.45 13.39l5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837a.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95M2 15l6 6\"/><path d=\"m7 20l1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91\"/>",
  "pac-man": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m12 12l7.4 6.7a10 10 0 1 1 0-13.4Zm6 0h.01M22 12h.01\"/>",
  "umbrella": "<path d=\"M12 13v7a2 2 0 0 0 4 0M12 2v2\"/><path d=\"M20.992 13a1 1 0 0 0 .97-1.274a10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z\"/>",
  "atom": "<circle cx=\"12\" cy=\"12\" r=\"1\"/><path d=\"M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9c-4.54-4.52-9.87-6.54-11.9-4.5c-2.04 2.03-.02 7.36 4.5 11.9c4.54 4.52 9.87 6.54 11.9 4.5\"/><path d=\"M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9c-2.03-2.04-7.36-.02-11.9 4.5c-4.52 4.54-6.54 9.87-4.5 11.9c2.03 2.04 7.36.02 11.9-4.5\"/>",
  "bubbles": "<path d=\"M7.001 15.085A1.5 1.5 0 0 1 9 16.5\"/><circle cx=\"18.5\" cy=\"8.5\" r=\"3.5\"/><circle cx=\"7.5\" cy=\"16.5\" r=\"5.5\"/><circle cx=\"7.5\" cy=\"4.5\" r=\"2.5\"/>",
  "fingerprint-pattern": "<path d=\"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88m4.29-.98c.12-.6.43-2.3.5-3.02M2 12a10 10 0 0 1 18-6M2 16h.01m19.79 0c.2-2 .131-5.354 0-6\"/><path d=\"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2m2.31 12c.21-.66.45-1.32.57-2M9 6.8a6 6 0 0 1 9 5.2v2\"/>",
  "ghost": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 10v1m-7.472 9.472a1.6 1.6 0 0 1 2.277 0l1.057 1.056a1.6 1.6 0 0 0 2.276 0l1.057-1.056a1.6 1.6 0 0 1 2.277 0l1.114 1.114a1.4 1.4 0 0 0 2.414-1V10a8 8 0 0 0-16 0v10.586a1.4 1.4 0 0 0 2.414 1zM9 10v1\"/>",
  "hand-helping": "<path d=\"M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14\"/><path d=\"m7 18l1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9M2 13l6 6\"/>",
  "refresh-ccw": "<path d=\"M21 12a9 9 0 0 0-9-9a9.75 9.75 0 0 0-6.74 2.74L3 8\"/><path d=\"M3 3v5h5m-5 4a9 9 0 0 0 9 9a9.75 9.75 0 0 0 6.74-2.74L21 16\"/><path d=\"M16 16h5v5\"/>",
  "siren": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 18v-6a5 5 0 1 1 10 0v6M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2zm16-9h1m-3.5-7.5L18 5M2 12h1m9-10v1M4.929 4.929l.707.707M12 12v6\"/>",
  "yarn-ball": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M10 6h10m-6 4h7.8M7.2 3.2l13.6 13.6M4 6l15.3 15.3c.4.4 1.2.7 1.7.7h1M2.2 10.2l11.6 11.6\"/>",
  "bell": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10.268 21a2 2 0 0 0 3.464 0m-10.47-5.674A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\"/>",
  "cigarette": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14m1-8c0-2.5-2-2.5-2-5m5 13a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1m1-4c0-2.5-2-2.5-2-5M7 12v4\"/>",
  "flag": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528\"/>",
  "gift": "<path d=\"M12 7v14m8-10v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8m3.5-4a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5a1 1 0 0 1 0 5\"/><rect width=\"18\" height=\"4\" x=\"3\" y=\"7\" rx=\"1\"/>",
  "hand-metal": "<path d=\"M18 12.5V10a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4m0-.4V9a2 2 0 1 0-4 0v2m0-.5V5a2 2 0 1 0-4 0v9\"/><path d=\"m7 15l-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5\"/>",
  "planet": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M4.05 13c-1.7 1.8-2.5 3.5-1.8 4.5c1.1 1.9 6.4 1 11.8-2s8.9-7.1 7.7-9c-.6-1-2.4-1.2-4.7-.7\"/>",
  "shield-half": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zm-8 9V2\"/>",
  "telescope": "<path d=\"m10.065 12.493l-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44m-2.875 6.493l4.332-.924M16 21l-3.105-6.21\"/><path d=\"M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455zM6.158 8.633l1.114 4.456M8 21l3.105-6.21\"/><circle cx=\"12\" cy=\"13\" r=\"2\"/>",
  "yin-yang": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"7\" r=\".5\"/><path d=\"M12 22a5 5 0 1 0 0-10a5 5 0 1 1 0-10\"/><circle cx=\"12\" cy=\"17\" r=\".5\"/>",
  "biceps-flexed": "<path d=\"M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7c-4.077 0-8.153-.82-10.371-2.462c-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3a2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1\"/><path d=\"M15 14a5 5 0 0 0-7.584 2\"/><path d=\"M9.964 6.825C8.019 7.977 9.5 13 8 15\"/>",
  "compass": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m16.24 7.76l-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\"/>",
  "folder": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\"/>",
  "hand-fist": "<path d=\"M12.035 17.012a3 3 0 0 0-3-3l-.311-.002a.72.72 0 0 1-.505-1.229l1.195-1.195A2 2 0 0 1 10.828 11H12a2 2 0 0 0 0-4H9.243a3 3 0 0 0-2.122.879l-2.707 2.707A4.83 4.83 0 0 0 3 14a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0\"/><path d=\"M13.888 9.662A2 2 0 0 0 17 8V5a2 2 0 1 0-4 0M9 5a2 2 0 1 0-4 0v5m4-3V4a2 2 0 1 1 4 0v3.268\"/>",
  "megaphone": "<path d=\"M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z\"/><path d=\"M6 14a12 12 0 0 0 2.4 7.2a2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14M8 6v8\"/>",
  "sigma": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2\"/>",
  "pen-box": "<path d=\"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\"/><path d=\"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z\"/>",
  "clover": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16.17 7.83L2 22m2.02-10a2.827 2.827 0 1 1 3.81-4.17A2.827 2.827 0 1 1 12 4.02a2.827 2.827 0 1 1 4.17 3.81A2.827 2.827 0 1 1 19.98 12a2.827 2.827 0 1 1-3.81 4.17A2.827 2.827 0 1 1 12 19.98a2.827 2.827 0 1 1-4.17-3.81A1 1 0 1 1 4 12m3.83-4.17l8.34 8.34\"/>",
  "x": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M18 6L6 18M6 6l12 12\"/>",
  "plus": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 12h14m-7-7v14\"/>",
  "chevron-left": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m15 18l-6-6l6-6\"/>",
  "chevron-right": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m9 18l6-6l-6-6\"/>",
  "chevron-down": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m6 9l6 6l6-6\"/>",
  "chevrons-down": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m7 6l5 5l5-5M7 13l5 5l5-5\"/>",
  "search": "<path d=\"m21 21l-4.34-4.34\"/><circle cx=\"11\" cy=\"11\" r=\"8\"/>",
  "chart-pie": "<path d=\"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z\"/><path d=\"M21.21 15.89A10 10 0 1 1 8 2.83\"/>",
  "settings": "<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0a2.34 2.34 0 0 0 3.319 1.915a2.34 2.34 0 0 1 2.33 4.033a2.34 2.34 0 0 0 0 3.831a2.34 2.34 0 0 1-2.33 4.033a2.34 2.34 0 0 0-3.319 1.915a2.34 2.34 0 0 1-4.659 0a2.34 2.34 0 0 0-3.32-1.915a2.34 2.34 0 0 1-2.33-4.033a2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "grip-vertical": "<circle cx=\"9\" cy=\"12\" r=\"1\"/><circle cx=\"9\" cy=\"5\" r=\"1\"/><circle cx=\"9\" cy=\"19\" r=\"1\"/><circle cx=\"15\" cy=\"12\" r=\"1\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><circle cx=\"15\" cy=\"19\" r=\"1\"/>",
  "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>",
  "delete": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm2 4l6 6m0-6l-6 6\"/>",
  "check": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 6L9 17l-5-5\"/>",
  "arrow-left-right": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 3L4 7l4 4M4 7h16m-4 14l4-4l-4-4m4 4H4\"/>",
  "arrow-left": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m12 19l-7-7l7-7m7 7H5\"/>",
  "arrow-right": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 12h14m-7-7l7 7l-7 7\"/>",
  "arrow-up": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m5 12l7-7l7 7m-7 7V5\"/>",
  "arrow-up-right": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 7h10v10M7 17L17 7\"/>",
  "arrow-down-left": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 7L7 17m10 0H7V7\"/>",
  "ellipsis-vertical": "<circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"12\" cy=\"5\" r=\"1\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/>",
  "palette": "<path d=\"M12 22a1 1 0 0 1 0-20a10 9 0 0 1 10 9a5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z\"/><circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\"/><circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\"/><circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\"/><circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/>",
  "circle-slash": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 15l6-6\"/>",
  "circle-dollar-sign": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8m4 2V6\"/>",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"6\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/>",
  "receipt": "<path d=\"M12 17V7m4 1h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8\"/><path d=\"M4 3a1 1 0 0 1 1-1a1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1a1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2a1 1 0 0 1-1-1z\"/>",
  "send": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939\"/>",
  "orbit": "<path d=\"M20.341 6.484A10 10 0 0 1 10.266 21.85m-6.607-4.334A10 10 0 0 1 13.74 2.152\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/><circle cx=\"19\" cy=\"5\" r=\"2\"/><circle cx=\"5\" cy=\"19\" r=\"2\"/>",
  "music": "<path d=\"M9 18V5l12-2v13\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"18\" cy=\"16\" r=\"3\"/>",
  "hand": "<path d=\"M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2m0 4V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2m0 4.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8\"/><path d=\"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\"/>",
  "hard-hat": "<path d=\"M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m0-4a6 6 0 0 1 6 6v3M4 15v-3a6 6 0 0 1 6-6\"/><rect width=\"20\" height=\"4\" x=\"2\" y=\"15\" rx=\"1\"/>",
  "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\"/>",
  "signature": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"m21 17l-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284M3 21h18\"/>",
  "book-open": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 5v16m8.001-2A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2a5 5 0 0 1 4-2z\"/>",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>",
  "trending-up": "<path d=\"M16 7h6v6\"/><path d=\"m22 7l-8.5 8.5l-5-5L2 17\"/>",
  "trending-down": "<path d=\"M16 17h6v-6\"/><path d=\"m22 17l-8.5-8.5l-5 5L2 7\"/>",
  "shield": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/>",
  "peace": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2v20m7.1-2.9L12 12l-7 7\"/>",
  "square-pen": "<path d=\"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\"/><path d=\"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z\"/>",
  "peace-sign": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2v20m7.1-2.9L12 12l-7 7\"/>",
  "hugeicons:dental-tooth": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"  d=\"M9 6c.5.5 1.503.412 3-.824m0 0q-.332-.272-.689-.626c-2.306-2.284-5.446-1.837-6.917 0C3.378 5.82.778 8.98 7.142 20.24c.264.466.789.76 1.354.76c.902 0 1.607-.72 1.636-1.56c.063-1.782.408-3.837 1.868-3.837s1.806 2.055 1.868 3.837c.029.84.734 1.56 1.636 1.56c.565 0 1.09-.294 1.354-.76c6.365-11.261 3.764-14.42 2.748-15.69c-1.471-1.837-4.611-2.284-6.917 0q-.357.353-.689.626\"/>",
  "dental-tooth": "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"  d=\"M9 6c.5.5 1.503.412 3-.824m0 0q-.332-.272-.689-.626c-2.306-2.284-5.446-1.837-6.917 0C3.378 5.82.778 8.98 7.142 20.24c.264.466.789.76 1.354.76c.902 0 1.607-.72 1.636-1.56c.063-1.782.408-3.837 1.868-3.837s1.806 2.055 1.868 3.837c.029.84.734 1.56 1.636 1.56c.565 0 1.09-.294 1.354-.76c6.365-11.261 3.764-14.42 2.748-15.69c-1.471-1.837-4.611-2.284-6.917 0q-.357.353-.689.626\"/>",
  "hugeicons:police-cap": "<path d=\"M2.08 9.734C1.53 12.578 4.006 14 4.006 14h15.989s2.476-1.422 1.925-4.266c-.347-1.791-4.191-4.146-6.99-5.644C13.573 3.363 12.894 3 12 3s-1.573.363-2.93 1.09C6.271 5.588 2.427 7.943 2.08 9.734M4.142 14c-1.474 1.325-1.931 4.576 1.164 5.384c2.057.536 4.337 1.103 5.635 1.422c.523.13.785.194 1.059.194s.536-.064 1.06-.194c1.297-.319 3.577-.886 5.634-1.422c3.095-.808 2.638-4.06 1.164-5.384\"/><path d=\"m10.39 7.73l1.106-.602a1.06 1.06 0 0 1 1.008 0l1.106.602c.29.158.453.48.367.796c-.218.8-.752 2.07-1.977 2.474c-1.225-.404-1.76-1.675-1.977-2.474c-.086-.316.077-.638.367-.796\"/>",
  "police-cap": "<path d=\"M2.08 9.734C1.53 12.578 4.006 14 4.006 14h15.989s2.476-1.422 1.925-4.266c-.347-1.791-4.191-4.146-6.99-5.644C13.573 3.363 12.894 3 12 3s-1.573.363-2.93 1.09C6.271 5.588 2.427 7.943 2.08 9.734M4.142 14c-1.474 1.325-1.931 4.576 1.164 5.384c2.057.536 4.337 1.103 5.635 1.422c.523.13.785.194 1.059.194s.536-.064 1.06-.194c1.297-.319 3.577-.886 5.634-1.422c3.095-.808 2.638-4.06 1.164-5.384\"/><path d=\"m10.39 7.73l1.106-.602a1.06 1.06 0 0 1 1.008 0l1.106.602c.29.158.453.48.367.796c-.218.8-.752 2.07-1.977 2.474c-1.225-.404-1.76-1.675-1.977-2.474c-.086-.316.077-.638.367-.796\"/>"
};

var ICON_MIGRATION_MAP = {
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
  "util-antenna": "antenna",
  "util-plug": "plug",
  "util-water-drop": "droplet",
  "util-tower": "radio-tower",
  "util-flame": "flame",
  "util-electricity": "zap",
  "util-globe-grid": "globe",
  "util-phone": "phone-call",
  "beauty-barber-pole": "barber-pole",
  "beauty-mustache": "mustache",
  "beauty-dispenser": "bottle-dispenser",
  "beauty-scissors": "scissors",
  "beauty-perfume": "bottle-perfume",
  "beauty-scissors-comb": "scissors-hair-comb",
  "beauty-hair-dryer": "hairdryer",
  "beauty-soap-dispenser": "soap-dispenser-droplet",
  "kids-baby": "baby",
  "kids-stroller": "stroller",
  "kids-bottle": "bottle-baby",
  "kids-diaper": "diaper",
  "kids-pram": "pram",
  "edu-book": "book-bookmark",
  "edu-library": "library-big",
  "edu-book-open": "book-open-text",
  "edu-microscope": "microscope",
  "edu-brain": "brain",
  "edu-arrow-up": "arrow-big-up",
  "edu-graduation-cap": "graduation-cap",
  "edu-book-lock": "book-lock",
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

if (typeof window !== 'undefined') {
  window.CATEGORY_ORDER = CATEGORY_ORDER;
  window.ICON_CATEGORIES = ICON_CATEGORIES;
  window.ICON_SECTIONS = ICON_SECTIONS;
  window.LUCIDE_SVG = LUCIDE_SVG;
  window.ICON_MIGRATION_MAP = ICON_MIGRATION_MAP;
}
