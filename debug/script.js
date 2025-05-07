(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLeafStates = getLeafStates;
exports.makeCheckboxTree = makeCheckboxTree;
exports.setLeafStates = setLeafStates;
var _html = require("./html");
function getChildren(node) {
  const parent_li = node.parentElement;
  if (!(parent_li instanceof HTMLLIElement)) {
    return [];
  }
  const parent_ul = parent_li.parentElement;
  if (!(parent_ul instanceof HTMLUListElement)) {
    return [];
  }
  for (let childIndex = 0; childIndex < parent_ul.children.length; childIndex++) {
    if (parent_ul.children[childIndex] !== parent_li) {
      continue;
    }
    const potentialSiblingEntry = parent_ul.children[childIndex + 1]?.children[0];
    if (!(potentialSiblingEntry instanceof HTMLUListElement)) {
      break;
    }
    return Array.from(potentialSiblingEntry.children).filter(e => e instanceof HTMLLIElement && e.children[0] instanceof HTMLInputElement).map(e => e.children[0]);
  }
  return [];
}
function applyCheckedToDescendants(node) {
  for (const child of getChildren(node)) {
    if (child.checked !== node.checked) {
      child.checked = node.checked;
      child.indeterminate = false;
      applyCheckedToDescendants(child);
    }
  }
}
function getParent(node) {
  const parent_li = node.parentElement?.parentElement?.parentElement;
  if (!(parent_li instanceof HTMLLIElement)) {
    return;
  }
  const parent_ul = parent_li.parentElement;
  if (!(parent_ul instanceof HTMLUListElement)) {
    return;
  }
  let candidate;
  for (const child of parent_ul.children) {
    if (child instanceof HTMLLIElement && child.children[0] instanceof HTMLInputElement) {
      candidate = child;
      continue;
    }
    if (child === parent_li && candidate) {
      return candidate.children[0];
    }
  }
}
function updateAncestors(node) {
  const parent = getParent(node);
  if (!parent) {
    return;
  }
  let foundChecked = false;
  let foundUnchecked = false;
  let foundIndeterminate = false;
  for (const child of getChildren(parent)) {
    if (child.checked) {
      foundChecked = true;
    } else {
      foundUnchecked = true;
    }
    if (child.indeterminate) {
      foundIndeterminate = true;
    }
  }
  if (foundIndeterminate || foundChecked && foundUnchecked) {
    parent.indeterminate = true;
  } else if (foundChecked) {
    parent.checked = true;
    parent.indeterminate = false;
  } else if (foundUnchecked) {
    parent.checked = false;
    parent.indeterminate = false;
  }
  updateAncestors(parent);
}
function applyCheckListener(node) {
  node.addEventListener("change", e => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    applyCheckedToDescendants(target);
    updateAncestors(target);
  });
}
function applyCheckListeners(node) {
  for (const element of node.children) {
    if (element instanceof HTMLLIElement) {
      applyCheckListener(element.children[0]);
    } else if (element instanceof HTMLUListElement) {
      applyCheckListeners(element);
    }
  }
}
function makeCheckboxTreeNode(treeNode) {
  if (typeof treeNode === "string") {
    let disabled = false;
    if (treeNode[0] === "-") {
      treeNode = treeNode.substring(1);
      disabled = true;
    }
    let checked = false;
    if (treeNode[0] === "+") {
      treeNode = treeNode.substring(1);
      checked = true;
    }
    const node = (0, _html.createHTML)(["li", ["input", {
      type: "checkbox",
      id: treeNode.replaceAll(" ", "_"),
      ...(checked && {
        checked: "checked"
      })
    }], ["label", {
      for: treeNode.replaceAll(" ", "_")
    }, treeNode]]);
    if (disabled) {
      node.classList.add("disabled");
    }
    return node;
  } else {
    const list = (0, _html.createHTML)(["ul", {
      class: "checkbox"
    }]);
    for (let i = 0; i < treeNode.length; i++) {
      const node = treeNode[i];
      list.appendChild(makeCheckboxTreeNode(node));
    }
    return (0, _html.createHTML)(["li", list]);
  }
}
function makeCheckboxTree(treeNode) {
  let root = makeCheckboxTreeNode(treeNode).children[0];
  if (!(root instanceof HTMLUListElement)) {
    throw "Internal error";
  }
  applyCheckListeners(root);
  for (const leaf of getLeaves(root)) {
    updateAncestors(leaf);
  }
  return root;
}
function getLeaves(node) {
  let result = [];
  for (const element of node.children) {
    const input = element.children[0];
    if (input instanceof HTMLInputElement) {
      if (getChildren(input).length === 0) {
        result.push(input);
      }
    } else if (input instanceof HTMLUListElement) {
      result = result.concat(getLeaves(input));
    }
  }
  return result;
}
function getLeafStates(node) {
  let states = {};
  for (const leaf of getLeaves(node)) {
    states[leaf.id.replaceAll("_", " ")] = leaf.checked;
  }
  return states;
}
function setLeafStates(node, states) {
  for (const leaf of getLeaves(node)) {
    const state = states[leaf.id.replaceAll("_", " ")];
    if (typeof state === "undefined") {
      continue;
    }
    leaf.checked = state;
    updateAncestors(leaf);
  }
}

},{"./html":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createHTML = createHTML;
function createHTML(node) {
  const element = document.createElement(node[0]);
  function handle(parameter) {
    if (typeof parameter === "string" || parameter instanceof HTMLElement) {
      element.append(parameter);
    } else if (Array.isArray(parameter)) {
      element.append(createHTML(parameter));
    } else {
      for (const key in parameter) {
        element.setAttribute(key, parameter[key]);
      }
    }
  }
  for (let i = 1; i < node.length; i++) {
    handle(node[i]);
  }
  return element;
}

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.characters = exports.ShopItemSource = exports.ItemSource = exports.Item = exports.GuardianItemSource = exports.GachaItemSource = void 0;
exports.createPopupLink = createPopupLink;
exports.download = download;
exports.downloadItems = downloadItems;
exports.getGachaTable = getGachaTable;
exports.getMaxItemLevel = getMaxItemLevel;
exports.getResultsTable = getResultsTable;
exports.isCharacter = isCharacter;
exports.shop_items = exports.items = void 0;
var _html = require("./html");
const characters = ["Niki", "LunLun", "Lucy", "Shua", "Dhanpir", "Pochi", "Al"];
exports.characters = characters;
function isCharacter(character) {
  return characters.includes(character);
}
class ItemSource {
  shop_id;
  constructor(shop_id) {
    this.shop_id = shop_id;
  }
  get requiresGuardian() {
    if (this instanceof ShopItemSource) {
      return false;
    } else if (this instanceof GachaItemSource) {
      return [...this.item.sources.values()].every(source => source.requiresGuardian);
    } else if (this instanceof GuardianItemSource) {
      return true;
    } else {
      throw "Internal error";
    }
  }
  get item() {
    const item = shop_items.get(this.shop_id);
    if (!item) {
      console.error(`Failed finding item of itemSource ${this.shop_id}`);
      throw "Internal error";
    }
    return item;
  }
}
exports.ItemSource = ItemSource;
class ShopItemSource extends ItemSource {
  price;
  ap;
  items;
  constructor(shop_id, price, ap, items) {
    super(shop_id);
    this.price = price;
    this.ap = ap;
    this.items = items;
  }
}
exports.ShopItemSource = ShopItemSource;
class GachaItemSource extends ItemSource {
  constructor(shop_id) {
    super(shop_id);
  }
  gachaTries(item, character) {
    const gacha = gachas.get(this.shop_id);
    if (!gacha) {
      throw "Internal error";
    }
    return gacha.average_tries(item, character);
  }
}
exports.GachaItemSource = GachaItemSource;
class GuardianItemSource extends ItemSource {
  guardian_map;
  items;
  xp;
  need_boss;
  boss_time;
  constructor(guardian_map, items, xp, need_boss, boss_time) {
    super(GuardianItemSource.guardian_map_id(guardian_map));
    this.guardian_map = guardian_map;
    this.items = items;
    this.xp = xp;
    this.need_boss = need_boss;
    this.boss_time = boss_time;
  }
  static guardian_map_id(map) {
    let index = this.guardian_maps.indexOf(map);
    if (index === -1) {
      index = this.guardian_maps.length;
      this.guardian_maps.push(map);
    }
    return -index;
  }
  static guardian_maps = [""];
}
exports.GuardianItemSource = GuardianItemSource;
class Item {
  id = 0;
  name_kr = "";
  name_en = "";
  useType = "";
  maxUse = 0;
  hidden = false;
  resist = "";
  character;
  part = "Other";
  level = 0;
  str = 0;
  sta = 0;
  dex = 0;
  wil = 0;
  hp = 0;
  quickslots = 0;
  buffslots = 0;
  smash = 0;
  movement = 0;
  charge = 0;
  lob = 0;
  serve = 0;
  max_str = 0;
  max_sta = 0;
  max_dex = 0;
  max_wil = 0;
  element_enchantable = false;
  parcel_enabled = false;
  parcel_from_shop = false;
  spin = 0;
  atss = 0;
  dfss = 0;
  socket = 0;
  gauge = 0;
  gauge_battle = 0;
  sources = [];
  statFromString(name) {
    switch (name) {
      case "Mov Speed":
        return this.movement;
      case "Charge":
        return this.charge;
      case "Lob":
        return this.lob;
      case "Smash":
        return this.smash;
      case "Str":
        return this.str;
      case "Dex":
        return this.dex;
      case "Sta":
        return this.sta;
      case "Will":
        return this.wil;
      case "Max Str":
        return this.max_str;
      case "Max Dex":
        return this.max_dex;
      case "Max Sta":
        return this.max_sta;
      case "Max Will":
        return this.max_wil;
      case "Serve":
        return this.serve;
      case "Quickslots":
        return this.quickslots;
      case "Buffslots":
        return this.buffslots;
      case "HP":
        return this.hp;
      default:
        throw "Internal error";
    }
  }
}
exports.Item = Item;
class Gacha {
  shop_index;
  gacha_index;
  name;
  constructor(shop_index, gacha_index, name) {
    this.shop_index = shop_index;
    this.gacha_index = gacha_index;
    this.name = name;
    for (const character of characters) {
      this.shop_items.set(character, new Map());
    }
  }
  add(item, probability, character, quantity_min, quantity_max) {
    if (item.character && item.character !== character) {
      //console.info(`Item ${item.id} from gacha "${this.name}" ${this.gacha_index} has wrong character`);
      character = item.character;
    }
    this.shop_items.get(character).set(item, [probability, quantity_min, quantity_max]);
    this.character_probability.set(character, probability + (this.character_probability.get(character) || 0));
  }
  average_tries(item, character = undefined) {
    const chars = character ? [character] : characters;
    const probability = chars.reduce((p, character) => p + (this.shop_items.get(character).get(item)?.[0] || 0), 0);
    if (probability === 0) {
      return 0;
    }
    const total_probability = chars.reduce((p, character) => p + this.character_probability.get(character), 0);
    return total_probability / probability;
  }
  get total_probability() {
    return characters.reduce((p, character) => p + this.character_probability.get(character), 0);
  }
  character_probability = new Map();
  shop_items = new Map();
}
let items = new Map();
exports.items = items;
let shop_items = new Map();
exports.shop_items = shop_items;
let gachas = new Map();
let dialog;
function prettyNumber(n, digits) {
  let s = n.toFixed(digits);
  while (s.endsWith("0")) {
    s = s.slice(0, -1);
  }
  if (s.endsWith(".")) {
    s = s.slice(0, -1);
  }
  return s;
}
function parseItemData(data) {
  if (data.length < 1000) {
    console.warn(`Items file is only ${data.length} bytes long`);
  }
  for (const [, result] of data.matchAll(/\<Item (.*)\/\>/g)) {
    const item = new Item();
    for (const [, attribute, value] of result.matchAll(/\s?([^=]*)="([^"]*)"/g)) {
      switch (attribute) {
        case "Index":
          item.id = parseInt(value);
          break;
        case "_Name_":
          item.name_kr = value;
          break;
        case "Name_N":
          item.name_en = value;
          break;
        case "UseType":
          item.useType = value;
          break;
        case "MaxUse":
          item.maxUse = parseInt(value);
          break;
        case "Hide":
          item.hidden = !!parseInt(value);
          break;
        case "Resist":
          item.resist = value;
          break;
        case "Char":
          switch (value) {
            case "NIKI":
              item.character = "Niki";
              break;
            case "LUNLUN":
              item.character = "LunLun";
              break;
            case "LUCY":
              item.character = "Lucy";
              break;
            case "SHUA":
              item.character = "Shua";
              break;
            case "DHANPIR":
              item.character = "Dhanpir";
              break;
            case "POCHI":
              item.character = "Pochi";
              break;
            case "AL":
              item.character = "Al";
              break;
            default:
              console.warn(`Found unknown character "${value}"`);
          }
          break;
        case "Part":
          switch (String(value)) {
            case "BAG":
              item.part = "Backpack";
              break;
            case "GLASSES":
              item.part = "Face";
              break;
            case "HAND":
              item.part = "Hand";
              break;
            case "SOCKS":
              item.part = "Socks";
              break;
            case "FOOT":
              item.part = "Shoes";
              break;
            case "CAP":
              item.part = "Hat";
              break;
            case "PANTS":
              item.part = "Lower";
              break;
            case "RACKET":
              item.part = "Racket";
              break;
            case "BODY":
              item.part = "Upper";
              break;
            case "HAIR":
              item.part = "Hair";
              break;
            case "DYE":
              item.part = "Dye";
              break;
            default:
              console.warn(`Found unknown part ${value}`);
          }
          break;
        case "Level":
          item.level = parseInt(value);
          break;
        case "STR":
          item.str = parseInt(value);
          break;
        case "STA":
          item.sta = parseInt(value);
          break;
        case "DEX":
          item.dex = parseInt(value);
          break;
        case "WIL":
          item.wil = parseInt(value);
          break;
        case "AddHP":
          item.hp = parseInt(value);
          break;
        case "AddQuick":
          item.quickslots = parseInt(value);
          break;
        case "AddBuff":
          item.buffslots = parseInt(value);
          break;
        case "SmashSpeed":
          item.smash = parseInt(value);
          break;
        case "MoveSpeed":
          item.movement = parseInt(value);
          break;
        case "ChargeshotSpeed":
          item.charge = parseInt(value);
          break;
        case "LobSpeed":
          item.lob = parseInt(value);
          break;
        case "ServeSpeed":
          item.serve = parseInt(value);
          break;
        case "MAX_STR":
          item.max_str = Math.max(parseInt(value), item.str);
          break;
        case "MAX_STA":
          item.max_sta = Math.max(parseInt(value), item.sta);
          break;
        case "MAX_DEX":
          item.max_dex = Math.max(parseInt(value), item.dex);
          break;
        case "MAX_WIL":
          item.max_wil = Math.max(parseInt(value), item.wil);
          break;
        case "EnchantElement":
          item.element_enchantable = !!parseInt(value);
          break;
        case "EnableParcel":
          item.parcel_enabled = !!parseInt(value);
          break;
        case "BallSpin":
          item.spin = parseInt(value);
          break;
        case "ATSS":
          item.atss = parseInt(value);
          break;
        case "DFSS":
          item.dfss = parseInt(value);
          break;
        case "Socket":
          item.socket = parseInt(value);
          break;
        case "Gauge":
          item.gauge = parseInt(value);
          break;
        case "GaugeBattle":
          item.gauge_battle = parseInt(value);
          break;
        default:
          console.warn(`Found unknown item attribute "${attribute}"`);
      }
    }
    items.set(item.id, item);
  }
}
function parseShopData(data) {
  const debugShopParsing = false;
  if (data.length < 1000) {
    console.warn(`Shop file is only ${data.length} bytes long`);
  }
  let count = 0;
  let currentIndex = 0;
  for (const match of data.matchAll(/<Product DISPLAY="\d+" HIT_DISPLAY="\d+" Index="(?<index>\d+)" Enable="(?<enabled>0|1)" New="\d+" Hit="\d+" Free="\d+" Sale="\d+" Event="\d+" Couple="\d+" Nobuy="\d+" Rand="[^"]+" UseType="[^"]+" Use0="\d+" Use1="\d+" Use2="\d+" PriceType="(?<price_type>(?:MINT)|(?:GOLD))" OldPrice0="-?\d+" OldPrice1="-?\d+" OldPrice2="-?\d+" Price0="(?<price>-?\d+)" Price1="-?\d+" Price2="-?\d+" CouplePrice="-?\d+" Category="(?<category>[^"]*)" Name="(?<name>[^"]*)" GoldBack="-?\d+" EnableParcel="(?<parcel_from_shop>0|1)" Char="-?\d+" Item0="(?<item0>-?\d+)" Item1="(?<item1>-?\d+)" Item2="(?<item2>-?\d+)" Item3="(?<item3>-?\d+)" Item4="(?<item4>-?\d+)" Item5="(?<item5>-?\d+)" Item6="(?<item6>-?\d+)" Item7="(?<item7>-?\d+)" Item8="(?<item8>-?\d+)" Item9="(?<item9>-?\d+)" ?(?:Icon="[^"]*" ?)?(?:Name_kr="[^"]*" ?)?(?:Name_en="(?<name_en>[^"]*)" ?)?(?:Name_th="[^"]*" ?)?\/>/g)) {
    if (!match.groups) {
      continue;
    }
    const index = parseInt(match.groups.index);
    if (currentIndex + 1 !== index) {
      debugShopParsing && console.warn(`Failed parsing shop item index ${currentIndex + 2 === index ? currentIndex + 1 : `${currentIndex + 1} to ${index - 1}`}`);
    }
    currentIndex = index;
    const name = match.groups.name;
    const category = match.groups.category;
    if (category === "LOTTERY") {
      gachas.set(index, new Gacha(index, parseInt(match.groups.item0), name));
    }
    const enabled = !!parseInt(match.groups.enabled);
    const price_type = match.groups.price_type === "MINT" ? "ap" : match.groups.price_type === "GOLD" ? "gold" : "none";
    const price = parseInt(match.groups.price);
    const parcel_from_shop = !!parseInt(match.groups.parcel_from_shop);
    const itemIDs = [parseInt(match.groups.item0), parseInt(match.groups.item1), parseInt(match.groups.item2), parseInt(match.groups.item3), parseInt(match.groups.item4), parseInt(match.groups.item5), parseInt(match.groups.item6), parseInt(match.groups.item7), parseInt(match.groups.item8), parseInt(match.groups.item9)];
    const inner_items = itemIDs.filter(id => !!id && items.get(id)).map(id => items.get(id));
    if (category === "PARTS") {
      if (inner_items.length === 1) {
        shop_items.set(index, inner_items[0]);
      } else {
        const item = new Item();
        item.name_en = match.groups.name_en || match.groups.name;
        shop_items.set(index, item);
      }
      if (enabled) {
        const itemSource = new ShopItemSource(index, price, price_type === "ap", inner_items);
        for (const item of inner_items) {
          item.sources.push(itemSource);
        }
      }
    } else if (category === "LOTTERY") {
      const gachaItem = new Item();
      gachaItem.name_en = match.groups.name_en || match.groups.name;
      shop_items.set(index, gachaItem);
      if (enabled) {
        gachaItem.sources.push(new ShopItemSource(index, price, price_type === "ap", inner_items));
      }
    } else {
      const otherItem = new Item();
      otherItem.name_en = match.groups.name_en || match.groups.name;
      shop_items.set(index, otherItem);
    }
    count++;
  }
  console.log(`Found ${count} shop items`);
}
class ApiItem {
  productIndex = 0;
  display = 0;
  hitDisplay = false;
  enabled = false;
  useType = "";
  use0 = 0;
  use1 = 0;
  use2 = 0;
  priceType = "GOLD";
  oldPrice0 = 0;
  oldPrice1 = 0;
  oldPrice2 = 0;
  price0 = 0;
  price1 = 0;
  price2 = 0;
  couplePrice = 0;
  category = "";
  name = "";
  goldBack = 0;
  enableParcel = false;
  forPlayer = 0;
  item0 = 0;
  item1 = 0;
  item2 = 0;
  item3 = 0;
  item4 = 0;
  item5 = 0;
  item6 = 0;
  item7 = 0;
  item8 = 0;
  item9 = 0;
}
function isApiItem(obj) {
  if (obj === null || typeof obj !== "object") {
    return false;
  }
  return [typeof obj.productIndex === "number", typeof obj.display === "number", typeof obj.hitDisplay === "boolean", typeof obj.enabled === "boolean", typeof obj.useType === "string", typeof obj.use0 === "number", typeof obj.use1 === "number", typeof obj.use2 === "number", typeof obj.priceType === "string", typeof obj.oldPrice0 === "number", typeof obj.oldPrice1 === "number", typeof obj.oldPrice2 === "number", typeof obj.price0 === "number", typeof obj.price1 === "number", typeof obj.price2 === "number", typeof obj.couplePrice === "number", typeof obj.category === "string", typeof obj.name === "string", typeof obj.goldBack === "number", typeof obj.enableParcel === "boolean", typeof obj.forPlayer === "number", typeof obj.item0 === "number", typeof obj.item1 === "number", typeof obj.item2 === "number", typeof obj.item3 === "number", typeof obj.item4 === "number", typeof obj.item5 === "number", typeof obj.item6 === "number", typeof obj.item7 === "number", typeof obj.item8 === "number", typeof obj.item9 === "number"].every(b => b);
}
function parseApiShopData(data) {
  for (const apiItem of JSON.parse(data)) {
    if (!isApiItem(apiItem)) {
      console.error(`Incorrect format of item: ${data}`);
      continue;
    }
    const inner_items = [apiItem.item0, apiItem.item1, apiItem.item2, apiItem.item3, apiItem.item4, apiItem.item5, apiItem.item6, apiItem.item7, apiItem.item8, apiItem.item9].filter(id => !!id && items.get(id)).map(id => items.get(id));
    if (apiItem.category === "PARTS") {
      if (inner_items.length === 1) {
        shop_items.set(apiItem.productIndex, inner_items[0]);
      } else {
        const item = new Item();
        item.name_en = apiItem.name;
        shop_items.set(apiItem.productIndex, item);
      }
      if (apiItem.enabled) {
        const itemSource = new ShopItemSource(apiItem.productIndex, apiItem.price0, apiItem.priceType === "MINT", inner_items);
        for (const item of inner_items) {
          item.sources.push(itemSource);
        }
      }
    } else if (apiItem.category === "LOTTERY") {
      gachas.set(apiItem.productIndex, new Gacha(apiItem.productIndex, apiItem.item0, apiItem.name));
      const gachaItem = new Item();
      gachaItem.name_en = apiItem.name;
      shop_items.set(apiItem.productIndex, gachaItem);
      if (apiItem.enabled) {
        gachaItem.sources.push(new ShopItemSource(apiItem.productIndex, apiItem.price0, apiItem.priceType === "MINT", inner_items));
      }
    } else {
      const otherItem = new Item();
      otherItem.name_en = apiItem.name;
      shop_items.set(apiItem.productIndex, otherItem);
    }
  }
}
function parseGachaData(data, gacha) {
  for (const line of data.split("\n")) {
    if (!line.includes("<LotteryItem_")) {
      continue;
    }
    const match = line.match(/\s*<LotteryItem_(?<character>[^ ]*) Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="(?<quantity_min>\d+)" QuantityMax="(?<quantity_max>\d+)" ChansPer="(?<probability>\d+\.?\d*)\s*" Effect="\d+" ProductOpt="\d+"\/>/);
    if (!match) {
      console.warn(`Failed parsing gacha ${gacha.gacha_index}:\n${line}`);
      continue;
    }
    if (!match.groups) {
      continue;
    }
    let character = match.groups.character;
    if (character === "Lunlun") {
      character = "LunLun";
    }
    if (!isCharacter(character)) {
      console.warn(`Found unknown character "${character}" in lottery file ${gacha.gacha_index}`);
      continue;
    }
    const item = shop_items.get(parseInt(match.groups.shop_id));
    if (!item) {
      console.warn(`Found unknown shop item id ${match.groups.shop_id} in lottery file ${gacha.gacha_index}`);
      continue;
    }
    gacha.add(item, parseFloat(match.groups.probability), character, parseInt(match.groups.quantity_min), parseInt(match.groups.quantity_max));
  }
  for (const [, map] of gacha.shop_items) {
    for (const [item] of map) {
      item.sources.push(new GachaItemSource(gacha.shop_index));
    }
  }
}
function parseGuardianData(data) {
  const guardianData = JSON.parse(data);
  if (!Array.isArray(guardianData)) {
    return;
  }
  function getNumber(o) {
    if (typeof o === "number") {
      return o;
    }
  }
  const bossTimeInfo = new Map();
  for (const mapInfo of guardianData) {
    if (typeof mapInfo !== "object") {
      continue;
    }
    const map_name = mapInfo.Name;
    if (typeof map_name !== "string") {
      continue;
    }
    const rewards = Array.isArray(mapInfo.Rewards) ? [...mapInfo.Rewards] : [];
    const reward_items = rewards.filter(shop_id => typeof shop_id === "number" && shop_items.has(shop_id)).map(shop_id => shop_items.get(shop_id));
    const ExpMultiplier = getNumber(mapInfo.ExpMultiplier) || 0;
    const IsBossStage = !!mapInfo.IsBossStage;
    const MapID = getNumber(mapInfo.MapId) || 0;
    let BossTriggerTimerInSeconds = getNumber(mapInfo.BossTriggerTimerInSeconds) || -1;
    if (BossTriggerTimerInSeconds === -1) {
      BossTriggerTimerInSeconds = bossTimeInfo.get(MapID) || -1;
    } else {
      if (MapID !== 0) {
        bossTimeInfo.set(MapID, BossTriggerTimerInSeconds);
      }
    }
    for (const item of reward_items) {
      const guardianSource = new GuardianItemSource(map_name, reward_items, ExpMultiplier, IsBossStage, BossTriggerTimerInSeconds);
      item.sources.push(guardianSource);
    }
  }
}
async function download(url) {
  const filename = url.slice(url.lastIndexOf("/") + 1);
  const element = document.getElementById("loading");
  if (element instanceof HTMLElement) {
    element.textContent = `Loading ${filename}, please wait...`;
  }
  const reply = await fetch(url);
  const progressbar = document.getElementById("progressbar");
  if (progressbar instanceof HTMLProgressElement) {
    progressbar.value++;
  }
  if (!reply.ok) {
    alert(`Oops, something broke. Complain to Lilli/Kanone/XxharCs about:\nFailed downloading ${url} because of ${reply.statusText}.`);
    return "";
  }
  return reply.text();
}
async function downloadItems() {
  const progressbar = document.getElementById("progressbar");
  if (progressbar instanceof HTMLProgressElement) {
    progressbar.value = 0;
    progressbar.max = 122;
  }
  const itemSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res";
  const gachaSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/game-server/src/main/resources/res/lottery";
  const guardianSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res/";
  const itemURL = itemSource + "/Item_Parts_Ini3.xml";
  const itemData = download(itemURL);
  //const shopURL = itemSource + "/Shop_Ini3.xml";
  const max_shop_pages = 20; //currently need only 10, should be enough
  const shopURL = "https://jftse.com/jftse-restservice/api/shop?size=1000&page=";
  const shopDatas = [...Array(max_shop_pages).keys()].map(n => download(`${shopURL}${n}`));
  const guardianURL = guardianSource + "/GuardianStages.json";
  const guardianData = download(guardianURL);
  parseItemData(await itemData);
  //parseShopData(await shopData);
  await Promise.all(shopDatas.map(p => p.then(data => parseApiShopData(data))));
  console.log(`Found ${gachas.size} gachas`);
  if (progressbar instanceof HTMLProgressElement) {
    progressbar.value = 0;
    progressbar.max = gachas.size + 3;
  }
  const gacha_items = [];
  for (const [, gacha] of gachas) {
    const gacha_url = `${gachaSource}/Ini3_Lot_${`${gacha.gacha_index}`.padStart(2, "0")}.xml`;
    gacha_items.push([download(gacha_url), gacha, gacha_url]);
  }
  parseGuardianData(await guardianData);
  for (const [item, gacha, gacha_url] of gacha_items) {
    try {
      parseGachaData(await item, gacha);
    } catch (e) {
      console.warn(`Failed downloading ${gacha_url} because ${e}`);
    }
  }
  console.log(`Loaded ${items.size} items`);
}
function deletableItem(name, id) {
  return (0, _html.createHTML)(["div", (0, _html.createHTML)(["button", {
    class: "item_removal",
    "data-item_index": `${id}`
  }, "X"]), name]);
}
function createPopupLink(text, content) {
  const link = (0, _html.createHTML)(["a", {
    class: "popup_link"
  }, text]);
  link.addEventListener("click", e => {
    if (!(e instanceof MouseEvent)) {
      return;
    }
    const top_div = document.getElementById("top_div");
    if (!(top_div instanceof HTMLDivElement)) {
      return;
    }
    e.stopPropagation();
    if (dialog) {
      dialog.close();
      dialog.remove();
    }
    dialog = Array.isArray(content) ? (0, _html.createHTML)(["dialog", ...content]) : (0, _html.createHTML)(["dialog", content]);
    top_div.appendChild(dialog);
    const width = 300;
    dialog.style.position = "absolute";
    dialog.style.top = `${e.pageY}px`;
    dialog.style.left = `${e.pageX - width}px`;
    dialog.show();
  });
  return link;
}
function createChancePopup(tries) {
  function probabilityAfterNTries(probability, tries) {
    return 1 - Math.pow(1 - probability, tries);
  }
  const content = (0, _html.createHTML)(["table", ["tr", ["th", "Number of gachas"], ["th", "Chance for item"]]]);
  for (const factor of [0.1, 0.5, 1, 2, 5, 10]) {
    const gachas = Math.round(tries * factor);
    if (gachas === 0) {
      continue;
    }
    content.appendChild((0, _html.createHTML)(["tr", ["td", {
      class: "numeric"
    }, `${gachas}`], ["td", {
      class: "numeric"
    }, `${(probabilityAfterNTries(1 / tries, gachas) * 100).toFixed(4)}%`]]));
  }
  content.appendChild((0, _html.createHTML)(["tr"]));
  return createPopupLink(`${prettyNumber(tries, 2)}`, content);
}
function quantityString(quantity_min, quantity_max) {
  if (quantity_min === 1 && quantity_max === 1) {
    return "";
  }
  if (quantity_min === quantity_max) {
    return ` x ${quantity_max}`;
  }
  return ` x ${quantity_min}-${quantity_max}`;
}
function createGachaSourcePopup(item, itemSource, character) {
  const content = character ? (0, _html.createHTML)(["table", ["tr", ["th", "Item"], ["th", "Average Tries"]]]) : (0, _html.createHTML)(["table", ["tr", ["th", "Item"], ["th", "Character"], ["th", "Average Tries"]]]);
  const gacha = gachas.get(itemSource.shop_id);
  if (!gacha) {
    throw "Internal error";
  }
  const gacha_items = new Map();
  for (const char of character === undefined ? characters : [character]) {
    const char_items = gacha.shop_items.get(char);
    if (!char_items) {
      continue;
    }
    for (const [char_gacha_item, [tickets, quantity_min, quantity_max]] of char_items) {
      const item_character = char_gacha_item.character || character;
      const item_tickets = item_character ? gacha.character_probability.get(item_character) : gacha.total_probability;
      const probability = tickets / item_tickets;
      const previous_probability = gacha_items.get(char_gacha_item)?.[0] || 0;
      gacha_items.set(char_gacha_item, [previous_probability + probability, quantity_min, quantity_max]);
    }
  }
  for (const [char_gacha_item, [probability, quantity_min, quantity_max]] of gacha_items) {
    if (character) {
      content.appendChild((0, _html.createHTML)(["tr", item === char_gacha_item ? {
        class: "highlighted"
      } : "", ["td", char_gacha_item.name_en, quantityString(quantity_min, quantity_max)], ["td", {
        class: "numeric"
      }, `${prettyNumber(1 / probability, 2)}`]]));
    } else {
      content.appendChild((0, _html.createHTML)(["tr", item === char_gacha_item ? {
        class: "highlighted"
      } : "", ["td", char_gacha_item.name_en, quantityString(quantity_min, quantity_max)], ["td", char_gacha_item.character || "*"], ["td", {
        class: "numeric"
      }, `${prettyNumber(1 / probability, 2)}`]]));
    }
  }
  return createPopupLink(itemSource.item.name_en, [(0, _html.createHTML)(["a", gacha.name]), content]);
}
function createSetSourcePopup(item, itemSource) {
  const contentTable = (0, _html.createHTML)(["table", ["tr", ["th", "Contents"]]]);
  for (const inner_item of itemSource.items) {
    contentTable.appendChild((0, _html.createHTML)(["tr", inner_item === item ? {
      class: "highlighted"
    } : "", ["td", inner_item.name_en]]));
  }
  return createPopupLink(itemSource.item.name_en, [(0, _html.createHTML)(["a", itemSource.item.name_en, contentTable])]);
}
function prettyTime(seconds) {
  return `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, "0")}`;
}
function createGuardianPopup(item, itemSource) {
  const content = [`Guardian map ${itemSource.guardian_map}`, (0, _html.createHTML)(["ul", {
    class: "layout"
  }, ["li", "Items:", ["ul", {
    class: "layout"
  }, ...itemSource.items.reduce((curr, reward_item) => [...curr, (0, _html.createHTML)(["li", {
    class: reward_item === item ? "highlighted" : ""
  }, reward_item.name_en])], [])]], ["li", `Requires boss: ${itemSource.need_boss ? "Yes" : "No"}`], ...(itemSource.boss_time > 0 ? [(0, _html.createHTML)(["li", `Boss time: ${prettyTime(itemSource.boss_time)}`])] : []), ["li", `EXP multiplier: ${itemSource.xp}`]])];
  return createPopupLink(itemSource.guardian_map, content);
}
function itemSourcesToElementArray(item, sourceFilter, character) {
  return [...item.sources.values()].filter(sourceFilter).map(itemSource => sourceItemElement(item, itemSource, sourceFilter, character));
}
function makeSourcesList(list) {
  const result = [];
  function add(element) {
    if (typeof element === "string" && typeof result[result.length - 1] === "string") {
      result[result.length - 1] = result[result.length - 1] + element;
      return;
    }
    result.push(element);
  }
  let first = true;
  for (const elements of list) {
    if (elements.length === 0) {
      add(" ");
      continue;
    }
    if (!first) {
      add(", ");
    } else {
      first = false;
    }
    for (const element of elements) {
      if (element === "") {
        continue;
      }
      add(element);
    }
  }
  return result;
}
function sourceItemElement(item, itemSource, sourceFilter, character) {
  if (itemSource instanceof GachaItemSource) {
    const char = itemSource.requiresGuardian ? undefined : character;
    const sources = itemSourcesToElementArray(itemSource.item, sourceFilter, character);
    const sourcesList = makeSourcesList(sources);
    return [createGachaSourcePopup(item, itemSource, char), ` x `, createChancePopup(itemSource.gachaTries(item, character)), ...(sourcesList.length > 0 ? [" "] : []), ...sourcesList];
  } else if (itemSource instanceof ShopItemSource) {
    if (itemSource.items.length === 1) {
      return [`${itemSource.price} ${itemSource.ap ? "AP" : "Gold"}`];
    }
    return [createSetSourcePopup(item, itemSource), ` ${itemSource.price} ${itemSource.ap ? "AP" : "Gold"}`];
  } else if (itemSource instanceof GuardianItemSource) {
    return [createGuardianPopup(item, itemSource)];
  } else {
    throw "Internal error";
  }
}
function itemToTableRow(item, sourceFilter, priorityStats, character) {
  const row = (0, _html.createHTML)(["tr", ["td", {
    class: "Name_column"
  }, deletableItem(item.name_en, item.id)], ["td", {
    class: "Character_column"
  }, item.character ?? "All"], ["td", {
    class: "Part_column"
  }, item.part], ...priorityStats.map(stat => (0, _html.createHTML)(["td", {
    class: "numeric"
  }, stat.split("+").map(s => item.statFromString(s)).join("+")])), ["td", {
    class: "Level_column numeric"
  }, `${item.level}`], ["td", {
    class: "Source_column"
  }, ...makeSourcesList(itemSourcesToElementArray(item, sourceFilter, character))]]);
  return row;
}
function getGachaTable(filter, char) {
  const table = (0, _html.createHTML)(["table", ["tr", ["th", {
    class: "Name_column"
  }, "Name"]]]);
  for (const [, gacha] of gachas) {
    const gachaItem = shop_items.get(gacha.shop_index);
    if (!gachaItem) {
      throw "Internal error";
    }
    if (filter(gachaItem)) {
      table.appendChild((0, _html.createHTML)(["tr", ["td", createGachaSourcePopup(undefined, new ItemSource(gacha.shop_index), char)]]));
    }
  }
  return table;
}
function getResultsTable(filter, sourceFilter, priorizer, priorityStats, character) {
  const results = {
    "Hat": [],
    "Hair": [],
    "Dye": [],
    "Upper": [],
    "Lower": [],
    "Shoes": [],
    "Socks": [],
    "Hand": [],
    "Backpack": [],
    "Face": [],
    "Racket": []
  };
  for (const [, item] of items) {
    if (filter(item)) {
      results[item.part] = priorizer(results[item.part], item);
    }
  }
  const table = (0, _html.createHTML)(["table", ["tr", ["th", {
    class: "Name_column"
  }, "Name"], ["th", {
    class: "Character_column"
  }, "Character"], ["th", {
    class: "Part_column"
  }, "Part"], ...priorityStats.map(stat => (0, _html.createHTML)(["th", {
    class: "numeric"
  }, stat])), ["th", {
    class: "Level_column numeric"
  }, "Level"], ["th", {
    class: "Source_column"
  }, "Source"]]]);
  function combineMaps(m1, m2) {
    const result = {
      ...m1
    };
    for (const [map, tries] of Object.entries(m2)) {
      if (result[map]) {
        result[map] = result[map].concat(tries);
      } else {
        result[map] = tries;
      }
    }
    return result;
  }
  function combineCosts(cost1, cost2) {
    return {
      gold: cost1.gold + cost2.gold,
      ap: cost1.ap + cost2.ap,
      maps: combineMaps(cost1.maps, cost2.maps)
    };
  }
  function minMap(m1, m2) {
    const result = {
      ...m1
    };
    for (const [map, tries] of Object.entries(m2)) {
      if (tries.length !== 1) {
        throw "Internal error";
      }
      if (result[map]) {
        result[map] = [Math.min(result[map][0], tries[0])];
      } else {
        result[map] = tries;
      }
    }
    return result;
  }
  function minCost(cost1, cost2) {
    return [cost1.ap, cost1.gold] < [cost1.ap, cost1.gold] ? {
      gold: cost1.gold,
      ap: cost1.ap,
      maps: minMap(cost1.maps, cost2.maps)
    } : {
      gold: cost2.gold,
      ap: cost2.ap,
      maps: minMap(cost1.maps, cost2.maps)
    };
  }
  function costOf(item, character) {
    return [...item.sources.values()].filter(sourceFilter).reduce((curr, itemSource) => {
      const cost = (() => {
        if (itemSource instanceof ShopItemSource) {
          if (itemSource.ap) {
            return {
              gold: 0,
              ap: itemSource.price,
              maps: {}
            };
          }
          return {
            gold: itemSource.price,
            ap: 0,
            maps: {}
          };
        } else if (itemSource instanceof GachaItemSource) {
          const singleCost = costOf(itemSource.item, character);
          const multiplier = itemSource.gachaTries(item, character);
          return {
            gold: singleCost.gold * multiplier,
            ap: singleCost.ap * multiplier,
            maps: Object.fromEntries(Object.entries(singleCost.maps).map(([map, tries]) => [map, tries.map(n => n * multiplier)]))
          };
        } else if (itemSource instanceof GuardianItemSource) {
          return {
            gold: 0,
            ap: 0,
            maps: Object.fromEntries([[itemSource.guardian_map, [itemSource.items.length]]])
          };
        } else {
          throw "Internal error";
        }
      })();
      return minCost(curr, cost);
    }, {
      gold: 0,
      ap: 0,
      maps: {}
    });
  }
  const statistics = {
    characters: new Set(),
    ...priorityStats.reduce((curr, stat) => ({
      ...curr,
      [stat]: 0
    }), {}),
    Level: 0,
    cost: {
      ap: 0,
      gold: 0,
      maps: {}
    }
  };
  for (const result of Object.values(results)) {
    if (result.length === 0) {
      continue;
    }
    for (const stat of priorityStats) {
      //@ts-ignore
      if (typeof statistics[stat] !== "number") {
        continue;
      }
      const value = stat.split("+").reduce((curr, statName) => curr + result[0].statFromString(statName), 0);
      //@ts-ignore
      statistics[stat] += value;
    }
    statistics.Level = Math.max(result[0].level, statistics.Level);
    for (const item of result) {
      for (const char of item.character ? [item.character] : characters) {
        statistics.characters.add(char);
        table.appendChild(itemToTableRow(item, sourceFilter, priorityStats, char));
      }
      statistics.cost = combineCosts(costOf(item, character && isCharacter(character) ? character : undefined), statistics.cost);
    }
  }
  if (statistics.characters.size === 1) {
    const total_sources = [];
    if (statistics.cost.gold > 0) {
      total_sources.push(`${statistics.cost.gold.toFixed(0)} Gold`);
    }
    if (statistics.cost.ap > 0) {
      total_sources.push(`${statistics.cost.ap.toFixed(0)} AP`);
    }
    //statistics['Guardian games'].forEach((count, map) => total_sources.push(`${count.toFixed(0)} x ${map}`));
    table.appendChild((0, _html.createHTML)(["tr", ["td", {
      class: "total Name_column"
    }, "Total:"], ["td", {
      class: "total Character_column"
    }], ["td", {
      class: "total Part_column"
    }], ...priorityStats.map(stat => (0, _html.createHTML)(["td", {
      class: "total numeric"
    },
    //@ts-ignore
    `${statistics[stat]}`])), ["td", {
      class: "total Level_column numeric"
    }, `${statistics.Level}`], ["td", {
      class: "total Source_column"
    }, total_sources.join(", ")]]));
    for (const column_element of table.getElementsByClassName(`Character_column`)) {
      if (!(column_element instanceof HTMLElement)) {
        continue;
      }
      column_element.hidden = true;
    }
  }
  for (const attribute of priorityStats) {
    //@ts-ignore
    if (statistics[attribute] === 0) {
      for (const column_element of table.getElementsByClassName(`${attribute}_column`)) {
        if (!(column_element instanceof HTMLElement)) {
          continue;
        }
        column_element.hidden = true;
      }
    }
  }
  return table;
}
function getMaxItemLevel() {
  //no reduce for Map?
  let max = 0;
  for (const [, item] of items) {
    max = Math.max(max, item.level);
  }
  return max;
}
document.body.addEventListener('click', event => {
  if (dialog && dialog !== event.target) {
    dialog.close();
    dialog.remove();
    dialog = undefined;
  }
});

},{"./html":2}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isItemSelector = isItemSelector;
exports.itemSelectors = void 0;
var _checkboxTree = require("./checkboxTree");
var _itemLookup = require("./itemLookup");
var _html = require("./html");
var _storage = require("./storage");
const partsFilter = ["Parts", ["Head", ["+Hat", "+Hair", "Dye"], "+Upper", "+Lower", "Legs", ["+Shoes", "Socks"], "Aux", ["+Hand", "+Backpack", "+Face"], "+Racket"]];
const availabilityFilter = ["Availability", ["Shop", ["+Gold", "+AP"], "+Allow gacha", "+Guardian", "+Untradable", "Unavailable items"]];
const excluded_item_ids = new Set();
function addFilterTrees() {
  const target = document.getElementById("characterFilters");
  if (!target) {
    return;
  }
  let first = true;
  for (const character of ["All", ..._itemLookup.characters]) {
    const id = `characterSelectors_${character}`;
    const radio_button = (0, _html.createHTML)(["input", {
      id: id,
      type: "radio",
      name: "characterSelectors",
      value: character
    }]);
    radio_button.addEventListener("input", updateResults);
    target.appendChild(radio_button);
    target.appendChild((0, _html.createHTML)(["label", {
      for: id
    }, character]));
    target.appendChild((0, _html.createHTML)(["br"]));
    if (first) {
      radio_button.checked = true;
      first = false;
    }
  }
  const filters = [[partsFilter, "partsFilter"], [availabilityFilter, "availabilityFilter"]];
  for (const [filter, name] of filters) {
    const target = document.getElementById(name);
    if (!target) {
      return;
    }
    const tree = (0, _checkboxTree.makeCheckboxTree)(filter);
    tree.addEventListener("change", updateResults);
    target.innerText = "";
    target.appendChild(tree);
  }
}
addFilterTrees();
let dragged;
const dragSeparatorLine = (0, _html.createHTML)(["hr", {
  id: "dragOverBar"
}]);
let dragHighlightedElement;
function applyDragDrop() {
  document.addEventListener("dragstart", ({
    target
  }) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }
    dragged = target;
  });
  document.addEventListener("dragover", event => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    if (event.target.className === "dropzone") {
      const targetRect = event.target.getBoundingClientRect();
      const y = event.clientY - targetRect.top;
      const height = targetRect.height;
      let Position;
      (function (Position) {
        Position[Position["above"] = 0] = "above";
        Position[Position["on"] = 1] = "on";
        Position[Position["below"] = 2] = "below";
      })(Position || (Position = {}));
      const position = y < height * 0.3 ? Position.above : y > height * 0.7 ? Position.below : Position.on;
      switch (position) {
        case Position.above:
          if (dragHighlightedElement) {
            dragHighlightedElement.classList.remove("drophover");
            dragHighlightedElement = undefined;
          }
          dragSeparatorLine.hidden = false;
          event.target.before(dragSeparatorLine);
          break;
        case Position.below:
          if (dragHighlightedElement) {
            dragHighlightedElement.classList.remove("drophover");
            dragHighlightedElement = undefined;
          }
          dragSeparatorLine.hidden = false;
          event.target.after(dragSeparatorLine);
          break;
        case Position.on:
          dragSeparatorLine.hidden = true;
          if (dragHighlightedElement) {
            dragHighlightedElement.classList.remove("drophover");
          }
          if (dragged === event.target) {
            break;
          }
          dragHighlightedElement = event.target;
          dragHighlightedElement.classList.add("drophover");
          break;
      }
    }
    event.preventDefault();
  });
  document.addEventListener("drop", ({
    target
  }) => {
    if (!dragSeparatorLine.hidden) {
      dragged.remove();
      dragSeparatorLine.after(dragged);
      dragSeparatorLine.hidden = true;
      updateResults();
      return;
    }
    dragSeparatorLine.hidden = true;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (dragHighlightedElement) {
      dragHighlightedElement.classList.remove("drophover");
      const dropTarget = dragHighlightedElement;
      dragHighlightedElement = undefined;
      if (!(dropTarget instanceof HTMLLIElement)) {
        return;
      }
      dropTarget.textContent += `+${dragged.textContent}`;
      dragged.remove();
    }
    if (target === dragged) {
      const stats = dragged.textContent.split("+");
      dragged.textContent = stats.shift();
      dragged.after(...stats.map(stat => (0, _html.createHTML)(["li", {
        class: "dropzone",
        draggable: "true"
      }, stat])));
    }
    updateResults();
  });
}
applyDragDrop();
function compare(lhs, rhs) {
  if (lhs === rhs) {
    return 0;
  }
  return lhs < rhs ? -1 : 1;
}
function getSelectedCharacter() {
  const characterFilterList = document.getElementsByName("characterSelectors");
  for (const element of characterFilterList) {
    if (!(element instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    if (element.checked) {
      const selection = element.value;
      if ((0, _itemLookup.isCharacter)(selection)) {
        return selection;
      }
      return;
    }
  }
}
function setSelectedCharacter(character) {
  const characterFilterList = document.getElementsByName("characterSelectors");
  for (const element of characterFilterList) {
    if (!(element instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    if (element.value === character) {
      element.checked = true;
      return;
    }
  }
}
const itemSelectors = ["partsSelector", "gachaSelector", "otherItemsSelector"];
exports.itemSelectors = itemSelectors;
function isItemSelector(itemSelector) {
  return itemSelectors.includes(itemSelector);
}
function getItemTypeSelection() {
  const partsSelector = document.getElementById("partsSelector");
  if (!(partsSelector instanceof HTMLInputElement)) {
    throw "Internal error";
  }
  if (partsSelector.checked) {
    return "partsSelector";
  }
  const gachaSelector = document.getElementById("gachaSelector");
  if (!(gachaSelector instanceof HTMLInputElement)) {
    throw "Internal error";
  }
  if (gachaSelector.checked) {
    return "gachaSelector";
  }
  const otherItemsSelector = document.getElementById("otherItemsSelector");
  if (!(otherItemsSelector instanceof HTMLInputElement)) {
    throw "Internal error";
  }
  if (otherItemsSelector.checked) {
    return "otherItemsSelector";
  }
  throw "Internal error";
}
function saveSelection() {
  const selectedCharacter = getSelectedCharacter() || "All";
  _storage.Variable_storage.set_variable("Character", selectedCharacter);
  {
    //Filters
    const partsFilterList = document.getElementById("partsFilter")?.children[0];
    if (!(partsFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    for (const [name, value] of Object.entries((0, _checkboxTree.getLeafStates)(partsFilterList))) {
      _storage.Variable_storage.set_variable(name, value);
    }
    const availabilityFilterList = document.getElementById("availabilityFilter")?.children[0];
    if (!(availabilityFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    for (const [name, value] of Object.entries((0, _checkboxTree.getLeafStates)(availabilityFilterList))) {
      _storage.Variable_storage.set_variable(name, value);
    }
  }
  {
    //misc
    const levelrange = document.getElementById("levelrange");
    if (!(levelrange instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    const maxLevel = parseInt(levelrange.value);
    _storage.Variable_storage.set_variable("maxLevel", maxLevel);
    const namefilter = document.getElementById("nameFilter");
    if (!(namefilter instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    const item_name = namefilter.value;
    if (item_name) {
      _storage.Variable_storage.set_variable("nameFilter", item_name);
    } else {
      _storage.Variable_storage.delete_variable("nameFilter");
    }
    const enchantToggle = document.getElementById("enchantToggle");
    if (!(enchantToggle instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    _storage.Variable_storage.set_variable("enchantToggle", enchantToggle.checked);
  }
  {
    //item selection
    _storage.Variable_storage.set_variable("itemTypeSelector", getItemTypeSelection());
  }
  _storage.Variable_storage.set_variable("excluded_item_ids", Array.from(excluded_item_ids).join(","));
}
function restoreSelection() {
  const stored_character = _storage.Variable_storage.get_variable("Character");
  setSelectedCharacter(typeof stored_character === "string" && (0, _itemLookup.isCharacter)(stored_character) ? stored_character : "All");
  {
    //Filters
    let states = {};
    for (const [name, value] of Object.entries(_storage.Variable_storage.variables)) {
      if (typeof value === "boolean") {
        states[name] = value;
      }
    }
    const partsFilterList = document.getElementById("partsFilter")?.children[0];
    if (!(partsFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    (0, _checkboxTree.setLeafStates)(partsFilterList, states);
    const availabilityFilterList = document.getElementById("availabilityFilter")?.children[0];
    if (!(availabilityFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    (0, _checkboxTree.setLeafStates)(availabilityFilterList, states);
  }
  const levelrange = document.getElementById("levelrange");
  {
    //misc
    if (!(levelrange instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    const maxLevel = _storage.Variable_storage.get_variable("maxLevel");
    if (typeof maxLevel === "number") {
      levelrange.value = `${maxLevel}`;
    } else {
      levelrange.value = levelrange.max;
    }
    const namefilter = document.getElementById("nameFilter");
    if (!(namefilter instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    const item_name = _storage.Variable_storage.get_variable("nameFilter");
    if (typeof item_name === "string") {
      namefilter.value = item_name;
    }
    const enchantToggle = document.getElementById("enchantToggle");
    if (!(enchantToggle instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    enchantToggle.checked = !!_storage.Variable_storage.get_variable("enchantToggle");
  }
  {
    //item selection
    let itemTypeSelector = _storage.Variable_storage.get_variable("itemTypeSelector");
    if (typeof itemTypeSelector !== "string" || !isItemSelector(itemTypeSelector)) {
      itemTypeSelector = "partsSelector";
    }
    const selector = document.getElementById(itemTypeSelector);
    if (!(selector instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    selector.checked = true;
    selector.dispatchEvent(new Event("change", {
      bubbles: false,
      cancelable: true
    }));
  }
  const excluded_ids = _storage.Variable_storage.get_variable("excluded_item_ids");
  if (typeof excluded_ids === "string") {
    for (const id of excluded_ids.split(",")) {
      excluded_item_ids.add(parseInt(id));
    }
  }
  excluded_item_ids.delete(NaN);
  //must be last because it triggers a store
  levelrange.dispatchEvent(new Event("input"));
}
function updateResults() {
  saveSelection();
  const filters = [];
  const sourceFilters = [];
  let selectedCharacter;
  const partsFilterList = document.getElementById("partsFilter")?.children[0];
  if (!(partsFilterList instanceof HTMLUListElement)) {
    throw "Internal error";
  }
  const enchantToggle = document.getElementById("enchantToggle");
  if (!(enchantToggle instanceof HTMLInputElement)) {
    throw "Internal error";
  }
  const namefilter = document.getElementById("nameFilter");
  if (!(namefilter instanceof HTMLInputElement)) {
    throw "Internal error";
  }
  {
    //character filter
    selectedCharacter = getSelectedCharacter();
    switch (getItemTypeSelection()) {
      case 'partsSelector':
        if (selectedCharacter) {
          filters.push(item => item.character === selectedCharacter);
        }
        break;
      case 'gachaSelector':
        break;
      case 'otherItemsSelector':
        break;
    }
  }
  {
    //parts filter
    switch (getItemTypeSelection()) {
      case 'partsSelector':
        const partsStates = (0, _checkboxTree.getLeafStates)(partsFilterList);
        filters.push(item => partsStates[item.part]);
        break;
      case 'gachaSelector':
        break;
      case 'otherItemsSelector':
        break;
    }
  }
  {
    //availability filter
    const availabilityFilterList = document.getElementById("availabilityFilter")?.children[0];
    if (!(availabilityFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    const availabilityStates = (0, _checkboxTree.getLeafStates)(availabilityFilterList);
    if (!availabilityStates["Gold"]) {
      sourceFilters.push(itemSource => !(itemSource instanceof _itemLookup.ShopItemSource && !itemSource.ap && itemSource.price > 0));
    }
    if (!availabilityStates["AP"]) {
      sourceFilters.push(itemSource => !(itemSource instanceof _itemLookup.ShopItemSource && itemSource.ap && itemSource.price > 0));
    }
    if (!availabilityStates["Untradable"]) {
      filters.push(item => item.parcel_enabled);
    }
    if (!availabilityStates["Allow gacha"]) {
      sourceFilters.push(itemSource => !(itemSource instanceof _itemLookup.GachaItemSource));
    }
    if (!availabilityStates["Guardian"]) {
      sourceFilters.push(itemSource => !itemSource.requiresGuardian);
    }
    if (!availabilityStates["Unavailable items"]) {
      const availabilitySourceFilter = [...sourceFilters];
      const sourceFilter = itemSource => availabilitySourceFilter.every(filter => filter(itemSource));
      function isAvailableSource(itemSource) {
        if (!sourceFilter(itemSource)) {
          return false;
        }
        if (itemSource instanceof _itemLookup.GachaItemSource) {
          for (const source of itemSource.item.sources) {
            if (isAvailableSource(source)) {
              return true;
            }
          }
        } else {
          return true;
        }
        return false;
      }
      sourceFilters.push(isAvailableSource);
      function isAvailableItem(item) {
        for (const itemSource of item.sources) {
          if (isAvailableSource(itemSource)) {
            return true;
          }
        }
        return false;
      }
      filters.push(isAvailableItem);
    }
  }
  {
    //misc filter
    const levelrange = document.getElementById("levelrange");
    if (!(levelrange instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    const maxLevel = parseInt(levelrange.value);
    filters.push(item => item.level <= maxLevel);
    const item_name = namefilter.value;
    if (item_name) {
      filters.push(item => item.name_en.toLowerCase().includes(item_name.toLowerCase()));
    }
  }
  {
    //id filter
    filters.push(item => !excluded_item_ids.has(item.id));
    const itemFilterList = document.getElementById("itemFilter");
    if (!(itemFilterList instanceof HTMLDivElement)) {
      throw "Internal error";
    }
    itemFilterList.replaceChildren();
    for (const id of excluded_item_ids) {
      const item = _itemLookup.items.get(id);
      if (!item) {
        continue;
      }
      itemFilterList.appendChild((0, _html.createHTML)(["div", (0, _html.createHTML)(["button", {
        class: "item_removal_removal",
        "data-item_index": `${id}`
      }, "X"]), item.name_en]));
    }
  }
  const comparators = [];
  const priorityList = document.getElementById("priority_list");
  if (!(priorityList instanceof HTMLOListElement)) {
    throw "Internal error";
  }
  const priorityStats = Array.from(priorityList.childNodes).filter(node => !node.textContent?.includes('\n')).filter(node => node.textContent).map(node => node.textContent);
  {
    for (const stat of priorityStats) {
      const stats = stat.split("+");
      comparators.push((lhs, rhs) => compare(stats.map(stat => lhs.statFromString(stat)).reduce((n, m) => n + m), stats.map(stat => rhs.statFromString(stat)).reduce((n, m) => n + m)));
    }
  }
  const table = (() => {
    switch (getItemTypeSelection()) {
      case 'partsSelector':
        return (0, _itemLookup.getResultsTable)(item => filters.every(filter => filter(item)), itemSource => sourceFilters.every(filter => filter(itemSource)), (items, item) => {
          if (items.length === 0) {
            return [item];
          }
          for (const comparator of comparators) {
            switch (comparator(items[0], item)) {
              case -1:
                return [item];
              case 1:
                return items;
            }
          }
          return [...items, item];
        }, priorityStats, selectedCharacter);
      case 'gachaSelector':
        return (0, _itemLookup.getGachaTable)(item => filters.every(filter => filter(item)), selectedCharacter);
      case 'otherItemsSelector':
        return (0, _html.createHTML)(["table", ["tr", ["th", "TODO: Other items"]]]);
    }
  })();
  const target = document.getElementById("results");
  if (!target) {
    return;
  }
  target.innerText = "";
  target.appendChild(table);
}
function setMaxLevelDisplayUpdate() {
  const levelDisplay = document.getElementById("levelDisplay");
  if (!(levelDisplay instanceof HTMLLabelElement)) {
    throw "Internal error";
  }
  const levelrange = document.getElementById("levelrange");
  if (!(levelrange instanceof HTMLInputElement)) {
    throw "Internal error";
  }
  levelrange.addEventListener("input", () => {
    levelDisplay.textContent = `Max level requirement: ${levelrange.value}`;
    updateResults();
  });
}
function setDisplayUpdates() {
  setMaxLevelDisplayUpdate();
  const namefilter = document.getElementById("nameFilter");
  if (!(namefilter instanceof HTMLElement)) {
    throw "Internal error";
  }
  namefilter.addEventListener("input", updateResults);
  const enchantToggle = document.getElementById("enchantToggle");
  if (!(enchantToggle instanceof HTMLInputElement)) {
    throw "Internal error";
  }
  const priorityList = document.getElementById("priority_list");
  if (!(priorityList instanceof HTMLOListElement)) {
    throw "Internal error";
  }
  enchantToggle.addEventListener("input", () => {
    const priorityStatNodes = Array.from(priorityList.childNodes).filter(node => !node.textContent?.includes('\n')).filter(node => node.textContent);
    for (const node of priorityStatNodes) {
      const regex = enchantToggle.checked ? /^((?:Str)|(?:Sta)|(?:Dex)|(?:Will))$/ : /^Max ((?:Str)|(?:Sta)|(?:Dex)|(?:Will))$/;
      const replacer = enchantToggle.checked ? "Max $1" : "$1";
      node.textContent = node.textContent.split("+").map(s => s.replace(regex, replacer)).join("+");
    }
    updateResults();
  });
}
setDisplayUpdates();
function setItemTypeSelectorFunctionality() {
  const priority_group = document.getElementById("priority_group");
  if (!(priority_group instanceof HTMLFieldSetElement)) {
    return;
  }
  const partsSelector = document.getElementById("partsSelector");
  if (!(partsSelector instanceof HTMLInputElement)) {
    return;
  }
  const partsFilter = document.getElementById("partsFilter");
  if (!(partsFilter instanceof HTMLDivElement)) {
    return;
  }
  partsSelector.addEventListener("change", () => {
    priority_group.classList.remove("disabled");
    partsFilter.classList.remove("disabled");
    updateResults();
  });
  const gachaSelector = document.getElementById("gachaSelector");
  if (!(gachaSelector instanceof HTMLInputElement)) {
    return;
  }
  gachaSelector.addEventListener("change", () => {
    priority_group.classList.add("disabled");
    partsFilter.classList.add("disabled");
    updateResults();
  });
  const otherItemsSelector = document.getElementById("otherItemsSelector");
  if (!(otherItemsSelector instanceof HTMLInputElement)) {
    return;
  }
  otherItemsSelector.addEventListener("change", () => {
    priority_group.classList.add("disabled");
    partsFilter.classList.add("disabled");
    updateResults();
  });
}
window.addEventListener("load", async () => {
  setItemTypeSelectorFunctionality();
  restoreSelection();
  await (0, _itemLookup.downloadItems)();
  for (const element of document.getElementsByClassName("show_after_load")) {
    if (element instanceof HTMLElement) {
      element.hidden = false;
    }
  }
  for (const element of document.getElementsByClassName("hide_after_load")) {
    if (element instanceof HTMLElement) {
      element.style.display = "none";
    }
  }
  const levelrange = document.getElementById("levelrange");
  if (!(levelrange instanceof HTMLInputElement)) {
    throw "Internal error";
  }
  const maxLevel = (0, _itemLookup.getMaxItemLevel)();
  levelrange.value = `${Math.min(parseInt(levelrange.value), maxLevel)}`;
  levelrange.max = `${maxLevel}`;
  levelrange.dispatchEvent(new Event("input"));
  updateResults();
  const sort_help = document.getElementById("priority_legend");
  if (sort_help instanceof HTMLLegendElement) {
    sort_help.appendChild((0, _itemLookup.createPopupLink)(" (?)", (0, _html.createHTML)(["p", "Reorder the stats to your liking to affect the results list.", ["br"], "Drag a stat up or down to change its importance (for example drag Lob above Charge).", ["br"], "Drag a stat onto another to combine them (for example Str onto Dex, the results will display Str+Dex).", ["br"], "Drag a combined stat onto itself to separate them."])));
  }
});
document.body.addEventListener('click', event => {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }
  if (event.target.className === "item_removal") {
    if (!event.target.dataset.item_index) {
      return;
    }
    excluded_item_ids.add(parseInt(event.target.dataset.item_index));
    updateResults();
  } else if (event.target.className === "item_removal_removal") {
    if (!event.target.dataset.item_index) {
      return;
    }
    excluded_item_ids.delete(parseInt(event.target.dataset.item_index));
    updateResults();
  }
});

},{"./checkboxTree":1,"./html":2,"./itemLookup":3,"./storage":5}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Variable_storage = void 0;
function variable_to_string(value) {
  switch (typeof value) {
    case "string":
      return `s${value}`;
    case "number":
      return `n${value}`;
    case "boolean":
      return value ? "b1" : "b0";
  }
}
function string_to_variable(vv) {
  const prefix = vv[0];
  const value = vv.substring(1);
  switch (prefix) {
    case 's':
      //string
      return value;
    case 'n':
      //number
      return parseFloat(value);
    case 'b':
      //boolean
      return value === "1" ? true : false;
  }
  throw `invalid value: ${vv}`;
}
function is_storage_value(key) {
  return key.length >= 1 && "snb".includes(key[0]);
}
class Variable_storage {
  static get_variable(variable_name) {
    const stored = localStorage.getItem(`${variable_name}`);
    if (typeof stored !== "string") {
      return;
    }
    if (!is_storage_value(stored)) {
      return;
    }
    return string_to_variable(stored);
  }
  static set_variable(variable_name, value) {
    localStorage.setItem(`${variable_name}`, variable_to_string(value));
  }
  static delete_variable(variable_name) {
    localStorage.removeItem(`${variable_name}`);
  }
  static clear_all() {
    localStorage.clear();
  }
  static get variables() {
    let result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (typeof key !== "string") {
        continue;
      }
      const value = localStorage.getItem(key);
      if (typeof value !== "string") {
        continue;
      }
      if (!is_storage_value(value)) {
        continue;
      }
      result[key] = string_to_variable(value);
    }
    return result;
  }
}
exports.Variable_storage = Variable_storage;

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjaGVja2JveFRyZWUudHMiLCJodG1sLnRzIiwiaXRlbUxvb2t1cC50cyIsIm1haW4udHMiLCJzdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7QUNBQTtBQUlBLFNBQVMsV0FBVyxDQUFDLElBQXNCO0VBQ3ZDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhO0VBQ3BDLElBQUksRUFBRSxTQUFTLFlBQVksYUFBYSxDQUFDLEVBQUU7SUFDdkMsT0FBTyxFQUFFOztFQUViLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxhQUFhO0VBQ3pDLElBQUksRUFBRSxTQUFTLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUMxQyxPQUFPLEVBQUU7O0VBRWIsS0FBSyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUUsVUFBVSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFO0lBQzNFLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxTQUFTLEVBQUU7TUFDOUM7O0lBRUosTUFBTSxxQkFBcUIsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzdFLElBQUksRUFBRSxxQkFBcUIsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ3REOztJQUVKLE9BQU8sS0FBSyxDQUNQLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FDcEMsTUFBTSxDQUFFLENBQUMsSUFBeUIsQ0FBQyxZQUFZLGFBQWEsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLGdCQUFnQixDQUFDLENBQzFHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQXFCLENBQUM7O0VBRXBELE9BQU8sRUFBRTtBQUNiO0FBRUEsU0FBUyx5QkFBeUIsQ0FBQyxJQUFzQjtFQUNyRCxLQUFLLE1BQU0sS0FBSyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNuQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRTtNQUNoQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPO01BQzVCLEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSztNQUMzQix5QkFBeUIsQ0FBQyxLQUFLLENBQUM7OztBQUc1QztBQUVBLFNBQVMsU0FBUyxDQUFDLElBQXNCO0VBQ3JDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLGFBQWE7RUFDbEUsSUFBSSxFQUFFLFNBQVMsWUFBWSxhQUFhLENBQUMsRUFBRTtJQUN2Qzs7RUFFSixNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsYUFBYTtFQUN6QyxJQUFJLEVBQUUsU0FBUyxZQUFZLGdCQUFnQixDQUFDLEVBQUU7SUFDMUM7O0VBRUosSUFBSSxTQUErQjtFQUNuQyxLQUFLLE1BQU0sS0FBSyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUU7SUFDcEMsSUFBSSxLQUFLLFlBQVksYUFBYSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFlBQVksZ0JBQWdCLEVBQUU7TUFDakYsU0FBUyxHQUFHLEtBQUs7TUFDakI7O0lBRUosSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLFNBQVMsRUFBRTtNQUNsQyxPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFxQjs7O0FBRzVEO0FBRUEsU0FBUyxlQUFlLENBQUMsSUFBc0I7RUFDM0MsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztFQUM5QixJQUFJLENBQUMsTUFBTSxFQUFFO0lBQ1Q7O0VBRUosSUFBSSxZQUFZLEdBQUcsS0FBSztFQUN4QixJQUFJLGNBQWMsR0FBRyxLQUFLO0VBQzFCLElBQUksa0JBQWtCLEdBQUcsS0FBSztFQUM5QixLQUFLLE1BQU0sS0FBSyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRTtJQUNyQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7TUFDZixZQUFZLEdBQUcsSUFBSTtLQUN0QixNQUNJO01BQ0QsY0FBYyxHQUFHLElBQUk7O0lBRXpCLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRTtNQUNyQixrQkFBa0IsR0FBRyxJQUFJOzs7RUFHakMsSUFBSSxrQkFBa0IsSUFBSSxZQUFZLElBQUksY0FBYyxFQUFFO0lBQ3RELE1BQU0sQ0FBQyxhQUFhLEdBQUcsSUFBSTtHQUM5QixNQUNJLElBQUksWUFBWSxFQUFFO0lBQ25CLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSTtJQUNyQixNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUs7R0FDL0IsTUFDSSxJQUFJLGNBQWMsRUFBRTtJQUNyQixNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUs7SUFDdEIsTUFBTSxDQUFDLGFBQWEsR0FBRyxLQUFLOztFQUVoQyxlQUFlLENBQUMsTUFBTSxDQUFDO0FBQzNCO0FBRUEsU0FBUyxrQkFBa0IsQ0FBQyxJQUFzQjtFQUM5QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBRztJQUNoQyxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTTtJQUN2QixJQUFJLEVBQUUsTUFBTSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7TUFDdkM7O0lBRUoseUJBQXlCLENBQUMsTUFBTSxDQUFDO0lBQ2pDLGVBQWUsQ0FBQyxNQUFNLENBQUM7RUFDM0IsQ0FBQyxDQUFDO0FBQ047QUFFQSxTQUFTLG1CQUFtQixDQUFDLElBQXNCO0VBQy9DLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtJQUNqQyxJQUFJLE9BQU8sWUFBWSxhQUFhLEVBQUU7TUFDbEMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQXFCLENBQUM7S0FDOUQsTUFDSSxJQUFJLE9BQU8sWUFBWSxnQkFBZ0IsRUFBRTtNQUMxQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUM7OztBQUd4QztBQUVBLFNBQVMsb0JBQW9CLENBQUMsUUFBa0I7RUFDNUMsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7SUFDOUIsSUFBSSxRQUFRLEdBQUcsS0FBSztJQUNwQixJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7TUFDckIsUUFBUSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO01BQ2hDLFFBQVEsR0FBRyxJQUFJOztJQUVuQixJQUFJLE9BQU8sR0FBRyxLQUFLO0lBQ25CLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtNQUNyQixRQUFRLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7TUFDaEMsT0FBTyxHQUFHLElBQUk7O0lBR2xCLE1BQU0sSUFBSSxHQUFHLG9CQUFVLEVBQUMsQ0FDcEIsSUFBSSxFQUNKLENBQ0ksT0FBTyxFQUNQO01BQ0ksSUFBSSxFQUFFLFVBQVU7TUFDaEIsRUFBRSxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNqQyxJQUFJLE9BQU8sSUFBSTtRQUFFLE9BQU8sRUFBRTtNQUFTLENBQUU7S0FDeEMsQ0FDSixFQUNELENBQ0ksT0FBTyxFQUNQO01BQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUc7SUFBQyxDQUFFLEVBQ3RDLFFBQVEsQ0FDWCxDQUNKLENBQUM7SUFDRixJQUFJLFFBQVEsRUFBRTtNQUNWLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQzs7SUFFbEMsT0FBTyxJQUFJO0dBQ2QsTUFDSTtJQUNELE1BQU0sSUFBSSxHQUFHLG9CQUFVLEVBQUMsQ0FBQyxJQUFJLEVBQUU7TUFBRSxLQUFLLEVBQUU7SUFBVSxDQUFFLENBQUMsQ0FBQztJQUN0RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUN0QyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO01BQ3hCLElBQUksQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7O0lBRWhELE9BQU8sb0JBQVUsRUFBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFdkM7QUFFTSxTQUFVLGdCQUFnQixDQUFDLFFBQWtCO0VBQy9DLElBQUksSUFBSSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDckQsSUFBSSxFQUFFLElBQUksWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO0lBQ3JDLE1BQU0sZ0JBQWdCOztFQUUxQixtQkFBbUIsQ0FBQyxJQUFJLENBQUM7RUFDekIsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDaEMsZUFBZSxDQUFDLElBQUksQ0FBQzs7RUFFekIsT0FBTyxJQUFJO0FBQ2Y7QUFFQSxTQUFTLFNBQVMsQ0FBQyxJQUFzQjtFQUNyQyxJQUFJLE1BQU0sR0FBdUIsRUFBRTtFQUNuQyxLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDakMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDakMsSUFBSSxLQUFLLFlBQVksZ0JBQWdCLEVBQUU7TUFDbkMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNqQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzs7S0FFekIsTUFDSSxJQUFJLEtBQUssWUFBWSxnQkFBZ0IsRUFBRTtNQUN4QyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7OztFQUdoRCxPQUFPLE1BQU07QUFDakI7QUFFTSxTQUFVLGFBQWEsQ0FBQyxJQUFzQjtFQUNoRCxJQUFJLE1BQU0sR0FBK0IsRUFBRTtFQUMzQyxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU87O0VBRXZELE9BQU8sTUFBTTtBQUNqQjtBQUVNLFNBQVUsYUFBYSxDQUFDLElBQXNCLEVBQUUsTUFBa0M7RUFDcEYsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDaEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNsRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFdBQVcsRUFBRTtNQUM5Qjs7SUFFSixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUs7SUFDcEIsZUFBZSxDQUFDLElBQUksQ0FBQzs7QUFFN0I7Ozs7Ozs7OztBQ3hNTSxTQUFVLFVBQVUsQ0FBcUIsSUFBa0I7RUFDN0QsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDL0MsU0FBUyxNQUFNLENBQUMsU0FBa0U7SUFDOUUsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLElBQUksU0FBUyxZQUFZLFdBQVcsRUFBRTtNQUNuRSxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztLQUM1QixNQUNJLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtNQUMvQixPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUN4QyxNQUNJO01BQ0QsS0FBSyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUU7UUFDekIsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7RUFHckQ7RUFDQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOztFQUVuQixPQUFPLE9BQU87QUFDbEI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDdkJBO0FBRU8sTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQVU7QUFBQztBQUUxRixTQUFVLFdBQVcsQ0FBQyxTQUFpQjtFQUN6QyxPQUFRLFVBQWtDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztBQUNsRTtBQUlNLE1BQU8sVUFBVTtFQUNFO0VBQXJCLFlBQXFCLE9BQWU7SUFBZixZQUFPLEdBQVAsT0FBTztFQUFZO0VBRXhDLElBQUksZ0JBQWdCO0lBQ2hCLElBQUksSUFBSSxZQUFZLGNBQWMsRUFBRTtNQUNoQyxPQUFPLEtBQUs7S0FDZixNQUNJLElBQUksSUFBSSxZQUFZLGVBQWUsRUFBRTtNQUN0QyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDO0tBQ2xGLE1BQ0ksSUFBSSxJQUFJLFlBQVksa0JBQWtCLEVBQUU7TUFDekMsT0FBTyxJQUFJO0tBQ2QsTUFDSTtNQUNELE1BQU0sZ0JBQWdCOztFQUU5QjtFQUVBLElBQUksSUFBSTtJQUNKLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN6QyxJQUFJLENBQUMsSUFBSSxFQUFFO01BQ1AsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO01BQ2xFLE1BQU0sZ0JBQWdCOztJQUUxQixPQUFPLElBQUk7RUFDZjs7QUFDSDtBQUVLLE1BQU8sY0FBZSxTQUFRLFVBQVU7RUFDSjtFQUF3QjtFQUFzQjtFQUFwRixZQUFZLE9BQWUsRUFBVyxLQUFhLEVBQVcsRUFBVyxFQUFXLEtBQWE7SUFDN0YsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQURvQixVQUFLLEdBQUwsS0FBSztJQUFtQixPQUFFLEdBQUYsRUFBRTtJQUFvQixVQUFLLEdBQUwsS0FBSztFQUV6Rjs7QUFDSDtBQUVLLE1BQU8sZUFBZ0IsU0FBUSxVQUFVO0VBQzNDLFlBQVksT0FBZTtJQUN2QixLQUFLLENBQUMsT0FBTyxDQUFDO0VBQ2xCO0VBRUEsVUFBVSxDQUFDLElBQVUsRUFBRSxTQUFxQjtJQUN4QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEMsSUFBSSxDQUFDLEtBQUssRUFBRTtNQUNSLE1BQU0sZ0JBQWdCOztJQUUxQixPQUFPLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQztFQUMvQzs7QUFDSDtBQUVLLE1BQU8sa0JBQW1CLFNBQVEsVUFBVTtFQUVqQztFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBTGIsWUFDYSxZQUFvQixFQUNwQixLQUFhLEVBQ2IsRUFBVSxFQUNWLFNBQWtCLEVBQ2xCLFNBQWlCO0lBQzFCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7SUFMOUMsaUJBQVksR0FBWixZQUFZO0lBQ1osVUFBSyxHQUFMLEtBQUs7SUFDTCxPQUFFLEdBQUYsRUFBRTtJQUNGLGNBQVMsR0FBVCxTQUFTO0lBQ1QsY0FBUyxHQUFULFNBQVM7RUFFdEI7RUFFQSxPQUFPLGVBQWUsQ0FBQyxHQUFXO0lBQzlCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztJQUMzQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtNQUNkLEtBQUssR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU07TUFDakMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDOztJQUVoQyxPQUFPLENBQUMsS0FBSztFQUNqQjtFQUVRLE9BQU8sYUFBYSxHQUFHLENBQUMsRUFBRSxDQUFDOzs7QUFHakMsTUFBTyxJQUFJO0VBQ2IsRUFBRSxHQUFHLENBQUM7RUFDTixPQUFPLEdBQUcsRUFBRTtFQUNaLE9BQU8sR0FBRyxFQUFFO0VBQ1osT0FBTyxHQUFHLEVBQUU7RUFDWixNQUFNLEdBQUcsQ0FBQztFQUNWLE1BQU0sR0FBRyxLQUFLO0VBQ2QsTUFBTSxHQUFHLEVBQUU7RUFDWCxTQUFTO0VBQ1QsSUFBSSxHQUFTLE9BQU87RUFDcEIsS0FBSyxHQUFHLENBQUM7RUFDVCxHQUFHLEdBQUcsQ0FBQztFQUNQLEdBQUcsR0FBRyxDQUFDO0VBQ1AsR0FBRyxHQUFHLENBQUM7RUFDUCxHQUFHLEdBQUcsQ0FBQztFQUNQLEVBQUUsR0FBRyxDQUFDO0VBQ04sVUFBVSxHQUFHLENBQUM7RUFDZCxTQUFTLEdBQUcsQ0FBQztFQUNiLEtBQUssR0FBRyxDQUFDO0VBQ1QsUUFBUSxHQUFHLENBQUM7RUFDWixNQUFNLEdBQUcsQ0FBQztFQUNWLEdBQUcsR0FBRyxDQUFDO0VBQ1AsS0FBSyxHQUFHLENBQUM7RUFDVCxPQUFPLEdBQUcsQ0FBQztFQUNYLE9BQU8sR0FBRyxDQUFDO0VBQ1gsT0FBTyxHQUFHLENBQUM7RUFDWCxPQUFPLEdBQUcsQ0FBQztFQUNYLG1CQUFtQixHQUFHLEtBQUs7RUFDM0IsY0FBYyxHQUFHLEtBQUs7RUFDdEIsZ0JBQWdCLEdBQUcsS0FBSztFQUN4QixJQUFJLEdBQUcsQ0FBQztFQUNSLElBQUksR0FBRyxDQUFDO0VBQ1IsSUFBSSxHQUFHLENBQUM7RUFDUixNQUFNLEdBQUcsQ0FBQztFQUNWLEtBQUssR0FBRyxDQUFDO0VBQ1QsWUFBWSxHQUFHLENBQUM7RUFDaEIsT0FBTyxHQUFpQixFQUFFO0VBQzFCLGNBQWMsQ0FBQyxJQUFZO0lBQ3ZCLFFBQVEsSUFBSTtNQUNSLEtBQUssV0FBVztRQUNaLE9BQU8sSUFBSSxDQUFDLFFBQVE7TUFDeEIsS0FBSyxRQUFRO1FBQ1QsT0FBTyxJQUFJLENBQUMsTUFBTTtNQUN0QixLQUFLLEtBQUs7UUFDTixPQUFPLElBQUksQ0FBQyxHQUFHO01BQ25CLEtBQUssT0FBTztRQUNSLE9BQU8sSUFBSSxDQUFDLEtBQUs7TUFDckIsS0FBSyxLQUFLO1FBQ04sT0FBTyxJQUFJLENBQUMsR0FBRztNQUNuQixLQUFLLEtBQUs7UUFDTixPQUFPLElBQUksQ0FBQyxHQUFHO01BQ25CLEtBQUssS0FBSztRQUNOLE9BQU8sSUFBSSxDQUFDLEdBQUc7TUFDbkIsS0FBSyxNQUFNO1FBQ1AsT0FBTyxJQUFJLENBQUMsR0FBRztNQUNuQixLQUFLLFNBQVM7UUFDVixPQUFPLElBQUksQ0FBQyxPQUFPO01BQ3ZCLEtBQUssU0FBUztRQUNWLE9BQU8sSUFBSSxDQUFDLE9BQU87TUFDdkIsS0FBSyxTQUFTO1FBQ1YsT0FBTyxJQUFJLENBQUMsT0FBTztNQUN2QixLQUFLLFVBQVU7UUFDWCxPQUFPLElBQUksQ0FBQyxPQUFPO01BQ3ZCLEtBQUssT0FBTztRQUNSLE9BQU8sSUFBSSxDQUFDLEtBQUs7TUFDckIsS0FBSyxZQUFZO1FBQ2IsT0FBTyxJQUFJLENBQUMsVUFBVTtNQUMxQixLQUFLLFdBQVc7UUFDWixPQUFPLElBQUksQ0FBQyxTQUFTO01BQ3pCLEtBQUssSUFBSTtRQUNMLE9BQU8sSUFBSSxDQUFDLEVBQUU7TUFDbEI7UUFDSSxNQUFNLGdCQUFnQjtJQUFDO0VBRW5DOztBQUNIO0FBRUQsTUFBTSxLQUFLO0VBQ2M7RUFBNkI7RUFBOEI7RUFBaEYsWUFBcUIsVUFBa0IsRUFBVyxXQUFtQixFQUFXLElBQVk7SUFBdkUsZUFBVSxHQUFWLFVBQVU7SUFBbUIsZ0JBQVcsR0FBWCxXQUFXO0lBQW1CLFNBQUksR0FBSixJQUFJO0lBQ2hGLEtBQUssTUFBTSxTQUFTLElBQUksVUFBVSxFQUFFO01BQ2hDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBdUYsQ0FBQzs7RUFFdEk7RUFFQSxHQUFHLENBQUMsSUFBVSxFQUFFLFdBQW1CLEVBQUUsU0FBb0IsRUFBRSxZQUFvQixFQUFFLFlBQW9CO0lBQ2pHLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtNQUNoRDtNQUNBLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUzs7SUFFOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFFLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDcEYsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsV0FBVyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7RUFDN0c7RUFFQSxhQUFhLENBQUMsSUFBVSxFQUFFLFlBQW1DLFNBQVM7SUFDbEUsTUFBTSxLQUFLLEdBQXlCLFNBQVMsR0FBSSxDQUFDLFNBQVMsQ0FBQyxHQUFJLFVBQVU7SUFDMUUsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDaEgsSUFBSSxXQUFXLEtBQUssQ0FBQyxFQUFFO01BQ25CLE9BQU8sQ0FBQzs7SUFFWixNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBRSxFQUFFLENBQUMsQ0FBQztJQUMzRyxPQUFPLGlCQUFpQixHQUFHLFdBQVc7RUFDMUM7RUFFQSxJQUFJLGlCQUFpQjtJQUNqQixPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBRSxFQUFFLENBQUMsQ0FBQztFQUNqRztFQUVBLHFCQUFxQixHQUFHLElBQUksR0FBRyxFQUFxQjtFQUNwRCxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQXVHOztBQUd4SCxJQUFJLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBZ0I7QUFBQztBQUNwQyxJQUFJLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBZ0I7QUFBQztBQUNoRCxJQUFJLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBaUI7QUFDckMsSUFBSSxNQUFxQztBQUV6QyxTQUFTLFlBQVksQ0FBQyxDQUFTLEVBQUUsTUFBYztFQUMzQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztFQUN6QixPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDcEIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztFQUV0QixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDakIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztFQUV0QixPQUFPLENBQUM7QUFDWjtBQUVBLFNBQVMsYUFBYSxDQUFDLElBQVk7RUFDL0IsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRTtJQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixJQUFJLENBQUMsTUFBTSxhQUFhLENBQUM7O0VBRWhFLEtBQUssTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRTtJQUN4RCxNQUFNLElBQUksR0FBUyxJQUFJLElBQUk7SUFDM0IsS0FBSyxNQUFNLEdBQUcsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsRUFBRTtNQUN6RSxRQUFRLFNBQVM7UUFDYixLQUFLLE9BQU87VUFDUixJQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDekI7UUFDSixLQUFLLFFBQVE7VUFDVCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUs7VUFDcEI7UUFDSixLQUFLLFFBQVE7VUFDVCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUs7VUFDcEI7UUFDSixLQUFLLFNBQVM7VUFDVixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUs7VUFDcEI7UUFDSixLQUFLLFFBQVE7VUFDVCxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDN0I7UUFDSixLQUFLLE1BQU07VUFDUCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1VBQy9CO1FBQ0osS0FBSyxRQUFRO1VBQ1QsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLO1VBQ25CO1FBQ0osS0FBSyxNQUFNO1VBQ1AsUUFBUSxLQUFLO1lBQ1QsS0FBSyxNQUFNO2NBQ1AsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNO2NBQ3ZCO1lBQ0osS0FBSyxRQUFRO2NBQ1QsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRO2NBQ3pCO1lBQ0osS0FBSyxNQUFNO2NBQ1AsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNO2NBQ3ZCO1lBQ0osS0FBSyxNQUFNO2NBQ1AsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNO2NBQ3ZCO1lBQ0osS0FBSyxTQUFTO2NBQ1YsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTO2NBQzFCO1lBQ0osS0FBSyxPQUFPO2NBQ1IsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPO2NBQ3hCO1lBQ0osS0FBSyxJQUFJO2NBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJO2NBQ3JCO1lBQ0o7Y0FDSSxPQUFPLENBQUMsSUFBSSxDQUFDLDRCQUE0QixLQUFLLEdBQUcsQ0FBQztVQUFDO1VBRTNEO1FBQ0osS0FBSyxNQUFNO1VBQ1AsUUFBUSxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2pCLEtBQUssS0FBSztjQUNOLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVTtjQUN0QjtZQUNKLEtBQUssU0FBUztjQUNWLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTTtjQUNsQjtZQUNKLEtBQUssTUFBTTtjQUNQLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTTtjQUNsQjtZQUNKLEtBQUssT0FBTztjQUNSLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTztjQUNuQjtZQUNKLEtBQUssTUFBTTtjQUNQLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTztjQUNuQjtZQUNKLEtBQUssS0FBSztjQUNOLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSztjQUNqQjtZQUNKLEtBQUssT0FBTztjQUNSLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTztjQUNuQjtZQUNKLEtBQUssUUFBUTtjQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUTtjQUNwQjtZQUNKLEtBQUssTUFBTTtjQUNQLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTztjQUNuQjtZQUNKLEtBQUssTUFBTTtjQUNQLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTTtjQUNsQjtZQUNKLEtBQUssS0FBSztjQUNOLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSztjQUNqQjtZQUNKO2NBQ0ksT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsS0FBSyxFQUFFLENBQUM7VUFBQztVQUVwRDtRQUNKLEtBQUssT0FBTztVQUNSLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUM1QjtRQUNKLEtBQUssS0FBSztVQUNOLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUMxQjtRQUNKLEtBQUssS0FBSztVQUNOLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUMxQjtRQUNKLEtBQUssS0FBSztVQUNOLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUMxQjtRQUNKLEtBQUssS0FBSztVQUNOLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUMxQjtRQUNKLEtBQUssT0FBTztVQUNSLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUN6QjtRQUNKLEtBQUssVUFBVTtVQUNYLElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUNqQztRQUNKLEtBQUssU0FBUztVQUNWLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUNoQztRQUNKLEtBQUssWUFBWTtVQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUM1QjtRQUNKLEtBQUssV0FBVztVQUNaLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUMvQjtRQUNKLEtBQUssaUJBQWlCO1VBQ2xCLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUM3QjtRQUNKLEtBQUssVUFBVTtVQUNYLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUMxQjtRQUNKLEtBQUssWUFBWTtVQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUM1QjtRQUNKLEtBQUssU0FBUztVQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztVQUNsRDtRQUNKLEtBQUssU0FBUztVQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztVQUNsRDtRQUNKLEtBQUssU0FBUztVQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztVQUNsRDtRQUNKLEtBQUssU0FBUztVQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztVQUNsRDtRQUNKLEtBQUssZ0JBQWdCO1VBQ2pCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztVQUM1QztRQUNKLEtBQUssY0FBYztVQUNmLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDdkM7UUFDSixLQUFLLFVBQVU7VUFDWCxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDM0I7UUFDSixLQUFLLE1BQU07VUFDUCxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDM0I7UUFDSixLQUFLLE1BQU07VUFDUCxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDM0I7UUFDSixLQUFLLFFBQVE7VUFDVCxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDN0I7UUFDSixLQUFLLE9BQU87VUFDUixJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDNUI7UUFDSixLQUFLLGFBQWE7VUFDZCxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7VUFDbkM7UUFDSjtVQUNJLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLFNBQVMsR0FBRyxDQUFDO01BQUM7O0lBR3hFLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUM7O0FBRWhDO0FBRUEsU0FBUyxhQUFhLENBQUMsSUFBWTtFQUMvQixNQUFNLGdCQUFnQixHQUFHLEtBQUs7RUFDOUIsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRTtJQUNwQixPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixJQUFJLENBQUMsTUFBTSxhQUFhLENBQUM7O0VBRS9ELElBQUksS0FBSyxHQUFHLENBQUM7RUFDYixJQUFJLFlBQVksR0FBRyxDQUFDO0VBQ3BCLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxxMkJBQXEyQixDQUFDLEVBQUU7SUFDdDRCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFO01BQ2Y7O0lBRUosTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQzFDLElBQUksWUFBWSxHQUFHLENBQUMsS0FBSyxLQUFLLEVBQUU7TUFDNUIsZ0JBQWdCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsWUFBWSxHQUFHLENBQUMsS0FBSyxLQUFLLEdBQUcsWUFBWSxHQUFHLENBQUMsR0FBRyxHQUFHLFlBQVksR0FBRyxDQUFDLE9BQU8sS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7O0lBRS9KLFlBQVksR0FBRyxLQUFLO0lBQ3BCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSTtJQUM5QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVE7SUFDdEMsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO01BQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7SUFFM0UsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztJQUNoRCxNQUFNLFVBQVUsR0FBMkIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEtBQUssTUFBTSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsS0FBSyxNQUFNLEdBQUcsTUFBTSxHQUFHLE1BQU07SUFDM0ksTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQzFDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0lBQ2xFLE1BQU0sT0FBTyxHQUFHLENBQ1osUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQzVCLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUM1QixRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFDNUIsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQzVCLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUM1QixRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFDNUIsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQzVCLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUM1QixRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFDNUIsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQy9CO0lBRUQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBRSxDQUFDO0lBRXpGLElBQUksUUFBUSxLQUFLLE9BQU8sRUFBRTtNQUN0QixJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQzFCLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUN4QyxNQUNJO1FBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUU7UUFDdkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUk7UUFDeEQsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDOztNQUUvQixJQUFJLE9BQU8sRUFBRTtRQUNULE1BQU0sVUFBVSxHQUFHLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxLQUFLLElBQUksRUFBRSxXQUFXLENBQUM7UUFDckYsS0FBSyxNQUFNLElBQUksSUFBSSxXQUFXLEVBQUU7VUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDOzs7S0FHeEMsTUFDSSxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7TUFDN0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUU7TUFDNUIsU0FBUyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUk7TUFDN0QsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDO01BQ2hDLElBQUksT0FBTyxFQUFFO1FBQ1QsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEtBQUssSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDOztLQUVqRyxNQUNJO01BQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUU7TUFDNUIsU0FBUyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUk7TUFDN0QsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDOztJQUVwQyxLQUFLLEVBQUU7O0VBRVgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEtBQUssYUFBYSxDQUFDO0FBQzVDO0FBRUEsTUFBTSxPQUFPO0VBQ1QsWUFBWSxHQUFHLENBQUM7RUFDaEIsT0FBTyxHQUFHLENBQUM7RUFDWCxVQUFVLEdBQUcsS0FBSztFQUNsQixPQUFPLEdBQUcsS0FBSztFQUNmLE9BQU8sR0FBRyxFQUFFO0VBQ1osSUFBSSxHQUFHLENBQUM7RUFDUixJQUFJLEdBQUcsQ0FBQztFQUNSLElBQUksR0FBRyxDQUFDO0VBQ1IsU0FBUyxHQUFHLE1BQU07RUFDbEIsU0FBUyxHQUFHLENBQUM7RUFDYixTQUFTLEdBQUcsQ0FBQztFQUNiLFNBQVMsR0FBRyxDQUFDO0VBQ2IsTUFBTSxHQUFHLENBQUM7RUFDVixNQUFNLEdBQUcsQ0FBQztFQUNWLE1BQU0sR0FBRyxDQUFDO0VBQ1YsV0FBVyxHQUFHLENBQUM7RUFDZixRQUFRLEdBQUcsRUFBRTtFQUNiLElBQUksR0FBRyxFQUFFO0VBQ1QsUUFBUSxHQUFHLENBQUM7RUFDWixZQUFZLEdBQUcsS0FBSztFQUNwQixTQUFTLEdBQUcsQ0FBQztFQUNiLEtBQUssR0FBRyxDQUFDO0VBQ1QsS0FBSyxHQUFHLENBQUM7RUFDVCxLQUFLLEdBQUcsQ0FBQztFQUNULEtBQUssR0FBRyxDQUFDO0VBQ1QsS0FBSyxHQUFHLENBQUM7RUFDVCxLQUFLLEdBQUcsQ0FBQztFQUNULEtBQUssR0FBRyxDQUFDO0VBQ1QsS0FBSyxHQUFHLENBQUM7RUFDVCxLQUFLLEdBQUcsQ0FBQztFQUNULEtBQUssR0FBRyxDQUFDOztBQUdiLFNBQVMsU0FBUyxDQUFDLEdBQVE7RUFDdkIsSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtJQUN6QyxPQUFPLEtBQUs7O0VBRWhCLE9BQU8sQ0FDSCxPQUFPLEdBQUcsQ0FBQyxZQUFZLEtBQUssUUFBUSxFQUNwQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUMvQixPQUFPLEdBQUcsQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUNuQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUNoQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUMvQixPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUM1QixPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUM1QixPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUM1QixPQUFPLEdBQUcsQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUNqQyxPQUFPLEdBQUcsQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUNqQyxPQUFPLEdBQUcsQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUNqQyxPQUFPLEdBQUcsQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUNqQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUM5QixPQUFPLEdBQUcsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUM5QixPQUFPLEdBQUcsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUM5QixPQUFPLEdBQUcsQ0FBQyxXQUFXLEtBQUssUUFBUSxFQUNuQyxPQUFPLEdBQUcsQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUNoQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUM1QixPQUFPLEdBQUcsQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUNoQyxPQUFPLEdBQUcsQ0FBQyxZQUFZLEtBQUssU0FBUyxFQUNyQyxPQUFPLEdBQUcsQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUNqQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxDQUNoQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25CO0FBRUEsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFZO0VBQ2xDLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNwQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFO01BQ3JCLE9BQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLElBQUksRUFBRSxDQUFDO01BQ2xEOztJQUdKLE1BQU0sV0FBVyxHQUFHLENBQ2hCLE9BQU8sQ0FBQyxLQUFLLEVBQ2IsT0FBTyxDQUFDLEtBQUssRUFDYixPQUFPLENBQUMsS0FBSyxFQUNiLE9BQU8sQ0FBQyxLQUFLLEVBQ2IsT0FBTyxDQUFDLEtBQUssRUFDYixPQUFPLENBQUMsS0FBSyxFQUNiLE9BQU8sQ0FBQyxLQUFLLEVBQ2IsT0FBTyxDQUFDLEtBQUssRUFDYixPQUFPLENBQUMsS0FBSyxFQUNiLE9BQU8sQ0FBQyxLQUFLLENBQ2hCLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFFLENBQUM7SUFFL0QsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sRUFBRTtNQUM5QixJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQzFCLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDdkQsTUFDSTtRQUNELE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFO1FBQ3ZCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUk7UUFDM0IsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQzs7TUFFOUMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ2pCLE1BQU0sVUFBVSxHQUFHLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsU0FBUyxLQUFLLE1BQU0sRUFBRSxXQUFXLENBQUM7UUFDdEgsS0FBSyxNQUFNLElBQUksSUFBSSxXQUFXLEVBQUU7VUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDOzs7S0FHeEMsTUFDSSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFO01BQ3JDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO01BQzlGLE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFO01BQzVCLFNBQVMsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUk7TUFDaEMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQztNQUMvQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7UUFDakIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEtBQUssTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDOztLQUVsSSxNQUNJO01BQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUU7TUFDNUIsU0FBUyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSTtNQUNoQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDOzs7QUFJM0Q7QUFFQSxTQUFTLGNBQWMsQ0FBQyxJQUFZLEVBQUUsS0FBWTtFQUM5QyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7SUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUU7TUFDakM7O0lBRUosTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQywyT0FBMk8sQ0FBQztJQUNyUSxJQUFJLENBQUMsS0FBSyxFQUFFO01BQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsS0FBSyxDQUFDLFdBQVcsTUFBTSxJQUFJLEVBQUUsQ0FBQztNQUNuRTs7SUFFSixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtNQUNmOztJQUVKLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUztJQUN0QyxJQUFJLFNBQVMsS0FBSyxRQUFRLEVBQUU7TUFDeEIsU0FBUyxHQUFHLFFBQVE7O0lBRXhCLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUU7TUFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsU0FBUyxxQkFBcUIsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO01BQzNGOztJQUVKLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0QsSUFBSSxDQUFDLElBQUksRUFBRTtNQUNQLE9BQU8sQ0FBQyxJQUFJLENBQUMsOEJBQThCLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxvQkFBb0IsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO01BQ3ZHOztJQUVKLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQzs7RUFFOUksS0FBSyxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtJQUNwQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUUsSUFBSSxHQUFHLEVBQUU7TUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDOzs7QUFHcEU7QUFFQSxTQUFTLGlCQUFpQixDQUFDLElBQVk7RUFDbkMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7RUFDckMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7SUFDOUI7O0VBRUosU0FBUyxTQUFTLENBQUMsQ0FBTTtJQUNyQixJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRTtNQUN2QixPQUFPLENBQUM7O0VBRWhCO0VBQ0EsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQWtCO0VBQzlDLEtBQUssTUFBTSxPQUFPLElBQUksWUFBWSxFQUFFO0lBQ2hDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO01BQzdCOztJQUVKLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxJQUFJO0lBQzdCLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO01BQzlCOztJQUVKLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtJQUMxRSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQ3ZCLE1BQU0sQ0FBRSxPQUFPLElBQXdCLE9BQU8sT0FBTyxLQUFLLFFBQVEsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQzlGLEdBQUcsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQztJQUM3QyxNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7SUFDM0QsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXO0lBQ3pDLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztJQUMzQyxJQUFJLHlCQUF5QixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEYsSUFBSSx5QkFBeUIsS0FBSyxDQUFDLENBQUMsRUFBRTtNQUNsQyx5QkFBeUIsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM1RCxNQUNJO01BQ0QsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ2IsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUseUJBQXlCLENBQUM7OztJQUcxRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFlBQVksRUFBRTtNQUM3QixNQUFNLGNBQWMsR0FBRyxJQUFJLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSx5QkFBeUIsQ0FBQztNQUM1SCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7OztBQUc3QztBQUVPLGVBQWUsUUFBUSxDQUFDLEdBQVc7RUFDdEMsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNwRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztFQUNsRCxJQUFJLE9BQU8sWUFBWSxXQUFXLEVBQUU7SUFDaEMsT0FBTyxDQUFDLFdBQVcsR0FBRyxXQUFXLFFBQVEsa0JBQWtCOztFQUUvRCxNQUFNLEtBQUssR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUM7RUFDOUIsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUM7RUFDMUQsSUFBSSxXQUFXLFlBQVksbUJBQW1CLEVBQUU7SUFDNUMsV0FBVyxDQUFDLEtBQUssRUFBRTs7RUFFdkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUU7SUFDWCxLQUFLLENBQUMsc0ZBQXNGLEdBQUcsZUFBZSxLQUFLLENBQUMsVUFBVSxHQUFHLENBQUM7SUFDbEksT0FBTyxFQUFFOztFQUViLE9BQU8sS0FBSyxDQUFDLElBQUksRUFBRTtBQUN2QjtBQUVPLGVBQWUsYUFBYTtFQUMvQixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQztFQUMxRCxJQUFJLFdBQVcsWUFBWSxtQkFBbUIsRUFBRTtJQUM1QyxXQUFXLENBQUMsS0FBSyxHQUFHLENBQUM7SUFDckIsV0FBVyxDQUFDLEdBQUcsR0FBRyxHQUFHOztFQUV6QixNQUFNLFVBQVUsR0FBRyxvR0FBb0c7RUFDdkgsTUFBTSxXQUFXLEdBQUcsNEdBQTRHO0VBQ2hJLE1BQU0sY0FBYyxHQUFHLGtHQUFrRztFQUN6SCxNQUFNLE9BQU8sR0FBRyxVQUFVLEdBQUcsc0JBQXNCO0VBQ25ELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7RUFDbEM7RUFDQSxNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsQ0FBQztFQUMzQixNQUFNLE9BQU8sR0FBRyw4REFBOEQ7RUFDOUUsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksUUFBUSxDQUFDLEdBQUcsT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDeEYsTUFBTSxXQUFXLEdBQUcsY0FBYyxHQUFHLHNCQUFzQjtFQUMzRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDO0VBQzFDLGFBQWEsQ0FBQyxNQUFNLFFBQVEsQ0FBQztFQUM3QjtFQUNBLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFFN0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQztFQUMxQyxJQUFJLFdBQVcsWUFBWSxtQkFBbUIsRUFBRTtJQUM1QyxXQUFXLENBQUMsS0FBSyxHQUFHLENBQUM7SUFDckIsV0FBVyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQUM7O0VBRXJDLE1BQU0sV0FBVyxHQUF1QyxFQUFFO0VBQzFELEtBQUssTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLE1BQU0sRUFBRTtJQUM1QixNQUFNLFNBQVMsR0FBRyxHQUFHLFdBQVcsYUFBYSxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNO0lBQzFGLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDOztFQUU3RCxpQkFBaUIsQ0FBQyxNQUFNLFlBQVksQ0FBQztFQUNyQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxJQUFJLFdBQVcsRUFBRTtJQUNoRCxJQUFJO01BQ0EsY0FBYyxDQUFDLE1BQU0sSUFBSSxFQUFFLEtBQUssQ0FBQztLQUNwQyxDQUFDLE9BQU8sQ0FBQyxFQUFFO01BQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsU0FBUyxZQUFZLENBQUMsRUFBRSxDQUFDOzs7RUFHcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEtBQUssQ0FBQyxJQUFJLFFBQVEsQ0FBQztBQUM3QztBQUVBLFNBQVMsYUFBYSxDQUFDLElBQVksRUFBRSxFQUFVO0VBQzNDLE9BQU8sb0JBQVUsRUFBQyxDQUFDLEtBQUssRUFBRSxvQkFBVSxFQUFDLENBQUMsUUFBUSxFQUFFO0lBQUUsS0FBSyxFQUFFLGNBQWM7SUFBRSxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7RUFBRSxDQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4SDtBQUVNLFNBQVUsZUFBZSxDQUFDLElBQVksRUFBRSxPQUF3RDtFQUNsRyxNQUFNLElBQUksR0FBRyxvQkFBVSxFQUFDLENBQUMsR0FBRyxFQUFFO0lBQUUsS0FBSyxFQUFFO0VBQVksQ0FBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0VBQzdELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUcsQ0FBQyxJQUFJO0lBQ2pDLElBQUksRUFBRSxDQUFDLFlBQVksVUFBVSxDQUFDLEVBQUU7TUFDNUI7O0lBRUosTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7SUFDbEQsSUFBSSxFQUFFLE9BQU8sWUFBWSxjQUFjLENBQUMsRUFBRTtNQUN0Qzs7SUFFSixDQUFDLENBQUMsZUFBZSxFQUFFO0lBQ25CLElBQUksTUFBTSxFQUFFO01BQ1IsTUFBTSxDQUFDLEtBQUssRUFBRTtNQUNkLE1BQU0sQ0FBQyxNQUFNLEVBQUU7O0lBRW5CLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLG9CQUFVLEVBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLG9CQUFVLEVBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFdEcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFDM0IsTUFBTSxLQUFLLEdBQUcsR0FBRztJQUNqQixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVO0lBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSTtJQUNqQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJO0lBQzFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7RUFDakIsQ0FBQyxDQUFDO0VBQ0YsT0FBTyxJQUFJO0FBQ2Y7QUFFQSxTQUFTLGlCQUFpQixDQUFDLEtBQWE7RUFDcEMsU0FBUyxzQkFBc0IsQ0FBQyxXQUFtQixFQUFFLEtBQWE7SUFDOUQsT0FBTyxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQUcsV0FBVyxFQUFHLEtBQUssQ0FBRTtFQUNuRDtFQUVBLE1BQU0sT0FBTyxHQUFHLG9CQUFVLEVBQUMsQ0FDdkIsT0FBTyxFQUNQLENBQ0ksSUFBSSxFQUNKLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLEVBQzFCLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQzVCLENBQ0osQ0FBQztFQUNGLEtBQUssTUFBTSxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0lBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztJQUN6QyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDZDs7SUFFSixPQUFPLENBQUMsV0FBVyxDQUFDLG9CQUFVLEVBQUMsQ0FDM0IsSUFBSSxFQUNKLENBQUMsSUFBSSxFQUFFO01BQUUsS0FBSyxFQUFFO0lBQVMsQ0FBRSxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFDekMsQ0FBQyxJQUFJLEVBQUU7TUFBRSxLQUFLLEVBQUU7SUFBUyxDQUFFLEVBQUUsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQ25HLENBQUMsQ0FBQzs7RUFFUCxPQUFPLENBQUMsV0FBVyxDQUFDLG9CQUFVLEVBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ3ZDLE9BQU8sZUFBZSxDQUFDLEdBQUcsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQztBQUNoRTtBQUVBLFNBQVMsY0FBYyxDQUFDLFlBQW9CLEVBQUUsWUFBb0I7RUFDOUQsSUFBSSxZQUFZLEtBQUssQ0FBQyxJQUFJLFlBQVksS0FBSyxDQUFDLEVBQUU7SUFDMUMsT0FBTyxFQUFFOztFQUViLElBQUksWUFBWSxLQUFLLFlBQVksRUFBRTtJQUMvQixPQUFPLE1BQU0sWUFBWSxFQUFFOztFQUUvQixPQUFPLE1BQU0sWUFBWSxJQUFJLFlBQVksRUFBRTtBQUMvQztBQUVBLFNBQVMsc0JBQXNCLENBQUMsSUFBc0IsRUFBRSxVQUFzQixFQUFFLFNBQXFCO0VBQ2pHLE1BQU0sT0FBTyxHQUFHLFNBQVMsR0FBRyxvQkFBVSxFQUFDLENBQ25DLE9BQU8sRUFDUCxDQUNJLElBQUksRUFDSixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFDZCxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FDMUIsQ0FDSixDQUFDLEdBQUcsb0JBQVUsRUFBQyxDQUNaLE9BQU8sRUFDUCxDQUNJLElBQUksRUFDSixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFDZCxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsRUFDbkIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQzFCLENBQ0osQ0FBQztFQUNGLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztFQUM1QyxJQUFJLENBQUMsS0FBSyxFQUFFO0lBQ1IsTUFBTSxnQkFBZ0I7O0VBRzFCLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUFrQztFQUM3RCxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsS0FBSyxTQUFTLEdBQUcsVUFBVSxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7SUFDbkUsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQzdDLElBQUksQ0FBQyxVQUFVLEVBQUU7TUFDYjs7SUFFSixLQUFLLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDLElBQUksVUFBVSxFQUFFO01BQy9FLE1BQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQyxTQUFTLElBQUksU0FBUztNQUM3RCxNQUFNLFlBQVksR0FBRyxjQUFjLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUUsR0FBRyxLQUFLLENBQUMsaUJBQWlCO01BQ2hILE1BQU0sV0FBVyxHQUFHLE9BQU8sR0FBRyxZQUFZO01BQzFDLE1BQU0sb0JBQW9CLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO01BQ3ZFLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsb0JBQW9CLEdBQUcsV0FBVyxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQzs7O0VBSTFHLEtBQUssTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsSUFBSSxXQUFXLEVBQUU7SUFDcEYsSUFBSSxTQUFTLEVBQUU7TUFDWCxPQUFPLENBQUMsV0FBVyxDQUFDLG9CQUFVLEVBQUMsQ0FDM0IsSUFBSSxFQUNKLElBQUksS0FBSyxlQUFlLEdBQUc7UUFBRSxLQUFLLEVBQUU7TUFBYSxDQUFFLEdBQUcsRUFBRSxFQUN4RCxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFDM0UsQ0FBQyxJQUFJLEVBQUU7UUFBRSxLQUFLLEVBQUU7TUFBUyxDQUFFLEVBQUUsR0FBRyxZQUFZLENBQUMsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQ3RFLENBQUMsQ0FBQztLQUNOLE1BQ0k7TUFDRCxPQUFPLENBQUMsV0FBVyxDQUFDLG9CQUFVLEVBQUMsQ0FDM0IsSUFBSSxFQUNKLElBQUksS0FBSyxlQUFlLEdBQUc7UUFBRSxLQUFLLEVBQUU7TUFBYSxDQUFFLEdBQUcsRUFBRSxFQUN4RCxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFDM0UsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLFNBQVMsSUFBSSxHQUFHLENBQUMsRUFDeEMsQ0FBQyxJQUFJLEVBQUU7UUFBRSxLQUFLLEVBQUU7TUFBUyxDQUFFLEVBQUUsR0FBRyxZQUFZLENBQUMsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQ3RFLENBQUMsQ0FBQzs7O0VBSVgsT0FBTyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxvQkFBVSxFQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzdGO0FBRUEsU0FBUyxvQkFBb0IsQ0FBQyxJQUFVLEVBQUUsVUFBMEI7RUFDaEUsTUFBTSxZQUFZLEdBQUcsb0JBQVUsRUFBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdEUsS0FBSyxNQUFNLFVBQVUsSUFBSSxVQUFVLENBQUMsS0FBSyxFQUFFO0lBQ3ZDLFlBQVksQ0FBQyxXQUFXLENBQUMsb0JBQVUsRUFBQyxDQUFDLElBQUksRUFBRSxVQUFVLEtBQUssSUFBSSxHQUFHO01BQUUsS0FBSyxFQUFFO0lBQWEsQ0FBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDOztFQUVqSSxPQUFPLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLG9CQUFVLEVBQUMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9HO0FBRUEsU0FBUyxVQUFVLENBQUMsT0FBZTtFQUMvQixPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUM5RTtBQUVBLFNBQVMsbUJBQW1CLENBQUMsSUFBVSxFQUFFLFVBQThCO0VBQ25FLE1BQU0sT0FBTyxHQUFHLENBQ1osZ0JBQWdCLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFDekMsb0JBQVUsRUFDTixDQUNJLElBQUksRUFBRTtJQUFFLEtBQUssRUFBRTtFQUFRLENBQUUsRUFDekIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUNYLENBQUMsSUFBSSxFQUFFO0lBQUUsS0FBSyxFQUFFO0VBQVEsQ0FBRSxFQUN0QixHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUN0QixDQUFDLElBQUksRUFBRSxXQUFXLEtBQ2QsQ0FBQyxHQUFHLElBQUksRUFBRSxvQkFBVSxFQUFDLENBQUMsSUFBSSxFQUFFO0lBQUUsS0FBSyxFQUFFLFdBQVcsS0FBSyxJQUFJLEdBQUcsYUFBYSxHQUFHO0VBQUUsQ0FBRSxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQzVHLEVBQThCLENBQ2pDLENBQ0osQ0FDSixFQUNELENBQUMsSUFBSSxFQUFFLGtCQUFrQixVQUFVLENBQUMsU0FBUyxHQUFHLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUMvRCxJQUFJLFVBQVUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsb0JBQVUsRUFBQyxDQUFDLElBQUksRUFBRSxjQUFjLFVBQVUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFDM0csQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUM3QyxDQUNKLENBQ0o7RUFDRCxPQUFPLGVBQWUsQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQztBQUM1RDtBQUVBLFNBQVMseUJBQXlCLENBQzlCLElBQVUsRUFDVixZQUFpRCxFQUNqRCxTQUFxQjtFQUNyQixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQzVCLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FDcEIsR0FBRyxDQUFDLFVBQVUsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN4RjtBQUVBLFNBQVMsZUFBZSxDQUFDLElBQWdDO0VBQ3JELE1BQU0sTUFBTSxHQUE2QixFQUFFO0VBQzNDLFNBQVMsR0FBRyxDQUFDLE9BQTZCO0lBQ3RDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO01BQzlFLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU87TUFDL0Q7O0lBRUosTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7RUFDeEI7RUFDQSxJQUFJLEtBQUssR0FBRyxJQUFJO0VBQ2hCLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxFQUFFO0lBQ3pCLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDdkIsR0FBRyxDQUFDLEdBQUcsQ0FBQztNQUNSOztJQUVKLElBQUksQ0FBQyxLQUFLLEVBQUU7TUFDUixHQUFHLENBQUMsSUFBSSxDQUFDO0tBQ1osTUFDSTtNQUNELEtBQUssR0FBRyxLQUFLOztJQUVqQixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtNQUM1QixJQUFJLE9BQU8sS0FBSyxFQUFFLEVBQUU7UUFDaEI7O01BRUosR0FBRyxDQUFDLE9BQU8sQ0FBQzs7O0VBR3BCLE9BQU8sTUFBTTtBQUNqQjtBQUVBLFNBQVMsaUJBQWlCLENBQUMsSUFBVSxFQUFFLFVBQXNCLEVBQUUsWUFBaUQsRUFBRSxTQUFxQjtFQUNuSSxJQUFJLFVBQVUsWUFBWSxlQUFlLEVBQUU7SUFDdkMsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsR0FBRyxTQUFTO0lBQ2hFLE1BQU0sT0FBTyxHQUFHLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQztJQUNuRixNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDO0lBQzVDLE9BQU8sQ0FDSCxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxFQUM5QyxLQUFLLEVBQ0wsaUJBQWlCLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFDekQsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUN4QyxHQUFHLFdBQVcsQ0FDakI7R0FDSixNQUNJLElBQUksVUFBVSxZQUFZLGNBQWMsRUFBRTtJQUMzQyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtNQUMvQixPQUFPLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxJQUFJLFVBQVUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxHQUFHLE1BQU0sRUFBRSxDQUFDOztJQUVuRSxPQUFPLENBQ0gsb0JBQW9CLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUN0QyxJQUFJLFVBQVUsQ0FBQyxLQUFLLElBQUksVUFBVSxDQUFDLEVBQUUsR0FBRyxJQUFJLEdBQUcsTUFBTSxFQUFFLENBQzFEO0dBQ0osTUFDSSxJQUFJLFVBQVUsWUFBWSxrQkFBa0IsRUFBRTtJQUMvQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0dBQ2pELE1BQ0k7SUFDRCxNQUFNLGdCQUFnQjs7QUFFOUI7QUFFQSxTQUFTLGNBQWMsQ0FBQyxJQUFVLEVBQUUsWUFBaUQsRUFBRSxhQUF1QixFQUFFLFNBQXFCO0VBQ2pJLE1BQU0sR0FBRyxHQUFHLG9CQUFVLEVBQ2xCLENBQUMsSUFBSSxFQUNELENBQUMsSUFBSSxFQUFFO0lBQUUsS0FBSyxFQUFFO0VBQWEsQ0FBRSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN0RSxDQUFDLElBQUksRUFBRTtJQUFFLEtBQUssRUFBRTtFQUFrQixDQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsRUFDOUQsQ0FBQyxJQUFJLEVBQUU7SUFBRSxLQUFLLEVBQUU7RUFBYSxDQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUMzQyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLG9CQUFVLEVBQUMsQ0FBQyxJQUFJLEVBQUU7SUFBRSxLQUFLLEVBQUU7RUFBUyxDQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ2xJLENBQUMsSUFBSSxFQUFFO0lBQUUsS0FBSyxFQUFFO0VBQXNCLENBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUMxRCxDQUFDLElBQUksRUFBRTtJQUFFLEtBQUssRUFBRTtFQUFlLENBQUUsRUFBRSxHQUFHLGVBQWUsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FDbkgsQ0FDSjtFQUNELE9BQU8sR0FBRztBQUNkO0FBRU0sU0FBVSxhQUFhLENBQUMsTUFBK0IsRUFBRSxJQUFnQjtFQUMzRSxNQUFNLEtBQUssR0FBRyxvQkFBVSxFQUNwQixDQUFDLE9BQU8sRUFDSixDQUFDLElBQUksRUFDRCxDQUFDLElBQUksRUFBRTtJQUFFLEtBQUssRUFBRTtFQUFhLENBQUUsRUFBRSxNQUFNLENBQUMsQ0FDM0MsQ0FDSixDQUNKO0VBQ0QsS0FBSyxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksTUFBTSxFQUFFO0lBQzVCLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztJQUNsRCxJQUFJLENBQUMsU0FBUyxFQUFFO01BQ1osTUFBTSxnQkFBZ0I7O0lBRTFCLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFO01BQ25CLEtBQUssQ0FBQyxXQUFXLENBQUMsb0JBQVUsRUFBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxzQkFBc0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7RUFHaEksT0FBTyxLQUFLO0FBQ2hCO0FBRU0sU0FBVSxlQUFlLENBQzNCLE1BQStCLEVBQy9CLFlBQWlELEVBQ2pELFNBQWdELEVBQ2hELGFBQXVCLEVBQ3ZCLFNBQXFCO0VBQ3JCLE1BQU0sT0FBTyxHQUE4QjtJQUN2QyxLQUFLLEVBQUUsRUFBRTtJQUNULE1BQU0sRUFBRSxFQUFFO0lBQ1YsS0FBSyxFQUFFLEVBQUU7SUFDVCxPQUFPLEVBQUUsRUFBRTtJQUNYLE9BQU8sRUFBRSxFQUFFO0lBQ1gsT0FBTyxFQUFFLEVBQUU7SUFDWCxPQUFPLEVBQUUsRUFBRTtJQUNYLE1BQU0sRUFBRSxFQUFFO0lBQ1YsVUFBVSxFQUFFLEVBQUU7SUFDZCxNQUFNLEVBQUUsRUFBRTtJQUNWLFFBQVEsRUFBRTtHQUNiO0VBRUQsS0FBSyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO0lBQzFCLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO01BQ2QsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUM7OztFQUloRSxNQUFNLEtBQUssR0FBRyxvQkFBVSxFQUNwQixDQUFDLE9BQU8sRUFDSixDQUFDLElBQUksRUFDRCxDQUFDLElBQUksRUFBRTtJQUFFLEtBQUssRUFBRTtFQUFhLENBQUUsRUFBRSxNQUFNLENBQUMsRUFDeEMsQ0FBQyxJQUFJLEVBQUU7SUFBRSxLQUFLLEVBQUU7RUFBa0IsQ0FBRSxFQUFFLFdBQVcsQ0FBQyxFQUNsRCxDQUFDLElBQUksRUFBRTtJQUFFLEtBQUssRUFBRTtFQUFhLENBQUUsRUFBRSxNQUFNLENBQUMsRUFDeEMsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxvQkFBVSxFQUFDLENBQUMsSUFBSSxFQUFFO0lBQUUsS0FBSyxFQUFFO0VBQVMsQ0FBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDNUUsQ0FBQyxJQUFJLEVBQUU7SUFBRSxLQUFLLEVBQUU7RUFBc0IsQ0FBRSxFQUFFLE9BQU8sQ0FBQyxFQUNsRCxDQUFDLElBQUksRUFBRTtJQUFFLEtBQUssRUFBRTtFQUFlLENBQUUsRUFBRSxRQUFRLENBQUMsQ0FDL0MsQ0FDSixDQUNKO0VBVUQsU0FBUyxXQUFXLENBQUMsRUFBYyxFQUFFLEVBQWM7SUFDL0MsTUFBTSxNQUFNLEdBQUc7TUFBRSxHQUFHO0lBQUUsQ0FBRTtJQUN4QixLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRTtNQUMzQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNiLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztPQUMxQyxNQUNJO1FBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUs7OztJQUczQixPQUFPLE1BQU07RUFDakI7RUFFQSxTQUFTLFlBQVksQ0FBQyxLQUFXLEVBQUUsS0FBVztJQUMxQyxPQUFPO01BQ0gsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUk7TUFDN0IsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLEVBQUU7TUFDdkIsSUFBSSxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQzNDO0VBQ0w7RUFFQSxTQUFTLE1BQU0sQ0FBQyxFQUFjLEVBQUUsRUFBYztJQUMxQyxNQUFNLE1BQU0sR0FBRztNQUFFLEdBQUc7SUFBRSxDQUFFO0lBQ3hCLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFO01BQzNDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDcEIsTUFBTSxnQkFBZ0I7O01BRTFCLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ2IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDckQsTUFDSTtRQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLOzs7SUFHM0IsT0FBTyxNQUFNO0VBQ2pCO0VBRUEsU0FBUyxPQUFPLENBQUMsS0FBVyxFQUFFLEtBQVc7SUFDckMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQ2xEO01BQ0ksSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO01BQ2hCLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtNQUNaLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtLQUN0QyxHQUNEO01BQ0ksSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO01BQ2hCLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtNQUNaLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtLQUN0QztFQUNUO0VBRUEsU0FBUyxNQUFNLENBQUMsSUFBVSxFQUFFLFNBQXFCO0lBQzdDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FDNUIsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUNwQixNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxLQUFJO01BQ3pCLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBSztRQUNmLElBQUksVUFBVSxZQUFZLGNBQWMsRUFBRTtVQUN0QyxJQUFJLFVBQVUsQ0FBQyxFQUFFLEVBQUU7WUFDZixPQUFPO2NBQUUsSUFBSSxFQUFFLENBQUM7Y0FBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLEtBQUs7Y0FBRSxJQUFJLEVBQUU7WUFBRSxDQUFFOztVQUV0RCxPQUFPO1lBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxLQUFLO1lBQUUsRUFBRSxFQUFFLENBQUM7WUFBRSxJQUFJLEVBQUU7VUFBRSxDQUFFO1NBQ3JELE1BQ0ksSUFBSSxVQUFVLFlBQVksZUFBZSxFQUFFO1VBQzVDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQztVQUNyRCxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUM7VUFDekQsT0FBTztZQUNILElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxHQUFHLFVBQVU7WUFDbEMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxFQUFFLEdBQUcsVUFBVTtZQUM5QixJQUFJLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FDcEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQzFCLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO1dBRXhFO1NBQ0osTUFDSSxJQUFJLFVBQVUsWUFBWSxrQkFBa0IsRUFBRTtVQUMvQyxPQUFPO1lBQ0gsSUFBSSxFQUFFLENBQUM7WUFDUCxFQUFFLEVBQUUsQ0FBQztZQUNMLElBQUksRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1dBQ2xGO1NBQ0osTUFDSTtVQUNELE1BQU0sZ0JBQWdCOztNQUU5QixDQUFDLEdBQUc7TUFDSixPQUFPLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQzlCLENBQUMsRUFDRztNQUFFLElBQUksRUFBRSxDQUFDO01BQUUsRUFBRSxFQUFFLENBQUM7TUFBRSxJQUFJLEVBQUU7SUFBRSxDQUFFLENBQy9CO0VBQ1Q7RUFFQSxNQUFNLFVBQVUsR0FBRztJQUNmLFVBQVUsRUFBRSxJQUFJLEdBQWM7SUFDOUIsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksTUFBTTtNQUFFLEdBQUcsSUFBSTtNQUFFLENBQUMsSUFBSSxHQUFHO0lBQUMsQ0FBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO0lBQ3JFLEtBQUssRUFBRSxDQUFDO0lBQ1IsSUFBSSxFQUFFO01BQUUsRUFBRSxFQUFFLENBQUM7TUFBRSxJQUFJLEVBQUUsQ0FBQztNQUFFLElBQUksRUFBRTtJQUFFO0dBQ25DO0VBRUQsS0FBSyxNQUFNLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0lBQ3pDLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDckI7O0lBR0osS0FBSyxNQUFNLElBQUksSUFBSSxhQUFhLEVBQUU7TUFDOUI7TUFDQSxJQUFJLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtRQUN0Qzs7TUFFSixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxRQUFRLEtBQUssSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO01BQ3RHO01BQ0EsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUs7O0lBRzdCLFVBQVUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUM7SUFFOUQsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLEVBQUU7TUFDdkIsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFVBQVUsRUFBRTtRQUMvRCxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDL0IsS0FBSyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7O01BRTlFLFVBQVUsQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsU0FBUyxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxTQUFTLEdBQUcsU0FBUyxDQUFDLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQzs7O0VBSWxJLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO0lBQ2xDLE1BQU0sYUFBYSxHQUFhLEVBQUU7SUFDbEMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUU7TUFDMUIsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDOztJQUVqRSxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRTtNQUN4QixhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7O0lBRTdEO0lBQ0EsS0FBSyxDQUFDLFdBQVcsQ0FBQyxvQkFBVSxFQUN4QixDQUFDLElBQUksRUFDRCxDQUFDLElBQUksRUFBRTtNQUFFLEtBQUssRUFBRTtJQUFtQixDQUFFLEVBQUUsUUFBUSxDQUFDLEVBQ2hELENBQUMsSUFBSSxFQUFFO01BQUUsS0FBSyxFQUFFO0lBQXdCLENBQUUsQ0FBQyxFQUMzQyxDQUFDLElBQUksRUFBRTtNQUFFLEtBQUssRUFBRTtJQUFtQixDQUFFLENBQUMsRUFDdEMsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxvQkFBVSxFQUFDLENBQUMsSUFBSSxFQUFFO01BQUUsS0FBSyxFQUFFO0lBQWUsQ0FBRTtJQUNyRTtJQUNBLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3hCLENBQUMsQ0FBQyxFQUNILENBQUMsSUFBSSxFQUFFO01BQUUsS0FBSyxFQUFFO0lBQTRCLENBQUUsRUFBRSxHQUFHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUN0RSxDQUFDLElBQUksRUFBRTtNQUFFLEtBQUssRUFBRTtJQUFxQixDQUFFLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUNyRSxDQUNKLENBQUM7SUFDRixLQUFLLE1BQU0sY0FBYyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO01BQzNFLElBQUksRUFBRSxjQUFjLFlBQVksV0FBVyxDQUFDLEVBQUU7UUFDMUM7O01BRUosY0FBYyxDQUFDLE1BQU0sR0FBRyxJQUFJOzs7RUFJcEMsS0FBSyxNQUFNLFNBQVMsSUFBSSxhQUFhLEVBQUU7SUFDbkM7SUFDQSxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7TUFDN0IsS0FBSyxNQUFNLGNBQWMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsR0FBRyxTQUFTLFNBQVMsQ0FBQyxFQUFFO1FBQzlFLElBQUksRUFBRSxjQUFjLFlBQVksV0FBVyxDQUFDLEVBQUU7VUFDMUM7O1FBRUosY0FBYyxDQUFDLE1BQU0sR0FBRyxJQUFJOzs7O0VBSXhDLE9BQU8sS0FBSztBQUNoQjtBQUVNLFNBQVUsZUFBZTtFQUMzQjtFQUNBLElBQUksR0FBRyxHQUFHLENBQUM7RUFDWCxLQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUU7SUFDMUIsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUM7O0VBRW5DLE9BQU8sR0FBRztBQUNkO0FBRUEsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUcsS0FBSyxJQUFJO0VBQzlDLElBQUksTUFBTSxJQUFJLE1BQU0sS0FBSyxLQUFLLENBQUMsTUFBTSxFQUFFO0lBQ25DLE1BQU0sQ0FBQyxLQUFLLEVBQUU7SUFDZCxNQUFNLENBQUMsTUFBTSxFQUFFO0lBQ2YsTUFBTSxHQUFHLFNBQVM7O0FBRTFCLENBQUMsQ0FBQzs7Ozs7Ozs7OztBQ3RzQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFFQSxNQUFNLFdBQVcsR0FBRyxDQUNoQixPQUFPLEVBQUUsQ0FDTCxNQUFNLEVBQUUsQ0FDSixNQUFNLEVBQ04sT0FBTyxFQUNQLEtBQUssQ0FDUixFQUNELFFBQVEsRUFDUixRQUFRLEVBQ1IsTUFBTSxFQUFFLENBQ0osUUFBUSxFQUNSLE9BQU8sQ0FDVixFQUNELEtBQUssRUFBRSxDQUNILE9BQU8sRUFDUCxXQUFXLEVBQ1gsT0FBTyxDQUNWLEVBQ0QsU0FBUyxDQUNaLENBQ0o7QUFFRCxNQUFNLGtCQUFrQixHQUFHLENBQ3ZCLGNBQWMsRUFBRSxDQUNaLE1BQU0sRUFBRSxDQUNKLE9BQU8sRUFDUCxLQUFLLENBQ1IsRUFDRCxjQUFjLEVBQ2QsV0FBVyxFQUNYLGFBQWEsRUFDYixtQkFBbUIsQ0FDdEIsQ0FDSjtBQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQVU7QUFFM0MsU0FBUyxjQUFjO0VBQ25CLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUM7RUFDMUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtJQUNUOztFQUdKLElBQUksS0FBSyxHQUFHLElBQUk7RUFDaEIsS0FBSyxNQUFNLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLHNCQUFVLENBQUMsRUFBRTtJQUM1QyxNQUFNLEVBQUUsR0FBRyxzQkFBc0IsU0FBUyxFQUFFO0lBQzVDLE1BQU0sWUFBWSxHQUFHLG9CQUFVLEVBQUMsQ0FBQyxPQUFPLEVBQUU7TUFBRSxFQUFFLEVBQUUsRUFBRTtNQUFFLElBQUksRUFBRSxPQUFPO01BQUUsSUFBSSxFQUFFLG9CQUFvQjtNQUFFLEtBQUssRUFBRTtJQUFTLENBQUUsQ0FBQyxDQUFDO0lBQ25ILFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDO0lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQVUsRUFBQyxDQUFDLE9BQU8sRUFBRTtNQUFFLEdBQUcsRUFBRTtJQUFFLENBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQVUsRUFBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEMsSUFBSSxLQUFLLEVBQUU7TUFDUCxZQUFZLENBQUMsT0FBTyxHQUFHLElBQUk7TUFDM0IsS0FBSyxHQUFHLEtBQUs7OztFQUlyQixNQUFNLE9BQU8sR0FBeUIsQ0FDbEMsQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLEVBQzVCLENBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsQ0FDN0M7RUFDRCxLQUFLLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksT0FBTyxFQUFFO0lBQ2xDLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO0lBQzVDLElBQUksQ0FBQyxNQUFNLEVBQUU7TUFDVDs7SUFFSixNQUFNLElBQUksR0FBRyxrQ0FBZ0IsRUFBQyxNQUFNLENBQUM7SUFDckMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUM7SUFDOUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxFQUFFO0lBQ3JCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDOztBQUVoQztBQUVBLGNBQWMsRUFBRTtBQUVoQixJQUFJLE9BQW9CO0FBQ3hCLE1BQU0saUJBQWlCLEdBQUcsb0JBQVUsRUFBQyxDQUFDLElBQUksRUFBRTtFQUFFLEVBQUUsRUFBRTtBQUFhLENBQUUsQ0FBQyxDQUFDO0FBQ25FLElBQUksc0JBQStDO0FBRW5ELFNBQVMsYUFBYTtFQUNsQixRQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUM7SUFBRTtFQUFNLENBQUUsS0FBSTtJQUNsRCxJQUFJLEVBQUUsTUFBTSxZQUFZLFdBQVcsQ0FBQyxFQUFFO01BQ2xDOztJQUVKLE9BQU8sR0FBRyxNQUFNO0VBQ3BCLENBQUMsQ0FBQztFQUVGLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUcsS0FBSyxJQUFJO0lBQzVDLElBQUksRUFBRSxLQUFLLENBQUMsTUFBTSxZQUFZLFdBQVcsQ0FBQyxFQUFFO01BQ3hDOztJQUVKLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEtBQUssVUFBVSxFQUFFO01BQ3ZDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQUU7TUFDdkQsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRztNQUN4QyxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTTtNQUNoQyxJQUFLLFFBSUo7TUFKRCxXQUFLLFFBQVE7UUFDVCx5Q0FBSztRQUNMLG1DQUFFO1FBQ0YseUNBQUs7TUFDVCxDQUFDLEVBSkksUUFBUSxLQUFSLFFBQVE7TUFLYixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxNQUFNLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEVBQUU7TUFDcEcsUUFBUSxRQUFRO1FBQ1osS0FBSyxRQUFRLENBQUMsS0FBSztVQUNmLElBQUksc0JBQXNCLEVBQUU7WUFDeEIsc0JBQXNCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFDcEQsc0JBQXNCLEdBQUcsU0FBUzs7VUFFdEMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLEtBQUs7VUFDaEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUM7VUFDdEM7UUFDSixLQUFLLFFBQVEsQ0FBQyxLQUFLO1VBQ2YsSUFBSSxzQkFBc0IsRUFBRTtZQUN4QixzQkFBc0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUNwRCxzQkFBc0IsR0FBRyxTQUFTOztVQUV0QyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsS0FBSztVQUNoQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztVQUNyQztRQUNKLEtBQUssUUFBUSxDQUFDLEVBQUU7VUFDWixpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsSUFBSTtVQUMvQixJQUFJLHNCQUFzQixFQUFFO1lBQ3hCLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDOztVQUV4RCxJQUFJLE9BQU8sS0FBSyxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQzFCOztVQUVKLHNCQUFzQixHQUFHLEtBQUssQ0FBQyxNQUFNO1VBQ3JDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO1VBQ2pEO01BQU07O0lBR2xCLEtBQUssQ0FBQyxjQUFjLEVBQUU7RUFDMUIsQ0FBQyxDQUFDO0VBRUYsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQUU7RUFBTSxDQUFFLEtBQUk7SUFDN0MsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRTtNQUMzQixPQUFPLENBQUMsTUFBTSxFQUFFO01BQ2hCLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7TUFDaEMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLElBQUk7TUFDL0IsYUFBYSxFQUFFO01BQ2Y7O0lBRUosaUJBQWlCLENBQUMsTUFBTSxHQUFHLElBQUk7SUFDL0IsSUFBSSxFQUFFLE1BQU0sWUFBWSxXQUFXLENBQUMsRUFBRTtNQUNsQzs7SUFFSixJQUFJLHNCQUFzQixFQUFFO01BQ3hCLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO01BQ3BELE1BQU0sVUFBVSxHQUFHLHNCQUFzQjtNQUN6QyxzQkFBc0IsR0FBRyxTQUFTO01BQ2xDLElBQUksRUFBRSxVQUFVLFlBQVksYUFBYSxDQUFDLEVBQUU7UUFDeEM7O01BRUosVUFBVSxDQUFDLFdBQVcsSUFBSSxJQUFJLE9BQU8sQ0FBQyxXQUFXLEVBQUU7TUFDbkQsT0FBTyxDQUFDLE1BQU0sRUFBRTs7SUFFcEIsSUFBSSxNQUFNLEtBQUssT0FBTyxFQUFFO01BQ3BCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxXQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztNQUM3QyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUc7TUFDcEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLG9CQUFVLEVBQUMsQ0FBQyxJQUFJLEVBQUU7UUFBRSxLQUFLLEVBQUUsVUFBVTtRQUFFLFNBQVMsRUFBRTtNQUFNLENBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7O0lBRTNHLGFBQWEsRUFBRTtFQUNuQixDQUFDLENBQUM7QUFDTjtBQUVBLGFBQWEsRUFBRTtBQUVmLFNBQVMsT0FBTyxDQUFDLEdBQVcsRUFBRSxHQUFXO0VBQ3JDLElBQUksR0FBRyxLQUFLLEdBQUcsRUFBRTtJQUNiLE9BQU8sQ0FBQzs7RUFFWixPQUFPLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUM3QjtBQUVBLFNBQVMsb0JBQW9CO0VBQ3pCLE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDO0VBQzVFLEtBQUssTUFBTSxPQUFPLElBQUksbUJBQW1CLEVBQUU7SUFDdkMsSUFBSSxFQUFFLE9BQU8sWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ3hDLE1BQU0sZ0JBQWdCOztJQUUxQixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7TUFDakIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUs7TUFDL0IsSUFBSSwyQkFBVyxFQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQ3hCLE9BQU8sU0FBUzs7TUFFcEI7OztBQUdaO0FBRUEsU0FBUyxvQkFBb0IsQ0FBQyxTQUE0QjtFQUN0RCxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQztFQUM1RSxLQUFLLE1BQU0sT0FBTyxJQUFJLG1CQUFtQixFQUFFO0lBQ3ZDLElBQUksRUFBRSxPQUFPLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtNQUN4QyxNQUFNLGdCQUFnQjs7SUFFMUIsSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtNQUM3QixPQUFPLENBQUMsT0FBTyxHQUFHLElBQUk7TUFDdEI7OztBQUdaO0FBR08sTUFBTSxhQUFhLEdBQUcsQ0FBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLG9CQUFvQixDQUFVO0FBQUM7QUFFekYsU0FBVSxjQUFjLENBQUMsWUFBb0I7RUFDL0MsT0FBUSxhQUFxQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7QUFDeEU7QUFFQSxTQUFTLG9CQUFvQjtFQUN6QixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQztFQUM5RCxJQUFJLEVBQUUsYUFBYSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7SUFDOUMsTUFBTSxnQkFBZ0I7O0VBRTFCLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRTtJQUN2QixPQUFPLGVBQWU7O0VBRTFCLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO0VBQzlELElBQUksRUFBRSxhQUFhLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUM5QyxNQUFNLGdCQUFnQjs7RUFFMUIsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFO0lBQ3ZCLE9BQU8sZUFBZTs7RUFFMUIsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDO0VBQ3hFLElBQUksRUFBRSxrQkFBa0IsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO0lBQ25ELE1BQU0sZ0JBQWdCOztFQUUxQixJQUFJLGtCQUFrQixDQUFDLE9BQU8sRUFBRTtJQUM1QixPQUFPLG9CQUFvQjs7RUFFL0IsTUFBTSxnQkFBZ0I7QUFDMUI7QUFFQSxTQUFTLGFBQWE7RUFDbEIsTUFBTSxpQkFBaUIsR0FBRyxvQkFBb0IsRUFBRSxJQUFJLEtBQUs7RUFDekQseUJBQWdCLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQztFQUM3RDtJQUFDO0lBQ0csTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzNFLElBQUksRUFBRSxlQUFlLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtNQUNoRCxNQUFNLGdCQUFnQjs7SUFFMUIsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsK0JBQWEsRUFBQyxlQUFlLENBQUMsQ0FBQyxFQUFFO01BQ3hFLHlCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDOztJQUU5QyxNQUFNLHNCQUFzQixHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3pGLElBQUksRUFBRSxzQkFBc0IsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ3ZELE1BQU0sZ0JBQWdCOztJQUUxQixLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQywrQkFBYSxFQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRTtNQUMvRSx5QkFBZ0IsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQzs7O0VBR2xEO0lBQUU7SUFDRSxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQztJQUN4RCxJQUFJLEVBQUUsVUFBVSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7TUFDM0MsTUFBTSxnQkFBZ0I7O0lBRTFCLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO0lBQzNDLHlCQUFnQixDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDO0lBRW5ELE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO0lBQ3hELElBQUksRUFBRSxVQUFVLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtNQUMzQyxNQUFNLGdCQUFnQjs7SUFFMUIsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLEtBQUs7SUFDbEMsSUFBSSxTQUFTLEVBQUU7TUFDWCx5QkFBZ0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQztLQUN6RCxNQUNJO01BQ0QseUJBQWdCLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQzs7SUFFbEQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUM7SUFDOUQsSUFBSSxFQUFFLGFBQWEsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQzlDLE1BQU0sZ0JBQWdCOztJQUUxQix5QkFBZ0IsQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUM7O0VBRXpFO0lBQUU7SUFDRSx5QkFBZ0IsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQzs7RUFHN0UseUJBQWdCLENBQUMsWUFBWSxDQUFDLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0Y7QUFFQSxTQUFTLGdCQUFnQjtFQUNyQixNQUFNLGdCQUFnQixHQUFHLHlCQUFnQixDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7RUFDbkUsb0JBQW9CLENBQUMsT0FBTyxnQkFBZ0IsS0FBSyxRQUFRLElBQUksMkJBQVcsRUFBQyxnQkFBZ0IsQ0FBQyxHQUFHLGdCQUFnQixHQUFHLEtBQUssQ0FBQztFQUV0SDtJQUFDO0lBQ0csSUFBSSxNQUFNLEdBQStCLEVBQUU7SUFDM0MsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMseUJBQWdCLENBQUMsU0FBUyxDQUFDLEVBQUU7TUFDcEUsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUs7OztJQUk1QixNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0UsSUFBSSxFQUFFLGVBQWUsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ2hELE1BQU0sZ0JBQWdCOztJQUUxQiwrQkFBYSxFQUFDLGVBQWUsRUFBRSxNQUFNLENBQUM7SUFDdEMsTUFBTSxzQkFBc0IsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUN6RixJQUFJLEVBQUUsc0JBQXNCLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtNQUN2RCxNQUFNLGdCQUFnQjs7SUFFMUIsK0JBQWEsRUFBQyxzQkFBc0IsRUFBRSxNQUFNLENBQUM7O0VBRWpELE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO0VBQ3hEO0lBQUU7SUFDRSxJQUFJLEVBQUUsVUFBVSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7TUFDM0MsTUFBTSxnQkFBZ0I7O0lBRTFCLE1BQU0sUUFBUSxHQUFHLHlCQUFnQixDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7SUFDMUQsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7TUFDOUIsVUFBVSxDQUFDLEtBQUssR0FBRyxHQUFHLFFBQVEsRUFBRTtLQUNuQyxNQUNJO01BQ0QsVUFBVSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRzs7SUFHckMsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7SUFDeEQsSUFBSSxFQUFFLFVBQVUsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQzNDLE1BQU0sZ0JBQWdCOztJQUcxQixNQUFNLFNBQVMsR0FBRyx5QkFBZ0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDO0lBQzdELElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFO01BQy9CLFVBQVUsQ0FBQyxLQUFLLEdBQUcsU0FBUzs7SUFHaEMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUM7SUFDOUQsSUFBSSxFQUFFLGFBQWEsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQzlDLE1BQU0sZ0JBQWdCOztJQUUxQixhQUFhLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyx5QkFBZ0IsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDOztFQUc1RTtJQUFFO0lBQ0UsSUFBSSxnQkFBZ0IsR0FBRyx5QkFBZ0IsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUM7SUFDeEUsSUFBSSxPQUFPLGdCQUFnQixLQUFLLFFBQVEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO01BQzNFLGdCQUFnQixHQUFHLGVBQWU7O0lBRXRDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUM7SUFDMUQsSUFBSSxFQUFFLFFBQVEsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ3pDLE1BQU0sZ0JBQWdCOztJQUUxQixRQUFRLENBQUMsT0FBTyxHQUFHLElBQUk7SUFDdkIsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUU7TUFBRSxPQUFPLEVBQUUsS0FBSztNQUFFLFVBQVUsRUFBRTtJQUFJLENBQUUsQ0FBQyxDQUFDOztFQUdyRixNQUFNLFlBQVksR0FBRyx5QkFBZ0IsQ0FBQyxZQUFZLENBQUMsbUJBQW1CLENBQUM7RUFDdkUsSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUU7SUFDbEMsS0FBSyxNQUFNLEVBQUUsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO01BQ3RDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7OztFQUczQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDO0VBRTdCO0VBQ0EsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNoRDtBQUVBLFNBQVMsYUFBYTtFQUNsQixhQUFhLEVBQUU7RUFDZixNQUFNLE9BQU8sR0FBZ0MsRUFBRTtFQUMvQyxNQUFNLGFBQWEsR0FBNEMsRUFBRTtFQUNqRSxJQUFJLGlCQUF3QztFQUM1QyxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDM0UsSUFBSSxFQUFFLGVBQWUsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO0lBQ2hELE1BQU0sZ0JBQWdCOztFQUUxQixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQztFQUM5RCxJQUFJLEVBQUUsYUFBYSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7SUFDOUMsTUFBTSxnQkFBZ0I7O0VBRTFCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO0VBQ3hELElBQUksRUFBRSxVQUFVLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUMzQyxNQUFNLGdCQUFnQjs7RUFHMUI7SUFBRTtJQUNFLGlCQUFpQixHQUFHLG9CQUFvQixFQUFFO0lBQzFDLFFBQVEsb0JBQW9CLEVBQUU7TUFDMUIsS0FBSyxlQUFlO1FBQ2hCLElBQUksaUJBQWlCLEVBQUU7VUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxpQkFBaUIsQ0FBQzs7UUFFOUQ7TUFDSixLQUFLLGVBQWU7UUFDaEI7TUFDSixLQUFLLG9CQUFvQjtRQUNyQjtJQUFNOztFQUlsQjtJQUFFO0lBQ0UsUUFBUSxvQkFBb0IsRUFBRTtNQUMxQixLQUFLLGVBQWU7UUFDaEIsTUFBTSxXQUFXLEdBQUcsK0JBQWEsRUFBQyxlQUFlLENBQUM7UUFDbEQsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QztNQUNKLEtBQUssZUFBZTtRQUNoQjtNQUNKLEtBQUssb0JBQW9CO1FBQ3JCO0lBQU07O0VBSWxCO0lBQUU7SUFDRSxNQUFNLHNCQUFzQixHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3pGLElBQUksRUFBRSxzQkFBc0IsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ3ZELE1BQU0sZ0JBQWdCOztJQUUxQixNQUFNLGtCQUFrQixHQUFHLCtCQUFhLEVBQUMsc0JBQXNCLENBQUM7SUFDaEUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxFQUFFO01BQzdCLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLEVBQUUsVUFBVSxZQUFZLDBCQUFjLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0lBRXZILElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtNQUMzQixhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxFQUFFLFVBQVUsWUFBWSwwQkFBYyxJQUFJLFVBQVUsQ0FBQyxFQUFFLElBQUksVUFBVSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzs7SUFFdEgsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxFQUFFO01BQ25DLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUM7O0lBRTdDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsRUFBRTtNQUNwQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxFQUFFLFVBQVUsWUFBWSwyQkFBZSxDQUFDLENBQUM7O0lBRTlFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsRUFBRTtNQUNqQyxhQUFhLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFFbEUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLEVBQUU7TUFDMUMsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLEdBQUcsYUFBYSxDQUFDO01BQ25ELE1BQU0sWUFBWSxHQUFJLFVBQXNCLElBQUssd0JBQXdCLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7TUFDN0csU0FBUyxpQkFBaUIsQ0FBQyxVQUFzQjtRQUM3QyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1VBQzNCLE9BQU8sS0FBSzs7UUFFaEIsSUFBSSxVQUFVLFlBQVksMkJBQWUsRUFBRTtVQUN2QyxLQUFLLE1BQU0sTUFBTSxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQzFDLElBQUksaUJBQWlCLENBQUMsTUFBTSxDQUFDLEVBQUU7Y0FDM0IsT0FBTyxJQUFJOzs7U0FHdEIsTUFDSTtVQUNELE9BQU8sSUFBSTs7UUFFZixPQUFPLEtBQUs7TUFDaEI7TUFDQSxhQUFhLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDO01BRXJDLFNBQVMsZUFBZSxDQUFDLElBQVU7UUFDL0IsS0FBSyxNQUFNLFVBQVUsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1VBQ25DLElBQUksaUJBQWlCLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDL0IsT0FBTyxJQUFJOzs7UUFHbkIsT0FBTyxLQUFLO01BQ2hCO01BQ0EsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7OztFQUlyQztJQUFFO0lBQ0UsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7SUFDeEQsSUFBSSxFQUFFLFVBQVUsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQzNDLE1BQU0sZ0JBQWdCOztJQUUxQixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztJQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFFLElBQVUsSUFBSyxJQUFJLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQztJQUVwRCxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSztJQUNsQyxJQUFJLFNBQVMsRUFBRTtNQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDOzs7RUFJMUY7SUFBRTtJQUNFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNyRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQztJQUM1RCxJQUFJLEVBQUUsY0FBYyxZQUFZLGNBQWMsQ0FBQyxFQUFFO01BQzdDLE1BQU0sZ0JBQWdCOztJQUcxQixjQUFjLENBQUMsZUFBZSxFQUFFO0lBQ2hDLEtBQUssTUFBTSxFQUFFLElBQUksaUJBQWlCLEVBQUU7TUFDaEMsTUFBTSxJQUFJLEdBQUcsaUJBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO01BQzFCLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDUDs7TUFFSixjQUFjLENBQUMsV0FBVyxDQUFDLG9CQUFVLEVBQUMsQ0FBQyxLQUFLLEVBQUUsb0JBQVUsRUFBQyxDQUFDLFFBQVEsRUFBRTtRQUFFLEtBQUssRUFBRSxzQkFBc0I7UUFBRSxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7TUFBRSxDQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzs7O0VBS2pLLE1BQU0sV0FBVyxHQUF5QyxFQUFFO0VBRTVELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO0VBQzdELElBQUksRUFBRSxZQUFZLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUM3QyxNQUFNLGdCQUFnQjs7RUFFMUIsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUN0QixJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUM3QixNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDakQsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQ2hDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVksQ0FBQztFQUNuQztJQUNJLEtBQUssTUFBTSxJQUFJLElBQUksYUFBYSxFQUFFO01BQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO01BQzdCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFTLEVBQUUsR0FBUyxLQUFLLE9BQU8sQ0FDOUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUNuRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQ3RFLENBQUM7OztFQUlWLE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBSztJQUNoQixRQUFRLG9CQUFvQixFQUFFO01BQzFCLEtBQUssZUFBZTtRQUNoQixPQUFPLCtCQUFlLEVBQ2xCLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFDN0MsVUFBVSxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUMvRCxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUk7VUFDWixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUM7O1VBRWpCLEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFO1lBQ2xDLFFBQVEsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUM7Y0FDOUIsS0FBSyxDQUFDLENBQUM7Z0JBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQztjQUNqQixLQUFLLENBQUM7Z0JBQ0YsT0FBTyxLQUFLO1lBQUM7O1VBR3pCLE9BQU8sQ0FBQyxHQUFHLEtBQUssRUFBRSxJQUFJLENBQUM7UUFDM0IsQ0FBQyxFQUNELGFBQWEsRUFDYixpQkFBaUIsQ0FDcEI7TUFDTCxLQUFLLGVBQWU7UUFDaEIsT0FBTyw2QkFBYSxFQUFDLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQztNQUMxRixLQUFLLG9CQUFvQjtRQUNyQixPQUFPLG9CQUFVLEVBQ2IsQ0FBQyxPQUFPLEVBQ0osQ0FBQyxJQUFJLEVBQ0QsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUMsQ0FDOUIsQ0FDSixDQUNKO0lBQUM7RUFFZCxDQUFDLEdBQUc7RUFFSixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztFQUNqRCxJQUFJLENBQUMsTUFBTSxFQUFFO0lBQ1Q7O0VBRUosTUFBTSxDQUFDLFNBQVMsR0FBRyxFQUFFO0VBQ3JCLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO0FBQzdCO0FBRUEsU0FBUyx3QkFBd0I7RUFDN0IsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUM7RUFDNUQsSUFBSSxFQUFFLFlBQVksWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO0lBQzdDLE1BQU0sZ0JBQWdCOztFQUUxQixNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQztFQUN4RCxJQUFJLEVBQUUsVUFBVSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7SUFDM0MsTUFBTSxnQkFBZ0I7O0VBRTFCLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBSztJQUN0QyxZQUFZLENBQUMsV0FBVyxHQUFHLDBCQUEwQixVQUFVLENBQUMsS0FBSyxFQUFFO0lBQ3ZFLGFBQWEsRUFBRTtFQUNuQixDQUFDLENBQUM7QUFDTjtBQUVBLFNBQVMsaUJBQWlCO0VBQ3RCLHdCQUF3QixFQUFFO0VBQzFCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO0VBQ3hELElBQUksRUFBRSxVQUFVLFlBQVksV0FBVyxDQUFDLEVBQUU7SUFDdEMsTUFBTSxnQkFBZ0I7O0VBRTFCLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDO0VBRW5ELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO0VBQzlELElBQUksRUFBRSxhQUFhLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUM5QyxNQUFNLGdCQUFnQjs7RUFFMUIsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUM7RUFDN0QsSUFBSSxFQUFFLFlBQVksWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO0lBQzdDLE1BQU0sZ0JBQWdCOztFQUUxQixhQUFhLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLE1BQUs7SUFDekMsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQzdCLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUNqRCxNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUM7SUFFckMsS0FBSyxNQUFNLElBQUksSUFBSSxpQkFBaUIsRUFBRTtNQUNsQyxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsT0FBTyxHQUFHLHNDQUFzQyxHQUFHLDBDQUEwQztNQUN6SCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsT0FBTyxHQUFHLFFBQVEsR0FBRyxJQUFJO01BQ3hELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7O0lBRWxHLGFBQWEsRUFBRTtFQUNuQixDQUFDLENBQUM7QUFDTjtBQUVBLGlCQUFpQixFQUFFO0FBRW5CLFNBQVMsZ0NBQWdDO0VBQ3JDLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUM7RUFDaEUsSUFBSSxFQUFFLGNBQWMsWUFBWSxtQkFBbUIsQ0FBQyxFQUFFO0lBQ2xEOztFQUVKLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO0VBQzlELElBQUksRUFBRSxhQUFhLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUM5Qzs7RUFFSixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQztFQUMxRCxJQUFJLEVBQUUsV0FBVyxZQUFZLGNBQWMsQ0FBQyxFQUFFO0lBQzFDOztFQUVKLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsTUFBSztJQUMxQyxjQUFjLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7SUFDM0MsV0FBVyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ3hDLGFBQWEsRUFBRTtFQUNuQixDQUFDLENBQUM7RUFFRixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQztFQUM5RCxJQUFJLEVBQUUsYUFBYSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7SUFDOUM7O0VBRUosYUFBYSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxNQUFLO0lBQzFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztJQUN4QyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7SUFDckMsYUFBYSxFQUFFO0VBQ25CLENBQUMsQ0FBQztFQUVGLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQztFQUN4RSxJQUFJLEVBQUUsa0JBQWtCLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUNuRDs7RUFFSixrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsTUFBSztJQUMvQyxjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7SUFDeEMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0lBQ3JDLGFBQWEsRUFBRTtFQUNuQixDQUFDLENBQUM7QUFDTjtBQUVBLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsWUFBVztFQUN2QyxnQ0FBZ0MsRUFBRTtFQUNsQyxnQkFBZ0IsRUFBRTtFQUNsQixNQUFNLDZCQUFhLEdBQUU7RUFDckIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLENBQUMsc0JBQXNCLENBQUMsaUJBQWlCLENBQUMsRUFBRTtJQUN0RSxJQUFJLE9BQU8sWUFBWSxXQUFXLEVBQUU7TUFDaEMsT0FBTyxDQUFDLE1BQU0sR0FBRyxLQUFLOzs7RUFHOUIsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLENBQUMsc0JBQXNCLENBQUMsaUJBQWlCLENBQUMsRUFBRTtJQUN0RSxJQUFJLE9BQU8sWUFBWSxXQUFXLEVBQUU7TUFDaEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTTs7O0VBR3RDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO0VBQ3hELElBQUksRUFBRSxVQUFVLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUMzQyxNQUFNLGdCQUFnQjs7RUFFMUIsTUFBTSxRQUFRLEdBQUcsK0JBQWUsR0FBRTtFQUNsQyxVQUFVLENBQUMsS0FBSyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUFFO0VBQ3RFLFVBQVUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxRQUFRLEVBQUU7RUFDOUIsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztFQUM1QyxhQUFhLEVBQUU7RUFDZixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDO0VBQzVELElBQUksU0FBUyxZQUFZLGlCQUFpQixFQUFFO0lBQ3hDLFNBQVMsQ0FBQyxXQUFXLENBQUMsK0JBQWUsRUFBQyxNQUFNLEVBQUUsb0JBQVUsRUFBQyxDQUFDLEdBQUcsRUFDekQsOERBQThELEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFDdEUsc0ZBQXNGLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFDOUYsd0dBQXdHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFDaEgsb0RBQW9ELENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXBFLENBQUMsQ0FBQztBQUVGLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFHLEtBQUssSUFBSTtFQUM5QyxJQUFJLEVBQUUsS0FBSyxDQUFDLE1BQU0sWUFBWSxXQUFXLENBQUMsRUFBRTtJQUN4Qzs7RUFFSixJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxLQUFLLGNBQWMsRUFBRTtJQUMzQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO01BQ2xDOztJQUVKLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDaEUsYUFBYSxFQUFFO0dBQ2xCLE1BQ0ksSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsS0FBSyxzQkFBc0IsRUFBRTtJQUN4RCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO01BQ2xDOztJQUVKLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDbkUsYUFBYSxFQUFFOztBQUV2QixDQUFDLENBQUM7Ozs7Ozs7OztBQzdyQkYsU0FBUyxrQkFBa0IsQ0FBQyxLQUE2QjtFQUNyRCxRQUFRLE9BQU8sS0FBSztJQUNoQixLQUFLLFFBQVE7TUFDVCxPQUFPLElBQUksS0FBSyxFQUFXO0lBQy9CLEtBQUssUUFBUTtNQUNULE9BQU8sSUFBSSxLQUFLLEVBQVc7SUFDL0IsS0FBSyxTQUFTO01BQ1YsT0FBTyxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUk7RUFBQztBQUV2QztBQUVBLFNBQVMsa0JBQWtCLENBQUMsRUFBaUI7RUFDekMsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUNwQixNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztFQUM3QixRQUFRLE1BQU07SUFDVixLQUFLLEdBQUc7TUFBRTtNQUNOLE9BQU8sS0FBSztJQUNoQixLQUFLLEdBQUc7TUFBRTtNQUNOLE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQztJQUM1QixLQUFLLEdBQUc7TUFBRTtNQUNOLE9BQU8sS0FBSyxLQUFLLEdBQUcsR0FBRyxJQUFJLEdBQUcsS0FBSztFQUFDO0VBRTVDLE1BQU0sa0JBQWtCLEVBQUUsRUFBRTtBQUNoQztBQUVBLFNBQVMsZ0JBQWdCLENBQUMsR0FBVztFQUNqQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BEO0FBRU0sTUFBTyxnQkFBZ0I7RUFDekIsT0FBTyxZQUFZLENBQUMsYUFBcUI7SUFDckMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDO0lBQ3ZELElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO01BQzVCOztJQUVKLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRTtNQUMzQjs7SUFFSixPQUFPLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztFQUNyQztFQUNBLE9BQU8sWUFBWSxDQUFDLGFBQXFCLEVBQUUsS0FBNkI7SUFDcEUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGFBQWEsRUFBRSxFQUFFLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3ZFO0VBQ0EsT0FBTyxlQUFlLENBQUMsYUFBcUI7SUFDeEMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDO0VBQy9DO0VBQ0EsT0FBTyxTQUFTO0lBQ1osWUFBWSxDQUFDLEtBQUssRUFBRTtFQUN4QjtFQUNBLFdBQVcsU0FBUztJQUNoQixJQUFJLE1BQU0sR0FBOEMsRUFBRTtJQUMxRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtNQUMxQyxNQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztNQUMvQixJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtRQUN6Qjs7TUFFSixNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztNQUN2QyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUMzQjs7TUFFSixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDMUI7O01BRUosTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQzs7SUFFM0MsT0FBTyxNQUFNO0VBQ2pCOztBQUNIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHsgY3JlYXRlSFRNTCB9IGZyb20gJy4vaHRtbCc7XG5cbmV4cG9ydCB0eXBlIFRyZWVOb2RlID0gc3RyaW5nIHwgVHJlZU5vZGVbXTtcblxuZnVuY3Rpb24gZ2V0Q2hpbGRyZW4obm9kZTogSFRNTElucHV0RWxlbWVudCk6IEhUTUxJbnB1dEVsZW1lbnRbXSB7XG4gICAgY29uc3QgcGFyZW50X2xpID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghKHBhcmVudF9saSBpbnN0YW5jZW9mIEhUTUxMSUVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50X3VsID0gcGFyZW50X2xpLnBhcmVudEVsZW1lbnQ7XG4gICAgaWYgKCEocGFyZW50X3VsIGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBmb3IgKGxldCBjaGlsZEluZGV4ID0gMDsgY2hpbGRJbmRleCA8IHBhcmVudF91bC5jaGlsZHJlbi5sZW5ndGg7IGNoaWxkSW5kZXgrKykge1xuICAgICAgICBpZiAocGFyZW50X3VsLmNoaWxkcmVuW2NoaWxkSW5kZXhdICE9PSBwYXJlbnRfbGkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBvdGVudGlhbFNpYmxpbmdFbnRyeSA9IHBhcmVudF91bC5jaGlsZHJlbltjaGlsZEluZGV4ICsgMV0/LmNoaWxkcmVuWzBdO1xuICAgICAgICBpZiAoIShwb3RlbnRpYWxTaWJsaW5nRW50cnkgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEFycmF5XG4gICAgICAgICAgICAuZnJvbShwb3RlbnRpYWxTaWJsaW5nRW50cnkuY2hpbGRyZW4pXG4gICAgICAgICAgICAuZmlsdGVyKChlKTogZSBpcyBIVE1MTElFbGVtZW50ID0+IGUgaW5zdGFuY2VvZiBIVE1MTElFbGVtZW50ICYmIGUuY2hpbGRyZW5bMF0gaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KVxuICAgICAgICAgICAgLm1hcChlID0+IGUuY2hpbGRyZW5bMF0gYXMgSFRNTElucHV0RWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbn1cblxuZnVuY3Rpb24gYXBwbHlDaGVja2VkVG9EZXNjZW5kYW50cyhub2RlOiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBnZXRDaGlsZHJlbihub2RlKSkge1xuICAgICAgICBpZiAoY2hpbGQuY2hlY2tlZCAhPT0gbm9kZS5jaGVja2VkKSB7XG4gICAgICAgICAgICBjaGlsZC5jaGVja2VkID0gbm9kZS5jaGVja2VkO1xuICAgICAgICAgICAgY2hpbGQuaW5kZXRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgYXBwbHlDaGVja2VkVG9EZXNjZW5kYW50cyhjaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudChub2RlOiBIVE1MSW5wdXRFbGVtZW50KTogSFRNTElucHV0RWxlbWVudCB8IHZvaWQge1xuICAgIGNvbnN0IHBhcmVudF9saSA9IG5vZGUucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudDtcbiAgICBpZiAoIShwYXJlbnRfbGkgaW5zdGFuY2VvZiBIVE1MTElFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudF91bCA9IHBhcmVudF9saS5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghKHBhcmVudF91bCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGNhbmRpZGF0ZTogSFRNTExJRWxlbWVudCB8IHZvaWQ7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBwYXJlbnRfdWwuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgSFRNTExJRWxlbWVudCAmJiBjaGlsZC5jaGlsZHJlblswXSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IGNoaWxkO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoaWxkID09PSBwYXJlbnRfbGkgJiYgY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlLmNoaWxkcmVuWzBdIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFuY2VzdG9ycyhub2RlOiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50KG5vZGUpO1xuICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGZvdW5kQ2hlY2tlZCA9IGZhbHNlO1xuICAgIGxldCBmb3VuZFVuY2hlY2tlZCA9IGZhbHNlO1xuICAgIGxldCBmb3VuZEluZGV0ZXJtaW5hdGUgPSBmYWxzZVxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZ2V0Q2hpbGRyZW4ocGFyZW50KSkge1xuICAgICAgICBpZiAoY2hpbGQuY2hlY2tlZCkge1xuICAgICAgICAgICAgZm91bmRDaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvdW5kVW5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGQuaW5kZXRlcm1pbmF0ZSkge1xuICAgICAgICAgICAgZm91bmRJbmRldGVybWluYXRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoZm91bmRJbmRldGVybWluYXRlIHx8IGZvdW5kQ2hlY2tlZCAmJiBmb3VuZFVuY2hlY2tlZCkge1xuICAgICAgICBwYXJlbnQuaW5kZXRlcm1pbmF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGZvdW5kQ2hlY2tlZCkge1xuICAgICAgICBwYXJlbnQuY2hlY2tlZCA9IHRydWU7XG4gICAgICAgIHBhcmVudC5pbmRldGVybWluYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKGZvdW5kVW5jaGVja2VkKSB7XG4gICAgICAgIHBhcmVudC5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgIHBhcmVudC5pbmRldGVybWluYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIHVwZGF0ZUFuY2VzdG9ycyhwYXJlbnQpO1xufVxuXG5mdW5jdGlvbiBhcHBseUNoZWNrTGlzdGVuZXIobm9kZTogSFRNTElucHV0RWxlbWVudCkge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBlID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXBwbHlDaGVja2VkVG9EZXNjZW5kYW50cyh0YXJnZXQpO1xuICAgICAgICB1cGRhdGVBbmNlc3RvcnModGFyZ2V0KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlDaGVja0xpc3RlbmVycyhub2RlOiBIVE1MVUxpc3RFbGVtZW50KSB7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MTElFbGVtZW50KSB7XG4gICAgICAgICAgICBhcHBseUNoZWNrTGlzdGVuZXIoZWxlbWVudC5jaGlsZHJlblswXSBhcyBIVE1MSW5wdXRFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkge1xuICAgICAgICAgICAgYXBwbHlDaGVja0xpc3RlbmVycyhlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFrZUNoZWNrYm94VHJlZU5vZGUodHJlZU5vZGU6IFRyZWVOb2RlKTogSFRNTExJRWxlbWVudCB7XG4gICAgaWYgKHR5cGVvZiB0cmVlTm9kZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBsZXQgZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRyZWVOb2RlWzBdID09PSBcIi1cIikge1xuICAgICAgICAgICAgdHJlZU5vZGUgPSB0cmVlTm9kZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICBkaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRyZWVOb2RlWzBdID09PSBcIitcIikge1xuICAgICAgICAgICAgdHJlZU5vZGUgPSB0cmVlTm9kZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICBjaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5vZGUgPSBjcmVhdGVIVE1MKFtcbiAgICAgICAgICAgIFwibGlcIixcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBcImlucHV0XCIsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImNoZWNrYm94XCIsXG4gICAgICAgICAgICAgICAgICAgIGlkOiB0cmVlTm9kZS5yZXBsYWNlQWxsKFwiIFwiLCBcIl9cIiksXG4gICAgICAgICAgICAgICAgICAgIC4uLihjaGVja2VkICYmIHsgY2hlY2tlZDogXCJjaGVja2VkXCIgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIixcbiAgICAgICAgICAgICAgICB7IGZvcjogdHJlZU5vZGUucmVwbGFjZUFsbChcIiBcIiwgXCJfXCIpIH0sXG4gICAgICAgICAgICAgICAgdHJlZU5vZGVcbiAgICAgICAgICAgIF1cbiAgICAgICAgXSk7XG4gICAgICAgIGlmIChkaXNhYmxlZCkge1xuICAgICAgICAgICAgbm9kZS5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBsaXN0ID0gY3JlYXRlSFRNTChbXCJ1bFwiLCB7IGNsYXNzOiBcImNoZWNrYm94XCIgfV0pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRyZWVOb2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdHJlZU5vZGVbaV07XG4gICAgICAgICAgICBsaXN0LmFwcGVuZENoaWxkKG1ha2VDaGVja2JveFRyZWVOb2RlKG5vZGUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3JlYXRlSFRNTChbXCJsaVwiLCBsaXN0XSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZUNoZWNrYm94VHJlZSh0cmVlTm9kZTogVHJlZU5vZGUpIHtcbiAgICBsZXQgcm9vdCA9IG1ha2VDaGVja2JveFRyZWVOb2RlKHRyZWVOb2RlKS5jaGlsZHJlblswXTtcbiAgICBpZiAoIShyb290IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICBhcHBseUNoZWNrTGlzdGVuZXJzKHJvb3QpO1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiBnZXRMZWF2ZXMocm9vdCkpIHtcbiAgICAgICAgdXBkYXRlQW5jZXN0b3JzKGxlYWYpO1xuICAgIH1cbiAgICByZXR1cm4gcm9vdDtcbn1cblxuZnVuY3Rpb24gZ2V0TGVhdmVzKG5vZGU6IEhUTUxVTGlzdEVsZW1lbnQpIHtcbiAgICBsZXQgcmVzdWx0OiBIVE1MSW5wdXRFbGVtZW50W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICBjb25zdCBpbnB1dCA9IGVsZW1lbnQuY2hpbGRyZW5bMF07XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChnZXRDaGlsZHJlbihpbnB1dCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaW5wdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlucHV0IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChnZXRMZWF2ZXMoaW5wdXQpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGVhZlN0YXRlcyhub2RlOiBIVE1MVUxpc3RFbGVtZW50KSB7XG4gICAgbGV0IHN0YXRlczogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH0gPSB7fTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgZ2V0TGVhdmVzKG5vZGUpKSB7XG4gICAgICAgIHN0YXRlc1tsZWFmLmlkLnJlcGxhY2VBbGwoXCJfXCIsIFwiIFwiKV0gPSBsZWFmLmNoZWNrZWQ7XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRMZWFmU3RhdGVzKG5vZGU6IEhUTUxVTGlzdEVsZW1lbnQsIHN0YXRlczogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH0pIHtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgZ2V0TGVhdmVzKG5vZGUpKSB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc3RhdGVzW2xlYWYuaWQucmVwbGFjZUFsbChcIl9cIiwgXCIgXCIpXTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbGVhZi5jaGVja2VkID0gc3RhdGU7XG4gICAgICAgIHVwZGF0ZUFuY2VzdG9ycyhsZWFmKTtcbiAgICB9XG59IiwidHlwZSBUYWdfbmFtZSA9IGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcDtcbnR5cGUgQXR0cmlidXRlcyA9IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG50eXBlIEhUTUxfbm9kZTxUIGV4dGVuZHMgVGFnX25hbWU+ID0gW1QsIC4uLihIVE1MX25vZGU8VGFnX25hbWU+IHwgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBBdHRyaWJ1dGVzKVtdXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUhUTUw8VCBleHRlbmRzIFRhZ19uYW1lPihub2RlOiBIVE1MX25vZGU8VD4pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbVF0ge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVbMF0pO1xuICAgIGZ1bmN0aW9uIGhhbmRsZShwYXJhbWV0ZXI6IEF0dHJpYnV0ZXMgfCBIVE1MX25vZGU8VGFnX25hbWU+IHwgSFRNTEVsZW1lbnQgfCBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbWV0ZXIgPT09IFwic3RyaW5nXCIgfHwgcGFyYW1ldGVyIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKHBhcmFtZXRlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwYXJhbWV0ZXIpKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZChjcmVhdGVIVE1MKHBhcmFtZXRlcikpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcGFyYW1ldGVyKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCBwYXJhbWV0ZXJba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBub2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGhhbmRsZShub2RlW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG59XG4iLCJpbXBvcnQgeyBjcmVhdGVIVE1MIH0gZnJvbSAnLi9odG1sJztcblxuZXhwb3J0IGNvbnN0IGNoYXJhY3RlcnMgPSBbXCJOaWtpXCIsIFwiTHVuTHVuXCIsIFwiTHVjeVwiLCBcIlNodWFcIiwgXCJEaGFucGlyXCIsIFwiUG9jaGlcIiwgXCJBbFwiXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIENoYXJhY3RlciA9IHR5cGVvZiBjaGFyYWN0ZXJzW251bWJlcl07XG5leHBvcnQgZnVuY3Rpb24gaXNDaGFyYWN0ZXIoY2hhcmFjdGVyOiBzdHJpbmcpOiBjaGFyYWN0ZXIgaXMgQ2hhcmFjdGVyIHtcbiAgICByZXR1cm4gKGNoYXJhY3RlcnMgYXMgdW5rbm93biBhcyBzdHJpbmdbXSkuaW5jbHVkZXMoY2hhcmFjdGVyKTtcbn1cblxuZXhwb3J0IHR5cGUgUGFydCA9IFwiSGF0XCIgfCBcIkhhaXJcIiB8IFwiRHllXCIgfCBcIlVwcGVyXCIgfCBcIkxvd2VyXCIgfCBcIlNob2VzXCIgfCBcIlNvY2tzXCIgfCBcIkhhbmRcIiB8IFwiQmFja3BhY2tcIiB8IFwiRmFjZVwiIHwgXCJSYWNrZXRcIiB8IFwiT3RoZXJcIjtcblxuZXhwb3J0IGNsYXNzIEl0ZW1Tb3VyY2Uge1xuICAgIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHNob3BfaWQ6IG51bWJlcikgeyB9XG5cbiAgICBnZXQgcmVxdWlyZXNHdWFyZGlhbigpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBTaG9wSXRlbVNvdXJjZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMgaW5zdGFuY2VvZiBHYWNoYUl0ZW1Tb3VyY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtLnNvdXJjZXMudmFsdWVzKCldLmV2ZXJ5KHNvdXJjZSA9PiBzb3VyY2UucmVxdWlyZXNHdWFyZGlhbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIEd1YXJkaWFuSXRlbVNvdXJjZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgaXRlbSgpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHNob3BfaXRlbXMuZ2V0KHRoaXMuc2hvcF9pZCk7XG4gICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIGZpbmRpbmcgaXRlbSBvZiBpdGVtU291cmNlICR7dGhpcy5zaG9wX2lkfWApO1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNob3BJdGVtU291cmNlIGV4dGVuZHMgSXRlbVNvdXJjZSB7XG4gICAgY29uc3RydWN0b3Ioc2hvcF9pZDogbnVtYmVyLCByZWFkb25seSBwcmljZTogbnVtYmVyLCByZWFkb25seSBhcDogYm9vbGVhbiwgcmVhZG9ubHkgaXRlbXM6IEl0ZW1bXSkge1xuICAgICAgICBzdXBlcihzaG9wX2lkKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHYWNoYUl0ZW1Tb3VyY2UgZXh0ZW5kcyBJdGVtU291cmNlIHtcbiAgICBjb25zdHJ1Y3RvcihzaG9wX2lkOiBudW1iZXIpIHtcbiAgICAgICAgc3VwZXIoc2hvcF9pZCk7XG4gICAgfVxuXG4gICAgZ2FjaGFUcmllcyhpdGVtOiBJdGVtLCBjaGFyYWN0ZXI/OiBDaGFyYWN0ZXIpIHtcbiAgICAgICAgY29uc3QgZ2FjaGEgPSBnYWNoYXMuZ2V0KHRoaXMuc2hvcF9pZCk7XG4gICAgICAgIGlmICghZ2FjaGEpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2FjaGEuYXZlcmFnZV90cmllcyhpdGVtLCBjaGFyYWN0ZXIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEd1YXJkaWFuSXRlbVNvdXJjZSBleHRlbmRzIEl0ZW1Tb3VyY2Uge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICByZWFkb25seSBndWFyZGlhbl9tYXA6IHN0cmluZyxcbiAgICAgICAgcmVhZG9ubHkgaXRlbXM6IEl0ZW1bXSxcbiAgICAgICAgcmVhZG9ubHkgeHA6IG51bWJlcixcbiAgICAgICAgcmVhZG9ubHkgbmVlZF9ib3NzOiBib29sZWFuLFxuICAgICAgICByZWFkb25seSBib3NzX3RpbWU6IG51bWJlcikge1xuICAgICAgICBzdXBlcihHdWFyZGlhbkl0ZW1Tb3VyY2UuZ3VhcmRpYW5fbWFwX2lkKGd1YXJkaWFuX21hcCkpO1xuICAgIH1cblxuICAgIHN0YXRpYyBndWFyZGlhbl9tYXBfaWQobWFwOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5ndWFyZGlhbl9tYXBzLmluZGV4T2YobWFwKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgaW5kZXggPSB0aGlzLmd1YXJkaWFuX21hcHMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5ndWFyZGlhbl9tYXBzLnB1c2gobWFwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLWluZGV4O1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIGd1YXJkaWFuX21hcHMgPSBbXCJcIl07XG59XG5cbmV4cG9ydCBjbGFzcyBJdGVtIHtcbiAgICBpZCA9IDA7XG4gICAgbmFtZV9rciA9IFwiXCI7XG4gICAgbmFtZV9lbiA9IFwiXCI7XG4gICAgdXNlVHlwZSA9IFwiXCI7XG4gICAgbWF4VXNlID0gMDtcbiAgICBoaWRkZW4gPSBmYWxzZTtcbiAgICByZXNpc3QgPSBcIlwiO1xuICAgIGNoYXJhY3Rlcj86IENoYXJhY3RlcjtcbiAgICBwYXJ0OiBQYXJ0ID0gXCJPdGhlclwiO1xuICAgIGxldmVsID0gMDtcbiAgICBzdHIgPSAwO1xuICAgIHN0YSA9IDA7XG4gICAgZGV4ID0gMDtcbiAgICB3aWwgPSAwO1xuICAgIGhwID0gMDtcbiAgICBxdWlja3Nsb3RzID0gMDtcbiAgICBidWZmc2xvdHMgPSAwO1xuICAgIHNtYXNoID0gMDtcbiAgICBtb3ZlbWVudCA9IDA7XG4gICAgY2hhcmdlID0gMDtcbiAgICBsb2IgPSAwO1xuICAgIHNlcnZlID0gMDtcbiAgICBtYXhfc3RyID0gMDtcbiAgICBtYXhfc3RhID0gMDtcbiAgICBtYXhfZGV4ID0gMDtcbiAgICBtYXhfd2lsID0gMDtcbiAgICBlbGVtZW50X2VuY2hhbnRhYmxlID0gZmFsc2U7XG4gICAgcGFyY2VsX2VuYWJsZWQgPSBmYWxzZTtcbiAgICBwYXJjZWxfZnJvbV9zaG9wID0gZmFsc2U7XG4gICAgc3BpbiA9IDA7XG4gICAgYXRzcyA9IDA7XG4gICAgZGZzcyA9IDA7XG4gICAgc29ja2V0ID0gMDtcbiAgICBnYXVnZSA9IDA7XG4gICAgZ2F1Z2VfYmF0dGxlID0gMDtcbiAgICBzb3VyY2VzOiBJdGVtU291cmNlW10gPSBbXTtcbiAgICBzdGF0RnJvbVN0cmluZyhuYW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJNb3YgU3BlZWRcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tb3ZlbWVudDtcbiAgICAgICAgICAgIGNhc2UgXCJDaGFyZ2VcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGFyZ2U7XG4gICAgICAgICAgICBjYXNlIFwiTG9iXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9iO1xuICAgICAgICAgICAgY2FzZSBcIlNtYXNoXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc21hc2g7XG4gICAgICAgICAgICBjYXNlIFwiU3RyXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RyO1xuICAgICAgICAgICAgY2FzZSBcIkRleFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRleDtcbiAgICAgICAgICAgIGNhc2UgXCJTdGFcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGE7XG4gICAgICAgICAgICBjYXNlIFwiV2lsbFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLndpbDtcbiAgICAgICAgICAgIGNhc2UgXCJNYXggU3RyXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWF4X3N0cjtcbiAgICAgICAgICAgIGNhc2UgXCJNYXggRGV4XCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWF4X2RleDtcbiAgICAgICAgICAgIGNhc2UgXCJNYXggU3RhXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWF4X3N0YTtcbiAgICAgICAgICAgIGNhc2UgXCJNYXggV2lsbFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1heF93aWw7XG4gICAgICAgICAgICBjYXNlIFwiU2VydmVcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXJ2ZTtcbiAgICAgICAgICAgIGNhc2UgXCJRdWlja3Nsb3RzXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVpY2tzbG90cztcbiAgICAgICAgICAgIGNhc2UgXCJCdWZmc2xvdHNcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5idWZmc2xvdHM7XG4gICAgICAgICAgICBjYXNlIFwiSFBcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ocDtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBHYWNoYSB7XG4gICAgY29uc3RydWN0b3IocmVhZG9ubHkgc2hvcF9pbmRleDogbnVtYmVyLCByZWFkb25seSBnYWNoYV9pbmRleDogbnVtYmVyLCByZWFkb25seSBuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGFyYWN0ZXIgb2YgY2hhcmFjdGVycykge1xuICAgICAgICAgICAgdGhpcy5zaG9wX2l0ZW1zLnNldChjaGFyYWN0ZXIsIG5ldyBNYXA8SXRlbSwgWy8qcHJvYmFiaWxpdHk6Ki8gbnVtYmVyLCAvKnF1YW50aXR5X21pbjoqLyBudW1iZXIsIC8qcXVhbnRpdHlfbWF4OiovIG51bWJlcl0+KCkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhZGQoaXRlbTogSXRlbSwgcHJvYmFiaWxpdHk6IG51bWJlciwgY2hhcmFjdGVyOiBDaGFyYWN0ZXIsIHF1YW50aXR5X21pbjogbnVtYmVyLCBxdWFudGl0eV9tYXg6IG51bWJlcikge1xuICAgICAgICBpZiAoaXRlbS5jaGFyYWN0ZXIgJiYgaXRlbS5jaGFyYWN0ZXIgIT09IGNoYXJhY3Rlcikge1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oYEl0ZW0gJHtpdGVtLmlkfSBmcm9tIGdhY2hhIFwiJHt0aGlzLm5hbWV9XCIgJHt0aGlzLmdhY2hhX2luZGV4fSBoYXMgd3JvbmcgY2hhcmFjdGVyYCk7XG4gICAgICAgICAgICBjaGFyYWN0ZXIgPSBpdGVtLmNoYXJhY3RlcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNob3BfaXRlbXMuZ2V0KGNoYXJhY3RlcikhLnNldChpdGVtLCBbcHJvYmFiaWxpdHksIHF1YW50aXR5X21pbiwgcXVhbnRpdHlfbWF4XSk7XG4gICAgICAgIHRoaXMuY2hhcmFjdGVyX3Byb2JhYmlsaXR5LnNldChjaGFyYWN0ZXIsIHByb2JhYmlsaXR5ICsgKHRoaXMuY2hhcmFjdGVyX3Byb2JhYmlsaXR5LmdldChjaGFyYWN0ZXIpIHx8IDApKTtcbiAgICB9XG5cbiAgICBhdmVyYWdlX3RyaWVzKGl0ZW06IEl0ZW0sIGNoYXJhY3RlcjogQ2hhcmFjdGVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IGNoYXJzOiByZWFkb25seSBDaGFyYWN0ZXJbXSA9IGNoYXJhY3RlciA/IChbY2hhcmFjdGVyXSkgOiBjaGFyYWN0ZXJzO1xuICAgICAgICBjb25zdCBwcm9iYWJpbGl0eSA9IGNoYXJzLnJlZHVjZSgocCwgY2hhcmFjdGVyKSA9PiBwICsgKHRoaXMuc2hvcF9pdGVtcy5nZXQoY2hhcmFjdGVyKSEuZ2V0KGl0ZW0pPy5bMF0gfHwgMCksIDApO1xuICAgICAgICBpZiAocHJvYmFiaWxpdHkgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRvdGFsX3Byb2JhYmlsaXR5ID0gY2hhcnMucmVkdWNlKChwLCBjaGFyYWN0ZXIpID0+IHAgKyB0aGlzLmNoYXJhY3Rlcl9wcm9iYWJpbGl0eS5nZXQoY2hhcmFjdGVyKSEsIDApO1xuICAgICAgICByZXR1cm4gdG90YWxfcHJvYmFiaWxpdHkgLyBwcm9iYWJpbGl0eTtcbiAgICB9XG5cbiAgICBnZXQgdG90YWxfcHJvYmFiaWxpdHkoKSB7XG4gICAgICAgIHJldHVybiBjaGFyYWN0ZXJzLnJlZHVjZSgocCwgY2hhcmFjdGVyKSA9PiBwICsgdGhpcy5jaGFyYWN0ZXJfcHJvYmFiaWxpdHkuZ2V0KGNoYXJhY3RlcikhLCAwKTtcbiAgICB9XG5cbiAgICBjaGFyYWN0ZXJfcHJvYmFiaWxpdHkgPSBuZXcgTWFwPENoYXJhY3RlciwgbnVtYmVyPigpO1xuICAgIHNob3BfaXRlbXMgPSBuZXcgTWFwPENoYXJhY3RlciwgTWFwPEl0ZW0sIFsvKnByb2JhYmlsaXR5OiovIG51bWJlciwgLypxdWFudGl0eV9taW46Ki8gbnVtYmVyLCAvKnF1YW50aXR5X21heDoqLyBudW1iZXJdPj4oKTtcbn1cblxuZXhwb3J0IGxldCBpdGVtcyA9IG5ldyBNYXA8bnVtYmVyLCBJdGVtPigpO1xuZXhwb3J0IGxldCBzaG9wX2l0ZW1zID0gbmV3IE1hcDxudW1iZXIsIEl0ZW0+KCk7XG5sZXQgZ2FjaGFzID0gbmV3IE1hcDxudW1iZXIsIEdhY2hhPigpO1xubGV0IGRpYWxvZzogSFRNTERpYWxvZ0VsZW1lbnQgfCB1bmRlZmluZWQ7XG5cbmZ1bmN0aW9uIHByZXR0eU51bWJlcihuOiBudW1iZXIsIGRpZ2l0czogbnVtYmVyKSB7XG4gICAgbGV0IHMgPSBuLnRvRml4ZWQoZGlnaXRzKTtcbiAgICB3aGlsZSAocy5lbmRzV2l0aChcIjBcIikpIHtcbiAgICAgICAgcyA9IHMuc2xpY2UoMCwgLTEpO1xuICAgIH1cbiAgICBpZiAocy5lbmRzV2l0aChcIi5cIikpIHtcbiAgICAgICAgcyA9IHMuc2xpY2UoMCwgLTEpO1xuICAgIH1cbiAgICByZXR1cm4gcztcbn1cblxuZnVuY3Rpb24gcGFyc2VJdGVtRGF0YShkYXRhOiBzdHJpbmcpIHtcbiAgICBpZiAoZGF0YS5sZW5ndGggPCAxMDAwKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgSXRlbXMgZmlsZSBpcyBvbmx5ICR7ZGF0YS5sZW5ndGh9IGJ5dGVzIGxvbmdgKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbLCByZXN1bHRdIG9mIGRhdGEubWF0Y2hBbGwoL1xcPEl0ZW0gKC4qKVxcL1xcPi9nKSkge1xuICAgICAgICBjb25zdCBpdGVtOiBJdGVtID0gbmV3IEl0ZW07XG4gICAgICAgIGZvciAoY29uc3QgWywgYXR0cmlidXRlLCB2YWx1ZV0gb2YgcmVzdWx0Lm1hdGNoQWxsKC9cXHM/KFtePV0qKT1cIihbXlwiXSopXCIvZykpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoYXR0cmlidXRlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkluZGV4XCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uaWQgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJfTmFtZV9cIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lX2tyID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJOYW1lX05cIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5uYW1lX2VuID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJVc2VUeXBlXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udXNlVHlwZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTWF4VXNlXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubWF4VXNlID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiSGlkZVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmhpZGRlbiA9ICEhcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiUmVzaXN0XCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ucmVzaXN0ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJDaGFyXCI6XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJOSUtJXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIk5pa2lcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMVU5MVU5cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJhY3RlciA9IFwiTHVuTHVuXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTFVDWVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJMdWN5XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiU0hVQVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJTaHVhXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiREhBTlBJUlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJEaGFucGlyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUE9DSElcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJhY3RlciA9IFwiUG9jaGlcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBTFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJBbFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZvdW5kIHVua25vd24gY2hhcmFjdGVyIFwiJHt2YWx1ZX1cImApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJQYXJ0XCI6XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkJBR1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiQmFja3BhY2tcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJHTEFTU0VTXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJGYWNlXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSEFORFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiSGFuZFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlNPQ0tTXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJTb2Nrc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkZPT1RcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIlNob2VzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQ0FQXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJIYXRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJQQU5UU1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiTG93ZXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJSQUNLRVRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIlJhY2tldFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkJPRFlcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIlVwcGVyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSEFJUlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiSGFpclwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkRZRVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiRHllXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRm91bmQgdW5rbm93biBwYXJ0ICR7dmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkxldmVsXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubGV2ZWwgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJTVFJcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zdHIgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJTVEFcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zdGEgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJERVhcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kZXggPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJXSUxcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS53aWwgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJBZGRIUFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmhwID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQWRkUXVpY2tcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5xdWlja3Nsb3RzID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQWRkQnVmZlwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmJ1ZmZzbG90cyA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNtYXNoU3BlZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zbWFzaCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk1vdmVTcGVlZFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm1vdmVtZW50ID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQ2hhcmdlc2hvdFNwZWVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmdlID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTG9iU3BlZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5sb2IgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJTZXJ2ZVNwZWVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc2VydmUgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNQVhfU1RSXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubWF4X3N0ciA9IE1hdGgubWF4KHBhcnNlSW50KHZhbHVlKSwgaXRlbS5zdHIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTUFYX1NUQVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm1heF9zdGEgPSBNYXRoLm1heChwYXJzZUludCh2YWx1ZSksIGl0ZW0uc3RhKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk1BWF9ERVhcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tYXhfZGV4ID0gTWF0aC5tYXgocGFyc2VJbnQodmFsdWUpLCBpdGVtLmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNQVhfV0lMXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubWF4X3dpbCA9IE1hdGgubWF4KHBhcnNlSW50KHZhbHVlKSwgaXRlbS53aWwpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiRW5jaGFudEVsZW1lbnRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5lbGVtZW50X2VuY2hhbnRhYmxlID0gISFwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJFbmFibGVQYXJjZWxcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJjZWxfZW5hYmxlZCA9ICEhcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQmFsbFNwaW5cIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zcGluID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVRTU1wiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmF0c3MgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJERlNTXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZGZzcyA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNvY2tldFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNvY2tldCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkdhdWdlXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZ2F1Z2UgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJHYXVnZUJhdHRsZVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmdhdWdlX2JhdHRsZSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBGb3VuZCB1bmtub3duIGl0ZW0gYXR0cmlidXRlIFwiJHthdHRyaWJ1dGV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpdGVtcy5zZXQoaXRlbS5pZCwgaXRlbSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZVNob3BEYXRhKGRhdGE6IHN0cmluZykge1xuICAgIGNvbnN0IGRlYnVnU2hvcFBhcnNpbmcgPSBmYWxzZTtcbiAgICBpZiAoZGF0YS5sZW5ndGggPCAxMDAwKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgU2hvcCBmaWxlIGlzIG9ubHkgJHtkYXRhLmxlbmd0aH0gYnl0ZXMgbG9uZ2ApO1xuICAgIH1cbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGxldCBjdXJyZW50SW5kZXggPSAwO1xuICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgZGF0YS5tYXRjaEFsbCgvPFByb2R1Y3QgRElTUExBWT1cIlxcZCtcIiBISVRfRElTUExBWT1cIlxcZCtcIiBJbmRleD1cIig/PGluZGV4PlxcZCspXCIgRW5hYmxlPVwiKD88ZW5hYmxlZD4wfDEpXCIgTmV3PVwiXFxkK1wiIEhpdD1cIlxcZCtcIiBGcmVlPVwiXFxkK1wiIFNhbGU9XCJcXGQrXCIgRXZlbnQ9XCJcXGQrXCIgQ291cGxlPVwiXFxkK1wiIE5vYnV5PVwiXFxkK1wiIFJhbmQ9XCJbXlwiXStcIiBVc2VUeXBlPVwiW15cIl0rXCIgVXNlMD1cIlxcZCtcIiBVc2UxPVwiXFxkK1wiIFVzZTI9XCJcXGQrXCIgUHJpY2VUeXBlPVwiKD88cHJpY2VfdHlwZT4oPzpNSU5UKXwoPzpHT0xEKSlcIiBPbGRQcmljZTA9XCItP1xcZCtcIiBPbGRQcmljZTE9XCItP1xcZCtcIiBPbGRQcmljZTI9XCItP1xcZCtcIiBQcmljZTA9XCIoPzxwcmljZT4tP1xcZCspXCIgUHJpY2UxPVwiLT9cXGQrXCIgUHJpY2UyPVwiLT9cXGQrXCIgQ291cGxlUHJpY2U9XCItP1xcZCtcIiBDYXRlZ29yeT1cIig/PGNhdGVnb3J5PlteXCJdKilcIiBOYW1lPVwiKD88bmFtZT5bXlwiXSopXCIgR29sZEJhY2s9XCItP1xcZCtcIiBFbmFibGVQYXJjZWw9XCIoPzxwYXJjZWxfZnJvbV9zaG9wPjB8MSlcIiBDaGFyPVwiLT9cXGQrXCIgSXRlbTA9XCIoPzxpdGVtMD4tP1xcZCspXCIgSXRlbTE9XCIoPzxpdGVtMT4tP1xcZCspXCIgSXRlbTI9XCIoPzxpdGVtMj4tP1xcZCspXCIgSXRlbTM9XCIoPzxpdGVtMz4tP1xcZCspXCIgSXRlbTQ9XCIoPzxpdGVtND4tP1xcZCspXCIgSXRlbTU9XCIoPzxpdGVtNT4tP1xcZCspXCIgSXRlbTY9XCIoPzxpdGVtNj4tP1xcZCspXCIgSXRlbTc9XCIoPzxpdGVtNz4tP1xcZCspXCIgSXRlbTg9XCIoPzxpdGVtOD4tP1xcZCspXCIgSXRlbTk9XCIoPzxpdGVtOT4tP1xcZCspXCIgPyg/Okljb249XCJbXlwiXSpcIiA/KT8oPzpOYW1lX2tyPVwiW15cIl0qXCIgPyk/KD86TmFtZV9lbj1cIig/PG5hbWVfZW4+W15cIl0qKVwiID8pPyg/Ok5hbWVfdGg9XCJbXlwiXSpcIiA/KT9cXC8+L2cpKSB7XG4gICAgICAgIGlmICghbWF0Y2guZ3JvdXBzKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmRleCA9IHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pbmRleCk7XG4gICAgICAgIGlmIChjdXJyZW50SW5kZXggKyAxICE9PSBpbmRleCkge1xuICAgICAgICAgICAgZGVidWdTaG9wUGFyc2luZyAmJiBjb25zb2xlLndhcm4oYEZhaWxlZCBwYXJzaW5nIHNob3AgaXRlbSBpbmRleCAke2N1cnJlbnRJbmRleCArIDIgPT09IGluZGV4ID8gY3VycmVudEluZGV4ICsgMSA6IGAke2N1cnJlbnRJbmRleCArIDF9IHRvICR7aW5kZXggLSAxfWB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudEluZGV4ID0gaW5kZXg7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBtYXRjaC5ncm91cHMubmFtZTtcbiAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBtYXRjaC5ncm91cHMuY2F0ZWdvcnk7XG4gICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJMT1RURVJZXCIpIHtcbiAgICAgICAgICAgIGdhY2hhcy5zZXQoaW5kZXgsIG5ldyBHYWNoYShpbmRleCwgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0wKSwgbmFtZSkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVuYWJsZWQgPSAhIXBhcnNlSW50KG1hdGNoLmdyb3Vwcy5lbmFibGVkKTtcbiAgICAgICAgY29uc3QgcHJpY2VfdHlwZTogXCJhcFwiIHwgXCJnb2xkXCIgfCBcIm5vbmVcIiA9IG1hdGNoLmdyb3Vwcy5wcmljZV90eXBlID09PSBcIk1JTlRcIiA/IFwiYXBcIiA6IG1hdGNoLmdyb3Vwcy5wcmljZV90eXBlID09PSBcIkdPTERcIiA/IFwiZ29sZFwiIDogXCJub25lXCI7XG4gICAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VJbnQobWF0Y2guZ3JvdXBzLnByaWNlKTtcbiAgICAgICAgY29uc3QgcGFyY2VsX2Zyb21fc2hvcCA9ICEhcGFyc2VJbnQobWF0Y2guZ3JvdXBzLnBhcmNlbF9mcm9tX3Nob3ApO1xuICAgICAgICBjb25zdCBpdGVtSURzID0gW1xuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0wKSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtMSksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTIpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0zKSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtNCksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTUpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW02KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtNyksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTgpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW05KSxcbiAgICAgICAgXTtcblxuICAgICAgICBjb25zdCBpbm5lcl9pdGVtcyA9IGl0ZW1JRHMuZmlsdGVyKGlkID0+ICEhaWQgJiYgaXRlbXMuZ2V0KGlkKSkubWFwKGlkID0+IGl0ZW1zLmdldChpZCkhKTtcblxuICAgICAgICBpZiAoY2F0ZWdvcnkgPT09IFwiUEFSVFNcIikge1xuICAgICAgICAgICAgaWYgKGlubmVyX2l0ZW1zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHNob3BfaXRlbXMuc2V0KGluZGV4LCBpbm5lcl9pdGVtc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gbmV3IEl0ZW0oKTtcbiAgICAgICAgICAgICAgICBpdGVtLm5hbWVfZW4gPSBtYXRjaC5ncm91cHMubmFtZV9lbiB8fCBtYXRjaC5ncm91cHMubmFtZTtcbiAgICAgICAgICAgICAgICBzaG9wX2l0ZW1zLnNldChpbmRleCwgaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1Tb3VyY2UgPSBuZXcgU2hvcEl0ZW1Tb3VyY2UoaW5kZXgsIHByaWNlLCBwcmljZV90eXBlID09PSBcImFwXCIsIGlubmVyX2l0ZW1zKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaW5uZXJfaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zb3VyY2VzLnB1c2goaXRlbVNvdXJjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNhdGVnb3J5ID09PSBcIkxPVFRFUllcIikge1xuICAgICAgICAgICAgY29uc3QgZ2FjaGFJdGVtID0gbmV3IEl0ZW0oKTtcbiAgICAgICAgICAgIGdhY2hhSXRlbS5uYW1lX2VuID0gbWF0Y2guZ3JvdXBzLm5hbWVfZW4gfHwgbWF0Y2guZ3JvdXBzLm5hbWU7XG4gICAgICAgICAgICBzaG9wX2l0ZW1zLnNldChpbmRleCwgZ2FjaGFJdGVtKTtcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgZ2FjaGFJdGVtLnNvdXJjZXMucHVzaChuZXcgU2hvcEl0ZW1Tb3VyY2UoaW5kZXgsIHByaWNlLCBwcmljZV90eXBlID09PSBcImFwXCIsIGlubmVyX2l0ZW1zKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBvdGhlckl0ZW0gPSBuZXcgSXRlbSgpO1xuICAgICAgICAgICAgb3RoZXJJdGVtLm5hbWVfZW4gPSBtYXRjaC5ncm91cHMubmFtZV9lbiB8fCBtYXRjaC5ncm91cHMubmFtZTtcbiAgICAgICAgICAgIHNob3BfaXRlbXMuc2V0KGluZGV4LCBvdGhlckl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50Kys7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2NvdW50fSBzaG9wIGl0ZW1zYCk7XG59XG5cbmNsYXNzIEFwaUl0ZW0ge1xuICAgIHByb2R1Y3RJbmRleCA9IDA7XG4gICAgZGlzcGxheSA9IDA7XG4gICAgaGl0RGlzcGxheSA9IGZhbHNlO1xuICAgIGVuYWJsZWQgPSBmYWxzZTtcbiAgICB1c2VUeXBlID0gXCJcIjtcbiAgICB1c2UwID0gMDtcbiAgICB1c2UxID0gMDtcbiAgICB1c2UyID0gMDtcbiAgICBwcmljZVR5cGUgPSBcIkdPTERcIjtcbiAgICBvbGRQcmljZTAgPSAwO1xuICAgIG9sZFByaWNlMSA9IDA7XG4gICAgb2xkUHJpY2UyID0gMDtcbiAgICBwcmljZTAgPSAwO1xuICAgIHByaWNlMSA9IDA7XG4gICAgcHJpY2UyID0gMDtcbiAgICBjb3VwbGVQcmljZSA9IDA7XG4gICAgY2F0ZWdvcnkgPSBcIlwiO1xuICAgIG5hbWUgPSBcIlwiO1xuICAgIGdvbGRCYWNrID0gMDtcbiAgICBlbmFibGVQYXJjZWwgPSBmYWxzZTtcbiAgICBmb3JQbGF5ZXIgPSAwO1xuICAgIGl0ZW0wID0gMDtcbiAgICBpdGVtMSA9IDA7XG4gICAgaXRlbTIgPSAwO1xuICAgIGl0ZW0zID0gMDtcbiAgICBpdGVtNCA9IDA7XG4gICAgaXRlbTUgPSAwO1xuICAgIGl0ZW02ID0gMDtcbiAgICBpdGVtNyA9IDA7XG4gICAgaXRlbTggPSAwO1xuICAgIGl0ZW05ID0gMDtcbn1cblxuZnVuY3Rpb24gaXNBcGlJdGVtKG9iajogYW55KTogb2JqIGlzIEFwaUl0ZW0ge1xuICAgIGlmIChvYmogPT09IG51bGwgfHwgdHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBbXG4gICAgICAgIHR5cGVvZiBvYmoucHJvZHVjdEluZGV4ID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLmRpc3BsYXkgPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmouaGl0RGlzcGxheSA9PT0gXCJib29sZWFuXCIsXG4gICAgICAgIHR5cGVvZiBvYmouZW5hYmxlZCA9PT0gXCJib29sZWFuXCIsXG4gICAgICAgIHR5cGVvZiBvYmoudXNlVHlwZSA9PT0gXCJzdHJpbmdcIixcbiAgICAgICAgdHlwZW9mIG9iai51c2UwID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLnVzZTEgPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmoudXNlMiA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5wcmljZVR5cGUgPT09IFwic3RyaW5nXCIsXG4gICAgICAgIHR5cGVvZiBvYmoub2xkUHJpY2UwID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLm9sZFByaWNlMSA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5vbGRQcmljZTIgPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmoucHJpY2UwID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLnByaWNlMSA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5wcmljZTIgPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmouY291cGxlUHJpY2UgPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmouY2F0ZWdvcnkgPT09IFwic3RyaW5nXCIsXG4gICAgICAgIHR5cGVvZiBvYmoubmFtZSA9PT0gXCJzdHJpbmdcIixcbiAgICAgICAgdHlwZW9mIG9iai5nb2xkQmFjayA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5lbmFibGVQYXJjZWwgPT09IFwiYm9vbGVhblwiLFxuICAgICAgICB0eXBlb2Ygb2JqLmZvclBsYXllciA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtMCA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtMSA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtMiA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtMyA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtNCA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtNSA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtNiA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtNyA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtOCA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5pdGVtOSA9PT0gXCJudW1iZXJcIlxuICAgIF0uZXZlcnkoYiA9PiBiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VBcGlTaG9wRGF0YShkYXRhOiBzdHJpbmcpIHtcbiAgICBmb3IgKGNvbnN0IGFwaUl0ZW0gb2YgSlNPTi5wYXJzZShkYXRhKSkge1xuICAgICAgICBpZiAoIWlzQXBpSXRlbShhcGlJdGVtKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSW5jb3JyZWN0IGZvcm1hdCBvZiBpdGVtOiAke2RhdGF9YCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlubmVyX2l0ZW1zID0gW1xuICAgICAgICAgICAgYXBpSXRlbS5pdGVtMCxcbiAgICAgICAgICAgIGFwaUl0ZW0uaXRlbTEsXG4gICAgICAgICAgICBhcGlJdGVtLml0ZW0yLFxuICAgICAgICAgICAgYXBpSXRlbS5pdGVtMyxcbiAgICAgICAgICAgIGFwaUl0ZW0uaXRlbTQsXG4gICAgICAgICAgICBhcGlJdGVtLml0ZW01LFxuICAgICAgICAgICAgYXBpSXRlbS5pdGVtNixcbiAgICAgICAgICAgIGFwaUl0ZW0uaXRlbTcsXG4gICAgICAgICAgICBhcGlJdGVtLml0ZW04LFxuICAgICAgICAgICAgYXBpSXRlbS5pdGVtOSxcbiAgICAgICAgXS5maWx0ZXIoaWQgPT4gISFpZCAmJiBpdGVtcy5nZXQoaWQpKS5tYXAoaWQgPT4gaXRlbXMuZ2V0KGlkKSEpO1xuXG4gICAgICAgIGlmIChhcGlJdGVtLmNhdGVnb3J5ID09PSBcIlBBUlRTXCIpIHtcbiAgICAgICAgICAgIGlmIChpbm5lcl9pdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBzaG9wX2l0ZW1zLnNldChhcGlJdGVtLnByb2R1Y3RJbmRleCwgaW5uZXJfaXRlbXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IG5ldyBJdGVtKCk7XG4gICAgICAgICAgICAgICAgaXRlbS5uYW1lX2VuID0gYXBpSXRlbS5uYW1lO1xuICAgICAgICAgICAgICAgIHNob3BfaXRlbXMuc2V0KGFwaUl0ZW0ucHJvZHVjdEluZGV4LCBpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhcGlJdGVtLmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtU291cmNlID0gbmV3IFNob3BJdGVtU291cmNlKGFwaUl0ZW0ucHJvZHVjdEluZGV4LCBhcGlJdGVtLnByaWNlMCwgYXBpSXRlbS5wcmljZVR5cGUgPT09IFwiTUlOVFwiLCBpbm5lcl9pdGVtcyk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGlubmVyX2l0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc291cmNlcy5wdXNoKGl0ZW1Tb3VyY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhcGlJdGVtLmNhdGVnb3J5ID09PSBcIkxPVFRFUllcIikge1xuICAgICAgICAgICAgZ2FjaGFzLnNldChhcGlJdGVtLnByb2R1Y3RJbmRleCwgbmV3IEdhY2hhKGFwaUl0ZW0ucHJvZHVjdEluZGV4LCBhcGlJdGVtLml0ZW0wLCBhcGlJdGVtLm5hbWUpKTtcbiAgICAgICAgICAgIGNvbnN0IGdhY2hhSXRlbSA9IG5ldyBJdGVtKCk7XG4gICAgICAgICAgICBnYWNoYUl0ZW0ubmFtZV9lbiA9IGFwaUl0ZW0ubmFtZTtcbiAgICAgICAgICAgIHNob3BfaXRlbXMuc2V0KGFwaUl0ZW0ucHJvZHVjdEluZGV4LCBnYWNoYUl0ZW0pO1xuICAgICAgICAgICAgaWYgKGFwaUl0ZW0uZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIGdhY2hhSXRlbS5zb3VyY2VzLnB1c2gobmV3IFNob3BJdGVtU291cmNlKGFwaUl0ZW0ucHJvZHVjdEluZGV4LCBhcGlJdGVtLnByaWNlMCwgYXBpSXRlbS5wcmljZVR5cGUgPT09IFwiTUlOVFwiLCBpbm5lcl9pdGVtcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgb3RoZXJJdGVtID0gbmV3IEl0ZW0oKTtcbiAgICAgICAgICAgIG90aGVySXRlbS5uYW1lX2VuID0gYXBpSXRlbS5uYW1lO1xuICAgICAgICAgICAgc2hvcF9pdGVtcy5zZXQoYXBpSXRlbS5wcm9kdWN0SW5kZXgsIG90aGVySXRlbSk7XG4gICAgICAgIH1cblxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VHYWNoYURhdGEoZGF0YTogc3RyaW5nLCBnYWNoYTogR2FjaGEpIHtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgZGF0YS5zcGxpdChcIlxcblwiKSkge1xuICAgICAgICBpZiAoIWxpbmUuaW5jbHVkZXMoXCI8TG90dGVyeUl0ZW1fXCIpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXRjaCA9IGxpbmUubWF0Y2goL1xccyo8TG90dGVyeUl0ZW1fKD88Y2hhcmFjdGVyPlteIF0qKSBJbmRleD1cIlxcZCtcIiBfTmFtZV89XCJbXlwiXSpcIiBTaG9wSW5kZXg9XCIoPzxzaG9wX2lkPlxcZCspXCIgUXVhbnRpdHlNaW49XCIoPzxxdWFudGl0eV9taW4+XFxkKylcIiBRdWFudGl0eU1heD1cIig/PHF1YW50aXR5X21heD5cXGQrKVwiIENoYW5zUGVyPVwiKD88cHJvYmFiaWxpdHk+XFxkK1xcLj9cXGQqKVxccypcIiBFZmZlY3Q9XCJcXGQrXCIgUHJvZHVjdE9wdD1cIlxcZCtcIlxcLz4vKTtcbiAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBGYWlsZWQgcGFyc2luZyBnYWNoYSAke2dhY2hhLmdhY2hhX2luZGV4fTpcXG4ke2xpbmV9YCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1hdGNoLmdyb3Vwcykge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNoYXJhY3RlciA9IG1hdGNoLmdyb3Vwcy5jaGFyYWN0ZXI7XG4gICAgICAgIGlmIChjaGFyYWN0ZXIgPT09IFwiTHVubHVuXCIpIHtcbiAgICAgICAgICAgIGNoYXJhY3RlciA9IFwiTHVuTHVuXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0NoYXJhY3RlcihjaGFyYWN0ZXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZvdW5kIHVua25vd24gY2hhcmFjdGVyIFwiJHtjaGFyYWN0ZXJ9XCIgaW4gbG90dGVyeSBmaWxlICR7Z2FjaGEuZ2FjaGFfaW5kZXh9YCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpdGVtID0gc2hvcF9pdGVtcy5nZXQocGFyc2VJbnQobWF0Y2guZ3JvdXBzLnNob3BfaWQpKTtcbiAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZvdW5kIHVua25vd24gc2hvcCBpdGVtIGlkICR7bWF0Y2guZ3JvdXBzLnNob3BfaWR9IGluIGxvdHRlcnkgZmlsZSAke2dhY2hhLmdhY2hhX2luZGV4fWApO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZ2FjaGEuYWRkKGl0ZW0sIHBhcnNlRmxvYXQobWF0Y2guZ3JvdXBzLnByb2JhYmlsaXR5KSwgY2hhcmFjdGVyLCBwYXJzZUludChtYXRjaC5ncm91cHMucXVhbnRpdHlfbWluKSwgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLnF1YW50aXR5X21heCkpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFssIG1hcF0gb2YgZ2FjaGEuc2hvcF9pdGVtcykge1xuICAgICAgICBmb3IgKGNvbnN0IFtpdGVtLF0gb2YgbWFwKSB7XG4gICAgICAgICAgICBpdGVtLnNvdXJjZXMucHVzaChuZXcgR2FjaGFJdGVtU291cmNlKGdhY2hhLnNob3BfaW5kZXgpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VHdWFyZGlhbkRhdGEoZGF0YTogc3RyaW5nKSB7XG4gICAgY29uc3QgZ3VhcmRpYW5EYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoZ3VhcmRpYW5EYXRhKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldE51bWJlcihvOiBhbnkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBib3NzVGltZUluZm8gPSBuZXcgTWFwPG51bWJlciwgbnVtYmVyPigpO1xuICAgIGZvciAoY29uc3QgbWFwSW5mbyBvZiBndWFyZGlhbkRhdGEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXBJbmZvICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXBfbmFtZSA9IG1hcEluZm8uTmFtZTtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXBfbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV3YXJkcyA9IEFycmF5LmlzQXJyYXkobWFwSW5mby5SZXdhcmRzKSA/IFsuLi5tYXBJbmZvLlJld2FyZHNdIDogW107XG4gICAgICAgIGNvbnN0IHJld2FyZF9pdGVtcyA9IHJld2FyZHNcbiAgICAgICAgICAgIC5maWx0ZXIoKHNob3BfaWQpOiBzaG9wX2lkIGlzIG51bWJlciA9PiB0eXBlb2Ygc2hvcF9pZCA9PT0gXCJudW1iZXJcIiAmJiBzaG9wX2l0ZW1zLmhhcyhzaG9wX2lkKSlcbiAgICAgICAgICAgIC5tYXAoc2hvcF9pZCA9PiBzaG9wX2l0ZW1zLmdldChzaG9wX2lkKSEpO1xuICAgICAgICBjb25zdCBFeHBNdWx0aXBsaWVyID0gZ2V0TnVtYmVyKG1hcEluZm8uRXhwTXVsdGlwbGllcikgfHwgMDtcbiAgICAgICAgY29uc3QgSXNCb3NzU3RhZ2UgPSAhIW1hcEluZm8uSXNCb3NzU3RhZ2U7XG4gICAgICAgIGNvbnN0IE1hcElEID0gZ2V0TnVtYmVyKG1hcEluZm8uTWFwSWQpIHx8IDA7XG4gICAgICAgIGxldCBCb3NzVHJpZ2dlclRpbWVySW5TZWNvbmRzID0gZ2V0TnVtYmVyKG1hcEluZm8uQm9zc1RyaWdnZXJUaW1lckluU2Vjb25kcykgfHwgLTE7XG4gICAgICAgIGlmIChCb3NzVHJpZ2dlclRpbWVySW5TZWNvbmRzID09PSAtMSkge1xuICAgICAgICAgICAgQm9zc1RyaWdnZXJUaW1lckluU2Vjb25kcyA9IGJvc3NUaW1lSW5mby5nZXQoTWFwSUQpIHx8IC0xO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKE1hcElEICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgYm9zc1RpbWVJbmZvLnNldChNYXBJRCwgQm9zc1RyaWdnZXJUaW1lckluU2Vjb25kcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJld2FyZF9pdGVtcykge1xuICAgICAgICAgICAgY29uc3QgZ3VhcmRpYW5Tb3VyY2UgPSBuZXcgR3VhcmRpYW5JdGVtU291cmNlKG1hcF9uYW1lLCByZXdhcmRfaXRlbXMsIEV4cE11bHRpcGxpZXIsIElzQm9zc1N0YWdlLCBCb3NzVHJpZ2dlclRpbWVySW5TZWNvbmRzKTtcbiAgICAgICAgICAgIGl0ZW0uc291cmNlcy5wdXNoKGd1YXJkaWFuU291cmNlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBmaWxlbmFtZSA9IHVybC5zbGljZSh1cmwubGFzdEluZGV4T2YoXCIvXCIpICsgMSk7XG4gICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9hZGluZ1wiKTtcbiAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBgTG9hZGluZyAke2ZpbGVuYW1lfSwgcGxlYXNlIHdhaXQuLi5gO1xuICAgIH1cbiAgICBjb25zdCByZXBseSA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgY29uc3QgcHJvZ3Jlc3NiYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByb2dyZXNzYmFyXCIpO1xuICAgIGlmIChwcm9ncmVzc2JhciBpbnN0YW5jZW9mIEhUTUxQcm9ncmVzc0VsZW1lbnQpIHtcbiAgICAgICAgcHJvZ3Jlc3NiYXIudmFsdWUrKztcbiAgICB9XG4gICAgaWYgKCFyZXBseS5vaykge1xuICAgICAgICBhbGVydChgT29wcywgc29tZXRoaW5nIGJyb2tlLiBDb21wbGFpbiB0byBMaWxsaS9LYW5vbmUvWHhoYXJDcyBhYm91dDpcXG5GYWlsZWQgZG93bmxvYWRpbmcgJHt1cmx9IGJlY2F1c2Ugb2YgJHtyZXBseS5zdGF0dXNUZXh0fS5gKTtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiByZXBseS50ZXh0KCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZEl0ZW1zKCkge1xuICAgIGNvbnN0IHByb2dyZXNzYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9ncmVzc2JhclwiKTtcbiAgICBpZiAocHJvZ3Jlc3NiYXIgaW5zdGFuY2VvZiBIVE1MUHJvZ3Jlc3NFbGVtZW50KSB7XG4gICAgICAgIHByb2dyZXNzYmFyLnZhbHVlID0gMDtcbiAgICAgICAgcHJvZ3Jlc3NiYXIubWF4ID0gMTIyO1xuICAgIH1cbiAgICBjb25zdCBpdGVtU291cmNlID0gXCJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vc3N0b2tpYy10Z20vSkZUU0UvZGV2ZWxvcG1lbnQvYXV0aC1zZXJ2ZXIvc3JjL21haW4vcmVzb3VyY2VzL3Jlc1wiO1xuICAgIGNvbnN0IGdhY2hhU291cmNlID0gXCJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vc3N0b2tpYy10Z20vSkZUU0UvZGV2ZWxvcG1lbnQvZ2FtZS1zZXJ2ZXIvc3JjL21haW4vcmVzb3VyY2VzL3Jlcy9sb3R0ZXJ5XCI7XG4gICAgY29uc3QgZ3VhcmRpYW5Tb3VyY2UgPSBcImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9zc3Rva2ljLXRnbS9KRlRTRS9kZXZlbG9wbWVudC9lbXVsYXRvci9zcmMvbWFpbi9yZXNvdXJjZXMvcmVzL1wiXG4gICAgY29uc3QgaXRlbVVSTCA9IGl0ZW1Tb3VyY2UgKyBcIi9JdGVtX1BhcnRzX0luaTMueG1sXCI7XG4gICAgY29uc3QgaXRlbURhdGEgPSBkb3dubG9hZChpdGVtVVJMKTtcbiAgICAvL2NvbnN0IHNob3BVUkwgPSBpdGVtU291cmNlICsgXCIvU2hvcF9JbmkzLnhtbFwiO1xuICAgIGNvbnN0IG1heF9zaG9wX3BhZ2VzID0gMjA7IC8vY3VycmVudGx5IG5lZWQgb25seSAxMCwgc2hvdWxkIGJlIGVub3VnaFxuICAgIGNvbnN0IHNob3BVUkwgPSBcImh0dHBzOi8vamZ0c2UuY29tL2pmdHNlLXJlc3RzZXJ2aWNlL2FwaS9zaG9wP3NpemU9MTAwMCZwYWdlPVwiO1xuICAgIGNvbnN0IHNob3BEYXRhcyA9IFsuLi5BcnJheShtYXhfc2hvcF9wYWdlcykua2V5cygpXS5tYXAobiA9PiBkb3dubG9hZChgJHtzaG9wVVJMfSR7bn1gKSk7XG4gICAgY29uc3QgZ3VhcmRpYW5VUkwgPSBndWFyZGlhblNvdXJjZSArIFwiL0d1YXJkaWFuU3RhZ2VzLmpzb25cIjtcbiAgICBjb25zdCBndWFyZGlhbkRhdGEgPSBkb3dubG9hZChndWFyZGlhblVSTCk7XG4gICAgcGFyc2VJdGVtRGF0YShhd2FpdCBpdGVtRGF0YSk7XG4gICAgLy9wYXJzZVNob3BEYXRhKGF3YWl0IHNob3BEYXRhKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChzaG9wRGF0YXMubWFwKHAgPT4gcC50aGVuKGRhdGEgPT4gcGFyc2VBcGlTaG9wRGF0YShkYXRhKSkpKTtcblxuICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2dhY2hhcy5zaXplfSBnYWNoYXNgKTtcbiAgICBpZiAocHJvZ3Jlc3NiYXIgaW5zdGFuY2VvZiBIVE1MUHJvZ3Jlc3NFbGVtZW50KSB7XG4gICAgICAgIHByb2dyZXNzYmFyLnZhbHVlID0gMDtcbiAgICAgICAgcHJvZ3Jlc3NiYXIubWF4ID0gZ2FjaGFzLnNpemUgKyAzO1xuICAgIH1cbiAgICBjb25zdCBnYWNoYV9pdGVtczogW1Byb21pc2U8c3RyaW5nPiwgR2FjaGEsIHN0cmluZ11bXSA9IFtdO1xuICAgIGZvciAoY29uc3QgWywgZ2FjaGFdIG9mIGdhY2hhcykge1xuICAgICAgICBjb25zdCBnYWNoYV91cmwgPSBgJHtnYWNoYVNvdXJjZX0vSW5pM19Mb3RfJHtgJHtnYWNoYS5nYWNoYV9pbmRleH1gLnBhZFN0YXJ0KDIsIFwiMFwiKX0ueG1sYDtcbiAgICAgICAgZ2FjaGFfaXRlbXMucHVzaChbZG93bmxvYWQoZ2FjaGFfdXJsKSwgZ2FjaGEsIGdhY2hhX3VybF0pO1xuICAgIH1cbiAgICBwYXJzZUd1YXJkaWFuRGF0YShhd2FpdCBndWFyZGlhbkRhdGEpO1xuICAgIGZvciAoY29uc3QgW2l0ZW0sIGdhY2hhLCBnYWNoYV91cmxdIG9mIGdhY2hhX2l0ZW1zKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYXJzZUdhY2hhRGF0YShhd2FpdCBpdGVtLCBnYWNoYSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgRmFpbGVkIGRvd25sb2FkaW5nICR7Z2FjaGFfdXJsfSBiZWNhdXNlICR7ZX1gKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhgTG9hZGVkICR7aXRlbXMuc2l6ZX0gaXRlbXNgKTtcbn1cblxuZnVuY3Rpb24gZGVsZXRhYmxlSXRlbShuYW1lOiBzdHJpbmcsIGlkOiBudW1iZXIpIHtcbiAgICByZXR1cm4gY3JlYXRlSFRNTChbXCJkaXZcIiwgY3JlYXRlSFRNTChbXCJidXR0b25cIiwgeyBjbGFzczogXCJpdGVtX3JlbW92YWxcIiwgXCJkYXRhLWl0ZW1faW5kZXhcIjogYCR7aWR9YCB9LCBcIlhcIl0pLCBuYW1lXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQb3B1cExpbmsodGV4dDogc3RyaW5nLCBjb250ZW50OiBIVE1MRWxlbWVudCB8IHN0cmluZyB8IChIVE1MRWxlbWVudCB8IHN0cmluZylbXSkge1xuICAgIGNvbnN0IGxpbmsgPSBjcmVhdGVIVE1MKFtcImFcIiwgeyBjbGFzczogXCJwb3B1cF9saW5rXCIgfSwgdGV4dF0pO1xuICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBNb3VzZUV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRvcF9kaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRvcF9kaXZcIik7XG4gICAgICAgIGlmICghKHRvcF9kaXYgaW5zdGFuY2VvZiBIVE1MRGl2RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBpZiAoZGlhbG9nKSB7XG4gICAgICAgICAgICBkaWFsb2cuY2xvc2UoKTtcbiAgICAgICAgICAgIGRpYWxvZy5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBkaWFsb2cgPSBBcnJheS5pc0FycmF5KGNvbnRlbnQpID8gY3JlYXRlSFRNTChbXCJkaWFsb2dcIiwgLi4uY29udGVudF0pIDogY3JlYXRlSFRNTChbXCJkaWFsb2dcIiwgY29udGVudF0pO1xuXG4gICAgICAgIHRvcF9kaXYuYXBwZW5kQ2hpbGQoZGlhbG9nKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSAzMDA7XG4gICAgICAgIGRpYWxvZy5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgZGlhbG9nLnN0eWxlLnRvcCA9IGAke2UucGFnZVl9cHhgO1xuICAgICAgICBkaWFsb2cuc3R5bGUubGVmdCA9IGAke2UucGFnZVggLSB3aWR0aH1weGA7XG4gICAgICAgIGRpYWxvZy5zaG93KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGxpbms7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNoYW5jZVBvcHVwKHRyaWVzOiBudW1iZXIpIHtcbiAgICBmdW5jdGlvbiBwcm9iYWJpbGl0eUFmdGVyTlRyaWVzKHByb2JhYmlsaXR5OiBudW1iZXIsIHRyaWVzOiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIDEgLSAoTWF0aC5wb3coKDEgLSBwcm9iYWJpbGl0eSksIHRyaWVzKSk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGVudCA9IGNyZWF0ZUhUTUwoW1xuICAgICAgICBcInRhYmxlXCIsXG4gICAgICAgIFtcbiAgICAgICAgICAgIFwidHJcIixcbiAgICAgICAgICAgIFtcInRoXCIsIFwiTnVtYmVyIG9mIGdhY2hhc1wiXSxcbiAgICAgICAgICAgIFtcInRoXCIsIFwiQ2hhbmNlIGZvciBpdGVtXCJdLFxuICAgICAgICBdLFxuICAgIF0pO1xuICAgIGZvciAoY29uc3QgZmFjdG9yIG9mIFswLjEsIDAuNSwgMSwgMiwgNSwgMTBdKSB7XG4gICAgICAgIGNvbnN0IGdhY2hhcyA9IE1hdGgucm91bmQodHJpZXMgKiBmYWN0b3IpO1xuICAgICAgICBpZiAoZ2FjaGFzID09PSAwKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1xuICAgICAgICAgICAgXCJ0clwiLFxuICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJudW1lcmljXCIgfSwgYCR7Z2FjaGFzfWBdLFxuICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJudW1lcmljXCIgfSwgYCR7KHByb2JhYmlsaXR5QWZ0ZXJOVHJpZXMoMSAvIHRyaWVzLCBnYWNoYXMpICogMTAwKS50b0ZpeGVkKDQpfSVgXSxcbiAgICAgICAgXSkpO1xuICAgIH1cbiAgICBjb250ZW50LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1widHJcIl0pKTtcbiAgICByZXR1cm4gY3JlYXRlUG9wdXBMaW5rKGAke3ByZXR0eU51bWJlcih0cmllcywgMil9YCwgY29udGVudCk7XG59XG5cbmZ1bmN0aW9uIHF1YW50aXR5U3RyaW5nKHF1YW50aXR5X21pbjogbnVtYmVyLCBxdWFudGl0eV9tYXg6IG51bWJlcikge1xuICAgIGlmIChxdWFudGl0eV9taW4gPT09IDEgJiYgcXVhbnRpdHlfbWF4ID09PSAxKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBpZiAocXVhbnRpdHlfbWluID09PSBxdWFudGl0eV9tYXgpIHtcbiAgICAgICAgcmV0dXJuIGAgeCAke3F1YW50aXR5X21heH1gO1xuICAgIH1cbiAgICByZXR1cm4gYCB4ICR7cXVhbnRpdHlfbWlufS0ke3F1YW50aXR5X21heH1gO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVHYWNoYVNvdXJjZVBvcHVwKGl0ZW06IEl0ZW0gfCB1bmRlZmluZWQsIGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UsIGNoYXJhY3Rlcj86IENoYXJhY3Rlcikge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBjaGFyYWN0ZXIgPyBjcmVhdGVIVE1MKFtcbiAgICAgICAgXCJ0YWJsZVwiLFxuICAgICAgICBbXG4gICAgICAgICAgICBcInRyXCIsXG4gICAgICAgICAgICBbXCJ0aFwiLCBcIkl0ZW1cIl0sXG4gICAgICAgICAgICBbXCJ0aFwiLCBcIkF2ZXJhZ2UgVHJpZXNcIl0sXG4gICAgICAgIF0sXG4gICAgXSkgOiBjcmVhdGVIVE1MKFtcbiAgICAgICAgXCJ0YWJsZVwiLFxuICAgICAgICBbXG4gICAgICAgICAgICBcInRyXCIsXG4gICAgICAgICAgICBbXCJ0aFwiLCBcIkl0ZW1cIl0sXG4gICAgICAgICAgICBbXCJ0aFwiLCBcIkNoYXJhY3RlclwiXSxcbiAgICAgICAgICAgIFtcInRoXCIsIFwiQXZlcmFnZSBUcmllc1wiXSxcbiAgICAgICAgXSxcbiAgICBdKTtcbiAgICBjb25zdCBnYWNoYSA9IGdhY2hhcy5nZXQoaXRlbVNvdXJjZS5zaG9wX2lkKTtcbiAgICBpZiAoIWdhY2hhKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG5cbiAgICBjb25zdCBnYWNoYV9pdGVtcyA9IG5ldyBNYXA8SXRlbSwgW251bWJlciwgbnVtYmVyLCBudW1iZXJdPigpO1xuICAgIGZvciAoY29uc3QgY2hhciBvZiBjaGFyYWN0ZXIgPT09IHVuZGVmaW5lZCA/IGNoYXJhY3RlcnMgOiBbY2hhcmFjdGVyXSkge1xuICAgICAgICBjb25zdCBjaGFyX2l0ZW1zID0gZ2FjaGEuc2hvcF9pdGVtcy5nZXQoY2hhcik7XG4gICAgICAgIGlmICghY2hhcl9pdGVtcykge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBbY2hhcl9nYWNoYV9pdGVtLCBbdGlja2V0cywgcXVhbnRpdHlfbWluLCBxdWFudGl0eV9tYXhdXSBvZiBjaGFyX2l0ZW1zKSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtX2NoYXJhY3RlciA9IGNoYXJfZ2FjaGFfaXRlbS5jaGFyYWN0ZXIgfHwgY2hhcmFjdGVyO1xuICAgICAgICAgICAgY29uc3QgaXRlbV90aWNrZXRzID0gaXRlbV9jaGFyYWN0ZXIgPyBnYWNoYS5jaGFyYWN0ZXJfcHJvYmFiaWxpdHkuZ2V0KGl0ZW1fY2hhcmFjdGVyKSEgOiBnYWNoYS50b3RhbF9wcm9iYWJpbGl0eTtcbiAgICAgICAgICAgIGNvbnN0IHByb2JhYmlsaXR5ID0gdGlja2V0cyAvIGl0ZW1fdGlja2V0cztcbiAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzX3Byb2JhYmlsaXR5ID0gZ2FjaGFfaXRlbXMuZ2V0KGNoYXJfZ2FjaGFfaXRlbSk/LlswXSB8fCAwO1xuICAgICAgICAgICAgZ2FjaGFfaXRlbXMuc2V0KGNoYXJfZ2FjaGFfaXRlbSwgW3ByZXZpb3VzX3Byb2JhYmlsaXR5ICsgcHJvYmFiaWxpdHksIHF1YW50aXR5X21pbiwgcXVhbnRpdHlfbWF4XSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtjaGFyX2dhY2hhX2l0ZW0sIFtwcm9iYWJpbGl0eSwgcXVhbnRpdHlfbWluLCBxdWFudGl0eV9tYXhdXSBvZiBnYWNoYV9pdGVtcykge1xuICAgICAgICBpZiAoY2hhcmFjdGVyKSB7XG4gICAgICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1xuICAgICAgICAgICAgICAgIFwidHJcIixcbiAgICAgICAgICAgICAgICBpdGVtID09PSBjaGFyX2dhY2hhX2l0ZW0gPyB7IGNsYXNzOiBcImhpZ2hsaWdodGVkXCIgfSA6IFwiXCIsXG4gICAgICAgICAgICAgICAgW1widGRcIiwgY2hhcl9nYWNoYV9pdGVtLm5hbWVfZW4sIHF1YW50aXR5U3RyaW5nKHF1YW50aXR5X21pbiwgcXVhbnRpdHlfbWF4KV0sXG4gICAgICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJudW1lcmljXCIgfSwgYCR7cHJldHR5TnVtYmVyKDEgLyBwcm9iYWJpbGl0eSwgMil9YF0sXG4gICAgICAgICAgICBdKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1xuICAgICAgICAgICAgICAgIFwidHJcIixcbiAgICAgICAgICAgICAgICBpdGVtID09PSBjaGFyX2dhY2hhX2l0ZW0gPyB7IGNsYXNzOiBcImhpZ2hsaWdodGVkXCIgfSA6IFwiXCIsXG4gICAgICAgICAgICAgICAgW1widGRcIiwgY2hhcl9nYWNoYV9pdGVtLm5hbWVfZW4sIHF1YW50aXR5U3RyaW5nKHF1YW50aXR5X21pbiwgcXVhbnRpdHlfbWF4KV0sXG4gICAgICAgICAgICAgICAgW1widGRcIiwgY2hhcl9nYWNoYV9pdGVtLmNoYXJhY3RlciB8fCBcIipcIl0sXG4gICAgICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJudW1lcmljXCIgfSwgYCR7cHJldHR5TnVtYmVyKDEgLyBwcm9iYWJpbGl0eSwgMil9YF0sXG4gICAgICAgICAgICBdKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3JlYXRlUG9wdXBMaW5rKGl0ZW1Tb3VyY2UuaXRlbS5uYW1lX2VuLCBbY3JlYXRlSFRNTChbXCJhXCIsIGdhY2hhLm5hbWVdKSwgY29udGVudF0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZXRTb3VyY2VQb3B1cChpdGVtOiBJdGVtLCBpdGVtU291cmNlOiBTaG9wSXRlbVNvdXJjZSkge1xuICAgIGNvbnN0IGNvbnRlbnRUYWJsZSA9IGNyZWF0ZUhUTUwoW1widGFibGVcIiwgW1widHJcIiwgW1widGhcIiwgXCJDb250ZW50c1wiXV1dKTtcbiAgICBmb3IgKGNvbnN0IGlubmVyX2l0ZW0gb2YgaXRlbVNvdXJjZS5pdGVtcykge1xuICAgICAgICBjb250ZW50VGFibGUuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChbXCJ0clwiLCBpbm5lcl9pdGVtID09PSBpdGVtID8geyBjbGFzczogXCJoaWdobGlnaHRlZFwiIH0gOiBcIlwiLCBbXCJ0ZFwiLCBpbm5lcl9pdGVtLm5hbWVfZW5dXSkpO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlUG9wdXBMaW5rKGl0ZW1Tb3VyY2UuaXRlbS5uYW1lX2VuLCBbY3JlYXRlSFRNTChbXCJhXCIsIGl0ZW1Tb3VyY2UuaXRlbS5uYW1lX2VuLCBjb250ZW50VGFibGVdKV0pO1xufVxuXG5mdW5jdGlvbiBwcmV0dHlUaW1lKHNlY29uZHM6IG51bWJlcikge1xuICAgIHJldHVybiBgJHtNYXRoLmZsb29yKHNlY29uZHMgLyA2MCl9OiR7YCR7c2Vjb25kcyAlIDYwfWAucGFkU3RhcnQoMiwgXCIwXCIpfWA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUd1YXJkaWFuUG9wdXAoaXRlbTogSXRlbSwgaXRlbVNvdXJjZTogR3VhcmRpYW5JdGVtU291cmNlKSB7XG4gICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgICAgYEd1YXJkaWFuIG1hcCAke2l0ZW1Tb3VyY2UuZ3VhcmRpYW5fbWFwfWAsXG4gICAgICAgIGNyZWF0ZUhUTUwoXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgXCJ1bFwiLCB7IGNsYXNzOiBcImxheW91dFwiIH0sXG4gICAgICAgICAgICAgICAgW1wibGlcIiwgXCJJdGVtczpcIixcbiAgICAgICAgICAgICAgICAgICAgW1widWxcIiwgeyBjbGFzczogXCJsYXlvdXRcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uaXRlbVNvdXJjZS5pdGVtcy5yZWR1Y2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGN1cnIsIHJld2FyZF9pdGVtKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbLi4uY3VyciwgY3JlYXRlSFRNTChbXCJsaVwiLCB7IGNsYXNzOiByZXdhcmRfaXRlbSA9PT0gaXRlbSA/IFwiaGlnaGxpZ2h0ZWRcIiA6IFwiXCIgfSwgcmV3YXJkX2l0ZW0ubmFtZV9lbl0pXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXSBhcyAoSFRNTEVsZW1lbnQgfCBzdHJpbmcpW11cbiAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBbXCJsaVwiLCBgUmVxdWlyZXMgYm9zczogJHtpdGVtU291cmNlLm5lZWRfYm9zcyA/IFwiWWVzXCIgOiBcIk5vXCJ9YF0sXG4gICAgICAgICAgICAgICAgLi4uKGl0ZW1Tb3VyY2UuYm9zc190aW1lID4gMCA/IFtjcmVhdGVIVE1MKFtcImxpXCIsIGBCb3NzIHRpbWU6ICR7cHJldHR5VGltZShpdGVtU291cmNlLmJvc3NfdGltZSl9YF0pXSA6IFtdKSxcbiAgICAgICAgICAgICAgICBbXCJsaVwiLCBgRVhQIG11bHRpcGxpZXI6ICR7aXRlbVNvdXJjZS54cH1gXSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgKVxuICAgIF07XG4gICAgcmV0dXJuIGNyZWF0ZVBvcHVwTGluayhpdGVtU291cmNlLmd1YXJkaWFuX21hcCwgY29udGVudCk7XG59XG5cbmZ1bmN0aW9uIGl0ZW1Tb3VyY2VzVG9FbGVtZW50QXJyYXkoXG4gICAgaXRlbTogSXRlbSxcbiAgICBzb3VyY2VGaWx0ZXI6IChpdGVtU291cmNlOiBJdGVtU291cmNlKSA9PiBib29sZWFuLFxuICAgIGNoYXJhY3Rlcj86IENoYXJhY3Rlcikge1xuICAgIHJldHVybiBbLi4uaXRlbS5zb3VyY2VzLnZhbHVlcygpXVxuICAgICAgICAuZmlsdGVyKHNvdXJjZUZpbHRlcilcbiAgICAgICAgLm1hcChpdGVtU291cmNlID0+IHNvdXJjZUl0ZW1FbGVtZW50KGl0ZW0sIGl0ZW1Tb3VyY2UsIHNvdXJjZUZpbHRlciwgY2hhcmFjdGVyKSk7XG59XG5cbmZ1bmN0aW9uIG1ha2VTb3VyY2VzTGlzdChsaXN0OiAoSFRNTEVsZW1lbnQgfCBzdHJpbmcpW11bXSk6IChIVE1MRWxlbWVudCB8IHN0cmluZylbXSB7XG4gICAgY29uc3QgcmVzdWx0OiAoSFRNTEVsZW1lbnQgfCBzdHJpbmcpW10gPSBbXTtcbiAgICBmdW5jdGlvbiBhZGQoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdID0gcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXSArIGVsZW1lbnQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0LnB1c2goZWxlbWVudCk7XG4gICAgfVxuICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgZm9yIChjb25zdCBlbGVtZW50cyBvZiBsaXN0KSB7XG4gICAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGFkZChcIiBcIik7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWZpcnN0KSB7XG4gICAgICAgICAgICBhZGQoXCIsIFwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHNvdXJjZUl0ZW1FbGVtZW50KGl0ZW06IEl0ZW0sIGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UsIHNvdXJjZUZpbHRlcjogKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpID0+IGJvb2xlYW4sIGNoYXJhY3Rlcj86IENoYXJhY3Rlcik6IChIVE1MRWxlbWVudCB8IHN0cmluZylbXSB7XG4gICAgaWYgKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBHYWNoYUl0ZW1Tb3VyY2UpIHtcbiAgICAgICAgY29uc3QgY2hhciA9IGl0ZW1Tb3VyY2UucmVxdWlyZXNHdWFyZGlhbiA/IHVuZGVmaW5lZCA6IGNoYXJhY3RlcjtcbiAgICAgICAgY29uc3Qgc291cmNlcyA9IGl0ZW1Tb3VyY2VzVG9FbGVtZW50QXJyYXkoaXRlbVNvdXJjZS5pdGVtLCBzb3VyY2VGaWx0ZXIsIGNoYXJhY3Rlcik7XG4gICAgICAgIGNvbnN0IHNvdXJjZXNMaXN0ID0gbWFrZVNvdXJjZXNMaXN0KHNvdXJjZXMpO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgY3JlYXRlR2FjaGFTb3VyY2VQb3B1cChpdGVtLCBpdGVtU291cmNlLCBjaGFyKSxcbiAgICAgICAgICAgIGAgeCBgLFxuICAgICAgICAgICAgY3JlYXRlQ2hhbmNlUG9wdXAoaXRlbVNvdXJjZS5nYWNoYVRyaWVzKGl0ZW0sIGNoYXJhY3RlcikpLFxuICAgICAgICAgICAgLi4uKHNvdXJjZXNMaXN0Lmxlbmd0aCA+IDAgPyBbXCIgXCJdIDogW10pLFxuICAgICAgICAgICAgLi4uc291cmNlc0xpc3QsXG4gICAgICAgIF07XG4gICAgfVxuICAgIGVsc2UgaWYgKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBTaG9wSXRlbVNvdXJjZSkge1xuICAgICAgICBpZiAoaXRlbVNvdXJjZS5pdGVtcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBbYCR7aXRlbVNvdXJjZS5wcmljZX0gJHtpdGVtU291cmNlLmFwID8gXCJBUFwiIDogXCJHb2xkXCJ9YF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGNyZWF0ZVNldFNvdXJjZVBvcHVwKGl0ZW0sIGl0ZW1Tb3VyY2UpLFxuICAgICAgICAgICAgYCAke2l0ZW1Tb3VyY2UucHJpY2V9ICR7aXRlbVNvdXJjZS5hcCA/IFwiQVBcIiA6IFwiR29sZFwifWBcbiAgICAgICAgXTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXRlbVNvdXJjZSBpbnN0YW5jZW9mIEd1YXJkaWFuSXRlbVNvdXJjZSkge1xuICAgICAgICByZXR1cm4gW2NyZWF0ZUd1YXJkaWFuUG9wdXAoaXRlbSwgaXRlbVNvdXJjZSldO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXRlbVRvVGFibGVSb3coaXRlbTogSXRlbSwgc291cmNlRmlsdGVyOiAoaXRlbVNvdXJjZTogSXRlbVNvdXJjZSkgPT4gYm9vbGVhbiwgcHJpb3JpdHlTdGF0czogc3RyaW5nW10sIGNoYXJhY3Rlcj86IENoYXJhY3Rlcik6IEhUTUxUYWJsZVJvd0VsZW1lbnQge1xuICAgIGNvbnN0IHJvdyA9IGNyZWF0ZUhUTUwoXG4gICAgICAgIFtcInRyXCIsXG4gICAgICAgICAgICBbXCJ0ZFwiLCB7IGNsYXNzOiBcIk5hbWVfY29sdW1uXCIgfSwgZGVsZXRhYmxlSXRlbShpdGVtLm5hbWVfZW4sIGl0ZW0uaWQpXSxcbiAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwiQ2hhcmFjdGVyX2NvbHVtblwiIH0sIGl0ZW0uY2hhcmFjdGVyID8/IFwiQWxsXCJdLFxuICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJQYXJ0X2NvbHVtblwiIH0sIGl0ZW0ucGFydF0sXG4gICAgICAgICAgICAuLi5wcmlvcml0eVN0YXRzLm1hcChzdGF0ID0+IGNyZWF0ZUhUTUwoW1widGRcIiwgeyBjbGFzczogXCJudW1lcmljXCIgfSwgc3RhdC5zcGxpdChcIitcIikubWFwKHMgPT4gaXRlbS5zdGF0RnJvbVN0cmluZyhzKSkuam9pbihcIitcIildKSksXG4gICAgICAgICAgICBbXCJ0ZFwiLCB7IGNsYXNzOiBcIkxldmVsX2NvbHVtbiBudW1lcmljXCIgfSwgYCR7aXRlbS5sZXZlbH1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwiU291cmNlX2NvbHVtblwiIH0sIC4uLm1ha2VTb3VyY2VzTGlzdChpdGVtU291cmNlc1RvRWxlbWVudEFycmF5KGl0ZW0sIHNvdXJjZUZpbHRlciwgY2hhcmFjdGVyKSldLFxuICAgICAgICBdXG4gICAgKTtcbiAgICByZXR1cm4gcm93O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2FjaGFUYWJsZShmaWx0ZXI6IChpdGVtOiBJdGVtKSA9PiBib29sZWFuLCBjaGFyPzogQ2hhcmFjdGVyKTogSFRNTFRhYmxlRWxlbWVudCB7XG4gICAgY29uc3QgdGFibGUgPSBjcmVhdGVIVE1MKFxuICAgICAgICBbXCJ0YWJsZVwiLFxuICAgICAgICAgICAgW1widHJcIixcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCB7IGNsYXNzOiBcIk5hbWVfY29sdW1uXCIgfSwgXCJOYW1lXCJdLFxuICAgICAgICAgICAgXVxuICAgICAgICBdXG4gICAgKTtcbiAgICBmb3IgKGNvbnN0IFssIGdhY2hhXSBvZiBnYWNoYXMpIHtcbiAgICAgICAgY29uc3QgZ2FjaGFJdGVtID0gc2hvcF9pdGVtcy5nZXQoZ2FjaGEuc2hvcF9pbmRleCk7XG4gICAgICAgIGlmICghZ2FjaGFJdGVtKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbHRlcihnYWNoYUl0ZW0pKSB7XG4gICAgICAgICAgICB0YWJsZS5hcHBlbmRDaGlsZChjcmVhdGVIVE1MKFtcInRyXCIsIFtcInRkXCIsIGNyZWF0ZUdhY2hhU291cmNlUG9wdXAodW5kZWZpbmVkLCBuZXcgSXRlbVNvdXJjZShnYWNoYS5zaG9wX2luZGV4KSwgY2hhcildXSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWJsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc3VsdHNUYWJsZShcbiAgICBmaWx0ZXI6IChpdGVtOiBJdGVtKSA9PiBib29sZWFuLFxuICAgIHNvdXJjZUZpbHRlcjogKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpID0+IGJvb2xlYW4sXG4gICAgcHJpb3JpemVyOiAoaXRlbXM6IEl0ZW1bXSwgaXRlbTogSXRlbSkgPT4gSXRlbVtdLFxuICAgIHByaW9yaXR5U3RhdHM6IHN0cmluZ1tdLFxuICAgIGNoYXJhY3Rlcj86IENoYXJhY3Rlcik6IEhUTUxUYWJsZUVsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHM6IHsgW2tleTogc3RyaW5nXTogSXRlbVtdIH0gPSB7XG4gICAgICAgIFwiSGF0XCI6IFtdLFxuICAgICAgICBcIkhhaXJcIjogW10sXG4gICAgICAgIFwiRHllXCI6IFtdLFxuICAgICAgICBcIlVwcGVyXCI6IFtdLFxuICAgICAgICBcIkxvd2VyXCI6IFtdLFxuICAgICAgICBcIlNob2VzXCI6IFtdLFxuICAgICAgICBcIlNvY2tzXCI6IFtdLFxuICAgICAgICBcIkhhbmRcIjogW10sXG4gICAgICAgIFwiQmFja3BhY2tcIjogW10sXG4gICAgICAgIFwiRmFjZVwiOiBbXSxcbiAgICAgICAgXCJSYWNrZXRcIjogW10sXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgWywgaXRlbV0gb2YgaXRlbXMpIHtcbiAgICAgICAgaWYgKGZpbHRlcihpdGVtKSkge1xuICAgICAgICAgICAgcmVzdWx0c1tpdGVtLnBhcnRdID0gcHJpb3JpemVyKHJlc3VsdHNbaXRlbS5wYXJ0XSwgaXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0YWJsZSA9IGNyZWF0ZUhUTUwoXG4gICAgICAgIFtcInRhYmxlXCIsXG4gICAgICAgICAgICBbXCJ0clwiLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIHsgY2xhc3M6IFwiTmFtZV9jb2x1bW5cIiB9LCBcIk5hbWVcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgeyBjbGFzczogXCJDaGFyYWN0ZXJfY29sdW1uXCIgfSwgXCJDaGFyYWN0ZXJcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgeyBjbGFzczogXCJQYXJ0X2NvbHVtblwiIH0sIFwiUGFydFwiXSxcbiAgICAgICAgICAgICAgICAuLi5wcmlvcml0eVN0YXRzLm1hcChzdGF0ID0+IGNyZWF0ZUhUTUwoW1widGhcIiwgeyBjbGFzczogXCJudW1lcmljXCIgfSwgc3RhdF0pKSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCB7IGNsYXNzOiBcIkxldmVsX2NvbHVtbiBudW1lcmljXCIgfSwgXCJMZXZlbFwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCB7IGNsYXNzOiBcIlNvdXJjZV9jb2x1bW5cIiB9LCBcIlNvdXJjZVwiXSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgXVxuICAgICk7XG5cbiAgICB0eXBlIE1hcE9wdGlvbnMgPSB7IFtrZXk6IHN0cmluZ106IG51bWJlcltdIH07XG5cbiAgICB0eXBlIENvc3QgPSB7XG4gICAgICAgIGdvbGQ6IG51bWJlcixcbiAgICAgICAgYXA6IG51bWJlcixcbiAgICAgICAgbWFwczogTWFwT3B0aW9ucyxcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY29tYmluZU1hcHMobTE6IE1hcE9wdGlvbnMsIG0yOiBNYXBPcHRpb25zKTogTWFwT3B0aW9ucyB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgLi4ubTEgfTtcbiAgICAgICAgZm9yIChjb25zdCBbbWFwLCB0cmllc10gb2YgT2JqZWN0LmVudHJpZXMobTIpKSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0W21hcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbbWFwXSA9IHJlc3VsdFttYXBdLmNvbmNhdCh0cmllcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbbWFwXSA9IHRyaWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tYmluZUNvc3RzKGNvc3QxOiBDb3N0LCBjb3N0MjogQ29zdCk6IENvc3Qge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ29sZDogY29zdDEuZ29sZCArIGNvc3QyLmdvbGQsXG4gICAgICAgICAgICBhcDogY29zdDEuYXAgKyBjb3N0Mi5hcCxcbiAgICAgICAgICAgIG1hcHM6IGNvbWJpbmVNYXBzKGNvc3QxLm1hcHMsIGNvc3QyLm1hcHMpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pbk1hcChtMTogTWFwT3B0aW9ucywgbTI6IE1hcE9wdGlvbnMpOiBNYXBPcHRpb25zIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0geyAuLi5tMSB9O1xuICAgICAgICBmb3IgKGNvbnN0IFttYXAsIHRyaWVzXSBvZiBPYmplY3QuZW50cmllcyhtMikpIHtcbiAgICAgICAgICAgIGlmICh0cmllcy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVzdWx0W21hcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbbWFwXSA9IFtNYXRoLm1pbihyZXN1bHRbbWFwXVswXSwgdHJpZXNbMF0pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdFttYXBdID0gdHJpZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaW5Db3N0KGNvc3QxOiBDb3N0LCBjb3N0MjogQ29zdCk6IENvc3Qge1xuICAgICAgICByZXR1cm4gW2Nvc3QxLmFwLCBjb3N0MS5nb2xkXSA8IFtjb3N0MS5hcCwgY29zdDEuZ29sZF0gP1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGdvbGQ6IGNvc3QxLmdvbGQsXG4gICAgICAgICAgICAgICAgYXA6IGNvc3QxLmFwLFxuICAgICAgICAgICAgICAgIG1hcHM6IG1pbk1hcChjb3N0MS5tYXBzLCBjb3N0Mi5tYXBzKSxcbiAgICAgICAgICAgIH0gOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGdvbGQ6IGNvc3QyLmdvbGQsXG4gICAgICAgICAgICAgICAgYXA6IGNvc3QyLmFwLFxuICAgICAgICAgICAgICAgIG1hcHM6IG1pbk1hcChjb3N0MS5tYXBzLCBjb3N0Mi5tYXBzKSxcbiAgICAgICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29zdE9mKGl0ZW06IEl0ZW0sIGNoYXJhY3Rlcj86IENoYXJhY3Rlcik6IENvc3Qge1xuICAgICAgICByZXR1cm4gWy4uLml0ZW0uc291cmNlcy52YWx1ZXMoKV1cbiAgICAgICAgICAgIC5maWx0ZXIoc291cmNlRmlsdGVyKVxuICAgICAgICAgICAgLnJlZHVjZSgoY3VyciwgaXRlbVNvdXJjZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvc3QgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbVNvdXJjZSBpbnN0YW5jZW9mIFNob3BJdGVtU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbVNvdXJjZS5hcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGdvbGQ6IDAsIGFwOiBpdGVtU291cmNlLnByaWNlLCBtYXBzOiB7fSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgZ29sZDogaXRlbVNvdXJjZS5wcmljZSwgYXA6IDAsIG1hcHM6IHt9IH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaXRlbVNvdXJjZSBpbnN0YW5jZW9mIEdhY2hhSXRlbVNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2luZ2xlQ29zdCA9IGNvc3RPZihpdGVtU291cmNlLml0ZW0sIGNoYXJhY3Rlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtdWx0aXBsaWVyID0gaXRlbVNvdXJjZS5nYWNoYVRyaWVzKGl0ZW0sIGNoYXJhY3Rlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvbGQ6IHNpbmdsZUNvc3QuZ29sZCAqIG11bHRpcGxpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXA6IHNpbmdsZUNvc3QuYXAgKiBtdWx0aXBsaWVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcHM6IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMoc2luZ2xlQ29zdC5tYXBzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoW21hcCwgdHJpZXNdKSA9PiBbbWFwLCB0cmllcy5tYXAobiA9PiBuICogbXVsdGlwbGllcildKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaXRlbVNvdXJjZSBpbnN0YW5jZW9mIEd1YXJkaWFuSXRlbVNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2xkOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcHM6IE9iamVjdC5mcm9tRW50cmllcyhbW2l0ZW1Tb3VyY2UuZ3VhcmRpYW5fbWFwLCBbaXRlbVNvdXJjZS5pdGVtcy5sZW5ndGhdXV0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWluQ29zdChjdXJyLCBjb3N0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeyBnb2xkOiAwLCBhcDogMCwgbWFwczoge30gfVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdGF0aXN0aWNzID0ge1xuICAgICAgICBjaGFyYWN0ZXJzOiBuZXcgU2V0PENoYXJhY3Rlcj4sXG4gICAgICAgIC4uLnByaW9yaXR5U3RhdHMucmVkdWNlKChjdXJyLCBzdGF0KSA9PiAoeyAuLi5jdXJyLCBbc3RhdF06IDAgfSksIHt9KSxcbiAgICAgICAgTGV2ZWw6IDAsXG4gICAgICAgIGNvc3Q6IHsgYXA6IDAsIGdvbGQ6IDAsIG1hcHM6IHt9IH0gYXMgQ29zdCxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgT2JqZWN0LnZhbHVlcyhyZXN1bHRzKSkge1xuICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IHN0YXQgb2YgcHJpb3JpdHlTdGF0cykge1xuICAgICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRpc3RpY3Nbc3RhdF0gIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gc3RhdC5zcGxpdChcIitcIikucmVkdWNlKChjdXJyLCBzdGF0TmFtZSkgPT4gY3VyciArIHJlc3VsdFswXS5zdGF0RnJvbVN0cmluZyhzdGF0TmFtZSksIDApO1xuICAgICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgICBzdGF0aXN0aWNzW3N0YXRdICs9IHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGlzdGljcy5MZXZlbCA9IE1hdGgubWF4KHJlc3VsdFswXS5sZXZlbCwgc3RhdGlzdGljcy5MZXZlbCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGFyIG9mIGl0ZW0uY2hhcmFjdGVyID8gW2l0ZW0uY2hhcmFjdGVyXSA6IGNoYXJhY3RlcnMpIHtcbiAgICAgICAgICAgICAgICBzdGF0aXN0aWNzLmNoYXJhY3RlcnMuYWRkKGNoYXIpXG4gICAgICAgICAgICAgICAgdGFibGUuYXBwZW5kQ2hpbGQoaXRlbVRvVGFibGVSb3coaXRlbSwgc291cmNlRmlsdGVyLCBwcmlvcml0eVN0YXRzLCBjaGFyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0aXN0aWNzLmNvc3QgPSBjb21iaW5lQ29zdHMoY29zdE9mKGl0ZW0sIGNoYXJhY3RlciAmJiBpc0NoYXJhY3RlcihjaGFyYWN0ZXIpID8gY2hhcmFjdGVyIDogdW5kZWZpbmVkKSwgc3RhdGlzdGljcy5jb3N0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGF0aXN0aWNzLmNoYXJhY3RlcnMuc2l6ZSA9PT0gMSkge1xuICAgICAgICBjb25zdCB0b3RhbF9zb3VyY2VzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBpZiAoc3RhdGlzdGljcy5jb3N0LmdvbGQgPiAwKSB7XG4gICAgICAgICAgICB0b3RhbF9zb3VyY2VzLnB1c2goYCR7c3RhdGlzdGljcy5jb3N0LmdvbGQudG9GaXhlZCgwKX0gR29sZGApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0aXN0aWNzLmNvc3QuYXAgPiAwKSB7XG4gICAgICAgICAgICB0b3RhbF9zb3VyY2VzLnB1c2goYCR7c3RhdGlzdGljcy5jb3N0LmFwLnRvRml4ZWQoMCl9IEFQYCk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zdGF0aXN0aWNzWydHdWFyZGlhbiBnYW1lcyddLmZvckVhY2goKGNvdW50LCBtYXApID0+IHRvdGFsX3NvdXJjZXMucHVzaChgJHtjb3VudC50b0ZpeGVkKDApfSB4ICR7bWFwfWApKTtcbiAgICAgICAgdGFibGUuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChcbiAgICAgICAgICAgIFtcInRyXCIsXG4gICAgICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJ0b3RhbCBOYW1lX2NvbHVtblwiIH0sIFwiVG90YWw6XCJdLFxuICAgICAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwidG90YWwgQ2hhcmFjdGVyX2NvbHVtblwiIH1dLFxuICAgICAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwidG90YWwgUGFydF9jb2x1bW5cIiB9XSxcbiAgICAgICAgICAgICAgICAuLi5wcmlvcml0eVN0YXRzLm1hcChzdGF0ID0+IGNyZWF0ZUhUTUwoW1widGRcIiwgeyBjbGFzczogXCJ0b3RhbCBudW1lcmljXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGAke3N0YXRpc3RpY3Nbc3RhdF19YFxuICAgICAgICAgICAgICAgIF0pKSxcbiAgICAgICAgICAgICAgICBbXCJ0ZFwiLCB7IGNsYXNzOiBcInRvdGFsIExldmVsX2NvbHVtbiBudW1lcmljXCIgfSwgYCR7c3RhdGlzdGljcy5MZXZlbH1gXSxcbiAgICAgICAgICAgICAgICBbXCJ0ZFwiLCB7IGNsYXNzOiBcInRvdGFsIFNvdXJjZV9jb2x1bW5cIiB9LCB0b3RhbF9zb3VyY2VzLmpvaW4oXCIsIFwiKV0sXG4gICAgICAgICAgICBdXG4gICAgICAgICkpO1xuICAgICAgICBmb3IgKGNvbnN0IGNvbHVtbl9lbGVtZW50IG9mIHRhYmxlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoYENoYXJhY3Rlcl9jb2x1bW5gKSkge1xuICAgICAgICAgICAgaWYgKCEoY29sdW1uX2VsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbHVtbl9lbGVtZW50LmhpZGRlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBwcmlvcml0eVN0YXRzKSB7XG4gICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICBpZiAoc3RhdGlzdGljc1thdHRyaWJ1dGVdID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbHVtbl9lbGVtZW50IG9mIHRhYmxlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoYCR7YXR0cmlidXRlfV9jb2x1bW5gKSkge1xuICAgICAgICAgICAgICAgIGlmICghKGNvbHVtbl9lbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb2x1bW5fZWxlbWVudC5oaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWJsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1heEl0ZW1MZXZlbCgpIHtcbiAgICAvL25vIHJlZHVjZSBmb3IgTWFwP1xuICAgIGxldCBtYXggPSAwO1xuICAgIGZvciAoY29uc3QgWywgaXRlbV0gb2YgaXRlbXMpIHtcbiAgICAgICAgbWF4ID0gTWF0aC5tYXgobWF4LCBpdGVtLmxldmVsKTtcbiAgICB9XG4gICAgcmV0dXJuIG1heDtcbn1cblxuZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgIGlmIChkaWFsb2cgJiYgZGlhbG9nICE9PSBldmVudC50YXJnZXQpIHtcbiAgICAgICAgZGlhbG9nLmNsb3NlKCk7XG4gICAgICAgIGRpYWxvZy5yZW1vdmUoKTtcbiAgICAgICAgZGlhbG9nID0gdW5kZWZpbmVkO1xuICAgIH1cbn0pOyIsImltcG9ydCB7IG1ha2VDaGVja2JveFRyZWUsIFRyZWVOb2RlLCBnZXRMZWFmU3RhdGVzLCBzZXRMZWFmU3RhdGVzIH0gZnJvbSAnLi9jaGVja2JveFRyZWUnO1xuaW1wb3J0IHsgY3JlYXRlUG9wdXBMaW5rLCBkb3dubG9hZEl0ZW1zLCBnZXRSZXN1bHRzVGFibGUsIEl0ZW0sIEl0ZW1Tb3VyY2UsIGdldE1heEl0ZW1MZXZlbCwgaXRlbXMsIENoYXJhY3RlciwgY2hhcmFjdGVycywgaXNDaGFyYWN0ZXIsIFNob3BJdGVtU291cmNlLCBHYWNoYUl0ZW1Tb3VyY2UsIGdldEdhY2hhVGFibGUgfSBmcm9tICcuL2l0ZW1Mb29rdXAnO1xuaW1wb3J0IHsgY3JlYXRlSFRNTCB9IGZyb20gJy4vaHRtbCc7XG5pbXBvcnQgeyBWYXJpYWJsZV9zdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuY29uc3QgcGFydHNGaWx0ZXIgPSBbXG4gICAgXCJQYXJ0c1wiLCBbXG4gICAgICAgIFwiSGVhZFwiLCBbXG4gICAgICAgICAgICBcIitIYXRcIixcbiAgICAgICAgICAgIFwiK0hhaXJcIixcbiAgICAgICAgICAgIFwiRHllXCIsXG4gICAgICAgIF0sXG4gICAgICAgIFwiK1VwcGVyXCIsXG4gICAgICAgIFwiK0xvd2VyXCIsXG4gICAgICAgIFwiTGVnc1wiLCBbXG4gICAgICAgICAgICBcIitTaG9lc1wiLFxuICAgICAgICAgICAgXCJTb2Nrc1wiLFxuICAgICAgICBdLFxuICAgICAgICBcIkF1eFwiLCBbXG4gICAgICAgICAgICBcIitIYW5kXCIsXG4gICAgICAgICAgICBcIitCYWNrcGFja1wiLFxuICAgICAgICAgICAgXCIrRmFjZVwiXG4gICAgICAgIF0sXG4gICAgICAgIFwiK1JhY2tldFwiLFxuICAgIF0sXG5dO1xuXG5jb25zdCBhdmFpbGFiaWxpdHlGaWx0ZXIgPSBbXG4gICAgXCJBdmFpbGFiaWxpdHlcIiwgW1xuICAgICAgICBcIlNob3BcIiwgW1xuICAgICAgICAgICAgXCIrR29sZFwiLFxuICAgICAgICAgICAgXCIrQVBcIixcbiAgICAgICAgXSxcbiAgICAgICAgXCIrQWxsb3cgZ2FjaGFcIixcbiAgICAgICAgXCIrR3VhcmRpYW5cIixcbiAgICAgICAgXCIrVW50cmFkYWJsZVwiLFxuICAgICAgICBcIlVuYXZhaWxhYmxlIGl0ZW1zXCIsXG4gICAgXSxcbl07XG5cbmNvbnN0IGV4Y2x1ZGVkX2l0ZW1faWRzID0gbmV3IFNldDxudW1iZXI+KCk7XG5cbmZ1bmN0aW9uIGFkZEZpbHRlclRyZWVzKCkge1xuICAgIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2hhcmFjdGVyRmlsdGVyc1wiKTtcbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGZpcnN0ID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGNoYXJhY3RlciBvZiBbXCJBbGxcIiwgLi4uY2hhcmFjdGVyc10pIHtcbiAgICAgICAgY29uc3QgaWQgPSBgY2hhcmFjdGVyU2VsZWN0b3JzXyR7Y2hhcmFjdGVyfWA7XG4gICAgICAgIGNvbnN0IHJhZGlvX2J1dHRvbiA9IGNyZWF0ZUhUTUwoW1wiaW5wdXRcIiwgeyBpZDogaWQsIHR5cGU6IFwicmFkaW9cIiwgbmFtZTogXCJjaGFyYWN0ZXJTZWxlY3RvcnNcIiwgdmFsdWU6IGNoYXJhY3RlciB9XSk7XG4gICAgICAgIHJhZGlvX2J1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgdXBkYXRlUmVzdWx0cyk7XG4gICAgICAgIHRhcmdldC5hcHBlbmRDaGlsZChyYWRpb19idXR0b24pO1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChbXCJsYWJlbFwiLCB7IGZvcjogaWQgfSwgY2hhcmFjdGVyXSkpO1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChbXCJiclwiXSkpO1xuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgIHJhZGlvX2J1dHRvbi5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBmaWx0ZXJzOiBbVHJlZU5vZGUsIHN0cmluZ11bXSA9IFtcbiAgICAgICAgW3BhcnRzRmlsdGVyLCBcInBhcnRzRmlsdGVyXCJdLFxuICAgICAgICBbYXZhaWxhYmlsaXR5RmlsdGVyLCBcImF2YWlsYWJpbGl0eUZpbHRlclwiXSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgW2ZpbHRlciwgbmFtZV0gb2YgZmlsdGVycykge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChuYW1lKTtcbiAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0cmVlID0gbWFrZUNoZWNrYm94VHJlZShmaWx0ZXIpO1xuICAgICAgICB0cmVlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlUmVzdWx0cyk7XG4gICAgICAgIHRhcmdldC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQodHJlZSk7XG4gICAgfVxufVxuXG5hZGRGaWx0ZXJUcmVlcygpO1xuXG5sZXQgZHJhZ2dlZDogSFRNTEVsZW1lbnQ7XG5jb25zdCBkcmFnU2VwYXJhdG9yTGluZSA9IGNyZWF0ZUhUTUwoW1wiaHJcIiwgeyBpZDogXCJkcmFnT3ZlckJhclwiIH1dKTtcbmxldCBkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50OiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gYXBwbHlEcmFnRHJvcCgpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsICh7IHRhcmdldCB9KSA9PiB7XG4gICAgICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRyYWdnZWQgPSB0YXJnZXQ7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmICghKGV2ZW50LnRhcmdldCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC50YXJnZXQuY2xhc3NOYW1lID09PSBcImRyb3B6b25lXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldFJlY3QgPSBldmVudC50YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBjb25zdCB5ID0gZXZlbnQuY2xpZW50WSAtIHRhcmdldFJlY3QudG9wO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGFyZ2V0UmVjdC5oZWlnaHQ7XG4gICAgICAgICAgICBlbnVtIFBvc2l0aW9uIHtcbiAgICAgICAgICAgICAgICBhYm92ZSxcbiAgICAgICAgICAgICAgICBvbixcbiAgICAgICAgICAgICAgICBiZWxvdyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0geSA8IGhlaWdodCAqIDAuMyA/IFBvc2l0aW9uLmFib3ZlIDogeSA+IGhlaWdodCAqIDAuNyA/IFBvc2l0aW9uLmJlbG93IDogUG9zaXRpb24ub247XG4gICAgICAgICAgICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBQb3NpdGlvbi5hYm92ZTpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRyYWdIaWdobGlnaHRlZEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdIaWdobGlnaHRlZEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImRyb3Bob3ZlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdIaWdobGlnaHRlZEVsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZHJhZ1NlcGFyYXRvckxpbmUuaGlkZGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC5iZWZvcmUoZHJhZ1NlcGFyYXRvckxpbmUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFBvc2l0aW9uLmJlbG93OlxuICAgICAgICAgICAgICAgICAgICBpZiAoZHJhZ0hpZ2hsaWdodGVkRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHJhZ0hpZ2hsaWdodGVkRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwiZHJvcGhvdmVyXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZHJhZ0hpZ2hsaWdodGVkRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkcmFnU2VwYXJhdG9yTGluZS5oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LmFmdGVyKGRyYWdTZXBhcmF0b3JMaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQb3NpdGlvbi5vbjpcbiAgICAgICAgICAgICAgICAgICAgZHJhZ1NlcGFyYXRvckxpbmUuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRyYWdIaWdobGlnaHRlZEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdIaWdobGlnaHRlZEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImRyb3Bob3ZlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZHJhZ2dlZCA9PT0gZXZlbnQudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICBkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJkcm9waG92ZXJcIik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCAoeyB0YXJnZXQgfSkgPT4ge1xuICAgICAgICBpZiAoIWRyYWdTZXBhcmF0b3JMaW5lLmhpZGRlbikge1xuICAgICAgICAgICAgZHJhZ2dlZC5yZW1vdmUoKTtcbiAgICAgICAgICAgIGRyYWdTZXBhcmF0b3JMaW5lLmFmdGVyKGRyYWdnZWQpO1xuICAgICAgICAgICAgZHJhZ1NlcGFyYXRvckxpbmUuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkcmFnU2VwYXJhdG9yTGluZS5oaWRkZW4gPSB0cnVlO1xuICAgICAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZHJhZ0hpZ2hsaWdodGVkRWxlbWVudCkge1xuICAgICAgICAgICAgZHJhZ0hpZ2hsaWdodGVkRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwiZHJvcGhvdmVyXCIpO1xuICAgICAgICAgICAgY29uc3QgZHJvcFRhcmdldCA9IGRyYWdIaWdobGlnaHRlZEVsZW1lbnQ7XG4gICAgICAgICAgICBkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKCEoZHJvcFRhcmdldCBpbnN0YW5jZW9mIEhUTUxMSUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZHJvcFRhcmdldC50ZXh0Q29udGVudCArPSBgKyR7ZHJhZ2dlZC50ZXh0Q29udGVudH1gO1xuICAgICAgICAgICAgZHJhZ2dlZC5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGFyZ2V0ID09PSBkcmFnZ2VkKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0cyA9IGRyYWdnZWQudGV4dENvbnRlbnQhLnNwbGl0KFwiK1wiKTtcbiAgICAgICAgICAgIGRyYWdnZWQudGV4dENvbnRlbnQgPSBzdGF0cy5zaGlmdCgpITtcbiAgICAgICAgICAgIGRyYWdnZWQuYWZ0ZXIoLi4uc3RhdHMubWFwKHN0YXQgPT4gY3JlYXRlSFRNTChbXCJsaVwiLCB7IGNsYXNzOiBcImRyb3B6b25lXCIsIGRyYWdnYWJsZTogXCJ0cnVlXCIgfSwgc3RhdF0pKSk7XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlUmVzdWx0cygpO1xuICAgIH0pO1xufVxuXG5hcHBseURyYWdEcm9wKCk7XG5cbmZ1bmN0aW9uIGNvbXBhcmUobGhzOiBudW1iZXIsIHJoczogbnVtYmVyKTogLTEgfCAwIHwgMSB7XG4gICAgaWYgKGxocyA9PT0gcmhzKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gbGhzIDwgcmhzID8gLTEgOiAxO1xufVxuXG5mdW5jdGlvbiBnZXRTZWxlY3RlZENoYXJhY3RlcigpOiBDaGFyYWN0ZXIgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGNoYXJhY3RlckZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZShcImNoYXJhY3RlclNlbGVjdG9yc1wiKTtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgY2hhcmFjdGVyRmlsdGVyTGlzdCkge1xuICAgICAgICBpZiAoIShlbGVtZW50IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWxlbWVudC5jaGVja2VkKSB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBlbGVtZW50LnZhbHVlO1xuICAgICAgICAgICAgaWYgKGlzQ2hhcmFjdGVyKHNlbGVjdGlvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZWN0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRTZWxlY3RlZENoYXJhY3RlcihjaGFyYWN0ZXI6IENoYXJhY3RlciB8IFwiQWxsXCIpIHtcbiAgICBjb25zdCBjaGFyYWN0ZXJGaWx0ZXJMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoXCJjaGFyYWN0ZXJTZWxlY3RvcnNcIik7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGNoYXJhY3RlckZpbHRlckxpc3QpIHtcbiAgICAgICAgaWYgKCEoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQudmFsdWUgPT09IGNoYXJhY3Rlcikge1xuICAgICAgICAgICAgZWxlbWVudC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5leHBvcnQgY29uc3QgaXRlbVNlbGVjdG9ycyA9IFtcInBhcnRzU2VsZWN0b3JcIiwgXCJnYWNoYVNlbGVjdG9yXCIsIFwib3RoZXJJdGVtc1NlbGVjdG9yXCJdIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgSXRlbVNlbGVjdG9yID0gdHlwZW9mIGl0ZW1TZWxlY3RvcnNbbnVtYmVyXTtcbmV4cG9ydCBmdW5jdGlvbiBpc0l0ZW1TZWxlY3RvcihpdGVtU2VsZWN0b3I6IHN0cmluZyk6IGl0ZW1TZWxlY3RvciBpcyBJdGVtU2VsZWN0b3Ige1xuICAgIHJldHVybiAoaXRlbVNlbGVjdG9ycyBhcyB1bmtub3duIGFzIHN0cmluZ1tdKS5pbmNsdWRlcyhpdGVtU2VsZWN0b3IpO1xufVxuXG5mdW5jdGlvbiBnZXRJdGVtVHlwZVNlbGVjdGlvbigpOiBJdGVtU2VsZWN0b3Ige1xuICAgIGNvbnN0IHBhcnRzU2VsZWN0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhcnRzU2VsZWN0b3JcIik7XG4gICAgaWYgKCEocGFydHNTZWxlY3RvciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgaWYgKHBhcnRzU2VsZWN0b3IuY2hlY2tlZCkge1xuICAgICAgICByZXR1cm4gXCJwYXJ0c1NlbGVjdG9yXCI7XG4gICAgfVxuICAgIGNvbnN0IGdhY2hhU2VsZWN0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhY2hhU2VsZWN0b3JcIik7XG4gICAgaWYgKCEoZ2FjaGFTZWxlY3RvciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgaWYgKGdhY2hhU2VsZWN0b3IuY2hlY2tlZCkge1xuICAgICAgICByZXR1cm4gXCJnYWNoYVNlbGVjdG9yXCI7XG4gICAgfVxuICAgIGNvbnN0IG90aGVySXRlbXNTZWxlY3RvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3RoZXJJdGVtc1NlbGVjdG9yXCIpO1xuICAgIGlmICghKG90aGVySXRlbXNTZWxlY3RvciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgaWYgKG90aGVySXRlbXNTZWxlY3Rvci5jaGVja2VkKSB7XG4gICAgICAgIHJldHVybiBcIm90aGVySXRlbXNTZWxlY3RvclwiO1xuICAgIH1cbiAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG59XG5cbmZ1bmN0aW9uIHNhdmVTZWxlY3Rpb24oKSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRDaGFyYWN0ZXIgPSBnZXRTZWxlY3RlZENoYXJhY3RlcigpIHx8IFwiQWxsXCI7XG4gICAgVmFyaWFibGVfc3RvcmFnZS5zZXRfdmFyaWFibGUoXCJDaGFyYWN0ZXJcIiwgc2VsZWN0ZWRDaGFyYWN0ZXIpO1xuICAgIHsvL0ZpbHRlcnNcbiAgICAgICAgY29uc3QgcGFydHNGaWx0ZXJMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXJ0c0ZpbHRlclwiKT8uY2hpbGRyZW5bMF07XG4gICAgICAgIGlmICghKHBhcnRzRmlsdGVyTGlzdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBbbmFtZSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGdldExlYWZTdGF0ZXMocGFydHNGaWx0ZXJMaXN0KSkpIHtcbiAgICAgICAgICAgIFZhcmlhYmxlX3N0b3JhZ2Uuc2V0X3ZhcmlhYmxlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdmFpbGFiaWxpdHlGaWx0ZXJMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhdmFpbGFiaWxpdHlGaWx0ZXJcIik/LmNoaWxkcmVuWzBdO1xuICAgICAgICBpZiAoIShhdmFpbGFiaWxpdHlGaWx0ZXJMaXN0IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IFtuYW1lLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZ2V0TGVhZlN0YXRlcyhhdmFpbGFiaWxpdHlGaWx0ZXJMaXN0KSkpIHtcbiAgICAgICAgICAgIFZhcmlhYmxlX3N0b3JhZ2Uuc2V0X3ZhcmlhYmxlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB7IC8vbWlzY1xuICAgICAgICBjb25zdCBsZXZlbHJhbmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZXZlbHJhbmdlXCIpO1xuICAgICAgICBpZiAoIShsZXZlbHJhbmdlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXhMZXZlbCA9IHBhcnNlSW50KGxldmVscmFuZ2UudmFsdWUpO1xuICAgICAgICBWYXJpYWJsZV9zdG9yYWdlLnNldF92YXJpYWJsZShcIm1heExldmVsXCIsIG1heExldmVsKTtcblxuICAgICAgICBjb25zdCBuYW1lZmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lRmlsdGVyXCIpO1xuICAgICAgICBpZiAoIShuYW1lZmlsdGVyIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpdGVtX25hbWUgPSBuYW1lZmlsdGVyLnZhbHVlO1xuICAgICAgICBpZiAoaXRlbV9uYW1lKSB7XG4gICAgICAgICAgICBWYXJpYWJsZV9zdG9yYWdlLnNldF92YXJpYWJsZShcIm5hbWVGaWx0ZXJcIiwgaXRlbV9uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIFZhcmlhYmxlX3N0b3JhZ2UuZGVsZXRlX3ZhcmlhYmxlKFwibmFtZUZpbHRlclwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbmNoYW50VG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbmNoYW50VG9nZ2xlXCIpO1xuICAgICAgICBpZiAoIShlbmNoYW50VG9nZ2xlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBWYXJpYWJsZV9zdG9yYWdlLnNldF92YXJpYWJsZShcImVuY2hhbnRUb2dnbGVcIiwgZW5jaGFudFRvZ2dsZS5jaGVja2VkKTtcbiAgICB9XG4gICAgeyAvL2l0ZW0gc2VsZWN0aW9uXG4gICAgICAgIFZhcmlhYmxlX3N0b3JhZ2Uuc2V0X3ZhcmlhYmxlKFwiaXRlbVR5cGVTZWxlY3RvclwiLCBnZXRJdGVtVHlwZVNlbGVjdGlvbigpKTtcbiAgICB9XG5cbiAgICBWYXJpYWJsZV9zdG9yYWdlLnNldF92YXJpYWJsZShcImV4Y2x1ZGVkX2l0ZW1faWRzXCIsIEFycmF5LmZyb20oZXhjbHVkZWRfaXRlbV9pZHMpLmpvaW4oXCIsXCIpKTtcbn1cblxuZnVuY3Rpb24gcmVzdG9yZVNlbGVjdGlvbigpIHtcbiAgICBjb25zdCBzdG9yZWRfY2hhcmFjdGVyID0gVmFyaWFibGVfc3RvcmFnZS5nZXRfdmFyaWFibGUoXCJDaGFyYWN0ZXJcIik7XG4gICAgc2V0U2VsZWN0ZWRDaGFyYWN0ZXIodHlwZW9mIHN0b3JlZF9jaGFyYWN0ZXIgPT09IFwic3RyaW5nXCIgJiYgaXNDaGFyYWN0ZXIoc3RvcmVkX2NoYXJhY3RlcikgPyBzdG9yZWRfY2hhcmFjdGVyIDogXCJBbGxcIik7XG5cbiAgICB7Ly9GaWx0ZXJzXG4gICAgICAgIGxldCBzdGF0ZXM6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9ID0ge307XG4gICAgICAgIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhWYXJpYWJsZV9zdG9yYWdlLnZhcmlhYmxlcykpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICAgICAgc3RhdGVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJ0c0ZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhcnRzRmlsdGVyXCIpPy5jaGlsZHJlblswXTtcbiAgICAgICAgaWYgKCEocGFydHNGaWx0ZXJMaXN0IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBzZXRMZWFmU3RhdGVzKHBhcnRzRmlsdGVyTGlzdCwgc3RhdGVzKTtcbiAgICAgICAgY29uc3QgYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXZhaWxhYmlsaXR5RmlsdGVyXCIpPy5jaGlsZHJlblswXTtcbiAgICAgICAgaWYgKCEoYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgc2V0TGVhZlN0YXRlcyhhdmFpbGFiaWxpdHlGaWx0ZXJMaXN0LCBzdGF0ZXMpO1xuICAgIH1cbiAgICBjb25zdCBsZXZlbHJhbmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZXZlbHJhbmdlXCIpO1xuICAgIHsgLy9taXNjXG4gICAgICAgIGlmICghKGxldmVscmFuZ2UgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1heExldmVsID0gVmFyaWFibGVfc3RvcmFnZS5nZXRfdmFyaWFibGUoXCJtYXhMZXZlbFwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXhMZXZlbCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgbGV2ZWxyYW5nZS52YWx1ZSA9IGAke21heExldmVsfWA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXZlbHJhbmdlLnZhbHVlID0gbGV2ZWxyYW5nZS5tYXg7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuYW1lZmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lRmlsdGVyXCIpO1xuICAgICAgICBpZiAoIShuYW1lZmlsdGVyIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGl0ZW1fbmFtZSA9IFZhcmlhYmxlX3N0b3JhZ2UuZ2V0X3ZhcmlhYmxlKFwibmFtZUZpbHRlclwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtX25hbWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIG5hbWVmaWx0ZXIudmFsdWUgPSBpdGVtX25hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlbmNoYW50VG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbmNoYW50VG9nZ2xlXCIpO1xuICAgICAgICBpZiAoIShlbmNoYW50VG9nZ2xlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBlbmNoYW50VG9nZ2xlLmNoZWNrZWQgPSAhIVZhcmlhYmxlX3N0b3JhZ2UuZ2V0X3ZhcmlhYmxlKFwiZW5jaGFudFRvZ2dsZVwiKTtcbiAgICB9XG5cbiAgICB7IC8vaXRlbSBzZWxlY3Rpb25cbiAgICAgICAgbGV0IGl0ZW1UeXBlU2VsZWN0b3IgPSBWYXJpYWJsZV9zdG9yYWdlLmdldF92YXJpYWJsZShcIml0ZW1UeXBlU2VsZWN0b3JcIik7XG4gICAgICAgIGlmICh0eXBlb2YgaXRlbVR5cGVTZWxlY3RvciAhPT0gXCJzdHJpbmdcIiB8fCAhaXNJdGVtU2VsZWN0b3IoaXRlbVR5cGVTZWxlY3RvcikpIHtcbiAgICAgICAgICAgIGl0ZW1UeXBlU2VsZWN0b3IgPSBcInBhcnRzU2VsZWN0b3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWxlY3RvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGl0ZW1UeXBlU2VsZWN0b3IpO1xuICAgICAgICBpZiAoIShzZWxlY3RvciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZWN0b3IuY2hlY2tlZCA9IHRydWU7XG4gICAgICAgIHNlbGVjdG9yLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiY2hhbmdlXCIsIHsgYnViYmxlczogZmFsc2UsIGNhbmNlbGFibGU6IHRydWUgfSkpO1xuICAgIH1cblxuICAgIGNvbnN0IGV4Y2x1ZGVkX2lkcyA9IFZhcmlhYmxlX3N0b3JhZ2UuZ2V0X3ZhcmlhYmxlKFwiZXhjbHVkZWRfaXRlbV9pZHNcIik7XG4gICAgaWYgKHR5cGVvZiBleGNsdWRlZF9pZHMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZm9yIChjb25zdCBpZCBvZiBleGNsdWRlZF9pZHMuc3BsaXQoXCIsXCIpKSB7XG4gICAgICAgICAgICBleGNsdWRlZF9pdGVtX2lkcy5hZGQocGFyc2VJbnQoaWQpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBleGNsdWRlZF9pdGVtX2lkcy5kZWxldGUoTmFOKTtcblxuICAgIC8vbXVzdCBiZSBsYXN0IGJlY2F1c2UgaXQgdHJpZ2dlcnMgYSBzdG9yZVxuICAgIGxldmVscmFuZ2UuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJpbnB1dFwiKSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJlc3VsdHMoKSB7XG4gICAgc2F2ZVNlbGVjdGlvbigpO1xuICAgIGNvbnN0IGZpbHRlcnM6ICgoaXRlbTogSXRlbSkgPT4gYm9vbGVhbilbXSA9IFtdO1xuICAgIGNvbnN0IHNvdXJjZUZpbHRlcnM6ICgoaXRlbVNvdXJjZTogSXRlbVNvdXJjZSkgPT4gYm9vbGVhbilbXSA9IFtdO1xuICAgIGxldCBzZWxlY3RlZENoYXJhY3RlcjogQ2hhcmFjdGVyIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHBhcnRzRmlsdGVyTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFydHNGaWx0ZXJcIik/LmNoaWxkcmVuWzBdO1xuICAgIGlmICghKHBhcnRzRmlsdGVyTGlzdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgY29uc3QgZW5jaGFudFRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW5jaGFudFRvZ2dsZVwiKTtcbiAgICBpZiAoIShlbmNoYW50VG9nZ2xlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICBjb25zdCBuYW1lZmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lRmlsdGVyXCIpO1xuICAgIGlmICghKG5hbWVmaWx0ZXIgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuXG4gICAgeyAvL2NoYXJhY3RlciBmaWx0ZXJcbiAgICAgICAgc2VsZWN0ZWRDaGFyYWN0ZXIgPSBnZXRTZWxlY3RlZENoYXJhY3RlcigpO1xuICAgICAgICBzd2l0Y2ggKGdldEl0ZW1UeXBlU2VsZWN0aW9uKCkpIHtcbiAgICAgICAgICAgIGNhc2UgJ3BhcnRzU2VsZWN0b3InOlxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZENoYXJhY3Rlcikge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiBpdGVtLmNoYXJhY3RlciA9PT0gc2VsZWN0ZWRDaGFyYWN0ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2dhY2hhU2VsZWN0b3InOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb3RoZXJJdGVtc1NlbGVjdG9yJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHsgLy9wYXJ0cyBmaWx0ZXJcbiAgICAgICAgc3dpdGNoIChnZXRJdGVtVHlwZVNlbGVjdGlvbigpKSB7XG4gICAgICAgICAgICBjYXNlICdwYXJ0c1NlbGVjdG9yJzpcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJ0c1N0YXRlcyA9IGdldExlYWZTdGF0ZXMocGFydHNGaWx0ZXJMaXN0KTtcbiAgICAgICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiBwYXJ0c1N0YXRlc1tpdGVtLnBhcnRdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2dhY2hhU2VsZWN0b3InOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnb3RoZXJJdGVtc1NlbGVjdG9yJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHsgLy9hdmFpbGFiaWxpdHkgZmlsdGVyXG4gICAgICAgIGNvbnN0IGF2YWlsYWJpbGl0eUZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImF2YWlsYWJpbGl0eUZpbHRlclwiKT8uY2hpbGRyZW5bMF07XG4gICAgICAgIGlmICghKGF2YWlsYWJpbGl0eUZpbHRlckxpc3QgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGF2YWlsYWJpbGl0eVN0YXRlcyA9IGdldExlYWZTdGF0ZXMoYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCk7XG4gICAgICAgIGlmICghYXZhaWxhYmlsaXR5U3RhdGVzW1wiR29sZFwiXSkge1xuICAgICAgICAgICAgc291cmNlRmlsdGVycy5wdXNoKGl0ZW1Tb3VyY2UgPT4gIShpdGVtU291cmNlIGluc3RhbmNlb2YgU2hvcEl0ZW1Tb3VyY2UgJiYgIWl0ZW1Tb3VyY2UuYXAgJiYgaXRlbVNvdXJjZS5wcmljZSA+IDApKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWF2YWlsYWJpbGl0eVN0YXRlc1tcIkFQXCJdKSB7XG4gICAgICAgICAgICBzb3VyY2VGaWx0ZXJzLnB1c2goaXRlbVNvdXJjZSA9PiAhKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBTaG9wSXRlbVNvdXJjZSAmJiBpdGVtU291cmNlLmFwICYmIGl0ZW1Tb3VyY2UucHJpY2UgPiAwKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJVbnRyYWRhYmxlXCJdKSB7XG4gICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiBpdGVtLnBhcmNlbF9lbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWF2YWlsYWJpbGl0eVN0YXRlc1tcIkFsbG93IGdhY2hhXCJdKSB7XG4gICAgICAgICAgICBzb3VyY2VGaWx0ZXJzLnB1c2goaXRlbVNvdXJjZSA9PiAhKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBHYWNoYUl0ZW1Tb3VyY2UpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWF2YWlsYWJpbGl0eVN0YXRlc1tcIkd1YXJkaWFuXCJdKSB7XG4gICAgICAgICAgICBzb3VyY2VGaWx0ZXJzLnB1c2goaXRlbVNvdXJjZSA9PiAhaXRlbVNvdXJjZS5yZXF1aXJlc0d1YXJkaWFuKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWF2YWlsYWJpbGl0eVN0YXRlc1tcIlVuYXZhaWxhYmxlIGl0ZW1zXCJdKSB7XG4gICAgICAgICAgICBjb25zdCBhdmFpbGFiaWxpdHlTb3VyY2VGaWx0ZXIgPSBbLi4uc291cmNlRmlsdGVyc107XG4gICAgICAgICAgICBjb25zdCBzb3VyY2VGaWx0ZXIgPSAoaXRlbVNvdXJjZTogSXRlbVNvdXJjZSkgPT4gYXZhaWxhYmlsaXR5U291cmNlRmlsdGVyLmV2ZXJ5KGZpbHRlciA9PiBmaWx0ZXIoaXRlbVNvdXJjZSkpO1xuICAgICAgICAgICAgZnVuY3Rpb24gaXNBdmFpbGFibGVTb3VyY2UoaXRlbVNvdXJjZTogSXRlbVNvdXJjZSkge1xuICAgICAgICAgICAgICAgIGlmICghc291cmNlRmlsdGVyKGl0ZW1Tb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBHYWNoYUl0ZW1Tb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBzb3VyY2Ugb2YgaXRlbVNvdXJjZS5pdGVtLnNvdXJjZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0F2YWlsYWJsZVNvdXJjZShzb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2VGaWx0ZXJzLnB1c2goaXNBdmFpbGFibGVTb3VyY2UpO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpc0F2YWlsYWJsZUl0ZW0oaXRlbTogSXRlbSk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbVNvdXJjZSBvZiBpdGVtLnNvdXJjZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQXZhaWxhYmxlU291cmNlKGl0ZW1Tb3VyY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXNBdmFpbGFibGVJdGVtKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHsgLy9taXNjIGZpbHRlclxuICAgICAgICBjb25zdCBsZXZlbHJhbmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZXZlbHJhbmdlXCIpO1xuICAgICAgICBpZiAoIShsZXZlbHJhbmdlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXhMZXZlbCA9IHBhcnNlSW50KGxldmVscmFuZ2UudmFsdWUpO1xuICAgICAgICBmaWx0ZXJzLnB1c2goKGl0ZW06IEl0ZW0pID0+IGl0ZW0ubGV2ZWwgPD0gbWF4TGV2ZWwpO1xuXG4gICAgICAgIGNvbnN0IGl0ZW1fbmFtZSA9IG5hbWVmaWx0ZXIudmFsdWU7XG4gICAgICAgIGlmIChpdGVtX25hbWUpIHtcbiAgICAgICAgICAgIGZpbHRlcnMucHVzaChpdGVtID0+IGl0ZW0ubmFtZV9lbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGl0ZW1fbmFtZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB7IC8vaWQgZmlsdGVyXG4gICAgICAgIGZpbHRlcnMucHVzaChpdGVtID0+ICFleGNsdWRlZF9pdGVtX2lkcy5oYXMoaXRlbS5pZCkpO1xuICAgICAgICBjb25zdCBpdGVtRmlsdGVyTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaXRlbUZpbHRlclwiKTtcbiAgICAgICAgaWYgKCEoaXRlbUZpbHRlckxpc3QgaW5zdGFuY2VvZiBIVE1MRGl2RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcblxuICAgICAgICB9XG4gICAgICAgIGl0ZW1GaWx0ZXJMaXN0LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgICBmb3IgKGNvbnN0IGlkIG9mIGV4Y2x1ZGVkX2l0ZW1faWRzKSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gaXRlbXMuZ2V0KGlkKTtcbiAgICAgICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlbUZpbHRlckxpc3QuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChbXCJkaXZcIiwgY3JlYXRlSFRNTChbXCJidXR0b25cIiwgeyBjbGFzczogXCJpdGVtX3JlbW92YWxfcmVtb3ZhbFwiLCBcImRhdGEtaXRlbV9pbmRleFwiOiBgJHtpZH1gIH0sIFwiWFwiXSksIGl0ZW0ubmFtZV9lbl0pKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgY29uc3QgY29tcGFyYXRvcnM6ICgobGhzOiBJdGVtLCByaHM6IEl0ZW0pID0+IG51bWJlcilbXSA9IFtdO1xuXG4gICAgY29uc3QgcHJpb3JpdHlMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcmlvcml0eV9saXN0XCIpO1xuICAgIGlmICghKHByaW9yaXR5TGlzdCBpbnN0YW5jZW9mIEhUTUxPTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgY29uc3QgcHJpb3JpdHlTdGF0cyA9IEFycmF5XG4gICAgICAgIC5mcm9tKHByaW9yaXR5TGlzdC5jaGlsZE5vZGVzKVxuICAgICAgICAuZmlsdGVyKG5vZGUgPT4gIW5vZGUudGV4dENvbnRlbnQ/LmluY2x1ZGVzKCdcXG4nKSlcbiAgICAgICAgLmZpbHRlcihub2RlID0+IG5vZGUudGV4dENvbnRlbnQpXG4gICAgICAgIC5tYXAobm9kZSA9PiBub2RlLnRleHRDb250ZW50ISk7XG4gICAge1xuICAgICAgICBmb3IgKGNvbnN0IHN0YXQgb2YgcHJpb3JpdHlTdGF0cykge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBzdGF0LnNwbGl0KFwiK1wiKTtcbiAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKFxuICAgICAgICAgICAgICAgIHN0YXRzLm1hcChzdGF0ID0+IGxocy5zdGF0RnJvbVN0cmluZyhzdGF0KSkucmVkdWNlKChuLCBtKSA9PiBuICsgbSksXG4gICAgICAgICAgICAgICAgc3RhdHMubWFwKHN0YXQgPT4gcmhzLnN0YXRGcm9tU3RyaW5nKHN0YXQpKS5yZWR1Y2UoKG4sIG0pID0+IG4gKyBtKVxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0YWJsZSA9ICgoKSA9PiB7XG4gICAgICAgIHN3aXRjaCAoZ2V0SXRlbVR5cGVTZWxlY3Rpb24oKSkge1xuICAgICAgICAgICAgY2FzZSAncGFydHNTZWxlY3Rvcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFJlc3VsdHNUYWJsZShcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9PiBmaWx0ZXJzLmV2ZXJ5KGZpbHRlciA9PiBmaWx0ZXIoaXRlbSkpLFxuICAgICAgICAgICAgICAgICAgICBpdGVtU291cmNlID0+IHNvdXJjZUZpbHRlcnMuZXZlcnkoZmlsdGVyID0+IGZpbHRlcihpdGVtU291cmNlKSksXG4gICAgICAgICAgICAgICAgICAgIChpdGVtcywgaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbaXRlbV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBhcmF0b3Igb2YgY29tcGFyYXRvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvbXBhcmF0b3IoaXRlbXNbMF0sIGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgLTE6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsuLi5pdGVtcywgaXRlbV07XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHByaW9yaXR5U3RhdHMsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkQ2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNhc2UgJ2dhY2hhU2VsZWN0b3InOlxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRHYWNoYVRhYmxlKGl0ZW0gPT4gZmlsdGVycy5ldmVyeShmaWx0ZXIgPT4gZmlsdGVyKGl0ZW0pKSwgc2VsZWN0ZWRDaGFyYWN0ZXIpO1xuICAgICAgICAgICAgY2FzZSAnb3RoZXJJdGVtc1NlbGVjdG9yJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gY3JlYXRlSFRNTChcbiAgICAgICAgICAgICAgICAgICAgW1widGFibGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcInRyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW1widGhcIiwgXCJUT0RPOiBPdGhlciBpdGVtc1wiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgY29uc3QgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZXN1bHRzXCIpO1xuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGFyZ2V0LmlubmVyVGV4dCA9IFwiXCI7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKHRhYmxlKTtcbn1cblxuZnVuY3Rpb24gc2V0TWF4TGV2ZWxEaXNwbGF5VXBkYXRlKCkge1xuICAgIGNvbnN0IGxldmVsRGlzcGxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxEaXNwbGF5XCIpO1xuICAgIGlmICghKGxldmVsRGlzcGxheSBpbnN0YW5jZW9mIEhUTUxMYWJlbEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgY29uc3QgbGV2ZWxyYW5nZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxyYW5nZVwiKTtcbiAgICBpZiAoIShsZXZlbHJhbmdlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICBsZXZlbHJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICAgIGxldmVsRGlzcGxheS50ZXh0Q29udGVudCA9IGBNYXggbGV2ZWwgcmVxdWlyZW1lbnQ6ICR7bGV2ZWxyYW5nZS52YWx1ZX1gO1xuICAgICAgICB1cGRhdGVSZXN1bHRzKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldERpc3BsYXlVcGRhdGVzKCkge1xuICAgIHNldE1heExldmVsRGlzcGxheVVwZGF0ZSgpO1xuICAgIGNvbnN0IG5hbWVmaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVGaWx0ZXJcIik7XG4gICAgaWYgKCEobmFtZWZpbHRlciBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIG5hbWVmaWx0ZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHVwZGF0ZVJlc3VsdHMpO1xuXG4gICAgY29uc3QgZW5jaGFudFRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW5jaGFudFRvZ2dsZVwiKTtcbiAgICBpZiAoIShlbmNoYW50VG9nZ2xlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICBjb25zdCBwcmlvcml0eUxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByaW9yaXR5X2xpc3RcIik7XG4gICAgaWYgKCEocHJpb3JpdHlMaXN0IGluc3RhbmNlb2YgSFRNTE9MaXN0RWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICBlbmNoYW50VG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHByaW9yaXR5U3RhdE5vZGVzID0gQXJyYXlcbiAgICAgICAgICAgIC5mcm9tKHByaW9yaXR5TGlzdC5jaGlsZE5vZGVzKVxuICAgICAgICAgICAgLmZpbHRlcihub2RlID0+ICFub2RlLnRleHRDb250ZW50Py5pbmNsdWRlcygnXFxuJykpXG4gICAgICAgICAgICAuZmlsdGVyKG5vZGUgPT4gbm9kZS50ZXh0Q29udGVudCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIHByaW9yaXR5U3RhdE5vZGVzKSB7XG4gICAgICAgICAgICBjb25zdCByZWdleCA9IGVuY2hhbnRUb2dnbGUuY2hlY2tlZCA/IC9eKCg/OlN0cil8KD86U3RhKXwoPzpEZXgpfCg/OldpbGwpKSQvIDogL15NYXggKCg/OlN0cil8KD86U3RhKXwoPzpEZXgpfCg/OldpbGwpKSQvO1xuICAgICAgICAgICAgY29uc3QgcmVwbGFjZXIgPSBlbmNoYW50VG9nZ2xlLmNoZWNrZWQgPyBcIk1heCAkMVwiIDogXCIkMVwiO1xuICAgICAgICAgICAgbm9kZS50ZXh0Q29udGVudCA9IG5vZGUudGV4dENvbnRlbnQhLnNwbGl0KFwiK1wiKS5tYXAocyA9PiBzLnJlcGxhY2UocmVnZXgsIHJlcGxhY2VyKSkuam9pbihcIitcIik7XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlUmVzdWx0cygpO1xuICAgIH0pO1xufVxuXG5zZXREaXNwbGF5VXBkYXRlcygpO1xuXG5mdW5jdGlvbiBzZXRJdGVtVHlwZVNlbGVjdG9yRnVuY3Rpb25hbGl0eSgpIHtcbiAgICBjb25zdCBwcmlvcml0eV9ncm91cCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJpb3JpdHlfZ3JvdXBcIik7XG4gICAgaWYgKCEocHJpb3JpdHlfZ3JvdXAgaW5zdGFuY2VvZiBIVE1MRmllbGRTZXRFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBhcnRzU2VsZWN0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhcnRzU2VsZWN0b3JcIik7XG4gICAgaWYgKCEocGFydHNTZWxlY3RvciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFydHNGaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhcnRzRmlsdGVyXCIpO1xuICAgIGlmICghKHBhcnRzRmlsdGVyIGluc3RhbmNlb2YgSFRNTERpdkVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcGFydHNTZWxlY3Rvci5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgcHJpb3JpdHlfZ3JvdXAuY2xhc3NMaXN0LnJlbW92ZShcImRpc2FibGVkXCIpO1xuICAgICAgICBwYXJ0c0ZpbHRlci5jbGFzc0xpc3QucmVtb3ZlKFwiZGlzYWJsZWRcIik7XG4gICAgICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGdhY2hhU2VsZWN0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhY2hhU2VsZWN0b3JcIik7XG4gICAgaWYgKCEoZ2FjaGFTZWxlY3RvciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZ2FjaGFTZWxlY3Rvci5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgcHJpb3JpdHlfZ3JvdXAuY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuICAgICAgICBwYXJ0c0ZpbHRlci5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG4gICAgICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IG90aGVySXRlbXNTZWxlY3RvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3RoZXJJdGVtc1NlbGVjdG9yXCIpO1xuICAgIGlmICghKG90aGVySXRlbXNTZWxlY3RvciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgb3RoZXJJdGVtc1NlbGVjdG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICBwcmlvcml0eV9ncm91cC5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG4gICAgICAgIHBhcnRzRmlsdGVyLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgdXBkYXRlUmVzdWx0cygpO1xuICAgIH0pO1xufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgYXN5bmMgKCkgPT4ge1xuICAgIHNldEl0ZW1UeXBlU2VsZWN0b3JGdW5jdGlvbmFsaXR5KCk7XG4gICAgcmVzdG9yZVNlbGVjdGlvbigpO1xuICAgIGF3YWl0IGRvd25sb2FkSXRlbXMoKTtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInNob3dfYWZ0ZXJfbG9hZFwiKSkge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50LmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaGlkZV9hZnRlcl9sb2FkXCIpKSB7XG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGxldmVscmFuZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxldmVscmFuZ2VcIik7XG4gICAgaWYgKCEobGV2ZWxyYW5nZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgY29uc3QgbWF4TGV2ZWwgPSBnZXRNYXhJdGVtTGV2ZWwoKTtcbiAgICBsZXZlbHJhbmdlLnZhbHVlID0gYCR7TWF0aC5taW4ocGFyc2VJbnQobGV2ZWxyYW5nZS52YWx1ZSksIG1heExldmVsKX1gO1xuICAgIGxldmVscmFuZ2UubWF4ID0gYCR7bWF4TGV2ZWx9YDtcbiAgICBsZXZlbHJhbmdlLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiaW5wdXRcIikpO1xuICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICBjb25zdCBzb3J0X2hlbHAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByaW9yaXR5X2xlZ2VuZFwiKTtcbiAgICBpZiAoc29ydF9oZWxwIGluc3RhbmNlb2YgSFRNTExlZ2VuZEVsZW1lbnQpIHtcbiAgICAgICAgc29ydF9oZWxwLmFwcGVuZENoaWxkKGNyZWF0ZVBvcHVwTGluayhcIiAoPylcIiwgY3JlYXRlSFRNTChbXCJwXCIsXG4gICAgICAgICAgICBcIlJlb3JkZXIgdGhlIHN0YXRzIHRvIHlvdXIgbGlraW5nIHRvIGFmZmVjdCB0aGUgcmVzdWx0cyBsaXN0LlwiLCBbXCJiclwiXSxcbiAgICAgICAgICAgIFwiRHJhZyBhIHN0YXQgdXAgb3IgZG93biB0byBjaGFuZ2UgaXRzIGltcG9ydGFuY2UgKGZvciBleGFtcGxlIGRyYWcgTG9iIGFib3ZlIENoYXJnZSkuXCIsIFtcImJyXCJdLFxuICAgICAgICAgICAgXCJEcmFnIGEgc3RhdCBvbnRvIGFub3RoZXIgdG8gY29tYmluZSB0aGVtIChmb3IgZXhhbXBsZSBTdHIgb250byBEZXgsIHRoZSByZXN1bHRzIHdpbGwgZGlzcGxheSBTdHIrRGV4KS5cIiwgW1wiYnJcIl0sXG4gICAgICAgICAgICBcIkRyYWcgYSBjb21iaW5lZCBzdGF0IG9udG8gaXRzZWxmIHRvIHNlcGFyYXRlIHRoZW0uXCJdKSkpO1xuICAgIH1cbn0pO1xuXG5kb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgaWYgKCEoZXZlbnQudGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LnRhcmdldC5jbGFzc05hbWUgPT09IFwiaXRlbV9yZW1vdmFsXCIpIHtcbiAgICAgICAgaWYgKCFldmVudC50YXJnZXQuZGF0YXNldC5pdGVtX2luZGV4KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZXhjbHVkZWRfaXRlbV9pZHMuYWRkKHBhcnNlSW50KGV2ZW50LnRhcmdldC5kYXRhc2V0Lml0ZW1faW5kZXgpKTtcbiAgICAgICAgdXBkYXRlUmVzdWx0cygpO1xuICAgIH1cbiAgICBlbHNlIGlmIChldmVudC50YXJnZXQuY2xhc3NOYW1lID09PSBcIml0ZW1fcmVtb3ZhbF9yZW1vdmFsXCIpIHtcbiAgICAgICAgaWYgKCFldmVudC50YXJnZXQuZGF0YXNldC5pdGVtX2luZGV4KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZXhjbHVkZWRfaXRlbV9pZHMuZGVsZXRlKHBhcnNlSW50KGV2ZW50LnRhcmdldC5kYXRhc2V0Lml0ZW1faW5kZXgpKTtcbiAgICAgICAgdXBkYXRlUmVzdWx0cygpO1xuICAgIH1cbn0pOyIsImV4cG9ydCB0eXBlIFZhcmlhYmxlX3N0b3JhZ2VfdHlwZXMgPSBudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuO1xuXG50eXBlIFN0b3JhZ2VfdmFsdWUgPSBgJHtcInNcIiB8IFwiblwiIHwgXCJiXCJ9JHtzdHJpbmd9YDtcblxuZnVuY3Rpb24gdmFyaWFibGVfdG9fc3RyaW5nKHZhbHVlOiBWYXJpYWJsZV9zdG9yYWdlX3R5cGVzKTogU3RvcmFnZV92YWx1ZSB7XG4gICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICAgICAgcmV0dXJuIGBzJHt2YWx1ZX1gIGFzIGNvbnN0O1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgICAgICByZXR1cm4gYG4ke3ZhbHVlfWAgYXMgY29uc3Q7XG4gICAgICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPyBcImIxXCIgOiBcImIwXCI7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdHJpbmdfdG9fdmFyaWFibGUodnY6IFN0b3JhZ2VfdmFsdWUpOiBWYXJpYWJsZV9zdG9yYWdlX3R5cGVzIHtcbiAgICBjb25zdCBwcmVmaXggPSB2dlswXTtcbiAgICBjb25zdCB2YWx1ZSA9IHZ2LnN1YnN0cmluZygxKTtcbiAgICBzd2l0Y2ggKHByZWZpeCkge1xuICAgICAgICBjYXNlICdzJzogLy9zdHJpbmdcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgY2FzZSAnbic6IC8vbnVtYmVyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSk7XG4gICAgICAgIGNhc2UgJ2InOiAvL2Jvb2xlYW5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCIxXCIgPyB0cnVlIDogZmFsc2U7XG4gICAgfVxuICAgIHRocm93IGBpbnZhbGlkIHZhbHVlOiAke3Z2fWA7XG59XG5cbmZ1bmN0aW9uIGlzX3N0b3JhZ2VfdmFsdWUoa2V5OiBzdHJpbmcpOiBrZXkgaXMgU3RvcmFnZV92YWx1ZSB7XG4gICAgcmV0dXJuIGtleS5sZW5ndGggPj0gMSAmJiBcInNuYlwiLmluY2x1ZGVzKGtleVswXSk7XG59XG5cbmV4cG9ydCBjbGFzcyBWYXJpYWJsZV9zdG9yYWdlIHtcbiAgICBzdGF0aWMgZ2V0X3ZhcmlhYmxlKHZhcmlhYmxlX25hbWU6IHN0cmluZykge1xuICAgICAgICBjb25zdCBzdG9yZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShgJHt2YXJpYWJsZV9uYW1lfWApO1xuICAgICAgICBpZiAodHlwZW9mIHN0b3JlZCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNfc3RvcmFnZV92YWx1ZShzdG9yZWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cmluZ190b192YXJpYWJsZShzdG9yZWQpO1xuICAgIH1cbiAgICBzdGF0aWMgc2V0X3ZhcmlhYmxlKHZhcmlhYmxlX25hbWU6IHN0cmluZywgdmFsdWU6IFZhcmlhYmxlX3N0b3JhZ2VfdHlwZXMpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oYCR7dmFyaWFibGVfbmFtZX1gLCB2YXJpYWJsZV90b19zdHJpbmcodmFsdWUpKTtcbiAgICB9XG4gICAgc3RhdGljIGRlbGV0ZV92YXJpYWJsZSh2YXJpYWJsZV9uYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oYCR7dmFyaWFibGVfbmFtZX1gKTtcbiAgICB9XG4gICAgc3RhdGljIGNsZWFyX2FsbCgpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKCk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgdmFyaWFibGVzKCkge1xuICAgICAgICBsZXQgcmVzdWx0OiB7IFtrZXk6IHN0cmluZ106IFZhcmlhYmxlX3N0b3JhZ2VfdHlwZXMgfSA9IHt9O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsU3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gbG9jYWxTdG9yYWdlLmtleShpKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzX3N0b3JhZ2VfdmFsdWUodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IHN0cmluZ190b192YXJpYWJsZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59Il19
