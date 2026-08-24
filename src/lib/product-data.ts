/**
 * Product Categories Configuration
 *
 * To add a new category:
 * 1. Add category config to CATEGORIES array
 * 2. Define brands, attributes, and templates
 * 3. That's it! The UI will automatically support the new category
 */

// Attribute types for category-specific fields
export interface AttributeConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

// Template for quick add
export interface ProductTemplate {
  name: string;
  brand: string;
  attributes: Record<string, string>;
  suggestedPrice: number;
}

// Condition option
export interface ConditionOption {
  value: string;
  label: string;
  emoji: string;
  description: string;
}

// Category configuration
export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  brands: string[];
  // Some categories have types/models per brand (e.g., phones, laptops)
  // Others don't (e.g., fashion, books)
  hasModels?: boolean;
  models?: Record<string, string[]>;
  // Category-specific attributes
  attributes: AttributeConfig[];
  // Condition options (uses defaults if not specified)
  conditions?: ConditionOption[];
  // Popular templates for quick add
  templates: ProductTemplate[];
}

// Default conditions (used if category doesn't specify custom ones)
export const DEFAULT_CONDITIONS: ConditionOption[] = [
  { value: 'new', label: 'New', emoji: '✨', description: 'Brand new, unused' },
  { value: 'excellent', label: 'Excellent', emoji: '🌟', description: 'Like new condition' },
  { value: 'very_good', label: 'Very Good', emoji: '👍', description: 'Minor signs of use' },
  { value: 'good', label: 'Good', emoji: '👌', description: 'Normal wear' },
  { value: 'fair', label: 'Fair', emoji: '🔧', description: 'Visible wear, works well' },
];

// Common colors used across categories
export const COMMON_COLORS = [
  'Black', 'White', 'Silver', 'Gold', 'Blue', 'Green', 'Red',
  'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Beige', 'Navy', 'Other'
];

// ============================================
// CATEGORY CONFIGURATIONS
// ============================================

export const CATEGORIES: CategoryConfig[] = [
  // ----------------------------------------
  // MOBILE PHONES
  // ----------------------------------------
  {
    id: 'phones',
    name: 'Mobile Phones',
    icon: '📱',
    hasModels: true,
    brands: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Oppo', 'Vivo', 'Nothing', 'Other'],
    models: {
      Apple: [
        'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
        'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
        'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
        'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
        'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
        'iPhone SE (2022)', 'iPhone SE (2020)', 'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
      ],
      Samsung: [
        'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
        'Galaxy Z Fold 6', 'Galaxy Z Flip 6',
        'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
        'Galaxy Z Fold 5', 'Galaxy Z Flip 5',
        'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
        'Galaxy A54', 'Galaxy A34', 'Galaxy A14',
      ],
      Google: [
        'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9',
        'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
        'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
        'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a',
      ],
      OnePlus: ['OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 10 Pro', 'OnePlus Nord 3'],
      Xiaomi: ['Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14', 'Redmi Note 13 Pro+', 'POCO F5 Pro'],
      Huawei: ['Mate 60 Pro', 'Mate 60', 'P60 Pro', 'P60', 'Nova 11 Pro'],
      Oppo: ['Find X7 Ultra', 'Find X6 Pro', 'Reno 11 Pro'],
      Vivo: ['X100 Pro', 'X90 Pro', 'V30 Pro'],
      Nothing: ['Phone (2a)', 'Phone (2)', 'Phone (1)'],
    },
    attributes: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'], required: true },
      { key: 'color', label: 'Color', type: 'select', options: COMMON_COLORS, required: true },
    ],
    templates: [
      { name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', attributes: { storage: '256GB', color: 'Black' }, suggestedPrice: 4200 },
      { name: 'iPhone 15 Pro 128GB', brand: 'Apple', attributes: { storage: '128GB', color: 'Black' }, suggestedPrice: 3500 },
      { name: 'iPhone 14 Pro Max 256GB', brand: 'Apple', attributes: { storage: '256GB', color: 'Black' }, suggestedPrice: 3200 },
      { name: 'Galaxy S24 Ultra 256GB', brand: 'Samsung', attributes: { storage: '256GB', color: 'Black' }, suggestedPrice: 3800 },
      { name: 'Galaxy S23 Ultra 256GB', brand: 'Samsung', attributes: { storage: '256GB', color: 'Black' }, suggestedPrice: 2800 },
      { name: 'Pixel 8 Pro 128GB', brand: 'Google', attributes: { storage: '128GB', color: 'Black' }, suggestedPrice: 2200 },
    ],
  },

  // ----------------------------------------
  // LAPTOPS
  // ----------------------------------------
  {
    id: 'laptops',
    name: 'Laptops',
    icon: '💻',
    hasModels: true,
    brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Microsoft', 'Acer', 'MSI', 'Razer', 'Other'],
    models: {
      Apple: ['MacBook Pro 16"', 'MacBook Pro 14"', 'MacBook Air 15"', 'MacBook Air 13"'],
      Dell: ['XPS 15', 'XPS 13', 'Inspiron 15', 'Latitude 14', 'Alienware m16'],
      HP: ['Spectre x360', 'Envy 15', 'Pavilion 15', 'EliteBook 840'],
      Lenovo: ['ThinkPad X1 Carbon', 'ThinkPad T14', 'IdeaPad 5', 'Legion 5 Pro', 'Yoga 9i'],
      ASUS: ['ZenBook 14', 'ROG Zephyrus G14', 'VivoBook 15', 'ProArt StudioBook'],
      Microsoft: ['Surface Laptop 5', 'Surface Pro 9', 'Surface Book 3'],
      Acer: ['Swift 5', 'Aspire 5', 'Predator Helios 300'],
      MSI: ['GS66 Stealth', 'Creator Z16', 'Prestige 14'],
      Razer: ['Blade 15', 'Blade 14', 'Book 13'],
    },
    attributes: [
      { key: 'processor', label: 'Processor', type: 'select', options: ['M3 Pro', 'M3 Max', 'M3', 'M2 Pro', 'M2', 'M1', 'Intel i9', 'Intel i7', 'Intel i5', 'AMD Ryzen 9', 'AMD Ryzen 7', 'AMD Ryzen 5'], required: true },
      { key: 'ram', label: 'RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB', '128GB'], required: true },
      { key: 'storage', label: 'Storage', type: 'select', options: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'], required: true },
      { key: 'color', label: 'Color', type: 'select', options: ['Silver', 'Space Gray', 'Black', 'White', 'Blue', 'Other'] },
    ],
    templates: [
      { name: 'MacBook Pro 14" M3 Pro', brand: 'Apple', attributes: { processor: 'M3 Pro', ram: '18GB', storage: '512GB SSD', color: 'Space Gray' }, suggestedPrice: 7500 },
      { name: 'MacBook Air 13" M2', brand: 'Apple', attributes: { processor: 'M2', ram: '8GB', storage: '256GB SSD', color: 'Silver' }, suggestedPrice: 3800 },
      { name: 'Dell XPS 15 i7', brand: 'Dell', attributes: { processor: 'Intel i7', ram: '16GB', storage: '512GB SSD', color: 'Silver' }, suggestedPrice: 5500 },
      { name: 'ThinkPad X1 Carbon', brand: 'Lenovo', attributes: { processor: 'Intel i7', ram: '16GB', storage: '512GB SSD', color: 'Black' }, suggestedPrice: 4800 },
    ],
  },

  // ----------------------------------------
  // TABLETS
  // ----------------------------------------
  {
    id: 'tablets',
    name: 'Tablets',
    icon: '📲',
    hasModels: true,
    brands: ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Amazon', 'Other'],
    models: {
      Apple: ['iPad Pro 12.9"', 'iPad Pro 11"', 'iPad Air', 'iPad (10th gen)', 'iPad mini'],
      Samsung: ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab A9'],
      Microsoft: ['Surface Pro 9', 'Surface Go 3'],
      Lenovo: ['Tab P12 Pro', 'Tab P11 Pro'],
      Amazon: ['Fire HD 10', 'Fire HD 8', 'Fire 7'],
    },
    attributes: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'], required: true },
      { key: 'connectivity', label: 'Connectivity', type: 'select', options: ['WiFi Only', 'WiFi + Cellular'], required: true },
      { key: 'color', label: 'Color', type: 'select', options: ['Silver', 'Space Gray', 'Black', 'White', 'Blue', 'Pink', 'Other'] },
    ],
    templates: [
      { name: 'iPad Pro 12.9" 256GB', brand: 'Apple', attributes: { storage: '256GB', connectivity: 'WiFi Only', color: 'Space Gray' }, suggestedPrice: 4200 },
      { name: 'iPad Air 256GB', brand: 'Apple', attributes: { storage: '256GB', connectivity: 'WiFi Only', color: 'Blue' }, suggestedPrice: 2400 },
      { name: 'Galaxy Tab S9 Ultra', brand: 'Samsung', attributes: { storage: '256GB', connectivity: 'WiFi Only', color: 'Black' }, suggestedPrice: 3500 },
    ],
  },

  // ----------------------------------------
  // SMARTWATCHES
  // ----------------------------------------
  {
    id: 'watches',
    name: 'Smartwatches',
    icon: '⌚',
    hasModels: true,
    brands: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Google', 'Huawei', 'Other'],
    models: {
      Apple: ['Apple Watch Ultra 2', 'Apple Watch Series 9', 'Apple Watch SE (2nd gen)'],
      Samsung: ['Galaxy Watch 6 Classic', 'Galaxy Watch 6', 'Galaxy Watch 5 Pro'],
      Garmin: ['Fenix 7', 'Venu 3', 'Forerunner 965', 'Epix Pro'],
      Fitbit: ['Sense 2', 'Versa 4', 'Charge 6'],
      Google: ['Pixel Watch 2', 'Pixel Watch'],
      Huawei: ['Watch GT 4', 'Watch 4 Pro'],
    },
    attributes: [
      { key: 'size', label: 'Case Size', type: 'select', options: ['40mm', '41mm', '42mm', '44mm', '45mm', '46mm', '47mm', '49mm'], required: true },
      { key: 'connectivity', label: 'Connectivity', type: 'select', options: ['GPS Only', 'GPS + Cellular'], required: true },
      { key: 'band', label: 'Band Type', type: 'select', options: ['Sport Band', 'Leather', 'Metal', 'Fabric', 'Silicone'] },
      { key: 'color', label: 'Color', type: 'select', options: ['Silver', 'Black', 'Gold', 'Blue', 'Titanium', 'Other'] },
    ],
    templates: [
      { name: 'Apple Watch Ultra 2', brand: 'Apple', attributes: { size: '49mm', connectivity: 'GPS + Cellular', color: 'Titanium' }, suggestedPrice: 2900 },
      { name: 'Apple Watch Series 9 45mm', brand: 'Apple', attributes: { size: '45mm', connectivity: 'GPS Only', color: 'Silver' }, suggestedPrice: 1500 },
      { name: 'Galaxy Watch 6 Classic', brand: 'Samsung', attributes: { size: '47mm', connectivity: 'GPS + Cellular', color: 'Black' }, suggestedPrice: 1400 },
    ],
  },

  // ----------------------------------------
  // AUDIO
  // ----------------------------------------
  {
    id: 'audio',
    name: 'Audio & Headphones',
    icon: '🎧',
    hasModels: true,
    brands: ['Apple', 'Sony', 'Bose', 'Samsung', 'JBL', 'Beats', 'Sennheiser', 'Bang & Olufsen', 'Other'],
    models: {
      Apple: ['AirPods Pro 2', 'AirPods 3', 'AirPods Max', 'AirPods 2'],
      Sony: ['WH-1000XM5', 'WH-1000XM4', 'WF-1000XM5', 'WF-1000XM4', 'LinkBuds S'],
      Bose: ['QuietComfort Ultra', 'QuietComfort 45', 'QuietComfort Earbuds II', 'SoundLink Flex'],
      Samsung: ['Galaxy Buds 2 Pro', 'Galaxy Buds FE', 'Galaxy Buds Live'],
      JBL: ['Tour Pro 2', 'Tune Flex', 'Flip 6', 'Charge 5', 'PartyBox'],
      Beats: ['Studio Pro', 'Fit Pro', 'Studio Buds+', 'Solo 4'],
      Sennheiser: ['Momentum 4', 'Momentum True Wireless 3', 'HD 660S'],
      'Bang & Olufsen': ['Beoplay H95', 'Beoplay EX', 'Beoplay Portal'],
    },
    attributes: [
      { key: 'type', label: 'Type', type: 'select', options: ['Over-Ear', 'On-Ear', 'In-Ear/Earbuds', 'Speaker'], required: true },
      { key: 'color', label: 'Color', type: 'select', options: ['Black', 'White', 'Silver', 'Blue', 'Red', 'Other'] },
    ],
    templates: [
      { name: 'AirPods Pro 2', brand: 'Apple', attributes: { type: 'In-Ear/Earbuds', color: 'White' }, suggestedPrice: 850 },
      { name: 'AirPods Max', brand: 'Apple', attributes: { type: 'Over-Ear', color: 'Silver' }, suggestedPrice: 1800 },
      { name: 'Sony WH-1000XM5', brand: 'Sony', attributes: { type: 'Over-Ear', color: 'Black' }, suggestedPrice: 1200 },
      { name: 'Bose QC Ultra Headphones', brand: 'Bose', attributes: { type: 'Over-Ear', color: 'Black' }, suggestedPrice: 1400 },
    ],
  },

  // ----------------------------------------
  // GAMING CONSOLES
  // ----------------------------------------
  {
    id: 'gaming',
    name: 'Gaming Consoles',
    icon: '🎮',
    hasModels: true,
    brands: ['Sony', 'Microsoft', 'Nintendo', 'Steam', 'Other'],
    models: {
      Sony: ['PlayStation 5', 'PlayStation 5 Digital', 'PlayStation 4 Pro', 'PlayStation 4'],
      Microsoft: ['Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S'],
      Nintendo: ['Switch OLED', 'Switch', 'Switch Lite'],
      Steam: ['Steam Deck OLED', 'Steam Deck'],
    },
    attributes: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['256GB', '500GB', '512GB', '825GB', '1TB', '2TB'] },
      { key: 'color', label: 'Color', type: 'select', options: ['Black', 'White', 'Red', 'Blue', 'Neon', 'Other'] },
      { key: 'accessories', label: 'Includes', type: 'text', placeholder: 'e.g., 2 controllers, games' },
    ],
    templates: [
      { name: 'PlayStation 5', brand: 'Sony', attributes: { storage: '825GB', color: 'White' }, suggestedPrice: 1800 },
      { name: 'Xbox Series X', brand: 'Microsoft', attributes: { storage: '1TB', color: 'Black' }, suggestedPrice: 1700 },
      { name: 'Nintendo Switch OLED', brand: 'Nintendo', attributes: { storage: '64GB', color: 'Neon' }, suggestedPrice: 1200 },
      { name: 'Steam Deck OLED 512GB', brand: 'Steam', attributes: { storage: '512GB', color: 'Black' }, suggestedPrice: 2200 },
    ],
  },

  // ----------------------------------------
  // FASHION - CLOTHING
  // ----------------------------------------
  {
    id: 'clothing',
    name: 'Clothing',
    icon: '👕',
    hasModels: false,
    brands: ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gucci', 'Louis Vuitton', 'Prada', 'Ralph Lauren', 'Tommy Hilfiger', 'Other'],
    attributes: [
      { key: 'type', label: 'Type', type: 'select', options: ['T-Shirt', 'Shirt', 'Pants', 'Jeans', 'Dress', 'Jacket', 'Coat', 'Sweater', 'Hoodie', 'Shorts', 'Skirt', 'Suit', 'Other'], required: true },
      { key: 'size', label: 'Size', type: 'select', options: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'], required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'] },
      { key: 'color', label: 'Color', type: 'select', options: COMMON_COLORS },
      { key: 'material', label: 'Material', type: 'text', placeholder: 'e.g., Cotton, Polyester' },
    ],
    conditions: [
      { value: 'new', label: 'New with Tags', emoji: '🏷️', description: 'Brand new, tags attached' },
      { value: 'excellent', label: 'Like New', emoji: '✨', description: 'Worn once or twice' },
      { value: 'good', label: 'Good', emoji: '👍', description: 'Gently used, no flaws' },
      { value: 'fair', label: 'Fair', emoji: '👌', description: 'Some wear, minor flaws' },
    ],
    templates: [],
  },

  // ----------------------------------------
  // FASHION - SHOES
  // ----------------------------------------
  {
    id: 'shoes',
    name: 'Shoes',
    icon: '👟',
    hasModels: true,
    brands: ['Nike', 'Adidas', 'Jordan', 'New Balance', 'Puma', 'Converse', 'Vans', 'Gucci', 'Balenciaga', 'Other'],
    models: {
      Nike: ['Air Force 1', 'Air Max 90', 'Air Max 1', 'Dunk Low', 'Dunk High', 'Air Jordan 1', 'Blazer'],
      Adidas: ['Ultraboost', 'Yeezy 350', 'Yeezy 500', 'Stan Smith', 'Superstar', 'Gazelle', 'Samba'],
      Jordan: ['Air Jordan 1', 'Air Jordan 4', 'Air Jordan 11', 'Air Jordan 3'],
      'New Balance': ['990v5', '550', '574', '2002R', '1906R'],
      Puma: ['Suede Classic', 'RS-X', 'Speedcat'],
      Converse: ['Chuck Taylor', 'Chuck 70', 'Run Star Hike'],
      Vans: ['Old Skool', 'Sk8-Hi', 'Era', 'Slip-On'],
    },
    attributes: [
      { key: 'size', label: 'Size (US)', type: 'select', options: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '14'], required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'] },
      { key: 'color', label: 'Colorway', type: 'text', placeholder: 'e.g., Black/White, University Blue', required: true },
    ],
    conditions: [
      { value: 'new', label: 'Deadstock', emoji: '📦', description: 'Brand new in box, never worn' },
      { value: 'excellent', label: 'VNDS', emoji: '✨', description: 'Very Near Deadstock, tried on only' },
      { value: 'good', label: 'Good', emoji: '👍', description: 'Light wear, no major flaws' },
      { value: 'fair', label: 'Beaters', emoji: '🔧', description: 'Heavy wear, still wearable' },
    ],
    templates: [
      { name: 'Nike Dunk Low', brand: 'Nike', attributes: { size: '10', gender: 'Men', color: 'Panda' }, suggestedPrice: 600 },
      { name: 'Air Jordan 1 Retro High', brand: 'Jordan', attributes: { size: '10', gender: 'Men', color: 'Chicago' }, suggestedPrice: 1200 },
      { name: 'Adidas Yeezy 350 V2', brand: 'Adidas', attributes: { size: '10', gender: 'Unisex', color: 'Zebra' }, suggestedPrice: 800 },
    ],
  },

  // ----------------------------------------
  // BAGS & ACCESSORIES
  // ----------------------------------------
  {
    id: 'bags',
    name: 'Bags & Accessories',
    icon: '👜',
    hasModels: false,
    brands: ['Louis Vuitton', 'Gucci', 'Chanel', 'Hermès', 'Prada', 'Dior', 'Fendi', 'Balenciaga', 'Coach', 'Michael Kors', 'Other'],
    attributes: [
      { key: 'type', label: 'Type', type: 'select', options: ['Handbag', 'Backpack', 'Crossbody', 'Tote', 'Clutch', 'Wallet', 'Belt', 'Sunglasses', 'Watch', 'Jewelry', 'Other'], required: true },
      { key: 'material', label: 'Material', type: 'select', options: ['Leather', 'Canvas', 'Nylon', 'Fabric', 'Metal', 'Other'] },
      { key: 'color', label: 'Color', type: 'select', options: COMMON_COLORS },
      { key: 'size', label: 'Size', type: 'text', placeholder: 'e.g., Small, 30cm x 20cm' },
    ],
    templates: [],
  },

  // ----------------------------------------
  // HOME & KITCHEN
  // ----------------------------------------
  {
    id: 'home',
    name: 'Home & Kitchen',
    icon: '🏠',
    hasModels: false,
    brands: ['Dyson', 'Philips', 'KitchenAid', 'Nespresso', 'Instant Pot', 'iRobot', 'Ninja', 'Vitamix', 'Other'],
    attributes: [
      { key: 'type', label: 'Type', type: 'select', options: ['Vacuum', 'Air Purifier', 'Coffee Machine', 'Blender', 'Air Fryer', 'Robot Vacuum', 'Kitchen Appliance', 'Furniture', 'Decor', 'Other'], required: true },
      { key: 'color', label: 'Color', type: 'select', options: COMMON_COLORS },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g., V15 Detect, Roomba i7' },
    ],
    templates: [
      { name: 'Dyson V15 Detect', brand: 'Dyson', attributes: { type: 'Vacuum', color: 'Gold', model: 'V15 Detect' }, suggestedPrice: 2000 },
      { name: 'iRobot Roomba j7+', brand: 'iRobot', attributes: { type: 'Robot Vacuum', color: 'Black', model: 'j7+' }, suggestedPrice: 1800 },
      { name: 'Nespresso Vertuo', brand: 'Nespresso', attributes: { type: 'Coffee Machine', color: 'Black', model: 'Vertuo Next' }, suggestedPrice: 500 },
    ],
  },

  // ----------------------------------------
  // SPORTS & FITNESS
  // ----------------------------------------
  {
    id: 'sports',
    name: 'Sports & Fitness',
    icon: '⚽',
    hasModels: false,
    brands: ['Nike', 'Adidas', 'Under Armour', 'Peloton', 'Theragun', 'Yeti', 'Hydro Flask', 'Other'],
    attributes: [
      { key: 'type', label: 'Type', type: 'select', options: ['Fitness Equipment', 'Sports Gear', 'Bicycle', 'Yoga/Pilates', 'Golf', 'Tennis', 'Swimming', 'Camping/Outdoor', 'Other'], required: true },
      { key: 'sport', label: 'Sport', type: 'text', placeholder: 'e.g., Running, Cycling' },
      { key: 'size', label: 'Size', type: 'text', placeholder: 'e.g., Medium, 26 inch' },
      { key: 'color', label: 'Color', type: 'select', options: COMMON_COLORS },
    ],
    templates: [],
  },

  // ----------------------------------------
  // BOOKS & MEDIA
  // ----------------------------------------
  {
    id: 'books',
    name: 'Books & Media',
    icon: '📚',
    hasModels: false,
    brands: ['Penguin', 'HarperCollins', 'Simon & Schuster', 'Macmillan', 'Hachette', 'Other'],
    attributes: [
      { key: 'type', label: 'Type', type: 'select', options: ['Hardcover', 'Paperback', 'eReader', 'Audiobook', 'Vinyl', 'DVD/Blu-ray', 'Other'], required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'author', label: 'Author/Artist', type: 'text' },
      { key: 'isbn', label: 'ISBN/UPC', type: 'text', placeholder: 'Optional' },
    ],
    conditions: [
      { value: 'new', label: 'New', emoji: '📦', description: 'Unread, perfect condition' },
      { value: 'excellent', label: 'Like New', emoji: '✨', description: 'Read once, no marks' },
      { value: 'good', label: 'Good', emoji: '👍', description: 'Some wear, no major damage' },
      { value: 'acceptable', label: 'Acceptable', emoji: '📖', description: 'Heavy wear, readable' },
    ],
    templates: [],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get category by ID
 */
export function getCategory(categoryId: string): CategoryConfig | undefined {
  return CATEGORIES.find(c => c.id === categoryId);
}

/**
 * Get conditions for a category (falls back to defaults)
 */
export function getConditions(categoryId: string): ConditionOption[] {
  const category = getCategory(categoryId);
  return category?.conditions || DEFAULT_CONDITIONS;
}

/**
 * Get models for a brand within a category
 */
export function getModels(categoryId: string, brand: string): string[] {
  const category = getCategory(categoryId);
  if (!category?.hasModels || !category.models) return [];
  return category.models[brand] || [];
}

/**
 * Generate SKU from product info
 */
export function generateSKU(
  category: string,
  brand: string,
  model: string,
  attributes: Record<string, string>
): string {
  const catCode = category.substring(0, 3).toUpperCase();
  const brandCode = brand.substring(0, 3).toUpperCase();
  const modelCode = model.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const attrCode = Object.values(attributes).join('').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${catCode}-${brandCode}-${modelCode}-${attrCode}-${random}`;
}

/**
 * Generate product name from info
 */
export function generateProductName(
  brand: string,
  model: string,
  attributes: Record<string, string>
): string {
  const attrString = Object.values(attributes).filter(v => v && v !== 'Other').join(' ');
  if (model) {
    return `${brand} ${model} ${attrString}`.trim();
  }
  return `${brand} ${attrString}`.trim();
}

// Type exports
export type CategoryId = typeof CATEGORIES[number]['id'];
