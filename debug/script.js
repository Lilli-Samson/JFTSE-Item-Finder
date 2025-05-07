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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjaGVja2JveFRyZWUudHMiLCJodG1sLnRzIiwiaXRlbUxvb2t1cC50cyIsIm1haW4udHMiLCJzdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7QUNBQTtBQUlBLFNBQVMsV0FBVyxDQUFDLElBQXNCO0VBQ3ZDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhO0VBQ3BDLElBQUksRUFBRSxTQUFTLFlBQVksYUFBYSxDQUFDLEVBQUU7SUFDdkMsT0FBTyxFQUFFOztFQUViLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxhQUFhO0VBQ3pDLElBQUksRUFBRSxTQUFTLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUMxQyxPQUFPLEVBQUU7O0VBRWIsS0FBSyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUUsVUFBVSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFO0lBQzNFLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxTQUFTLEVBQUU7TUFDOUM7O0lBRUosTUFBTSxxQkFBcUIsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzdFLElBQUksRUFBRSxxQkFBcUIsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ3REOztJQUVKLE9BQU8sS0FBSyxDQUNQLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FDcEMsTUFBTSxDQUFFLENBQUMsSUFBeUIsQ0FBQyxZQUFZLGFBQWEsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLGdCQUFnQixDQUFDLENBQzFHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQXFCLENBQUM7O0VBRXBELE9BQU8s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LElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzNCOztNQUVKLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMxQjs7TUFFSixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDOztJQUUzQyxPQUFPLE1BQU07RUFDakI7O0FBQ0giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgeyBjcmVhdGVIVE1MIH0gZnJvbSAnLi9odG1sJztcblxuZXhwb3J0IHR5cGUgVHJlZU5vZGUgPSBzdHJpbmcgfCBUcmVlTm9kZVtdO1xuXG5mdW5jdGlvbiBnZXRDaGlsZHJlbihub2RlOiBIVE1MSW5wdXRFbGVtZW50KTogSFRNTElucHV0RWxlbWVudFtdIHtcbiAgICBjb25zdCBwYXJlbnRfbGkgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gICAgaWYgKCEocGFyZW50X2xpIGluc3RhbmNlb2YgSFRNTExJRWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRfdWwgPSBwYXJlbnRfbGkucGFyZW50RWxlbWVudDtcbiAgICBpZiAoIShwYXJlbnRfdWwgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGZvciAobGV0IGNoaWxkSW5kZXggPSAwOyBjaGlsZEluZGV4IDwgcGFyZW50X3VsLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleCsrKSB7XG4gICAgICAgIGlmIChwYXJlbnRfdWwuY2hpbGRyZW5bY2hpbGRJbmRleF0gIT09IHBhcmVudF9saSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcG90ZW50aWFsU2libGluZ0VudHJ5ID0gcGFyZW50X3VsLmNoaWxkcmVuW2NoaWxkSW5kZXggKyAxXT8uY2hpbGRyZW5bMF07XG4gICAgICAgIGlmICghKHBvdGVudGlhbFNpYmxpbmdFbnRyeSBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQXJyYXlcbiAgICAgICAgICAgIC5mcm9tKHBvdGVudGlhbFNpYmxpbmdFbnRyeS5jaGlsZHJlbilcbiAgICAgICAgICAgIC5maWx0ZXIoKGUpOiBlIGlzIEhUTUxMSUVsZW1lbnQgPT4gZSBpbnN0YW5jZW9mIEhUTUxMSUVsZW1lbnQgJiYgZS5jaGlsZHJlblswXSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpXG4gICAgICAgICAgICAubWFwKGUgPT4gZS5jaGlsZHJlblswXSBhcyBIVE1MSW5wdXRFbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBhcHBseUNoZWNrZWRUb0Rlc2NlbmRhbnRzKG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGdldENoaWxkcmVuKG5vZGUpKSB7XG4gICAgICAgIGlmIChjaGlsZC5jaGVja2VkICE9PSBub2RlLmNoZWNrZWQpIHtcbiAgICAgICAgICAgIGNoaWxkLmNoZWNrZWQgPSBub2RlLmNoZWNrZWQ7XG4gICAgICAgICAgICBjaGlsZC5pbmRldGVybWluYXRlID0gZmFsc2U7XG4gICAgICAgICAgICBhcHBseUNoZWNrZWRUb0Rlc2NlbmRhbnRzKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGFyZW50KG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpOiBIVE1MSW5wdXRFbGVtZW50IHwgdm9pZCB7XG4gICAgY29uc3QgcGFyZW50X2xpID0gbm9kZS5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghKHBhcmVudF9saSBpbnN0YW5jZW9mIEhUTUxMSUVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50X3VsID0gcGFyZW50X2xpLnBhcmVudEVsZW1lbnQ7XG4gICAgaWYgKCEocGFyZW50X3VsIGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgY2FuZGlkYXRlOiBIVE1MTElFbGVtZW50IHwgdm9pZDtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHBhcmVudF91bC5jaGlsZHJlbikge1xuICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBIVE1MTElFbGVtZW50ICYmIGNoaWxkLmNoaWxkcmVuWzBdIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgY2FuZGlkYXRlID0gY2hpbGQ7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGQgPT09IHBhcmVudF9saSAmJiBjYW5kaWRhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGUuY2hpbGRyZW5bMF0gYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlQW5jZXN0b3JzKG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnQobm9kZSk7XG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgZm91bmRDaGVja2VkID0gZmFsc2U7XG4gICAgbGV0IGZvdW5kVW5jaGVja2VkID0gZmFsc2U7XG4gICAgbGV0IGZvdW5kSW5kZXRlcm1pbmF0ZSA9IGZhbHNlXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBnZXRDaGlsZHJlbihwYXJlbnQpKSB7XG4gICAgICAgIGlmIChjaGlsZC5jaGVja2VkKSB7XG4gICAgICAgICAgICBmb3VuZENoZWNrZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm91bmRVbmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGlsZC5pbmRldGVybWluYXRlKSB7XG4gICAgICAgICAgICBmb3VuZEluZGV0ZXJtaW5hdGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChmb3VuZEluZGV0ZXJtaW5hdGUgfHwgZm91bmRDaGVja2VkICYmIGZvdW5kVW5jaGVja2VkKSB7XG4gICAgICAgIHBhcmVudC5pbmRldGVybWluYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZm91bmRDaGVja2VkKSB7XG4gICAgICAgIHBhcmVudC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgcGFyZW50LmluZGV0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZm91bmRVbmNoZWNrZWQpIHtcbiAgICAgICAgcGFyZW50LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgcGFyZW50LmluZGV0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgdXBkYXRlQW5jZXN0b3JzKHBhcmVudCk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5Q2hlY2tMaXN0ZW5lcihub2RlOiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGUgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldDtcbiAgICAgICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhcHBseUNoZWNrZWRUb0Rlc2NlbmRhbnRzKHRhcmdldCk7XG4gICAgICAgIHVwZGF0ZUFuY2VzdG9ycyh0YXJnZXQpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBhcHBseUNoZWNrTGlzdGVuZXJzKG5vZGU6IEhUTUxVTGlzdEVsZW1lbnQpIHtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxMSUVsZW1lbnQpIHtcbiAgICAgICAgICAgIGFwcGx5Q2hlY2tMaXN0ZW5lcihlbGVtZW50LmNoaWxkcmVuWzBdIGFzIEhUTUxJbnB1dEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSB7XG4gICAgICAgICAgICBhcHBseUNoZWNrTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYWtlQ2hlY2tib3hUcmVlTm9kZSh0cmVlTm9kZTogVHJlZU5vZGUpOiBIVE1MTElFbGVtZW50IHtcbiAgICBpZiAodHlwZW9mIHRyZWVOb2RlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGxldCBkaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICBpZiAodHJlZU5vZGVbMF0gPT09IFwiLVwiKSB7XG4gICAgICAgICAgICB0cmVlTm9kZSA9IHRyZWVOb2RlLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIGRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICBpZiAodHJlZU5vZGVbMF0gPT09IFwiK1wiKSB7XG4gICAgICAgICAgICB0cmVlTm9kZSA9IHRyZWVOb2RlLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIGNoZWNrZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IGNyZWF0ZUhUTUwoW1xuICAgICAgICAgICAgXCJsaVwiLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIFwiaW5wdXRcIixcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiY2hlY2tib3hcIixcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHRyZWVOb2RlLnJlcGxhY2VBbGwoXCIgXCIsIFwiX1wiKSxcbiAgICAgICAgICAgICAgICAgICAgLi4uKGNoZWNrZWQgJiYgeyBjaGVja2VkOiBcImNoZWNrZWRcIiB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiLFxuICAgICAgICAgICAgICAgIHsgZm9yOiB0cmVlTm9kZS5yZXBsYWNlQWxsKFwiIFwiLCBcIl9cIikgfSxcbiAgICAgICAgICAgICAgICB0cmVlTm9kZVxuICAgICAgICAgICAgXVxuICAgICAgICBdKTtcbiAgICAgICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICAgICAgICBub2RlLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IGxpc3QgPSBjcmVhdGVIVE1MKFtcInVsXCIsIHsgY2xhc3M6IFwiY2hlY2tib3hcIiB9XSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHJlZU5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0cmVlTm9kZVtpXTtcbiAgICAgICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQobWFrZUNoZWNrYm94VHJlZU5vZGUobm9kZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjcmVhdGVIVE1MKFtcImxpXCIsIGxpc3RdKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlQ2hlY2tib3hUcmVlKHRyZWVOb2RlOiBUcmVlTm9kZSkge1xuICAgIGxldCByb290ID0gbWFrZUNoZWNrYm94VHJlZU5vZGUodHJlZU5vZGUpLmNoaWxkcmVuWzBdO1xuICAgIGlmICghKHJvb3QgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGFwcGx5Q2hlY2tMaXN0ZW5lcnMocm9vdCk7XG4gICAgZm9yIChjb25zdCBsZWFmIG9mIGdldExlYXZlcyhyb290KSkge1xuICAgICAgICB1cGRhdGVBbmNlc3RvcnMobGVhZik7XG4gICAgfVxuICAgIHJldHVybiByb290O1xufVxuXG5mdW5jdGlvbiBnZXRMZWF2ZXMobm9kZTogSFRNTFVMaXN0RWxlbWVudCkge1xuICAgIGxldCByZXN1bHQ6IEhUTUxJbnB1dEVsZW1lbnRbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgIGNvbnN0IGlucHV0ID0gZWxlbWVudC5jaGlsZHJlblswXTtcbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGdldENoaWxkcmVuKGlucHV0KS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KGdldExlYXZlcyhpbnB1dCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMZWFmU3RhdGVzKG5vZGU6IEhUTUxVTGlzdEVsZW1lbnQpIHtcbiAgICBsZXQgc3RhdGVzOiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSA9IHt9O1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiBnZXRMZWF2ZXMobm9kZSkpIHtcbiAgICAgICAgc3RhdGVzW2xlYWYuaWQucmVwbGFjZUFsbChcIl9cIiwgXCIgXCIpXSA9IGxlYWYuY2hlY2tlZDtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldExlYWZTdGF0ZXMobm9kZTogSFRNTFVMaXN0RWxlbWVudCwgc3RhdGVzOiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSkge1xuICAgIGZvciAoY29uc3QgbGVhZiBvZiBnZXRMZWF2ZXMobm9kZSkpIHtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzdGF0ZXNbbGVhZi5pZC5yZXBsYWNlQWxsKFwiX1wiLCBcIiBcIildO1xuICAgICAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZWFmLmNoZWNrZWQgPSBzdGF0ZTtcbiAgICAgICAgdXBkYXRlQW5jZXN0b3JzKGxlYWYpO1xuICAgIH1cbn0iLCJ0eXBlIFRhZ19uYW1lID0ga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwO1xudHlwZSBBdHRyaWJ1dGVzID0geyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbnR5cGUgSFRNTF9ub2RlPFQgZXh0ZW5kcyBUYWdfbmFtZT4gPSBbVCwgLi4uKEhUTUxfbm9kZTxUYWdfbmFtZT4gfCBIVE1MRWxlbWVudCB8IHN0cmluZyB8IEF0dHJpYnV0ZXMpW11dO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSFRNTDxUIGV4dGVuZHMgVGFnX25hbWU+KG5vZGU6IEhUTUxfbm9kZTxUPik6IEhUTUxFbGVtZW50VGFnTmFtZU1hcFtUXSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZVswXSk7XG4gICAgZnVuY3Rpb24gaGFuZGxlKHBhcmFtZXRlcjogQXR0cmlidXRlcyB8IEhUTUxfbm9kZTxUYWdfbmFtZT4gfCBIVE1MRWxlbWVudCB8IHN0cmluZykge1xuICAgICAgICBpZiAodHlwZW9mIHBhcmFtZXRlciA9PT0gXCJzdHJpbmdcIiB8fCBwYXJhbWV0ZXIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQocGFyYW1ldGVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBhcmFtZXRlcikpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKGNyZWF0ZUhUTUwocGFyYW1ldGVyKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwYXJhbWV0ZXIpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHBhcmFtZXRlcltrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IG5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGFuZGxlKG5vZGVbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbn1cbiIsImltcG9ydCB7IGNyZWF0ZUhUTUwgfSBmcm9tICcuL2h0bWwnO1xuXG5leHBvcnQgY29uc3QgY2hhcmFjdGVycyA9IFtcIk5pa2lcIiwgXCJMdW5MdW5cIiwgXCJMdWN5XCIsIFwiU2h1YVwiLCBcIkRoYW5waXJcIiwgXCJQb2NoaVwiLCBcIkFsXCJdIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQ2hhcmFjdGVyID0gdHlwZW9mIGNoYXJhY3RlcnNbbnVtYmVyXTtcbmV4cG9ydCBmdW5jdGlvbiBpc0NoYXJhY3RlcihjaGFyYWN0ZXI6IHN0cmluZyk6IGNoYXJhY3RlciBpcyBDaGFyYWN0ZXIge1xuICAgIHJldHVybiAoY2hhcmFjdGVycyBhcyB1bmtub3duIGFzIHN0cmluZ1tdKS5pbmNsdWRlcyhjaGFyYWN0ZXIpO1xufVxuXG5leHBvcnQgdHlwZSBQYXJ0ID0gXCJIYXRcIiB8IFwiSGFpclwiIHwgXCJEeWVcIiB8IFwiVXBwZXJcIiB8IFwiTG93ZXJcIiB8IFwiU2hvZXNcIiB8IFwiU29ja3NcIiB8IFwiSGFuZFwiIHwgXCJCYWNrcGFja1wiIHwgXCJGYWNlXCIgfCBcIlJhY2tldFwiIHwgXCJPdGhlclwiO1xuXG5leHBvcnQgY2xhc3MgSXRlbVNvdXJjZSB7XG4gICAgY29uc3RydWN0b3IocmVhZG9ubHkgc2hvcF9pZDogbnVtYmVyKSB7IH1cblxuICAgIGdldCByZXF1aXJlc0d1YXJkaWFuKCk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIFNob3BJdGVtU291cmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcyBpbnN0YW5jZW9mIEdhY2hhSXRlbVNvdXJjZSkge1xuICAgICAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW0uc291cmNlcy52YWx1ZXMoKV0uZXZlcnkoc291cmNlID0+IHNvdXJjZS5yZXF1aXJlc0d1YXJkaWFuKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzIGluc3RhbmNlb2YgR3VhcmRpYW5JdGVtU291cmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpdGVtKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gc2hvcF9pdGVtcy5nZXQodGhpcy5zaG9wX2lkKTtcbiAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgZmluZGluZyBpdGVtIG9mIGl0ZW1Tb3VyY2UgJHt0aGlzLnNob3BfaWR9YCk7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2hvcEl0ZW1Tb3VyY2UgZXh0ZW5kcyBJdGVtU291cmNlIHtcbiAgICBjb25zdHJ1Y3RvcihzaG9wX2lkOiBudW1iZXIsIHJlYWRvbmx5IHByaWNlOiBudW1iZXIsIHJlYWRvbmx5IGFwOiBib29sZWFuLCByZWFkb25seSBpdGVtczogSXRlbVtdKSB7XG4gICAgICAgIHN1cGVyKHNob3BfaWQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdhY2hhSXRlbVNvdXJjZSBleHRlbmRzIEl0ZW1Tb3VyY2Uge1xuICAgIGNvbnN0cnVjdG9yKHNob3BfaWQ6IG51bWJlcikge1xuICAgICAgICBzdXBlcihzaG9wX2lkKTtcbiAgICB9XG5cbiAgICBnYWNoYVRyaWVzKGl0ZW06IEl0ZW0sIGNoYXJhY3Rlcj86IENoYXJhY3Rlcikge1xuICAgICAgICBjb25zdCBnYWNoYSA9IGdhY2hhcy5nZXQodGhpcy5zaG9wX2lkKTtcbiAgICAgICAgaWYgKCFnYWNoYSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnYWNoYS5hdmVyYWdlX3RyaWVzKGl0ZW0sIGNoYXJhY3Rlcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgR3VhcmRpYW5JdGVtU291cmNlIGV4dGVuZHMgSXRlbVNvdXJjZSB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHJlYWRvbmx5IGd1YXJkaWFuX21hcDogc3RyaW5nLFxuICAgICAgICByZWFkb25seSBpdGVtczogSXRlbVtdLFxuICAgICAgICByZWFkb25seSB4cDogbnVtYmVyLFxuICAgICAgICByZWFkb25seSBuZWVkX2Jvc3M6IGJvb2xlYW4sXG4gICAgICAgIHJlYWRvbmx5IGJvc3NfdGltZTogbnVtYmVyKSB7XG4gICAgICAgIHN1cGVyKEd1YXJkaWFuSXRlbVNvdXJjZS5ndWFyZGlhbl9tYXBfaWQoZ3VhcmRpYW5fbWFwKSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGd1YXJkaWFuX21hcF9pZChtYXA6IHN0cmluZykge1xuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLmd1YXJkaWFuX21hcHMuaW5kZXhPZihtYXApO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICBpbmRleCA9IHRoaXMuZ3VhcmRpYW5fbWFwcy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLmd1YXJkaWFuX21hcHMucHVzaChtYXApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtaW5kZXg7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgZ3VhcmRpYW5fbWFwcyA9IFtcIlwiXTtcbn1cblxuZXhwb3J0IGNsYXNzIEl0ZW0ge1xuICAgIGlkID0gMDtcbiAgICBuYW1lX2tyID0gXCJcIjtcbiAgICBuYW1lX2VuID0gXCJcIjtcbiAgICB1c2VUeXBlID0gXCJcIjtcbiAgICBtYXhVc2UgPSAwO1xuICAgIGhpZGRlbiA9IGZhbHNlO1xuICAgIHJlc2lzdCA9IFwiXCI7XG4gICAgY2hhcmFjdGVyPzogQ2hhcmFjdGVyO1xuICAgIHBhcnQ6IFBhcnQgPSBcIk90aGVyXCI7XG4gICAgbGV2ZWwgPSAwO1xuICAgIHN0ciA9IDA7XG4gICAgc3RhID0gMDtcbiAgICBkZXggPSAwO1xuICAgIHdpbCA9IDA7XG4gICAgaHAgPSAwO1xuICAgIHF1aWNrc2xvdHMgPSAwO1xuICAgIGJ1ZmZzbG90cyA9IDA7XG4gICAgc21hc2ggPSAwO1xuICAgIG1vdmVtZW50ID0gMDtcbiAgICBjaGFyZ2UgPSAwO1xuICAgIGxvYiA9IDA7XG4gICAgc2VydmUgPSAwO1xuICAgIG1heF9zdHIgPSAwO1xuICAgIG1heF9zdGEgPSAwO1xuICAgIG1heF9kZXggPSAwO1xuICAgIG1heF93aWwgPSAwO1xuICAgIGVsZW1lbnRfZW5jaGFudGFibGUgPSBmYWxzZTtcbiAgICBwYXJjZWxfZW5hYmxlZCA9IGZhbHNlO1xuICAgIHBhcmNlbF9mcm9tX3Nob3AgPSBmYWxzZTtcbiAgICBzcGluID0gMDtcbiAgICBhdHNzID0gMDtcbiAgICBkZnNzID0gMDtcbiAgICBzb2NrZXQgPSAwO1xuICAgIGdhdWdlID0gMDtcbiAgICBnYXVnZV9iYXR0bGUgPSAwO1xuICAgIHNvdXJjZXM6IEl0ZW1Tb3VyY2VbXSA9IFtdO1xuICAgIHN0YXRGcm9tU3RyaW5nKG5hbWU6IHN0cmluZyk6IG51bWJlciB7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIk1vdiBTcGVlZFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1vdmVtZW50O1xuICAgICAgICAgICAgY2FzZSBcIkNoYXJnZVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoYXJnZTtcbiAgICAgICAgICAgIGNhc2UgXCJMb2JcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2I7XG4gICAgICAgICAgICBjYXNlIFwiU21hc2hcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zbWFzaDtcbiAgICAgICAgICAgIGNhc2UgXCJTdHJcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHI7XG4gICAgICAgICAgICBjYXNlIFwiRGV4XCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGV4O1xuICAgICAgICAgICAgY2FzZSBcIlN0YVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YTtcbiAgICAgICAgICAgIGNhc2UgXCJXaWxsXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2lsO1xuICAgICAgICAgICAgY2FzZSBcIk1heCBTdHJcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXhfc3RyO1xuICAgICAgICAgICAgY2FzZSBcIk1heCBEZXhcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXhfZGV4O1xuICAgICAgICAgICAgY2FzZSBcIk1heCBTdGFcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXhfc3RhO1xuICAgICAgICAgICAgY2FzZSBcIk1heCBXaWxsXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWF4X3dpbDtcbiAgICAgICAgICAgIGNhc2UgXCJTZXJ2ZVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlcnZlO1xuICAgICAgICAgICAgY2FzZSBcIlF1aWNrc2xvdHNcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWlja3Nsb3RzO1xuICAgICAgICAgICAgY2FzZSBcIkJ1ZmZzbG90c1wiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJ1ZmZzbG90cztcbiAgICAgICAgICAgIGNhc2UgXCJIUFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhwO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIEdhY2hhIHtcbiAgICBjb25zdHJ1Y3RvcihyZWFkb25seSBzaG9wX2luZGV4OiBudW1iZXIsIHJlYWRvbmx5IGdhY2hhX2luZGV4OiBudW1iZXIsIHJlYWRvbmx5IG5hbWU6IHN0cmluZykge1xuICAgICAgICBmb3IgKGNvbnN0IGNoYXJhY3RlciBvZiBjaGFyYWN0ZXJzKSB7XG4gICAgICAgICAgICB0aGlzLnNob3BfaXRlbXMuc2V0KGNoYXJhY3RlciwgbmV3IE1hcDxJdGVtLCBbLypwcm9iYWJpbGl0eToqLyBudW1iZXIsIC8qcXVhbnRpdHlfbWluOiovIG51bWJlciwgLypxdWFudGl0eV9tYXg6Ki8gbnVtYmVyXT4oKSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZChpdGVtOiBJdGVtLCBwcm9iYWJpbGl0eTogbnVtYmVyLCBjaGFyYWN0ZXI6IENoYXJhY3RlciwgcXVhbnRpdHlfbWluOiBudW1iZXIsIHF1YW50aXR5X21heDogbnVtYmVyKSB7XG4gICAgICAgIGlmIChpdGVtLmNoYXJhY3RlciAmJiBpdGVtLmNoYXJhY3RlciAhPT0gY2hhcmFjdGVyKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhgSXRlbSAke2l0ZW0uaWR9IGZyb20gZ2FjaGEgXCIke3RoaXMubmFtZX1cIiAke3RoaXMuZ2FjaGFfaW5kZXh9IGhhcyB3cm9uZyBjaGFyYWN0ZXJgKTtcbiAgICAgICAgICAgIGNoYXJhY3RlciA9IGl0ZW0uY2hhcmFjdGVyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2hvcF9pdGVtcy5nZXQoY2hhcmFjdGVyKSEuc2V0KGl0ZW0sIFtwcm9iYWJpbGl0eSwgcXVhbnRpdHlfbWluLCBxdWFudGl0eV9tYXhdKTtcbiAgICAgICAgdGhpcy5jaGFyYWN0ZXJfcHJvYmFiaWxpdHkuc2V0KGNoYXJhY3RlciwgcHJvYmFiaWxpdHkgKyAodGhpcy5jaGFyYWN0ZXJfcHJvYmFiaWxpdHkuZ2V0KGNoYXJhY3RlcikgfHwgMCkpO1xuICAgIH1cblxuICAgIGF2ZXJhZ2VfdHJpZXMoaXRlbTogSXRlbSwgY2hhcmFjdGVyOiBDaGFyYWN0ZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgY2hhcnM6IHJlYWRvbmx5IENoYXJhY3RlcltdID0gY2hhcmFjdGVyID8gKFtjaGFyYWN0ZXJdKSA6IGNoYXJhY3RlcnM7XG4gICAgICAgIGNvbnN0IHByb2JhYmlsaXR5ID0gY2hhcnMucmVkdWNlKChwLCBjaGFyYWN0ZXIpID0+IHAgKyAodGhpcy5zaG9wX2l0ZW1zLmdldChjaGFyYWN0ZXIpIS5nZXQoaXRlbSk/LlswXSB8fCAwKSwgMCk7XG4gICAgICAgIGlmIChwcm9iYWJpbGl0eSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdG90YWxfcHJvYmFiaWxpdHkgPSBjaGFycy5yZWR1Y2UoKHAsIGNoYXJhY3RlcikgPT4gcCArIHRoaXMuY2hhcmFjdGVyX3Byb2JhYmlsaXR5LmdldChjaGFyYWN0ZXIpISwgMCk7XG4gICAgICAgIHJldHVybiB0b3RhbF9wcm9iYWJpbGl0eSAvIHByb2JhYmlsaXR5O1xuICAgIH1cblxuICAgIGdldCB0b3RhbF9wcm9iYWJpbGl0eSgpIHtcbiAgICAgICAgcmV0dXJuIGNoYXJhY3RlcnMucmVkdWNlKChwLCBjaGFyYWN0ZXIpID0+IHAgKyB0aGlzLmNoYXJhY3Rlcl9wcm9iYWJpbGl0eS5nZXQoY2hhcmFjdGVyKSEsIDApO1xuICAgIH1cblxuICAgIGNoYXJhY3Rlcl9wcm9iYWJpbGl0eSA9IG5ldyBNYXA8Q2hhcmFjdGVyLCBudW1iZXI+KCk7XG4gICAgc2hvcF9pdGVtcyA9IG5ldyBNYXA8Q2hhcmFjdGVyLCBNYXA8SXRlbSwgWy8qcHJvYmFiaWxpdHk6Ki8gbnVtYmVyLCAvKnF1YW50aXR5X21pbjoqLyBudW1iZXIsIC8qcXVhbnRpdHlfbWF4OiovIG51bWJlcl0+PigpO1xufVxuXG5leHBvcnQgbGV0IGl0ZW1zID0gbmV3IE1hcDxudW1iZXIsIEl0ZW0+KCk7XG5leHBvcnQgbGV0IHNob3BfaXRlbXMgPSBuZXcgTWFwPG51bWJlciwgSXRlbT4oKTtcbmxldCBnYWNoYXMgPSBuZXcgTWFwPG51bWJlciwgR2FjaGE+KCk7XG5sZXQgZGlhbG9nOiBIVE1MRGlhbG9nRWxlbWVudCB8IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gcHJldHR5TnVtYmVyKG46IG51bWJlciwgZGlnaXRzOiBudW1iZXIpIHtcbiAgICBsZXQgcyA9IG4udG9GaXhlZChkaWdpdHMpO1xuICAgIHdoaWxlIChzLmVuZHNXaXRoKFwiMFwiKSkge1xuICAgICAgICBzID0gcy5zbGljZSgwLCAtMSk7XG4gICAgfVxuICAgIGlmIChzLmVuZHNXaXRoKFwiLlwiKSkge1xuICAgICAgICBzID0gcy5zbGljZSgwLCAtMSk7XG4gICAgfVxuICAgIHJldHVybiBzO1xufVxuXG5mdW5jdGlvbiBwYXJzZUl0ZW1EYXRhKGRhdGE6IHN0cmluZykge1xuICAgIGlmIChkYXRhLmxlbmd0aCA8IDEwMDApIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBJdGVtcyBmaWxlIGlzIG9ubHkgJHtkYXRhLmxlbmd0aH0gYnl0ZXMgbG9uZ2ApO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFssIHJlc3VsdF0gb2YgZGF0YS5tYXRjaEFsbCgvXFw8SXRlbSAoLiopXFwvXFw+L2cpKSB7XG4gICAgICAgIGNvbnN0IGl0ZW06IEl0ZW0gPSBuZXcgSXRlbTtcbiAgICAgICAgZm9yIChjb25zdCBbLCBhdHRyaWJ1dGUsIHZhbHVlXSBvZiByZXN1bHQubWF0Y2hBbGwoL1xccz8oW149XSopPVwiKFteXCJdKilcIi9nKSkge1xuICAgICAgICAgICAgc3dpdGNoIChhdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiSW5kZXhcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5pZCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIl9OYW1lX1wiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWVfa3IgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk5hbWVfTlwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWVfZW4gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlVzZVR5cGVcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS51c2VUeXBlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNYXhVc2VcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tYXhVc2UgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJIaWRlXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uaGlkZGVuID0gISFwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJSZXNpc3RcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5yZXNpc3QgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkNoYXJcIjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk5JS0lcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJhY3RlciA9IFwiTmlraVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxVTkxVTlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJMdW5MdW5cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMVUNZXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIkx1Y3lcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJTSFVBXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIlNodWFcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJESEFOUElSXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIkRoYW5waXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJQT0NISVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJQb2NoaVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFMXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIkFsXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRm91bmQgdW5rbm93biBjaGFyYWN0ZXIgXCIke3ZhbHVlfVwiYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlBhcnRcIjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQkFHXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJCYWNrcGFja1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkdMQVNTRVNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkZhY2VcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIQU5EXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJIYW5kXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiU09DS1NcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIlNvY2tzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRk9PVFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiU2hvZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJDQVBcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkhhdFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlBBTlRTXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJMb3dlclwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlJBQ0tFVFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiUmFja2V0XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQk9EWVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiVXBwZXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIQUlSXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJIYWlyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRFlFXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJEeWVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBGb3VuZCB1bmtub3duIHBhcnQgJHt2YWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTGV2ZWxcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5sZXZlbCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNUUlwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnN0ciA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNUQVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnN0YSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRFWFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRleCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIldJTFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLndpbCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFkZEhQXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uaHAgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJBZGRRdWlja1wiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnF1aWNrc2xvdHMgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJBZGRCdWZmXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYnVmZnNsb3RzID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiU21hc2hTcGVlZFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNtYXNoID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTW92ZVNwZWVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubW92ZW1lbnQgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJDaGFyZ2VzaG90U3BlZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyZ2UgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJMb2JTcGVlZFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmxvYiA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNlcnZlU3BlZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXJ2ZSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk1BWF9TVFJcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tYXhfc3RyID0gTWF0aC5tYXgocGFyc2VJbnQodmFsdWUpLCBpdGVtLnN0cik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNQVhfU1RBXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubWF4X3N0YSA9IE1hdGgubWF4KHBhcnNlSW50KHZhbHVlKSwgaXRlbS5zdGEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTUFYX0RFWFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm1heF9kZXggPSBNYXRoLm1heChwYXJzZUludCh2YWx1ZSksIGl0ZW0uZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk1BWF9XSUxcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tYXhfd2lsID0gTWF0aC5tYXgocGFyc2VJbnQodmFsdWUpLCBpdGVtLndpbCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJFbmNoYW50RWxlbWVudFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmVsZW1lbnRfZW5jaGFudGFibGUgPSAhIXBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkVuYWJsZVBhcmNlbFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcmNlbF9lbmFibGVkID0gISFwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJCYWxsU3BpblwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNwaW4gPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJBVFNTXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYXRzcyA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRGU1NcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kZnNzID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiU29ja2V0XCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc29ja2V0ID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiR2F1Z2VcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5nYXVnZSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkdhdWdlQmF0dGxlXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZ2F1Z2VfYmF0dGxlID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZvdW5kIHVua25vd24gaXRlbSBhdHRyaWJ1dGUgXCIke2F0dHJpYnV0ZX1cImApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGl0ZW1zLnNldChpdGVtLmlkLCBpdGVtKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlU2hvcERhdGEoZGF0YTogc3RyaW5nKSB7XG4gICAgY29uc3QgZGVidWdTaG9wUGFyc2luZyA9IGZhbHNlO1xuICAgIGlmIChkYXRhLmxlbmd0aCA8IDEwMDApIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBTaG9wIGZpbGUgaXMgb25seSAke2RhdGEubGVuZ3RofSBieXRlcyBsb25nYCk7XG4gICAgfVxuICAgIGxldCBjb3VudCA9IDA7XG4gICAgbGV0IGN1cnJlbnRJbmRleCA9IDA7XG4gICAgZm9yIChjb25zdCBtYXRjaCBvZiBkYXRhLm1hdGNoQWxsKC88UHJvZHVjdCBESVNQTEFZPVwiXFxkK1wiIEhJVF9ESVNQTEFZPVwiXFxkK1wiIEluZGV4PVwiKD88aW5kZXg+XFxkKylcIiBFbmFibGU9XCIoPzxlbmFibGVkPjB8MSlcIiBOZXc9XCJcXGQrXCIgSGl0PVwiXFxkK1wiIEZyZWU9XCJcXGQrXCIgU2FsZT1cIlxcZCtcIiBFdmVudD1cIlxcZCtcIiBDb3VwbGU9XCJcXGQrXCIgTm9idXk9XCJcXGQrXCIgUmFuZD1cIlteXCJdK1wiIFVzZVR5cGU9XCJbXlwiXStcIiBVc2UwPVwiXFxkK1wiIFVzZTE9XCJcXGQrXCIgVXNlMj1cIlxcZCtcIiBQcmljZVR5cGU9XCIoPzxwcmljZV90eXBlPig/Ok1JTlQpfCg/OkdPTEQpKVwiIE9sZFByaWNlMD1cIi0/XFxkK1wiIE9sZFByaWNlMT1cIi0/XFxkK1wiIE9sZFByaWNlMj1cIi0/XFxkK1wiIFByaWNlMD1cIig/PHByaWNlPi0/XFxkKylcIiBQcmljZTE9XCItP1xcZCtcIiBQcmljZTI9XCItP1xcZCtcIiBDb3VwbGVQcmljZT1cIi0/XFxkK1wiIENhdGVnb3J5PVwiKD88Y2F0ZWdvcnk+W15cIl0qKVwiIE5hbWU9XCIoPzxuYW1lPlteXCJdKilcIiBHb2xkQmFjaz1cIi0/XFxkK1wiIEVuYWJsZVBhcmNlbD1cIig/PHBhcmNlbF9mcm9tX3Nob3A+MHwxKVwiIENoYXI9XCItP1xcZCtcIiBJdGVtMD1cIig/PGl0ZW0wPi0/XFxkKylcIiBJdGVtMT1cIig/PGl0ZW0xPi0/XFxkKylcIiBJdGVtMj1cIig/PGl0ZW0yPi0/XFxkKylcIiBJdGVtMz1cIig/PGl0ZW0zPi0/XFxkKylcIiBJdGVtND1cIig/PGl0ZW00Pi0/XFxkKylcIiBJdGVtNT1cIig/PGl0ZW01Pi0/XFxkKylcIiBJdGVtNj1cIig/PGl0ZW02Pi0/XFxkKylcIiBJdGVtNz1cIig/PGl0ZW03Pi0/XFxkKylcIiBJdGVtOD1cIig/PGl0ZW04Pi0/XFxkKylcIiBJdGVtOT1cIig/PGl0ZW05Pi0/XFxkKylcIiA/KD86SWNvbj1cIlteXCJdKlwiID8pPyg/Ok5hbWVfa3I9XCJbXlwiXSpcIiA/KT8oPzpOYW1lX2VuPVwiKD88bmFtZV9lbj5bXlwiXSopXCIgPyk/KD86TmFtZV90aD1cIlteXCJdKlwiID8pP1xcLz4vZykpIHtcbiAgICAgICAgaWYgKCFtYXRjaC5ncm91cHMpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcGFyc2VJbnQobWF0Y2guZ3JvdXBzLmluZGV4KTtcbiAgICAgICAgaWYgKGN1cnJlbnRJbmRleCArIDEgIT09IGluZGV4KSB7XG4gICAgICAgICAgICBkZWJ1Z1Nob3BQYXJzaW5nICYmIGNvbnNvbGUud2FybihgRmFpbGVkIHBhcnNpbmcgc2hvcCBpdGVtIGluZGV4ICR7Y3VycmVudEluZGV4ICsgMiA9PT0gaW5kZXggPyBjdXJyZW50SW5kZXggKyAxIDogYCR7Y3VycmVudEluZGV4ICsgMX0gdG8gJHtpbmRleCAtIDF9YH1gKTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICAgICAgY29uc3QgbmFtZSA9IG1hdGNoLmdyb3Vwcy5uYW1lO1xuICAgICAgICBjb25zdCBjYXRlZ29yeSA9IG1hdGNoLmdyb3Vwcy5jYXRlZ29yeTtcbiAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcIkxPVFRFUllcIikge1xuICAgICAgICAgICAgZ2FjaGFzLnNldChpbmRleCwgbmV3IEdhY2hhKGluZGV4LCBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTApLCBuYW1lKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW5hYmxlZCA9ICEhcGFyc2VJbnQobWF0Y2guZ3JvdXBzLmVuYWJsZWQpO1xuICAgICAgICBjb25zdCBwcmljZV90eXBlOiBcImFwXCIgfCBcImdvbGRcIiB8IFwibm9uZVwiID0gbWF0Y2guZ3JvdXBzLnByaWNlX3R5cGUgPT09IFwiTUlOVFwiID8gXCJhcFwiIDogbWF0Y2guZ3JvdXBzLnByaWNlX3R5cGUgPT09IFwiR09MRFwiID8gXCJnb2xkXCIgOiBcIm5vbmVcIjtcbiAgICAgICAgY29uc3QgcHJpY2UgPSBwYXJzZUludChtYXRjaC5ncm91cHMucHJpY2UpO1xuICAgICAgICBjb25zdCBwYXJjZWxfZnJvbV9zaG9wID0gISFwYXJzZUludChtYXRjaC5ncm91cHMucGFyY2VsX2Zyb21fc2hvcCk7XG4gICAgICAgIGNvbnN0IGl0ZW1JRHMgPSBbXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTApLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0xKSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtMiksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTMpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW00KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtNSksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTYpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW03KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtOCksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTkpLFxuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IGlubmVyX2l0ZW1zID0gaXRlbUlEcy5maWx0ZXIoaWQgPT4gISFpZCAmJiBpdGVtcy5nZXQoaWQpKS5tYXAoaWQgPT4gaXRlbXMuZ2V0KGlkKSEpO1xuXG4gICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJQQVJUU1wiKSB7XG4gICAgICAgICAgICBpZiAoaW5uZXJfaXRlbXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgc2hvcF9pdGVtcy5zZXQoaW5kZXgsIGlubmVyX2l0ZW1zWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBuZXcgSXRlbSgpO1xuICAgICAgICAgICAgICAgIGl0ZW0ubmFtZV9lbiA9IG1hdGNoLmdyb3Vwcy5uYW1lX2VuIHx8IG1hdGNoLmdyb3Vwcy5uYW1lO1xuICAgICAgICAgICAgICAgIHNob3BfaXRlbXMuc2V0KGluZGV4LCBpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVNvdXJjZSA9IG5ldyBTaG9wSXRlbVNvdXJjZShpbmRleCwgcHJpY2UsIHByaWNlX3R5cGUgPT09IFwiYXBcIiwgaW5uZXJfaXRlbXMpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpbm5lcl9pdGVtcykge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnNvdXJjZXMucHVzaChpdGVtU291cmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY2F0ZWdvcnkgPT09IFwiTE9UVEVSWVwiKSB7XG4gICAgICAgICAgICBjb25zdCBnYWNoYUl0ZW0gPSBuZXcgSXRlbSgpO1xuICAgICAgICAgICAgZ2FjaGFJdGVtLm5hbWVfZW4gPSBtYXRjaC5ncm91cHMubmFtZV9lbiB8fCBtYXRjaC5ncm91cHMubmFtZTtcbiAgICAgICAgICAgIHNob3BfaXRlbXMuc2V0KGluZGV4LCBnYWNoYUl0ZW0pO1xuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBnYWNoYUl0ZW0uc291cmNlcy5wdXNoKG5ldyBTaG9wSXRlbVNvdXJjZShpbmRleCwgcHJpY2UsIHByaWNlX3R5cGUgPT09IFwiYXBcIiwgaW5uZXJfaXRlbXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG90aGVySXRlbSA9IG5ldyBJdGVtKCk7XG4gICAgICAgICAgICBvdGhlckl0ZW0ubmFtZV9lbiA9IG1hdGNoLmdyb3Vwcy5uYW1lX2VuIHx8IG1hdGNoLmdyb3Vwcy5uYW1lO1xuICAgICAgICAgICAgc2hvcF9pdGVtcy5zZXQoaW5kZXgsIG90aGVySXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgY291bnQrKztcbiAgICB9XG4gICAgY29uc29sZS5sb2coYEZvdW5kICR7Y291bnR9IHNob3AgaXRlbXNgKTtcbn1cblxuY2xhc3MgQXBpSXRlbSB7XG4gICAgcHJvZHVjdEluZGV4ID0gMDtcbiAgICBkaXNwbGF5ID0gMDtcbiAgICBoaXREaXNwbGF5ID0gZmFsc2U7XG4gICAgZW5hYmxlZCA9IGZhbHNlO1xuICAgIHVzZVR5cGUgPSBcIlwiO1xuICAgIHVzZTAgPSAwO1xuICAgIHVzZTEgPSAwO1xuICAgIHVzZTIgPSAwO1xuICAgIHByaWNlVHlwZSA9IFwiR09MRFwiO1xuICAgIG9sZFByaWNlMCA9IDA7XG4gICAgb2xkUHJpY2UxID0gMDtcbiAgICBvbGRQcmljZTIgPSAwO1xuICAgIHByaWNlMCA9IDA7XG4gICAgcHJpY2UxID0gMDtcbiAgICBwcmljZTIgPSAwO1xuICAgIGNvdXBsZVByaWNlID0gMDtcbiAgICBjYXRlZ29yeSA9IFwiXCI7XG4gICAgbmFtZSA9IFwiXCI7XG4gICAgZ29sZEJhY2sgPSAwO1xuICAgIGVuYWJsZVBhcmNlbCA9IGZhbHNlO1xuICAgIGZvclBsYXllciA9IDA7XG4gICAgaXRlbTAgPSAwO1xuICAgIGl0ZW0xID0gMDtcbiAgICBpdGVtMiA9IDA7XG4gICAgaXRlbTMgPSAwO1xuICAgIGl0ZW00ID0gMDtcbiAgICBpdGVtNSA9IDA7XG4gICAgaXRlbTYgPSAwO1xuICAgIGl0ZW03ID0gMDtcbiAgICBpdGVtOCA9IDA7XG4gICAgaXRlbTkgPSAwO1xufVxuXG5mdW5jdGlvbiBpc0FwaUl0ZW0ob2JqOiBhbnkpOiBvYmogaXMgQXBpSXRlbSB7XG4gICAgaWYgKG9iaiA9PT0gbnVsbCB8fCB0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgICAgdHlwZW9mIG9iai5wcm9kdWN0SW5kZXggPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmouZGlzcGxheSA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5oaXREaXNwbGF5ID09PSBcImJvb2xlYW5cIixcbiAgICAgICAgdHlwZW9mIG9iai5lbmFibGVkID09PSBcImJvb2xlYW5cIixcbiAgICAgICAgdHlwZW9mIG9iai51c2VUeXBlID09PSBcInN0cmluZ1wiLFxuICAgICAgICB0eXBlb2Ygb2JqLnVzZTAgPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmoudXNlMSA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai51c2UyID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLnByaWNlVHlwZSA9PT0gXCJzdHJpbmdcIixcbiAgICAgICAgdHlwZW9mIG9iai5vbGRQcmljZTAgPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmoub2xkUHJpY2UxID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLm9sZFByaWNlMiA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5wcmljZTAgPT09IFwibnVtYmVyXCIsXG4gICAgICAgIHR5cGVvZiBvYmoucHJpY2UxID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLnByaWNlMiA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5jb3VwbGVQcmljZSA9PT0gXCJudW1iZXJcIixcbiAgICAgICAgdHlwZW9mIG9iai5jYXRlZ29yeSA9PT0gXCJzdHJpbmdcIixcbiAgICAgICAgdHlwZW9mIG9iai5uYW1lID09PSBcInN0cmluZ1wiLFxuICAgICAgICB0eXBlb2Ygb2JqLmdvbGRCYWNrID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLmVuYWJsZVBhcmNlbCA9PT0gXCJib29sZWFuXCIsXG4gICAgICAgIHR5cGVvZiBvYmouZm9yUGxheWVyID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW0wID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW0xID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW0yID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW0zID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW00ID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW01ID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW02ID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW03ID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW04ID09PSBcIm51bWJlclwiLFxuICAgICAgICB0eXBlb2Ygb2JqLml0ZW05ID09PSBcIm51bWJlclwiXG4gICAgXS5ldmVyeShiID0+IGIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZUFwaVNob3BEYXRhKGRhdGE6IHN0cmluZykge1xuICAgIGZvciAoY29uc3QgYXBpSXRlbSBvZiBKU09OLnBhcnNlKGRhdGEpKSB7XG4gICAgICAgIGlmICghaXNBcGlJdGVtKGFwaUl0ZW0pKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBJbmNvcnJlY3QgZm9ybWF0IG9mIGl0ZW06ICR7ZGF0YX1gKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5uZXJfaXRlbXMgPSBbXG4gICAgICAgICAgICBhcGlJdGVtLml0ZW0wLFxuICAgICAgICAgICAgYXBpSXRlbS5pdGVtMSxcbiAgICAgICAgICAgIGFwaUl0ZW0uaXRlbTIsXG4gICAgICAgICAgICBhcGlJdGVtLml0ZW0zLFxuICAgICAgICAgICAgYXBpSXRlbS5pdGVtNCxcbiAgICAgICAgICAgIGFwaUl0ZW0uaXRlbTUsXG4gICAgICAgICAgICBhcGlJdGVtLml0ZW02LFxuICAgICAgICAgICAgYXBpSXRlbS5pdGVtNyxcbiAgICAgICAgICAgIGFwaUl0ZW0uaXRlbTgsXG4gICAgICAgICAgICBhcGlJdGVtLml0ZW05LFxuICAgICAgICBdLmZpbHRlcihpZCA9PiAhIWlkICYmIGl0ZW1zLmdldChpZCkpLm1hcChpZCA9PiBpdGVtcy5nZXQoaWQpISk7XG5cbiAgICAgICAgaWYgKGFwaUl0ZW0uY2F0ZWdvcnkgPT09IFwiUEFSVFNcIikge1xuICAgICAgICAgICAgaWYgKGlubmVyX2l0ZW1zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHNob3BfaXRlbXMuc2V0KGFwaUl0ZW0ucHJvZHVjdEluZGV4LCBpbm5lcl9pdGVtc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0gbmV3IEl0ZW0oKTtcbiAgICAgICAgICAgICAgICBpdGVtLm5hbWVfZW4gPSBhcGlJdGVtLm5hbWU7XG4gICAgICAgICAgICAgICAgc2hvcF9pdGVtcy5zZXQoYXBpSXRlbS5wcm9kdWN0SW5kZXgsIGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFwaUl0ZW0uZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1Tb3VyY2UgPSBuZXcgU2hvcEl0ZW1Tb3VyY2UoYXBpSXRlbS5wcm9kdWN0SW5kZXgsIGFwaUl0ZW0ucHJpY2UwLCBhcGlJdGVtLnByaWNlVHlwZSA9PT0gXCJNSU5UXCIsIGlubmVyX2l0ZW1zKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaW5uZXJfaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zb3VyY2VzLnB1c2goaXRlbVNvdXJjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGFwaUl0ZW0uY2F0ZWdvcnkgPT09IFwiTE9UVEVSWVwiKSB7XG4gICAgICAgICAgICBnYWNoYXMuc2V0KGFwaUl0ZW0ucHJvZHVjdEluZGV4LCBuZXcgR2FjaGEoYXBpSXRlbS5wcm9kdWN0SW5kZXgsIGFwaUl0ZW0uaXRlbTAsIGFwaUl0ZW0ubmFtZSkpO1xuICAgICAgICAgICAgY29uc3QgZ2FjaGFJdGVtID0gbmV3IEl0ZW0oKTtcbiAgICAgICAgICAgIGdhY2hhSXRlbS5uYW1lX2VuID0gYXBpSXRlbS5uYW1lO1xuICAgICAgICAgICAgc2hvcF9pdGVtcy5zZXQoYXBpSXRlbS5wcm9kdWN0SW5kZXgsIGdhY2hhSXRlbSk7XG4gICAgICAgICAgICBpZiAoYXBpSXRlbS5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgZ2FjaGFJdGVtLnNvdXJjZXMucHVzaChuZXcgU2hvcEl0ZW1Tb3VyY2UoYXBpSXRlbS5wcm9kdWN0SW5kZXgsIGFwaUl0ZW0ucHJpY2UwLCBhcGlJdGVtLnByaWNlVHlwZSA9PT0gXCJNSU5UXCIsIGlubmVyX2l0ZW1zKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBvdGhlckl0ZW0gPSBuZXcgSXRlbSgpO1xuICAgICAgICAgICAgb3RoZXJJdGVtLm5hbWVfZW4gPSBhcGlJdGVtLm5hbWU7XG4gICAgICAgICAgICBzaG9wX2l0ZW1zLnNldChhcGlJdGVtLnByb2R1Y3RJbmRleCwgb3RoZXJJdGVtKTtcbiAgICAgICAgfVxuXG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZUdhY2hhRGF0YShkYXRhOiBzdHJpbmcsIGdhY2hhOiBHYWNoYSkge1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBkYXRhLnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgICAgIGlmICghbGluZS5pbmNsdWRlcyhcIjxMb3R0ZXJ5SXRlbV9cIikpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1hdGNoID0gbGluZS5tYXRjaCgvXFxzKjxMb3R0ZXJ5SXRlbV8oPzxjaGFyYWN0ZXI+W14gXSopIEluZGV4PVwiXFxkK1wiIF9OYW1lXz1cIlteXCJdKlwiIFNob3BJbmRleD1cIig/PHNob3BfaWQ+XFxkKylcIiBRdWFudGl0eU1pbj1cIig/PHF1YW50aXR5X21pbj5cXGQrKVwiIFF1YW50aXR5TWF4PVwiKD88cXVhbnRpdHlfbWF4PlxcZCspXCIgQ2hhbnNQZXI9XCIoPzxwcm9iYWJpbGl0eT5cXGQrXFwuP1xcZCopXFxzKlwiIEVmZmVjdD1cIlxcZCtcIiBQcm9kdWN0T3B0PVwiXFxkK1wiXFwvPi8pO1xuICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCBwYXJzaW5nIGdhY2hhICR7Z2FjaGEuZ2FjaGFfaW5kZXh9OlxcbiR7bGluZX1gKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbWF0Y2guZ3JvdXBzKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY2hhcmFjdGVyID0gbWF0Y2guZ3JvdXBzLmNoYXJhY3RlcjtcbiAgICAgICAgaWYgKGNoYXJhY3RlciA9PT0gXCJMdW5sdW5cIikge1xuICAgICAgICAgICAgY2hhcmFjdGVyID0gXCJMdW5MdW5cIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzQ2hhcmFjdGVyKGNoYXJhY3RlcikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgRm91bmQgdW5rbm93biBjaGFyYWN0ZXIgXCIke2NoYXJhY3Rlcn1cIiBpbiBsb3R0ZXJ5IGZpbGUgJHtnYWNoYS5nYWNoYV9pbmRleH1gKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBzaG9wX2l0ZW1zLmdldChwYXJzZUludChtYXRjaC5ncm91cHMuc2hvcF9pZCkpO1xuICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgRm91bmQgdW5rbm93biBzaG9wIGl0ZW0gaWQgJHttYXRjaC5ncm91cHMuc2hvcF9pZH0gaW4gbG90dGVyeSBmaWxlICR7Z2FjaGEuZ2FjaGFfaW5kZXh9YCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBnYWNoYS5hZGQoaXRlbSwgcGFyc2VGbG9hdChtYXRjaC5ncm91cHMucHJvYmFiaWxpdHkpLCBjaGFyYWN0ZXIsIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5xdWFudGl0eV9taW4pLCBwYXJzZUludChtYXRjaC5ncm91cHMucXVhbnRpdHlfbWF4KSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgWywgbWFwXSBvZiBnYWNoYS5zaG9wX2l0ZW1zKSB7XG4gICAgICAgIGZvciAoY29uc3QgW2l0ZW0sXSBvZiBtYXApIHtcbiAgICAgICAgICAgIGl0ZW0uc291cmNlcy5wdXNoKG5ldyBHYWNoYUl0ZW1Tb3VyY2UoZ2FjaGEuc2hvcF9pbmRleCkpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZUd1YXJkaWFuRGF0YShkYXRhOiBzdHJpbmcpIHtcbiAgICBjb25zdCBndWFyZGlhbkRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShndWFyZGlhbkRhdGEpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0TnVtYmVyKG86IGFueSkge1xuICAgICAgICBpZiAodHlwZW9mIG8gPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBvO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGJvc3NUaW1lSW5mbyA9IG5ldyBNYXA8bnVtYmVyLCBudW1iZXI+KCk7XG4gICAgZm9yIChjb25zdCBtYXBJbmZvIG9mIGd1YXJkaWFuRGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIG1hcEluZm8gIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1hcF9uYW1lID0gbWFwSW5mby5OYW1lO1xuICAgICAgICBpZiAodHlwZW9mIG1hcF9uYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXdhcmRzID0gQXJyYXkuaXNBcnJheShtYXBJbmZvLlJld2FyZHMpID8gWy4uLm1hcEluZm8uUmV3YXJkc10gOiBbXTtcbiAgICAgICAgY29uc3QgcmV3YXJkX2l0ZW1zID0gcmV3YXJkc1xuICAgICAgICAgICAgLmZpbHRlcigoc2hvcF9pZCk6IHNob3BfaWQgaXMgbnVtYmVyID0+IHR5cGVvZiBzaG9wX2lkID09PSBcIm51bWJlclwiICYmIHNob3BfaXRlbXMuaGFzKHNob3BfaWQpKVxuICAgICAgICAgICAgLm1hcChzaG9wX2lkID0+IHNob3BfaXRlbXMuZ2V0KHNob3BfaWQpISk7XG4gICAgICAgIGNvbnN0IEV4cE11bHRpcGxpZXIgPSBnZXROdW1iZXIobWFwSW5mby5FeHBNdWx0aXBsaWVyKSB8fCAwO1xuICAgICAgICBjb25zdCBJc0Jvc3NTdGFnZSA9ICEhbWFwSW5mby5Jc0Jvc3NTdGFnZTtcbiAgICAgICAgY29uc3QgTWFwSUQgPSBnZXROdW1iZXIobWFwSW5mby5NYXBJZCkgfHwgMDtcbiAgICAgICAgbGV0IEJvc3NUcmlnZ2VyVGltZXJJblNlY29uZHMgPSBnZXROdW1iZXIobWFwSW5mby5Cb3NzVHJpZ2dlclRpbWVySW5TZWNvbmRzKSB8fCAtMTtcbiAgICAgICAgaWYgKEJvc3NUcmlnZ2VyVGltZXJJblNlY29uZHMgPT09IC0xKSB7XG4gICAgICAgICAgICBCb3NzVHJpZ2dlclRpbWVySW5TZWNvbmRzID0gYm9zc1RpbWVJbmZvLmdldChNYXBJRCkgfHwgLTE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoTWFwSUQgIT09IDApIHtcbiAgICAgICAgICAgICAgICBib3NzVGltZUluZm8uc2V0KE1hcElELCBCb3NzVHJpZ2dlclRpbWVySW5TZWNvbmRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcmV3YXJkX2l0ZW1zKSB7XG4gICAgICAgICAgICBjb25zdCBndWFyZGlhblNvdXJjZSA9IG5ldyBHdWFyZGlhbkl0ZW1Tb3VyY2UobWFwX25hbWUsIHJld2FyZF9pdGVtcywgRXhwTXVsdGlwbGllciwgSXNCb3NzU3RhZ2UsIEJvc3NUcmlnZ2VyVGltZXJJblNlY29uZHMpO1xuICAgICAgICAgICAgaXRlbS5zb3VyY2VzLnB1c2goZ3VhcmRpYW5Tb3VyY2UpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG93bmxvYWQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGZpbGVuYW1lID0gdXJsLnNsaWNlKHVybC5sYXN0SW5kZXhPZihcIi9cIikgKyAxKTtcbiAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkaW5nXCIpO1xuICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGBMb2FkaW5nICR7ZmlsZW5hbWV9LCBwbGVhc2Ugd2FpdC4uLmA7XG4gICAgfVxuICAgIGNvbnN0IHJlcGx5ID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgICBjb25zdCBwcm9ncmVzc2JhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvZ3Jlc3NiYXJcIik7XG4gICAgaWYgKHByb2dyZXNzYmFyIGluc3RhbmNlb2YgSFRNTFByb2dyZXNzRWxlbWVudCkge1xuICAgICAgICBwcm9ncmVzc2Jhci52YWx1ZSsrO1xuICAgIH1cbiAgICBpZiAoIXJlcGx5Lm9rKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gcmVwbHkudGV4dCgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRJdGVtcygpIHtcbiAgICBjb25zdCBwcm9ncmVzc2JhciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJvZ3Jlc3NiYXJcIik7XG4gICAgaWYgKHByb2dyZXNzYmFyIGluc3RhbmNlb2YgSFRNTFByb2dyZXNzRWxlbWVudCkge1xuICAgICAgICBwcm9ncmVzc2Jhci52YWx1ZSA9IDA7XG4gICAgICAgIHByb2dyZXNzYmFyLm1heCA9IDEyMjtcbiAgICB9XG4gICAgY29uc3QgaXRlbVNvdXJjZSA9IFwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3NzdG9raWMtdGdtL0pGVFNFL2RldmVsb3BtZW50L2F1dGgtc2VydmVyL3NyYy9tYWluL3Jlc291cmNlcy9yZXNcIjtcbiAgICBjb25zdCBnYWNoYVNvdXJjZSA9IFwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3NzdG9raWMtdGdtL0pGVFNFL2RldmVsb3BtZW50L2dhbWUtc2VydmVyL3NyYy9tYWluL3Jlc291cmNlcy9yZXMvbG90dGVyeVwiO1xuICAgIGNvbnN0IGd1YXJkaWFuU291cmNlID0gXCJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vc3N0b2tpYy10Z20vSkZUU0UvZGV2ZWxvcG1lbnQvZW11bGF0b3Ivc3JjL21haW4vcmVzb3VyY2VzL3Jlcy9cIlxuICAgIGNvbnN0IGl0ZW1VUkwgPSBpdGVtU291cmNlICsgXCIvSXRlbV9QYXJ0c19JbmkzLnhtbFwiO1xuICAgIGNvbnN0IGl0ZW1EYXRhID0gZG93bmxvYWQoaXRlbVVSTCk7XG4gICAgLy9jb25zdCBzaG9wVVJMID0gaXRlbVNvdXJjZSArIFwiL1Nob3BfSW5pMy54bWxcIjtcbiAgICBjb25zdCBtYXhfc2hvcF9wYWdlcyA9IDIwOyAvL2N1cnJlbnRseSBuZWVkIG9ubHkgMTAsIHNob3VsZCBiZSBlbm91Z2hcbiAgICBjb25zdCBzaG9wVVJMID0gXCJodHRwczovL2pmdHNlLmNvbS9qZnRzZS1yZXN0c2VydmljZS9hcGkvc2hvcD9zaXplPTEwMDAmcGFnZT1cIjtcbiAgICBjb25zdCBzaG9wRGF0YXMgPSBbLi4uQXJyYXkobWF4X3Nob3BfcGFnZXMpLmtleXMoKV0ubWFwKG4gPT4gZG93bmxvYWQoYCR7c2hvcFVSTH0ke259YCkpO1xuICAgIGNvbnN0IGd1YXJkaWFuVVJMID0gZ3VhcmRpYW5Tb3VyY2UgKyBcIi9HdWFyZGlhblN0YWdlcy5qc29uXCI7XG4gICAgY29uc3QgZ3VhcmRpYW5EYXRhID0gZG93bmxvYWQoZ3VhcmRpYW5VUkwpO1xuICAgIHBhcnNlSXRlbURhdGEoYXdhaXQgaXRlbURhdGEpO1xuICAgIC8vcGFyc2VTaG9wRGF0YShhd2FpdCBzaG9wRGF0YSk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoc2hvcERhdGFzLm1hcChwID0+IHAudGhlbihkYXRhID0+IHBhcnNlQXBpU2hvcERhdGEoZGF0YSkpKSk7XG5cbiAgICBjb25zb2xlLmxvZyhgRm91bmQgJHtnYWNoYXMuc2l6ZX0gZ2FjaGFzYCk7XG4gICAgaWYgKHByb2dyZXNzYmFyIGluc3RhbmNlb2YgSFRNTFByb2dyZXNzRWxlbWVudCkge1xuICAgICAgICBwcm9ncmVzc2Jhci52YWx1ZSA9IDA7XG4gICAgICAgIHByb2dyZXNzYmFyLm1heCA9IGdhY2hhcy5zaXplICsgMztcbiAgICB9XG4gICAgY29uc3QgZ2FjaGFfaXRlbXM6IFtQcm9taXNlPHN0cmluZz4sIEdhY2hhLCBzdHJpbmddW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFssIGdhY2hhXSBvZiBnYWNoYXMpIHtcbiAgICAgICAgY29uc3QgZ2FjaGFfdXJsID0gYCR7Z2FjaGFTb3VyY2V9L0luaTNfTG90XyR7YCR7Z2FjaGEuZ2FjaGFfaW5kZXh9YC5wYWRTdGFydCgyLCBcIjBcIil9LnhtbGA7XG4gICAgICAgIGdhY2hhX2l0ZW1zLnB1c2goW2Rvd25sb2FkKGdhY2hhX3VybCksIGdhY2hhLCBnYWNoYV91cmxdKTtcbiAgICB9XG4gICAgcGFyc2VHdWFyZGlhbkRhdGEoYXdhaXQgZ3VhcmRpYW5EYXRhKTtcbiAgICBmb3IgKGNvbnN0IFtpdGVtLCBnYWNoYSwgZ2FjaGFfdXJsXSBvZiBnYWNoYV9pdGVtcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcGFyc2VHYWNoYURhdGEoYXdhaXQgaXRlbSwgZ2FjaGEpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCBkb3dubG9hZGluZyAke2dhY2hhX3VybH0gYmVjYXVzZSAke2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5sb2coYExvYWRlZCAke2l0ZW1zLnNpemV9IGl0ZW1zYCk7XG59XG5cbmZ1bmN0aW9uIGRlbGV0YWJsZUl0ZW0obmFtZTogc3RyaW5nLCBpZDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUhUTUwoW1wiZGl2XCIsIGNyZWF0ZUhUTUwoW1wiYnV0dG9uXCIsIHsgY2xhc3M6IFwiaXRlbV9yZW1vdmFsXCIsIFwiZGF0YS1pdGVtX2luZGV4XCI6IGAke2lkfWAgfSwgXCJYXCJdKSwgbmFtZV0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUG9wdXBMaW5rKHRleHQ6IHN0cmluZywgY29udGVudDogSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCAoSFRNTEVsZW1lbnQgfCBzdHJpbmcpW10pIHtcbiAgICBjb25zdCBsaW5rID0gY3JlYXRlSFRNTChbXCJhXCIsIHsgY2xhc3M6IFwicG9wdXBfbGlua1wiIH0sIHRleHRdKTtcbiAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgICBpZiAoIShlIGluc3RhbmNlb2YgTW91c2VFdmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0b3BfZGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b3BfZGl2XCIpO1xuICAgICAgICBpZiAoISh0b3BfZGl2IGluc3RhbmNlb2YgSFRNTERpdkVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgaWYgKGRpYWxvZykge1xuICAgICAgICAgICAgZGlhbG9nLmNsb3NlKCk7XG4gICAgICAgICAgICBkaWFsb2cucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGlhbG9nID0gQXJyYXkuaXNBcnJheShjb250ZW50KSA/IGNyZWF0ZUhUTUwoW1wiZGlhbG9nXCIsIC4uLmNvbnRlbnRdKSA6IGNyZWF0ZUhUTUwoW1wiZGlhbG9nXCIsIGNvbnRlbnRdKTtcblxuICAgICAgICB0b3BfZGl2LmFwcGVuZENoaWxkKGRpYWxvZyk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gMzAwO1xuICAgICAgICBkaWFsb2cuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgIGRpYWxvZy5zdHlsZS50b3AgPSBgJHtlLnBhZ2VZfXB4YDtcbiAgICAgICAgZGlhbG9nLnN0eWxlLmxlZnQgPSBgJHtlLnBhZ2VYIC0gd2lkdGh9cHhgO1xuICAgICAgICBkaWFsb2cuc2hvdygpO1xuICAgIH0pO1xuICAgIHJldHVybiBsaW5rO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVDaGFuY2VQb3B1cCh0cmllczogbnVtYmVyKSB7XG4gICAgZnVuY3Rpb24gcHJvYmFiaWxpdHlBZnRlck5Ucmllcyhwcm9iYWJpbGl0eTogbnVtYmVyLCB0cmllczogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiAxIC0gKE1hdGgucG93KCgxIC0gcHJvYmFiaWxpdHkpLCB0cmllcykpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRlbnQgPSBjcmVhdGVIVE1MKFtcbiAgICAgICAgXCJ0YWJsZVwiLFxuICAgICAgICBbXG4gICAgICAgICAgICBcInRyXCIsXG4gICAgICAgICAgICBbXCJ0aFwiLCBcIk51bWJlciBvZiBnYWNoYXNcIl0sXG4gICAgICAgICAgICBbXCJ0aFwiLCBcIkNoYW5jZSBmb3IgaXRlbVwiXSxcbiAgICAgICAgXSxcbiAgICBdKTtcbiAgICBmb3IgKGNvbnN0IGZhY3RvciBvZiBbMC4xLCAwLjUsIDEsIDIsIDUsIDEwXSkge1xuICAgICAgICBjb25zdCBnYWNoYXMgPSBNYXRoLnJvdW5kKHRyaWVzICogZmFjdG9yKTtcbiAgICAgICAgaWYgKGdhY2hhcyA9PT0gMCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZChjcmVhdGVIVE1MKFtcbiAgICAgICAgICAgIFwidHJcIixcbiAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwibnVtZXJpY1wiIH0sIGAke2dhY2hhc31gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwibnVtZXJpY1wiIH0sIGAkeyhwcm9iYWJpbGl0eUFmdGVyTlRyaWVzKDEgLyB0cmllcywgZ2FjaGFzKSAqIDEwMCkudG9GaXhlZCg0KX0lYF0sXG4gICAgICAgIF0pKTtcbiAgICB9XG4gICAgY29udGVudC5hcHBlbmRDaGlsZChjcmVhdGVIVE1MKFtcInRyXCJdKSk7XG4gICAgcmV0dXJuIGNyZWF0ZVBvcHVwTGluayhgJHtwcmV0dHlOdW1iZXIodHJpZXMsIDIpfWAsIGNvbnRlbnQpO1xufVxuXG5mdW5jdGlvbiBxdWFudGl0eVN0cmluZyhxdWFudGl0eV9taW46IG51bWJlciwgcXVhbnRpdHlfbWF4OiBudW1iZXIpIHtcbiAgICBpZiAocXVhbnRpdHlfbWluID09PSAxICYmIHF1YW50aXR5X21heCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgaWYgKHF1YW50aXR5X21pbiA9PT0gcXVhbnRpdHlfbWF4KSB7XG4gICAgICAgIHJldHVybiBgIHggJHtxdWFudGl0eV9tYXh9YDtcbiAgICB9XG4gICAgcmV0dXJuIGAgeCAke3F1YW50aXR5X21pbn0tJHtxdWFudGl0eV9tYXh9YDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlR2FjaGFTb3VyY2VQb3B1cChpdGVtOiBJdGVtIHwgdW5kZWZpbmVkLCBpdGVtU291cmNlOiBJdGVtU291cmNlLCBjaGFyYWN0ZXI/OiBDaGFyYWN0ZXIpIHtcbiAgICBjb25zdCBjb250ZW50ID0gY2hhcmFjdGVyID8gY3JlYXRlSFRNTChbXG4gICAgICAgIFwidGFibGVcIixcbiAgICAgICAgW1xuICAgICAgICAgICAgXCJ0clwiLFxuICAgICAgICAgICAgW1widGhcIiwgXCJJdGVtXCJdLFxuICAgICAgICAgICAgW1widGhcIiwgXCJBdmVyYWdlIFRyaWVzXCJdLFxuICAgICAgICBdLFxuICAgIF0pIDogY3JlYXRlSFRNTChbXG4gICAgICAgIFwidGFibGVcIixcbiAgICAgICAgW1xuICAgICAgICAgICAgXCJ0clwiLFxuICAgICAgICAgICAgW1widGhcIiwgXCJJdGVtXCJdLFxuICAgICAgICAgICAgW1widGhcIiwgXCJDaGFyYWN0ZXJcIl0sXG4gICAgICAgICAgICBbXCJ0aFwiLCBcIkF2ZXJhZ2UgVHJpZXNcIl0sXG4gICAgICAgIF0sXG4gICAgXSk7XG4gICAgY29uc3QgZ2FjaGEgPSBnYWNoYXMuZ2V0KGl0ZW1Tb3VyY2Uuc2hvcF9pZCk7XG4gICAgaWYgKCFnYWNoYSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuXG4gICAgY29uc3QgZ2FjaGFfaXRlbXMgPSBuZXcgTWFwPEl0ZW0sIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXT4oKTtcbiAgICBmb3IgKGNvbnN0IGNoYXIgb2YgY2hhcmFjdGVyID09PSB1bmRlZmluZWQgPyBjaGFyYWN0ZXJzIDogW2NoYXJhY3Rlcl0pIHtcbiAgICAgICAgY29uc3QgY2hhcl9pdGVtcyA9IGdhY2hhLnNob3BfaXRlbXMuZ2V0KGNoYXIpO1xuICAgICAgICBpZiAoIWNoYXJfaXRlbXMpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgW2NoYXJfZ2FjaGFfaXRlbSwgW3RpY2tldHMsIHF1YW50aXR5X21pbiwgcXVhbnRpdHlfbWF4XV0gb2YgY2hhcl9pdGVtcykge1xuICAgICAgICAgICAgY29uc3QgaXRlbV9jaGFyYWN0ZXIgPSBjaGFyX2dhY2hhX2l0ZW0uY2hhcmFjdGVyIHx8IGNoYXJhY3RlcjtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1fdGlja2V0cyA9IGl0ZW1fY2hhcmFjdGVyID8gZ2FjaGEuY2hhcmFjdGVyX3Byb2JhYmlsaXR5LmdldChpdGVtX2NoYXJhY3RlcikhIDogZ2FjaGEudG90YWxfcHJvYmFiaWxpdHk7XG4gICAgICAgICAgICBjb25zdCBwcm9iYWJpbGl0eSA9IHRpY2tldHMgLyBpdGVtX3RpY2tldHM7XG4gICAgICAgICAgICBjb25zdCBwcmV2aW91c19wcm9iYWJpbGl0eSA9IGdhY2hhX2l0ZW1zLmdldChjaGFyX2dhY2hhX2l0ZW0pPy5bMF0gfHwgMDtcbiAgICAgICAgICAgIGdhY2hhX2l0ZW1zLnNldChjaGFyX2dhY2hhX2l0ZW0sIFtwcmV2aW91c19wcm9iYWJpbGl0eSArIHByb2JhYmlsaXR5LCBxdWFudGl0eV9taW4sIHF1YW50aXR5X21heF0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBbY2hhcl9nYWNoYV9pdGVtLCBbcHJvYmFiaWxpdHksIHF1YW50aXR5X21pbiwgcXVhbnRpdHlfbWF4XV0gb2YgZ2FjaGFfaXRlbXMpIHtcbiAgICAgICAgaWYgKGNoYXJhY3Rlcikge1xuICAgICAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZChjcmVhdGVIVE1MKFtcbiAgICAgICAgICAgICAgICBcInRyXCIsXG4gICAgICAgICAgICAgICAgaXRlbSA9PT0gY2hhcl9nYWNoYV9pdGVtID8geyBjbGFzczogXCJoaWdobGlnaHRlZFwiIH0gOiBcIlwiLFxuICAgICAgICAgICAgICAgIFtcInRkXCIsIGNoYXJfZ2FjaGFfaXRlbS5uYW1lX2VuLCBxdWFudGl0eVN0cmluZyhxdWFudGl0eV9taW4sIHF1YW50aXR5X21heCldLFxuICAgICAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwibnVtZXJpY1wiIH0sIGAke3ByZXR0eU51bWJlcigxIC8gcHJvYmFiaWxpdHksIDIpfWBdLFxuICAgICAgICAgICAgXSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZChjcmVhdGVIVE1MKFtcbiAgICAgICAgICAgICAgICBcInRyXCIsXG4gICAgICAgICAgICAgICAgaXRlbSA9PT0gY2hhcl9nYWNoYV9pdGVtID8geyBjbGFzczogXCJoaWdobGlnaHRlZFwiIH0gOiBcIlwiLFxuICAgICAgICAgICAgICAgIFtcInRkXCIsIGNoYXJfZ2FjaGFfaXRlbS5uYW1lX2VuLCBxdWFudGl0eVN0cmluZyhxdWFudGl0eV9taW4sIHF1YW50aXR5X21heCldLFxuICAgICAgICAgICAgICAgIFtcInRkXCIsIGNoYXJfZ2FjaGFfaXRlbS5jaGFyYWN0ZXIgfHwgXCIqXCJdLFxuICAgICAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwibnVtZXJpY1wiIH0sIGAke3ByZXR0eU51bWJlcigxIC8gcHJvYmFiaWxpdHksIDIpfWBdLFxuICAgICAgICAgICAgXSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZVBvcHVwTGluayhpdGVtU291cmNlLml0ZW0ubmFtZV9lbiwgW2NyZWF0ZUhUTUwoW1wiYVwiLCBnYWNoYS5uYW1lXSksIGNvbnRlbnRdKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2V0U291cmNlUG9wdXAoaXRlbTogSXRlbSwgaXRlbVNvdXJjZTogU2hvcEl0ZW1Tb3VyY2UpIHtcbiAgICBjb25zdCBjb250ZW50VGFibGUgPSBjcmVhdGVIVE1MKFtcInRhYmxlXCIsIFtcInRyXCIsIFtcInRoXCIsIFwiQ29udGVudHNcIl1dXSk7XG4gICAgZm9yIChjb25zdCBpbm5lcl9pdGVtIG9mIGl0ZW1Tb3VyY2UuaXRlbXMpIHtcbiAgICAgICAgY29udGVudFRhYmxlLmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1widHJcIiwgaW5uZXJfaXRlbSA9PT0gaXRlbSA/IHsgY2xhc3M6IFwiaGlnaGxpZ2h0ZWRcIiB9IDogXCJcIiwgW1widGRcIiwgaW5uZXJfaXRlbS5uYW1lX2VuXV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGNyZWF0ZVBvcHVwTGluayhpdGVtU291cmNlLml0ZW0ubmFtZV9lbiwgW2NyZWF0ZUhUTUwoW1wiYVwiLCBpdGVtU291cmNlLml0ZW0ubmFtZV9lbiwgY29udGVudFRhYmxlXSldKTtcbn1cblxuZnVuY3Rpb24gcHJldHR5VGltZShzZWNvbmRzOiBudW1iZXIpIHtcbiAgICByZXR1cm4gYCR7TWF0aC5mbG9vcihzZWNvbmRzIC8gNjApfToke2Ake3NlY29uZHMgJSA2MH1gLnBhZFN0YXJ0KDIsIFwiMFwiKX1gO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVHdWFyZGlhblBvcHVwKGl0ZW06IEl0ZW0sIGl0ZW1Tb3VyY2U6IEd1YXJkaWFuSXRlbVNvdXJjZSkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICAgIGBHdWFyZGlhbiBtYXAgJHtpdGVtU291cmNlLmd1YXJkaWFuX21hcH1gLFxuICAgICAgICBjcmVhdGVIVE1MKFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIFwidWxcIiwgeyBjbGFzczogXCJsYXlvdXRcIiB9LFxuICAgICAgICAgICAgICAgIFtcImxpXCIsIFwiSXRlbXM6XCIsXG4gICAgICAgICAgICAgICAgICAgIFtcInVsXCIsIHsgY2xhc3M6IFwibGF5b3V0XCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLml0ZW1Tb3VyY2UuaXRlbXMucmVkdWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjdXJyLCByZXdhcmRfaXRlbSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWy4uLmN1cnIsIGNyZWF0ZUhUTUwoW1wibGlcIiwgeyBjbGFzczogcmV3YXJkX2l0ZW0gPT09IGl0ZW0gPyBcImhpZ2hsaWdodGVkXCIgOiBcIlwiIH0sIHJld2FyZF9pdGVtLm5hbWVfZW5dKV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW10gYXMgKEhUTUxFbGVtZW50IHwgc3RyaW5nKVtdXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgW1wibGlcIiwgYFJlcXVpcmVzIGJvc3M6ICR7aXRlbVNvdXJjZS5uZWVkX2Jvc3MgPyBcIlllc1wiIDogXCJOb1wifWBdLFxuICAgICAgICAgICAgICAgIC4uLihpdGVtU291cmNlLmJvc3NfdGltZSA+IDAgPyBbY3JlYXRlSFRNTChbXCJsaVwiLCBgQm9zcyB0aW1lOiAke3ByZXR0eVRpbWUoaXRlbVNvdXJjZS5ib3NzX3RpbWUpfWBdKV0gOiBbXSksXG4gICAgICAgICAgICAgICAgW1wibGlcIiwgYEVYUCBtdWx0aXBsaWVyOiAke2l0ZW1Tb3VyY2UueHB9YF0sXG4gICAgICAgICAgICBdXG4gICAgICAgIClcbiAgICBdO1xuICAgIHJldHVybiBjcmVhdGVQb3B1cExpbmsoaXRlbVNvdXJjZS5ndWFyZGlhbl9tYXAsIGNvbnRlbnQpO1xufVxuXG5mdW5jdGlvbiBpdGVtU291cmNlc1RvRWxlbWVudEFycmF5KFxuICAgIGl0ZW06IEl0ZW0sXG4gICAgc291cmNlRmlsdGVyOiAoaXRlbVNvdXJjZTogSXRlbVNvdXJjZSkgPT4gYm9vbGVhbixcbiAgICBjaGFyYWN0ZXI/OiBDaGFyYWN0ZXIpIHtcbiAgICByZXR1cm4gWy4uLml0ZW0uc291cmNlcy52YWx1ZXMoKV1cbiAgICAgICAgLmZpbHRlcihzb3VyY2VGaWx0ZXIpXG4gICAgICAgIC5tYXAoaXRlbVNvdXJjZSA9PiBzb3VyY2VJdGVtRWxlbWVudChpdGVtLCBpdGVtU291cmNlLCBzb3VyY2VGaWx0ZXIsIGNoYXJhY3RlcikpO1xufVxuXG5mdW5jdGlvbiBtYWtlU291cmNlc0xpc3QobGlzdDogKEhUTUxFbGVtZW50IHwgc3RyaW5nKVtdW10pOiAoSFRNTEVsZW1lbnQgfCBzdHJpbmcpW10ge1xuICAgIGNvbnN0IHJlc3VsdDogKEhUTUxFbGVtZW50IHwgc3RyaW5nKVtdID0gW107XG4gICAgZnVuY3Rpb24gYWRkKGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgc3RyaW5nKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXSA9IHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV0gKyBlbGVtZW50O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdC5wdXNoKGVsZW1lbnQpO1xuICAgIH1cbiAgICBsZXQgZmlyc3QgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgZWxlbWVudHMgb2YgbGlzdCkge1xuICAgICAgICBpZiAoZWxlbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBhZGQoXCIgXCIpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFmaXJzdCkge1xuICAgICAgICAgICAgYWRkKFwiLCBcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFkZChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBzb3VyY2VJdGVtRWxlbWVudChpdGVtOiBJdGVtLCBpdGVtU291cmNlOiBJdGVtU291cmNlLCBzb3VyY2VGaWx0ZXI6IChpdGVtU291cmNlOiBJdGVtU291cmNlKSA9PiBib29sZWFuLCBjaGFyYWN0ZXI/OiBDaGFyYWN0ZXIpOiAoSFRNTEVsZW1lbnQgfCBzdHJpbmcpW10ge1xuICAgIGlmIChpdGVtU291cmNlIGluc3RhbmNlb2YgR2FjaGFJdGVtU291cmNlKSB7XG4gICAgICAgIGNvbnN0IGNoYXIgPSBpdGVtU291cmNlLnJlcXVpcmVzR3VhcmRpYW4gPyB1bmRlZmluZWQgOiBjaGFyYWN0ZXI7XG4gICAgICAgIGNvbnN0IHNvdXJjZXMgPSBpdGVtU291cmNlc1RvRWxlbWVudEFycmF5KGl0ZW1Tb3VyY2UuaXRlbSwgc291cmNlRmlsdGVyLCBjaGFyYWN0ZXIpO1xuICAgICAgICBjb25zdCBzb3VyY2VzTGlzdCA9IG1ha2VTb3VyY2VzTGlzdChzb3VyY2VzKTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGNyZWF0ZUdhY2hhU291cmNlUG9wdXAoaXRlbSwgaXRlbVNvdXJjZSwgY2hhciksXG4gICAgICAgICAgICBgIHggYCxcbiAgICAgICAgICAgIGNyZWF0ZUNoYW5jZVBvcHVwKGl0ZW1Tb3VyY2UuZ2FjaGFUcmllcyhpdGVtLCBjaGFyYWN0ZXIpKSxcbiAgICAgICAgICAgIC4uLihzb3VyY2VzTGlzdC5sZW5ndGggPiAwID8gW1wiIFwiXSA6IFtdKSxcbiAgICAgICAgICAgIC4uLnNvdXJjZXNMaXN0LFxuICAgICAgICBdO1xuICAgIH1cbiAgICBlbHNlIGlmIChpdGVtU291cmNlIGluc3RhbmNlb2YgU2hvcEl0ZW1Tb3VyY2UpIHtcbiAgICAgICAgaWYgKGl0ZW1Tb3VyY2UuaXRlbXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gW2Ake2l0ZW1Tb3VyY2UucHJpY2V9ICR7aXRlbVNvdXJjZS5hcCA/IFwiQVBcIiA6IFwiR29sZFwifWBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBjcmVhdGVTZXRTb3VyY2VQb3B1cChpdGVtLCBpdGVtU291cmNlKSxcbiAgICAgICAgICAgIGAgJHtpdGVtU291cmNlLnByaWNlfSAke2l0ZW1Tb3VyY2UuYXAgPyBcIkFQXCIgOiBcIkdvbGRcIn1gXG4gICAgICAgIF07XG4gICAgfVxuICAgIGVsc2UgaWYgKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBHdWFyZGlhbkl0ZW1Tb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIFtjcmVhdGVHdWFyZGlhblBvcHVwKGl0ZW0sIGl0ZW1Tb3VyY2UpXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGl0ZW1Ub1RhYmxlUm93KGl0ZW06IEl0ZW0sIHNvdXJjZUZpbHRlcjogKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpID0+IGJvb2xlYW4sIHByaW9yaXR5U3RhdHM6IHN0cmluZ1tdLCBjaGFyYWN0ZXI/OiBDaGFyYWN0ZXIpOiBIVE1MVGFibGVSb3dFbGVtZW50IHtcbiAgICBjb25zdCByb3cgPSBjcmVhdGVIVE1MKFxuICAgICAgICBbXCJ0clwiLFxuICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJOYW1lX2NvbHVtblwiIH0sIGRlbGV0YWJsZUl0ZW0oaXRlbS5uYW1lX2VuLCBpdGVtLmlkKV0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCB7IGNsYXNzOiBcIkNoYXJhY3Rlcl9jb2x1bW5cIiB9LCBpdGVtLmNoYXJhY3RlciA/PyBcIkFsbFwiXSxcbiAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwiUGFydF9jb2x1bW5cIiB9LCBpdGVtLnBhcnRdLFxuICAgICAgICAgICAgLi4ucHJpb3JpdHlTdGF0cy5tYXAoc3RhdCA9PiBjcmVhdGVIVE1MKFtcInRkXCIsIHsgY2xhc3M6IFwibnVtZXJpY1wiIH0sIHN0YXQuc3BsaXQoXCIrXCIpLm1hcChzID0+IGl0ZW0uc3RhdEZyb21TdHJpbmcocykpLmpvaW4oXCIrXCIpXSkpLFxuICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJMZXZlbF9jb2x1bW4gbnVtZXJpY1wiIH0sIGAke2l0ZW0ubGV2ZWx9YF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCB7IGNsYXNzOiBcIlNvdXJjZV9jb2x1bW5cIiB9LCAuLi5tYWtlU291cmNlc0xpc3QoaXRlbVNvdXJjZXNUb0VsZW1lbnRBcnJheShpdGVtLCBzb3VyY2VGaWx0ZXIsIGNoYXJhY3RlcikpXSxcbiAgICAgICAgXVxuICAgICk7XG4gICAgcmV0dXJuIHJvdztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEdhY2hhVGFibGUoZmlsdGVyOiAoaXRlbTogSXRlbSkgPT4gYm9vbGVhbiwgY2hhcj86IENoYXJhY3Rlcik6IEhUTUxUYWJsZUVsZW1lbnQge1xuICAgIGNvbnN0IHRhYmxlID0gY3JlYXRlSFRNTChcbiAgICAgICAgW1widGFibGVcIixcbiAgICAgICAgICAgIFtcInRyXCIsXG4gICAgICAgICAgICAgICAgW1widGhcIiwgeyBjbGFzczogXCJOYW1lX2NvbHVtblwiIH0sIFwiTmFtZVwiXSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgXVxuICAgICk7XG4gICAgZm9yIChjb25zdCBbLCBnYWNoYV0gb2YgZ2FjaGFzKSB7XG4gICAgICAgIGNvbnN0IGdhY2hhSXRlbSA9IHNob3BfaXRlbXMuZ2V0KGdhY2hhLnNob3BfaW5kZXgpO1xuICAgICAgICBpZiAoIWdhY2hhSXRlbSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWx0ZXIoZ2FjaGFJdGVtKSkge1xuICAgICAgICAgICAgdGFibGUuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChbXCJ0clwiLCBbXCJ0ZFwiLCBjcmVhdGVHYWNoYVNvdXJjZVBvcHVwKHVuZGVmaW5lZCwgbmV3IEl0ZW1Tb3VyY2UoZ2FjaGEuc2hvcF9pbmRleCksIGNoYXIpXV0pKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFibGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXN1bHRzVGFibGUoXG4gICAgZmlsdGVyOiAoaXRlbTogSXRlbSkgPT4gYm9vbGVhbixcbiAgICBzb3VyY2VGaWx0ZXI6IChpdGVtU291cmNlOiBJdGVtU291cmNlKSA9PiBib29sZWFuLFxuICAgIHByaW9yaXplcjogKGl0ZW1zOiBJdGVtW10sIGl0ZW06IEl0ZW0pID0+IEl0ZW1bXSxcbiAgICBwcmlvcml0eVN0YXRzOiBzdHJpbmdbXSxcbiAgICBjaGFyYWN0ZXI/OiBDaGFyYWN0ZXIpOiBIVE1MVGFibGVFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzOiB7IFtrZXk6IHN0cmluZ106IEl0ZW1bXSB9ID0ge1xuICAgICAgICBcIkhhdFwiOiBbXSxcbiAgICAgICAgXCJIYWlyXCI6IFtdLFxuICAgICAgICBcIkR5ZVwiOiBbXSxcbiAgICAgICAgXCJVcHBlclwiOiBbXSxcbiAgICAgICAgXCJMb3dlclwiOiBbXSxcbiAgICAgICAgXCJTaG9lc1wiOiBbXSxcbiAgICAgICAgXCJTb2Nrc1wiOiBbXSxcbiAgICAgICAgXCJIYW5kXCI6IFtdLFxuICAgICAgICBcIkJhY2twYWNrXCI6IFtdLFxuICAgICAgICBcIkZhY2VcIjogW10sXG4gICAgICAgIFwiUmFja2V0XCI6IFtdLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IFssIGl0ZW1dIG9mIGl0ZW1zKSB7XG4gICAgICAgIGlmIChmaWx0ZXIoaXRlbSkpIHtcbiAgICAgICAgICAgIHJlc3VsdHNbaXRlbS5wYXJ0XSA9IHByaW9yaXplcihyZXN1bHRzW2l0ZW0ucGFydF0sIGl0ZW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdGFibGUgPSBjcmVhdGVIVE1MKFxuICAgICAgICBbXCJ0YWJsZVwiLFxuICAgICAgICAgICAgW1widHJcIixcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCB7IGNsYXNzOiBcIk5hbWVfY29sdW1uXCIgfSwgXCJOYW1lXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIHsgY2xhc3M6IFwiQ2hhcmFjdGVyX2NvbHVtblwiIH0sIFwiQ2hhcmFjdGVyXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIHsgY2xhc3M6IFwiUGFydF9jb2x1bW5cIiB9LCBcIlBhcnRcIl0sXG4gICAgICAgICAgICAgICAgLi4ucHJpb3JpdHlTdGF0cy5tYXAoc3RhdCA9PiBjcmVhdGVIVE1MKFtcInRoXCIsIHsgY2xhc3M6IFwibnVtZXJpY1wiIH0sIHN0YXRdKSksXG4gICAgICAgICAgICAgICAgW1widGhcIiwgeyBjbGFzczogXCJMZXZlbF9jb2x1bW4gbnVtZXJpY1wiIH0sIFwiTGV2ZWxcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgeyBjbGFzczogXCJTb3VyY2VfY29sdW1uXCIgfSwgXCJTb3VyY2VcIl0sXG4gICAgICAgICAgICBdXG4gICAgICAgIF1cbiAgICApO1xuXG4gICAgdHlwZSBNYXBPcHRpb25zID0geyBba2V5OiBzdHJpbmddOiBudW1iZXJbXSB9O1xuXG4gICAgdHlwZSBDb3N0ID0ge1xuICAgICAgICBnb2xkOiBudW1iZXIsXG4gICAgICAgIGFwOiBudW1iZXIsXG4gICAgICAgIG1hcHM6IE1hcE9wdGlvbnMsXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNvbWJpbmVNYXBzKG0xOiBNYXBPcHRpb25zLCBtMjogTWFwT3B0aW9ucyk6IE1hcE9wdGlvbnMge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB7IC4uLm0xIH07XG4gICAgICAgIGZvciAoY29uc3QgW21hcCwgdHJpZXNdIG9mIE9iamVjdC5lbnRyaWVzKG0yKSkge1xuICAgICAgICAgICAgaWYgKHJlc3VsdFttYXBdKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W21hcF0gPSByZXN1bHRbbWFwXS5jb25jYXQodHJpZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W21hcF0gPSB0cmllcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbWJpbmVDb3N0cyhjb3N0MTogQ29zdCwgY29zdDI6IENvc3QpOiBDb3N0IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdvbGQ6IGNvc3QxLmdvbGQgKyBjb3N0Mi5nb2xkLFxuICAgICAgICAgICAgYXA6IGNvc3QxLmFwICsgY29zdDIuYXAsXG4gICAgICAgICAgICBtYXBzOiBjb21iaW5lTWFwcyhjb3N0MS5tYXBzLCBjb3N0Mi5tYXBzKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaW5NYXAobTE6IE1hcE9wdGlvbnMsIG0yOiBNYXBPcHRpb25zKTogTWFwT3B0aW9ucyB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHsgLi4ubTEgfTtcbiAgICAgICAgZm9yIChjb25zdCBbbWFwLCB0cmllc10gb2YgT2JqZWN0LmVudHJpZXMobTIpKSB7XG4gICAgICAgICAgICBpZiAodHJpZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlc3VsdFttYXBdKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W21hcF0gPSBbTWF0aC5taW4ocmVzdWx0W21hcF1bMF0sIHRyaWVzWzBdKV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbbWFwXSA9IHRyaWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWluQ29zdChjb3N0MTogQ29zdCwgY29zdDI6IENvc3QpOiBDb3N0IHtcbiAgICAgICAgcmV0dXJuIFtjb3N0MS5hcCwgY29zdDEuZ29sZF0gPCBbY29zdDEuYXAsIGNvc3QxLmdvbGRdID9cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBnb2xkOiBjb3N0MS5nb2xkLFxuICAgICAgICAgICAgICAgIGFwOiBjb3N0MS5hcCxcbiAgICAgICAgICAgICAgICBtYXBzOiBtaW5NYXAoY29zdDEubWFwcywgY29zdDIubWFwcyksXG4gICAgICAgICAgICB9IDpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBnb2xkOiBjb3N0Mi5nb2xkLFxuICAgICAgICAgICAgICAgIGFwOiBjb3N0Mi5hcCxcbiAgICAgICAgICAgICAgICBtYXBzOiBtaW5NYXAoY29zdDEubWFwcywgY29zdDIubWFwcyksXG4gICAgICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvc3RPZihpdGVtOiBJdGVtLCBjaGFyYWN0ZXI/OiBDaGFyYWN0ZXIpOiBDb3N0IHtcbiAgICAgICAgcmV0dXJuIFsuLi5pdGVtLnNvdXJjZXMudmFsdWVzKCldXG4gICAgICAgICAgICAuZmlsdGVyKHNvdXJjZUZpbHRlcilcbiAgICAgICAgICAgIC5yZWR1Y2UoKGN1cnIsIGl0ZW1Tb3VyY2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb3N0ID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBTaG9wSXRlbVNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW1Tb3VyY2UuYXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBnb2xkOiAwLCBhcDogaXRlbVNvdXJjZS5wcmljZSwgbWFwczoge30gfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGdvbGQ6IGl0ZW1Tb3VyY2UucHJpY2UsIGFwOiAwLCBtYXBzOiB7fSB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBHYWNoYUl0ZW1Tb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpbmdsZUNvc3QgPSBjb3N0T2YoaXRlbVNvdXJjZS5pdGVtLCBjaGFyYWN0ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbXVsdGlwbGllciA9IGl0ZW1Tb3VyY2UuZ2FjaGFUcmllcyhpdGVtLCBjaGFyYWN0ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2xkOiBzaW5nbGVDb3N0LmdvbGQgKiBtdWx0aXBsaWVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwOiBzaW5nbGVDb3N0LmFwICogbXVsdGlwbGllcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBzOiBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKHNpbmdsZUNvc3QubWFwcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKFttYXAsIHRyaWVzXSkgPT4gW21hcCwgdHJpZXMubWFwKG4gPT4gbiAqIG11bHRpcGxpZXIpXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGl0ZW1Tb3VyY2UgaW5zdGFuY2VvZiBHdWFyZGlhbkl0ZW1Tb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29sZDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBzOiBPYmplY3QuZnJvbUVudHJpZXMoW1tpdGVtU291cmNlLmd1YXJkaWFuX21hcCwgW2l0ZW1Tb3VyY2UuaXRlbXMubGVuZ3RoXV1dKVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1pbkNvc3QoY3VyciwgY29zdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHsgZ29sZDogMCwgYXA6IDAsIG1hcHM6IHt9IH1cbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhdGlzdGljcyA9IHtcbiAgICAgICAgY2hhcmFjdGVyczogbmV3IFNldDxDaGFyYWN0ZXI+LFxuICAgICAgICAuLi5wcmlvcml0eVN0YXRzLnJlZHVjZSgoY3Vyciwgc3RhdCkgPT4gKHsgLi4uY3VyciwgW3N0YXRdOiAwIH0pLCB7fSksXG4gICAgICAgIExldmVsOiAwLFxuICAgICAgICBjb3N0OiB7IGFwOiAwLCBnb2xkOiAwLCBtYXBzOiB7fSB9IGFzIENvc3QsXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIE9iamVjdC52YWx1ZXMocmVzdWx0cykpIHtcbiAgICAgICAgaWYgKHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBzdGF0IG9mIHByaW9yaXR5U3RhdHMpIHtcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0aXN0aWNzW3N0YXRdICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHN0YXQuc3BsaXQoXCIrXCIpLnJlZHVjZSgoY3Vyciwgc3RhdE5hbWUpID0+IGN1cnIgKyByZXN1bHRbMF0uc3RhdEZyb21TdHJpbmcoc3RhdE5hbWUpLCAwKTtcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgc3RhdGlzdGljc1tzdGF0XSArPSB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRpc3RpY3MuTGV2ZWwgPSBNYXRoLm1heChyZXN1bHRbMF0ubGV2ZWwsIHN0YXRpc3RpY3MuTGV2ZWwpO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiByZXN1bHQpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hhciBvZiBpdGVtLmNoYXJhY3RlciA/IFtpdGVtLmNoYXJhY3Rlcl0gOiBjaGFyYWN0ZXJzKSB7XG4gICAgICAgICAgICAgICAgc3RhdGlzdGljcy5jaGFyYWN0ZXJzLmFkZChjaGFyKVxuICAgICAgICAgICAgICAgIHRhYmxlLmFwcGVuZENoaWxkKGl0ZW1Ub1RhYmxlUm93KGl0ZW0sIHNvdXJjZUZpbHRlciwgcHJpb3JpdHlTdGF0cywgY2hhcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGlzdGljcy5jb3N0ID0gY29tYmluZUNvc3RzKGNvc3RPZihpdGVtLCBjaGFyYWN0ZXIgJiYgaXNDaGFyYWN0ZXIoY2hhcmFjdGVyKSA/IGNoYXJhY3RlciA6IHVuZGVmaW5lZCksIHN0YXRpc3RpY3MuY29zdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhdGlzdGljcy5jaGFyYWN0ZXJzLnNpemUgPT09IDEpIHtcbiAgICAgICAgY29uc3QgdG90YWxfc291cmNlczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgaWYgKHN0YXRpc3RpY3MuY29zdC5nb2xkID4gMCkge1xuICAgICAgICAgICAgdG90YWxfc291cmNlcy5wdXNoKGAke3N0YXRpc3RpY3MuY29zdC5nb2xkLnRvRml4ZWQoMCl9IEdvbGRgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RhdGlzdGljcy5jb3N0LmFwID4gMCkge1xuICAgICAgICAgICAgdG90YWxfc291cmNlcy5wdXNoKGAke3N0YXRpc3RpY3MuY29zdC5hcC50b0ZpeGVkKDApfSBBUGApO1xuICAgICAgICB9XG4gICAgICAgIC8vc3RhdGlzdGljc1snR3VhcmRpYW4gZ2FtZXMnXS5mb3JFYWNoKChjb3VudCwgbWFwKSA9PiB0b3RhbF9zb3VyY2VzLnB1c2goYCR7Y291bnQudG9GaXhlZCgwKX0geCAke21hcH1gKSk7XG4gICAgICAgIHRhYmxlLmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoXG4gICAgICAgICAgICBbXCJ0clwiLFxuICAgICAgICAgICAgICAgIFtcInRkXCIsIHsgY2xhc3M6IFwidG90YWwgTmFtZV9jb2x1bW5cIiB9LCBcIlRvdGFsOlwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0ZFwiLCB7IGNsYXNzOiBcInRvdGFsIENoYXJhY3Rlcl9jb2x1bW5cIiB9XSxcbiAgICAgICAgICAgICAgICBbXCJ0ZFwiLCB7IGNsYXNzOiBcInRvdGFsIFBhcnRfY29sdW1uXCIgfV0sXG4gICAgICAgICAgICAgICAgLi4ucHJpb3JpdHlTdGF0cy5tYXAoc3RhdCA9PiBjcmVhdGVIVE1MKFtcInRkXCIsIHsgY2xhc3M6IFwidG90YWwgbnVtZXJpY1wiIH0sXG4gICAgICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBgJHtzdGF0aXN0aWNzW3N0YXRdfWBcbiAgICAgICAgICAgICAgICBdKSksXG4gICAgICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJ0b3RhbCBMZXZlbF9jb2x1bW4gbnVtZXJpY1wiIH0sIGAke3N0YXRpc3RpY3MuTGV2ZWx9YF0sXG4gICAgICAgICAgICAgICAgW1widGRcIiwgeyBjbGFzczogXCJ0b3RhbCBTb3VyY2VfY29sdW1uXCIgfSwgdG90YWxfc291cmNlcy5qb2luKFwiLCBcIildLFxuICAgICAgICAgICAgXVxuICAgICAgICApKTtcbiAgICAgICAgZm9yIChjb25zdCBjb2x1bW5fZWxlbWVudCBvZiB0YWJsZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGBDaGFyYWN0ZXJfY29sdW1uYCkpIHtcbiAgICAgICAgICAgIGlmICghKGNvbHVtbl9lbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb2x1bW5fZWxlbWVudC5oaWRkZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgcHJpb3JpdHlTdGF0cykge1xuICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgaWYgKHN0YXRpc3RpY3NbYXR0cmlidXRlXSA9PT0gMCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjb2x1bW5fZWxlbWVudCBvZiB0YWJsZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGAke2F0dHJpYnV0ZX1fY29sdW1uYCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShjb2x1bW5fZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29sdW1uX2VsZW1lbnQuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFibGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXhJdGVtTGV2ZWwoKSB7XG4gICAgLy9ubyByZWR1Y2UgZm9yIE1hcD9cbiAgICBsZXQgbWF4ID0gMDtcbiAgICBmb3IgKGNvbnN0IFssIGl0ZW1dIG9mIGl0ZW1zKSB7XG4gICAgICAgIG1heCA9IE1hdGgubWF4KG1heCwgaXRlbS5sZXZlbCk7XG4gICAgfVxuICAgIHJldHVybiBtYXg7XG59XG5cbmRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZGlhbG9nICYmIGRpYWxvZyAhPT0gZXZlbnQudGFyZ2V0KSB7XG4gICAgICAgIGRpYWxvZy5jbG9zZSgpO1xuICAgICAgICBkaWFsb2cucmVtb3ZlKCk7XG4gICAgICAgIGRpYWxvZyA9IHVuZGVmaW5lZDtcbiAgICB9XG59KTsiLCJpbXBvcnQgeyBtYWtlQ2hlY2tib3hUcmVlLCBUcmVlTm9kZSwgZ2V0TGVhZlN0YXRlcywgc2V0TGVhZlN0YXRlcyB9IGZyb20gJy4vY2hlY2tib3hUcmVlJztcbmltcG9ydCB7IGNyZWF0ZVBvcHVwTGluaywgZG93bmxvYWRJdGVtcywgZ2V0UmVzdWx0c1RhYmxlLCBJdGVtLCBJdGVtU291cmNlLCBnZXRNYXhJdGVtTGV2ZWwsIGl0ZW1zLCBDaGFyYWN0ZXIsIGNoYXJhY3RlcnMsIGlzQ2hhcmFjdGVyLCBTaG9wSXRlbVNvdXJjZSwgR2FjaGFJdGVtU291cmNlLCBnZXRHYWNoYVRhYmxlIH0gZnJvbSAnLi9pdGVtTG9va3VwJztcbmltcG9ydCB7IGNyZWF0ZUhUTUwgfSBmcm9tICcuL2h0bWwnO1xuaW1wb3J0IHsgVmFyaWFibGVfc3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmNvbnN0IHBhcnRzRmlsdGVyID0gW1xuICAgIFwiUGFydHNcIiwgW1xuICAgICAgICBcIkhlYWRcIiwgW1xuICAgICAgICAgICAgXCIrSGF0XCIsXG4gICAgICAgICAgICBcIitIYWlyXCIsXG4gICAgICAgICAgICBcIkR5ZVwiLFxuICAgICAgICBdLFxuICAgICAgICBcIitVcHBlclwiLFxuICAgICAgICBcIitMb3dlclwiLFxuICAgICAgICBcIkxlZ3NcIiwgW1xuICAgICAgICAgICAgXCIrU2hvZXNcIixcbiAgICAgICAgICAgIFwiU29ja3NcIixcbiAgICAgICAgXSxcbiAgICAgICAgXCJBdXhcIiwgW1xuICAgICAgICAgICAgXCIrSGFuZFwiLFxuICAgICAgICAgICAgXCIrQmFja3BhY2tcIixcbiAgICAgICAgICAgIFwiK0ZhY2VcIlxuICAgICAgICBdLFxuICAgICAgICBcIitSYWNrZXRcIixcbiAgICBdLFxuXTtcblxuY29uc3QgYXZhaWxhYmlsaXR5RmlsdGVyID0gW1xuICAgIFwiQXZhaWxhYmlsaXR5XCIsIFtcbiAgICAgICAgXCJTaG9wXCIsIFtcbiAgICAgICAgICAgIFwiK0dvbGRcIixcbiAgICAgICAgICAgIFwiK0FQXCIsXG4gICAgICAgIF0sXG4gICAgICAgIFwiK0FsbG93IGdhY2hhXCIsXG4gICAgICAgIFwiK0d1YXJkaWFuXCIsXG4gICAgICAgIFwiK1VudHJhZGFibGVcIixcbiAgICAgICAgXCJVbmF2YWlsYWJsZSBpdGVtc1wiLFxuICAgIF0sXG5dO1xuXG5jb25zdCBleGNsdWRlZF9pdGVtX2lkcyA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuXG5mdW5jdGlvbiBhZGRGaWx0ZXJUcmVlcygpIHtcbiAgICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNoYXJhY3RlckZpbHRlcnNcIik7XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgZm9yIChjb25zdCBjaGFyYWN0ZXIgb2YgW1wiQWxsXCIsIC4uLmNoYXJhY3RlcnNdKSB7XG4gICAgICAgIGNvbnN0IGlkID0gYGNoYXJhY3RlclNlbGVjdG9yc18ke2NoYXJhY3Rlcn1gO1xuICAgICAgICBjb25zdCByYWRpb19idXR0b24gPSBjcmVhdGVIVE1MKFtcImlucHV0XCIsIHsgaWQ6IGlkLCB0eXBlOiBcInJhZGlvXCIsIG5hbWU6IFwiY2hhcmFjdGVyU2VsZWN0b3JzXCIsIHZhbHVlOiBjaGFyYWN0ZXIgfV0pO1xuICAgICAgICByYWRpb19idXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHVwZGF0ZVJlc3VsdHMpO1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQocmFkaW9fYnV0dG9uKTtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1wibGFiZWxcIiwgeyBmb3I6IGlkIH0sIGNoYXJhY3Rlcl0pKTtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1wiYnJcIl0pKTtcbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICByYWRpb19idXR0b24uY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZmlsdGVyczogW1RyZWVOb2RlLCBzdHJpbmddW10gPSBbXG4gICAgICAgIFtwYXJ0c0ZpbHRlciwgXCJwYXJ0c0ZpbHRlclwiXSxcbiAgICAgICAgW2F2YWlsYWJpbGl0eUZpbHRlciwgXCJhdmFpbGFiaWxpdHlGaWx0ZXJcIl0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IFtmaWx0ZXIsIG5hbWVdIG9mIGZpbHRlcnMpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobmFtZSk7XG4gICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdHJlZSA9IG1ha2VDaGVja2JveFRyZWUoZmlsdGVyKTtcbiAgICAgICAgdHJlZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZVJlc3VsdHMpO1xuICAgICAgICB0YXJnZXQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKHRyZWUpO1xuICAgIH1cbn1cblxuYWRkRmlsdGVyVHJlZXMoKTtcblxubGV0IGRyYWdnZWQ6IEhUTUxFbGVtZW50O1xuY29uc3QgZHJhZ1NlcGFyYXRvckxpbmUgPSBjcmVhdGVIVE1MKFtcImhyXCIsIHsgaWQ6IFwiZHJhZ092ZXJCYXJcIiB9XSk7XG5sZXQgZHJhZ0hpZ2hsaWdodGVkRWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGFwcGx5RHJhZ0Ryb3AoKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoeyB0YXJnZXQgfSkgPT4ge1xuICAgICAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkcmFnZ2VkID0gdGFyZ2V0O1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoIShldmVudC50YXJnZXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PT0gXCJkcm9wem9uZVwiKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRSZWN0ID0gZXZlbnQudGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgY29uc3QgeSA9IGV2ZW50LmNsaWVudFkgLSB0YXJnZXRSZWN0LnRvcDtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IHRhcmdldFJlY3QuaGVpZ2h0O1xuICAgICAgICAgICAgZW51bSBQb3NpdGlvbiB7XG4gICAgICAgICAgICAgICAgYWJvdmUsXG4gICAgICAgICAgICAgICAgb24sXG4gICAgICAgICAgICAgICAgYmVsb3csXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHkgPCBoZWlnaHQgKiAwLjMgPyBQb3NpdGlvbi5hYm92ZSA6IHkgPiBoZWlnaHQgKiAwLjcgPyBQb3NpdGlvbi5iZWxvdyA6IFBvc2l0aW9uLm9uO1xuICAgICAgICAgICAgc3dpdGNoIChwb3NpdGlvbikge1xuICAgICAgICAgICAgICAgIGNhc2UgUG9zaXRpb24uYWJvdmU6XG4gICAgICAgICAgICAgICAgICAgIGlmIChkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJkcm9waG92ZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRyYWdTZXBhcmF0b3JMaW5lLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQuYmVmb3JlKGRyYWdTZXBhcmF0b3JMaW5lKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBQb3NpdGlvbi5iZWxvdzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRyYWdIaWdobGlnaHRlZEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdIaWdobGlnaHRlZEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImRyb3Bob3ZlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdIaWdobGlnaHRlZEVsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZHJhZ1NlcGFyYXRvckxpbmUuaGlkZGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC5hZnRlcihkcmFnU2VwYXJhdG9yTGluZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgUG9zaXRpb24ub246XG4gICAgICAgICAgICAgICAgICAgIGRyYWdTZXBhcmF0b3JMaW5lLmhpZGRlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJkcm9waG92ZXJcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGRyYWdnZWQgPT09IGV2ZW50LnRhcmdldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZHJhZ0hpZ2hsaWdodGVkRWxlbWVudCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgICAgICAgICAgZHJhZ0hpZ2hsaWdodGVkRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZHJvcGhvdmVyXCIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgKHsgdGFyZ2V0IH0pID0+IHtcbiAgICAgICAgaWYgKCFkcmFnU2VwYXJhdG9yTGluZS5oaWRkZW4pIHtcbiAgICAgICAgICAgIGRyYWdnZWQucmVtb3ZlKCk7XG4gICAgICAgICAgICBkcmFnU2VwYXJhdG9yTGluZS5hZnRlcihkcmFnZ2VkKTtcbiAgICAgICAgICAgIGRyYWdTZXBhcmF0b3JMaW5lLmhpZGRlbiA9IHRydWU7XG4gICAgICAgICAgICB1cGRhdGVSZXN1bHRzKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZHJhZ1NlcGFyYXRvckxpbmUuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRyYWdIaWdobGlnaHRlZEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGRyYWdIaWdobGlnaHRlZEVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImRyb3Bob3ZlclwiKTtcbiAgICAgICAgICAgIGNvbnN0IGRyb3BUYXJnZXQgPSBkcmFnSGlnaGxpZ2h0ZWRFbGVtZW50O1xuICAgICAgICAgICAgZHJhZ0hpZ2hsaWdodGVkRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmICghKGRyb3BUYXJnZXQgaW5zdGFuY2VvZiBIVE1MTElFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRyb3BUYXJnZXQudGV4dENvbnRlbnQgKz0gYCske2RyYWdnZWQudGV4dENvbnRlbnR9YDtcbiAgICAgICAgICAgIGRyYWdnZWQucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhcmdldCA9PT0gZHJhZ2dlZCkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBkcmFnZ2VkLnRleHRDb250ZW50IS5zcGxpdChcIitcIik7XG4gICAgICAgICAgICBkcmFnZ2VkLnRleHRDb250ZW50ID0gc3RhdHMuc2hpZnQoKSE7XG4gICAgICAgICAgICBkcmFnZ2VkLmFmdGVyKC4uLnN0YXRzLm1hcChzdGF0ID0+IGNyZWF0ZUhUTUwoW1wibGlcIiwgeyBjbGFzczogXCJkcm9wem9uZVwiLCBkcmFnZ2FibGU6IFwidHJ1ZVwiIH0sIHN0YXRdKSkpO1xuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICB9KTtcbn1cblxuYXBwbHlEcmFnRHJvcCgpO1xuXG5mdW5jdGlvbiBjb21wYXJlKGxoczogbnVtYmVyLCByaHM6IG51bWJlcik6IC0xIHwgMCB8IDEge1xuICAgIGlmIChsaHMgPT09IHJocykge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIGxocyA8IHJocyA/IC0xIDogMTtcbn1cblxuZnVuY3Rpb24gZ2V0U2VsZWN0ZWRDaGFyYWN0ZXIoKTogQ2hhcmFjdGVyIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBjaGFyYWN0ZXJGaWx0ZXJMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoXCJjaGFyYWN0ZXJTZWxlY3RvcnNcIik7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGNoYXJhY3RlckZpbHRlckxpc3QpIHtcbiAgICAgICAgaWYgKCEoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW1lbnQuY2hlY2tlZCkge1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gZWxlbWVudC52YWx1ZTtcbiAgICAgICAgICAgIGlmIChpc0NoYXJhY3RlcihzZWxlY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGVjdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0U2VsZWN0ZWRDaGFyYWN0ZXIoY2hhcmFjdGVyOiBDaGFyYWN0ZXIgfCBcIkFsbFwiKSB7XG4gICAgY29uc3QgY2hhcmFjdGVyRmlsdGVyTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKFwiY2hhcmFjdGVyU2VsZWN0b3JzXCIpO1xuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBjaGFyYWN0ZXJGaWx0ZXJMaXN0KSB7XG4gICAgICAgIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbGVtZW50LnZhbHVlID09PSBjaGFyYWN0ZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuZXhwb3J0IGNvbnN0IGl0ZW1TZWxlY3RvcnMgPSBbXCJwYXJ0c1NlbGVjdG9yXCIsIFwiZ2FjaGFTZWxlY3RvclwiLCBcIm90aGVySXRlbXNTZWxlY3RvclwiXSBhcyBjb25zdDtcbmV4cG9ydCB0eXBlIEl0ZW1TZWxlY3RvciA9IHR5cGVvZiBpdGVtU2VsZWN0b3JzW251bWJlcl07XG5leHBvcnQgZnVuY3Rpb24gaXNJdGVtU2VsZWN0b3IoaXRlbVNlbGVjdG9yOiBzdHJpbmcpOiBpdGVtU2VsZWN0b3IgaXMgSXRlbVNlbGVjdG9yIHtcbiAgICByZXR1cm4gKGl0ZW1TZWxlY3RvcnMgYXMgdW5rbm93biBhcyBzdHJpbmdbXSkuaW5jbHVkZXMoaXRlbVNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gZ2V0SXRlbVR5cGVTZWxlY3Rpb24oKTogSXRlbVNlbGVjdG9yIHtcbiAgICBjb25zdCBwYXJ0c1NlbGVjdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXJ0c1NlbGVjdG9yXCIpO1xuICAgIGlmICghKHBhcnRzU2VsZWN0b3IgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGlmIChwYXJ0c1NlbGVjdG9yLmNoZWNrZWQpIHtcbiAgICAgICAgcmV0dXJuIFwicGFydHNTZWxlY3RvclwiO1xuICAgIH1cbiAgICBjb25zdCBnYWNoYVNlbGVjdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYWNoYVNlbGVjdG9yXCIpO1xuICAgIGlmICghKGdhY2hhU2VsZWN0b3IgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGlmIChnYWNoYVNlbGVjdG9yLmNoZWNrZWQpIHtcbiAgICAgICAgcmV0dXJuIFwiZ2FjaGFTZWxlY3RvclwiO1xuICAgIH1cbiAgICBjb25zdCBvdGhlckl0ZW1zU2VsZWN0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm90aGVySXRlbXNTZWxlY3RvclwiKTtcbiAgICBpZiAoIShvdGhlckl0ZW1zU2VsZWN0b3IgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGlmIChvdGhlckl0ZW1zU2VsZWN0b3IuY2hlY2tlZCkge1xuICAgICAgICByZXR1cm4gXCJvdGhlckl0ZW1zU2VsZWN0b3JcIjtcbiAgICB9XG4gICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xufVxuXG5mdW5jdGlvbiBzYXZlU2VsZWN0aW9uKCkge1xuICAgIGNvbnN0IHNlbGVjdGVkQ2hhcmFjdGVyID0gZ2V0U2VsZWN0ZWRDaGFyYWN0ZXIoKSB8fCBcIkFsbFwiO1xuICAgIFZhcmlhYmxlX3N0b3JhZ2Uuc2V0X3ZhcmlhYmxlKFwiQ2hhcmFjdGVyXCIsIHNlbGVjdGVkQ2hhcmFjdGVyKTtcbiAgICB7Ly9GaWx0ZXJzXG4gICAgICAgIGNvbnN0IHBhcnRzRmlsdGVyTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGFydHNGaWx0ZXJcIik/LmNoaWxkcmVuWzBdO1xuICAgICAgICBpZiAoIShwYXJ0c0ZpbHRlckxpc3QgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhnZXRMZWFmU3RhdGVzKHBhcnRzRmlsdGVyTGlzdCkpKSB7XG4gICAgICAgICAgICBWYXJpYWJsZV9zdG9yYWdlLnNldF92YXJpYWJsZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXZhaWxhYmlsaXR5RmlsdGVyXCIpPy5jaGlsZHJlblswXTtcbiAgICAgICAgaWYgKCEoYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBbbmFtZSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGdldExlYWZTdGF0ZXMoYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCkpKSB7XG4gICAgICAgICAgICBWYXJpYWJsZV9zdG9yYWdlLnNldF92YXJpYWJsZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgeyAvL21pc2NcbiAgICAgICAgY29uc3QgbGV2ZWxyYW5nZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxyYW5nZVwiKTtcbiAgICAgICAgaWYgKCEobGV2ZWxyYW5nZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWF4TGV2ZWwgPSBwYXJzZUludChsZXZlbHJhbmdlLnZhbHVlKTtcbiAgICAgICAgVmFyaWFibGVfc3RvcmFnZS5zZXRfdmFyaWFibGUoXCJtYXhMZXZlbFwiLCBtYXhMZXZlbCk7XG5cbiAgICAgICAgY29uc3QgbmFtZWZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmFtZUZpbHRlclwiKTtcbiAgICAgICAgaWYgKCEobmFtZWZpbHRlciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXRlbV9uYW1lID0gbmFtZWZpbHRlci52YWx1ZTtcbiAgICAgICAgaWYgKGl0ZW1fbmFtZSkge1xuICAgICAgICAgICAgVmFyaWFibGVfc3RvcmFnZS5zZXRfdmFyaWFibGUoXCJuYW1lRmlsdGVyXCIsIGl0ZW1fbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBWYXJpYWJsZV9zdG9yYWdlLmRlbGV0ZV92YXJpYWJsZShcIm5hbWVGaWx0ZXJcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW5jaGFudFRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW5jaGFudFRvZ2dsZVwiKTtcbiAgICAgICAgaWYgKCEoZW5jaGFudFRvZ2dsZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgVmFyaWFibGVfc3RvcmFnZS5zZXRfdmFyaWFibGUoXCJlbmNoYW50VG9nZ2xlXCIsIGVuY2hhbnRUb2dnbGUuY2hlY2tlZCk7XG4gICAgfVxuICAgIHsgLy9pdGVtIHNlbGVjdGlvblxuICAgICAgICBWYXJpYWJsZV9zdG9yYWdlLnNldF92YXJpYWJsZShcIml0ZW1UeXBlU2VsZWN0b3JcIiwgZ2V0SXRlbVR5cGVTZWxlY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgVmFyaWFibGVfc3RvcmFnZS5zZXRfdmFyaWFibGUoXCJleGNsdWRlZF9pdGVtX2lkc1wiLCBBcnJheS5mcm9tKGV4Y2x1ZGVkX2l0ZW1faWRzKS5qb2luKFwiLFwiKSk7XG59XG5cbmZ1bmN0aW9uIHJlc3RvcmVTZWxlY3Rpb24oKSB7XG4gICAgY29uc3Qgc3RvcmVkX2NoYXJhY3RlciA9IFZhcmlhYmxlX3N0b3JhZ2UuZ2V0X3ZhcmlhYmxlKFwiQ2hhcmFjdGVyXCIpO1xuICAgIHNldFNlbGVjdGVkQ2hhcmFjdGVyKHR5cGVvZiBzdG9yZWRfY2hhcmFjdGVyID09PSBcInN0cmluZ1wiICYmIGlzQ2hhcmFjdGVyKHN0b3JlZF9jaGFyYWN0ZXIpID8gc3RvcmVkX2NoYXJhY3RlciA6IFwiQWxsXCIpO1xuXG4gICAgey8vRmlsdGVyc1xuICAgICAgICBsZXQgc3RhdGVzOiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IFtuYW1lLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoVmFyaWFibGVfc3RvcmFnZS52YXJpYWJsZXMpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgICAgIHN0YXRlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFydHNGaWx0ZXJMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXJ0c0ZpbHRlclwiKT8uY2hpbGRyZW5bMF07XG4gICAgICAgIGlmICghKHBhcnRzRmlsdGVyTGlzdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgc2V0TGVhZlN0YXRlcyhwYXJ0c0ZpbHRlckxpc3QsIHN0YXRlcyk7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJpbGl0eUZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImF2YWlsYWJpbGl0eUZpbHRlclwiKT8uY2hpbGRyZW5bMF07XG4gICAgICAgIGlmICghKGF2YWlsYWJpbGl0eUZpbHRlckxpc3QgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIHNldExlYWZTdGF0ZXMoYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCwgc3RhdGVzKTtcbiAgICB9XG4gICAgY29uc3QgbGV2ZWxyYW5nZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxyYW5nZVwiKTtcbiAgICB7IC8vbWlzY1xuICAgICAgICBpZiAoIShsZXZlbHJhbmdlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXhMZXZlbCA9IFZhcmlhYmxlX3N0b3JhZ2UuZ2V0X3ZhcmlhYmxlKFwibWF4TGV2ZWxcIik7XG4gICAgICAgIGlmICh0eXBlb2YgbWF4TGV2ZWwgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIGxldmVscmFuZ2UudmFsdWUgPSBgJHttYXhMZXZlbH1gO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV2ZWxyYW5nZS52YWx1ZSA9IGxldmVscmFuZ2UubWF4O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmFtZWZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmFtZUZpbHRlclwiKTtcbiAgICAgICAgaWYgKCEobmFtZWZpbHRlciBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpdGVtX25hbWUgPSBWYXJpYWJsZV9zdG9yYWdlLmdldF92YXJpYWJsZShcIm5hbWVGaWx0ZXJcIik7XG4gICAgICAgIGlmICh0eXBlb2YgaXRlbV9uYW1lID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBuYW1lZmlsdGVyLnZhbHVlID0gaXRlbV9uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZW5jaGFudFRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZW5jaGFudFRvZ2dsZVwiKTtcbiAgICAgICAgaWYgKCEoZW5jaGFudFRvZ2dsZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgZW5jaGFudFRvZ2dsZS5jaGVja2VkID0gISFWYXJpYWJsZV9zdG9yYWdlLmdldF92YXJpYWJsZShcImVuY2hhbnRUb2dnbGVcIik7XG4gICAgfVxuXG4gICAgeyAvL2l0ZW0gc2VsZWN0aW9uXG4gICAgICAgIGxldCBpdGVtVHlwZVNlbGVjdG9yID0gVmFyaWFibGVfc3RvcmFnZS5nZXRfdmFyaWFibGUoXCJpdGVtVHlwZVNlbGVjdG9yXCIpO1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW1UeXBlU2VsZWN0b3IgIT09IFwic3RyaW5nXCIgfHwgIWlzSXRlbVNlbGVjdG9yKGl0ZW1UeXBlU2VsZWN0b3IpKSB7XG4gICAgICAgICAgICBpdGVtVHlwZVNlbGVjdG9yID0gXCJwYXJ0c1NlbGVjdG9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpdGVtVHlwZVNlbGVjdG9yKTtcbiAgICAgICAgaWYgKCEoc2VsZWN0b3IgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIHNlbGVjdG9yLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICBzZWxlY3Rvci5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImNoYW5nZVwiLCB7IGJ1YmJsZXM6IGZhbHNlLCBjYW5jZWxhYmxlOiB0cnVlIH0pKTtcbiAgICB9XG5cbiAgICBjb25zdCBleGNsdWRlZF9pZHMgPSBWYXJpYWJsZV9zdG9yYWdlLmdldF92YXJpYWJsZShcImV4Y2x1ZGVkX2l0ZW1faWRzXCIpO1xuICAgIGlmICh0eXBlb2YgZXhjbHVkZWRfaWRzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGZvciAoY29uc3QgaWQgb2YgZXhjbHVkZWRfaWRzLnNwbGl0KFwiLFwiKSkge1xuICAgICAgICAgICAgZXhjbHVkZWRfaXRlbV9pZHMuYWRkKHBhcnNlSW50KGlkKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZXhjbHVkZWRfaXRlbV9pZHMuZGVsZXRlKE5hTik7XG5cbiAgICAvL211c3QgYmUgbGFzdCBiZWNhdXNlIGl0IHRyaWdnZXJzIGEgc3RvcmVcbiAgICBsZXZlbHJhbmdlLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiaW5wdXRcIikpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVSZXN1bHRzKCkge1xuICAgIHNhdmVTZWxlY3Rpb24oKTtcbiAgICBjb25zdCBmaWx0ZXJzOiAoKGl0ZW06IEl0ZW0pID0+IGJvb2xlYW4pW10gPSBbXTtcbiAgICBjb25zdCBzb3VyY2VGaWx0ZXJzOiAoKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpID0+IGJvb2xlYW4pW10gPSBbXTtcbiAgICBsZXQgc2VsZWN0ZWRDaGFyYWN0ZXI6IENoYXJhY3RlciB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCBwYXJ0c0ZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhcnRzRmlsdGVyXCIpPy5jaGlsZHJlblswXTtcbiAgICBpZiAoIShwYXJ0c0ZpbHRlckxpc3QgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGNvbnN0IGVuY2hhbnRUb2dnbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVuY2hhbnRUb2dnbGVcIik7XG4gICAgaWYgKCEoZW5jaGFudFRvZ2dsZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgY29uc3QgbmFtZWZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmFtZUZpbHRlclwiKTtcbiAgICBpZiAoIShuYW1lZmlsdGVyIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cblxuICAgIHsgLy9jaGFyYWN0ZXIgZmlsdGVyXG4gICAgICAgIHNlbGVjdGVkQ2hhcmFjdGVyID0gZ2V0U2VsZWN0ZWRDaGFyYWN0ZXIoKTtcbiAgICAgICAgc3dpdGNoIChnZXRJdGVtVHlwZVNlbGVjdGlvbigpKSB7XG4gICAgICAgICAgICBjYXNlICdwYXJ0c1NlbGVjdG9yJzpcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRDaGFyYWN0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVycy5wdXNoKGl0ZW0gPT4gaXRlbS5jaGFyYWN0ZXIgPT09IHNlbGVjdGVkQ2hhcmFjdGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdnYWNoYVNlbGVjdG9yJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ290aGVySXRlbXNTZWxlY3Rvcic6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB7IC8vcGFydHMgZmlsdGVyXG4gICAgICAgIHN3aXRjaCAoZ2V0SXRlbVR5cGVTZWxlY3Rpb24oKSkge1xuICAgICAgICAgICAgY2FzZSAncGFydHNTZWxlY3Rvcic6XG4gICAgICAgICAgICAgICAgY29uc3QgcGFydHNTdGF0ZXMgPSBnZXRMZWFmU3RhdGVzKHBhcnRzRmlsdGVyTGlzdCk7XG4gICAgICAgICAgICAgICAgZmlsdGVycy5wdXNoKGl0ZW0gPT4gcGFydHNTdGF0ZXNbaXRlbS5wYXJ0XSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdnYWNoYVNlbGVjdG9yJzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ290aGVySXRlbXNTZWxlY3Rvcic6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB7IC8vYXZhaWxhYmlsaXR5IGZpbHRlclxuICAgICAgICBjb25zdCBhdmFpbGFiaWxpdHlGaWx0ZXJMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhdmFpbGFiaWxpdHlGaWx0ZXJcIik/LmNoaWxkcmVuWzBdO1xuICAgICAgICBpZiAoIShhdmFpbGFiaWxpdHlGaWx0ZXJMaXN0IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhdmFpbGFiaWxpdHlTdGF0ZXMgPSBnZXRMZWFmU3RhdGVzKGF2YWlsYWJpbGl0eUZpbHRlckxpc3QpO1xuICAgICAgICBpZiAoIWF2YWlsYWJpbGl0eVN0YXRlc1tcIkdvbGRcIl0pIHtcbiAgICAgICAgICAgIHNvdXJjZUZpbHRlcnMucHVzaChpdGVtU291cmNlID0+ICEoaXRlbVNvdXJjZSBpbnN0YW5jZW9mIFNob3BJdGVtU291cmNlICYmICFpdGVtU291cmNlLmFwICYmIGl0ZW1Tb3VyY2UucHJpY2UgPiAwKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJBUFwiXSkge1xuICAgICAgICAgICAgc291cmNlRmlsdGVycy5wdXNoKGl0ZW1Tb3VyY2UgPT4gIShpdGVtU291cmNlIGluc3RhbmNlb2YgU2hvcEl0ZW1Tb3VyY2UgJiYgaXRlbVNvdXJjZS5hcCAmJiBpdGVtU291cmNlLnByaWNlID4gMCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYXZhaWxhYmlsaXR5U3RhdGVzW1wiVW50cmFkYWJsZVwiXSkge1xuICAgICAgICAgICAgZmlsdGVycy5wdXNoKGl0ZW0gPT4gaXRlbS5wYXJjZWxfZW5hYmxlZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJBbGxvdyBnYWNoYVwiXSkge1xuICAgICAgICAgICAgc291cmNlRmlsdGVycy5wdXNoKGl0ZW1Tb3VyY2UgPT4gIShpdGVtU291cmNlIGluc3RhbmNlb2YgR2FjaGFJdGVtU291cmNlKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJHdWFyZGlhblwiXSkge1xuICAgICAgICAgICAgc291cmNlRmlsdGVycy5wdXNoKGl0ZW1Tb3VyY2UgPT4gIWl0ZW1Tb3VyY2UucmVxdWlyZXNHdWFyZGlhbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJVbmF2YWlsYWJsZSBpdGVtc1wiXSkge1xuICAgICAgICAgICAgY29uc3QgYXZhaWxhYmlsaXR5U291cmNlRmlsdGVyID0gWy4uLnNvdXJjZUZpbHRlcnNdO1xuICAgICAgICAgICAgY29uc3Qgc291cmNlRmlsdGVyID0gKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpID0+IGF2YWlsYWJpbGl0eVNvdXJjZUZpbHRlci5ldmVyeShmaWx0ZXIgPT4gZmlsdGVyKGl0ZW1Tb3VyY2UpKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGlzQXZhaWxhYmxlU291cmNlKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNvdXJjZUZpbHRlcihpdGVtU291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpdGVtU291cmNlIGluc3RhbmNlb2YgR2FjaGFJdGVtU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc291cmNlIG9mIGl0ZW1Tb3VyY2UuaXRlbS5zb3VyY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNBdmFpbGFibGVTb3VyY2Uoc291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlRmlsdGVycy5wdXNoKGlzQXZhaWxhYmxlU291cmNlKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaXNBdmFpbGFibGVJdGVtKGl0ZW06IEl0ZW0pOiBib29sZWFuIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW1Tb3VyY2Ugb2YgaXRlbS5zb3VyY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0F2YWlsYWJsZVNvdXJjZShpdGVtU291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmlsdGVycy5wdXNoKGlzQXZhaWxhYmxlSXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB7IC8vbWlzYyBmaWx0ZXJcbiAgICAgICAgY29uc3QgbGV2ZWxyYW5nZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxyYW5nZVwiKTtcbiAgICAgICAgaWYgKCEobGV2ZWxyYW5nZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbWF4TGV2ZWwgPSBwYXJzZUludChsZXZlbHJhbmdlLnZhbHVlKTtcbiAgICAgICAgZmlsdGVycy5wdXNoKChpdGVtOiBJdGVtKSA9PiBpdGVtLmxldmVsIDw9IG1heExldmVsKTtcblxuICAgICAgICBjb25zdCBpdGVtX25hbWUgPSBuYW1lZmlsdGVyLnZhbHVlO1xuICAgICAgICBpZiAoaXRlbV9uYW1lKSB7XG4gICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiBpdGVtLm5hbWVfZW4udG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhpdGVtX25hbWUudG9Mb3dlckNhc2UoKSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgeyAvL2lkIGZpbHRlclxuICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiAhZXhjbHVkZWRfaXRlbV9pZHMuaGFzKGl0ZW0uaWQpKTtcbiAgICAgICAgY29uc3QgaXRlbUZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIml0ZW1GaWx0ZXJcIik7XG4gICAgICAgIGlmICghKGl0ZW1GaWx0ZXJMaXN0IGluc3RhbmNlb2YgSFRNTERpdkVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG5cbiAgICAgICAgfVxuICAgICAgICBpdGVtRmlsdGVyTGlzdC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgICAgZm9yIChjb25zdCBpZCBvZiBleGNsdWRlZF9pdGVtX2lkcykge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGl0ZW1zLmdldChpZCk7XG4gICAgICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZW1GaWx0ZXJMaXN0LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1wiZGl2XCIsIGNyZWF0ZUhUTUwoW1wiYnV0dG9uXCIsIHsgY2xhc3M6IFwiaXRlbV9yZW1vdmFsX3JlbW92YWxcIiwgXCJkYXRhLWl0ZW1faW5kZXhcIjogYCR7aWR9YCB9LCBcIlhcIl0pLCBpdGVtLm5hbWVfZW5dKSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGNvbnN0IGNvbXBhcmF0b3JzOiAoKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBudW1iZXIpW10gPSBbXTtcblxuICAgIGNvbnN0IHByaW9yaXR5TGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJpb3JpdHlfbGlzdFwiKTtcbiAgICBpZiAoIShwcmlvcml0eUxpc3QgaW5zdGFuY2VvZiBIVE1MT0xpc3RFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGNvbnN0IHByaW9yaXR5U3RhdHMgPSBBcnJheVxuICAgICAgICAuZnJvbShwcmlvcml0eUxpc3QuY2hpbGROb2RlcylcbiAgICAgICAgLmZpbHRlcihub2RlID0+ICFub2RlLnRleHRDb250ZW50Py5pbmNsdWRlcygnXFxuJykpXG4gICAgICAgIC5maWx0ZXIobm9kZSA9PiBub2RlLnRleHRDb250ZW50KVxuICAgICAgICAubWFwKG5vZGUgPT4gbm9kZS50ZXh0Q29udGVudCEpO1xuICAgIHtcbiAgICAgICAgZm9yIChjb25zdCBzdGF0IG9mIHByaW9yaXR5U3RhdHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gc3RhdC5zcGxpdChcIitcIik7XG4gICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShcbiAgICAgICAgICAgICAgICBzdGF0cy5tYXAoc3RhdCA9PiBsaHMuc3RhdEZyb21TdHJpbmcoc3RhdCkpLnJlZHVjZSgobiwgbSkgPT4gbiArIG0pLFxuICAgICAgICAgICAgICAgIHN0YXRzLm1hcChzdGF0ID0+IHJocy5zdGF0RnJvbVN0cmluZyhzdGF0KSkucmVkdWNlKChuLCBtKSA9PiBuICsgbSlcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdGFibGUgPSAoKCkgPT4ge1xuICAgICAgICBzd2l0Y2ggKGdldEl0ZW1UeXBlU2VsZWN0aW9uKCkpIHtcbiAgICAgICAgICAgIGNhc2UgJ3BhcnRzU2VsZWN0b3InOlxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRSZXN1bHRzVGFibGUoXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPT4gZmlsdGVycy5ldmVyeShmaWx0ZXIgPT4gZmlsdGVyKGl0ZW0pKSxcbiAgICAgICAgICAgICAgICAgICAgaXRlbVNvdXJjZSA9PiBzb3VyY2VGaWx0ZXJzLmV2ZXJ5KGZpbHRlciA9PiBmaWx0ZXIoaXRlbVNvdXJjZSkpLFxuICAgICAgICAgICAgICAgICAgICAoaXRlbXMsIGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb21wYXJhdG9yIG9mIGNvbXBhcmF0b3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjb21wYXJhdG9yKGl0ZW1zWzBdLCBpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIC0xOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtpdGVtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbLi4uaXRlbXMsIGl0ZW1dO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eVN0YXRzLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZENoYXJhY3RlclxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjYXNlICdnYWNoYVNlbGVjdG9yJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0R2FjaGFUYWJsZShpdGVtID0+IGZpbHRlcnMuZXZlcnkoZmlsdGVyID0+IGZpbHRlcihpdGVtKSksIHNlbGVjdGVkQ2hhcmFjdGVyKTtcbiAgICAgICAgICAgIGNhc2UgJ290aGVySXRlbXNTZWxlY3Rvcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUhUTUwoXG4gICAgICAgICAgICAgICAgICAgIFtcInRhYmxlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJ0clwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiVE9ETzogT3RoZXIgaXRlbXNcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSkoKTtcblxuICAgIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0c1wiKTtcbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRhcmdldC5pbm5lclRleHQgPSBcIlwiO1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZCh0YWJsZSk7XG59XG5cbmZ1bmN0aW9uIHNldE1heExldmVsRGlzcGxheVVwZGF0ZSgpIHtcbiAgICBjb25zdCBsZXZlbERpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxldmVsRGlzcGxheVwiKTtcbiAgICBpZiAoIShsZXZlbERpc3BsYXkgaW5zdGFuY2VvZiBIVE1MTGFiZWxFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGNvbnN0IGxldmVscmFuZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxldmVscmFuZ2VcIik7XG4gICAgaWYgKCEobGV2ZWxyYW5nZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgbGV2ZWxyYW5nZS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgICBsZXZlbERpc3BsYXkudGV4dENvbnRlbnQgPSBgTWF4IGxldmVsIHJlcXVpcmVtZW50OiAke2xldmVscmFuZ2UudmFsdWV9YDtcbiAgICAgICAgdXBkYXRlUmVzdWx0cygpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXREaXNwbGF5VXBkYXRlcygpIHtcbiAgICBzZXRNYXhMZXZlbERpc3BsYXlVcGRhdGUoKTtcbiAgICBjb25zdCBuYW1lZmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYW1lRmlsdGVyXCIpO1xuICAgIGlmICghKG5hbWVmaWx0ZXIgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICBuYW1lZmlsdGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCB1cGRhdGVSZXN1bHRzKTtcblxuICAgIGNvbnN0IGVuY2hhbnRUb2dnbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVuY2hhbnRUb2dnbGVcIik7XG4gICAgaWYgKCEoZW5jaGFudFRvZ2dsZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgY29uc3QgcHJpb3JpdHlMaXN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcmlvcml0eV9saXN0XCIpO1xuICAgIGlmICghKHByaW9yaXR5TGlzdCBpbnN0YW5jZW9mIEhUTUxPTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgZW5jaGFudFRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCBwcmlvcml0eVN0YXROb2RlcyA9IEFycmF5XG4gICAgICAgICAgICAuZnJvbShwcmlvcml0eUxpc3QuY2hpbGROb2RlcylcbiAgICAgICAgICAgIC5maWx0ZXIobm9kZSA9PiAhbm9kZS50ZXh0Q29udGVudD8uaW5jbHVkZXMoJ1xcbicpKVxuICAgICAgICAgICAgLmZpbHRlcihub2RlID0+IG5vZGUudGV4dENvbnRlbnQpO1xuXG4gICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBwcmlvcml0eVN0YXROb2Rlcykge1xuICAgICAgICAgICAgY29uc3QgcmVnZXggPSBlbmNoYW50VG9nZ2xlLmNoZWNrZWQgPyAvXigoPzpTdHIpfCg/OlN0YSl8KD86RGV4KXwoPzpXaWxsKSkkLyA6IC9eTWF4ICgoPzpTdHIpfCg/OlN0YSl8KD86RGV4KXwoPzpXaWxsKSkkLztcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VyID0gZW5jaGFudFRvZ2dsZS5jaGVja2VkID8gXCJNYXggJDFcIiA6IFwiJDFcIjtcbiAgICAgICAgICAgIG5vZGUudGV4dENvbnRlbnQgPSBub2RlLnRleHRDb250ZW50IS5zcGxpdChcIitcIikubWFwKHMgPT4gcy5yZXBsYWNlKHJlZ2V4LCByZXBsYWNlcikpLmpvaW4oXCIrXCIpO1xuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICB9KTtcbn1cblxuc2V0RGlzcGxheVVwZGF0ZXMoKTtcblxuZnVuY3Rpb24gc2V0SXRlbVR5cGVTZWxlY3RvckZ1bmN0aW9uYWxpdHkoKSB7XG4gICAgY29uc3QgcHJpb3JpdHlfZ3JvdXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInByaW9yaXR5X2dyb3VwXCIpO1xuICAgIGlmICghKHByaW9yaXR5X2dyb3VwIGluc3RhbmNlb2YgSFRNTEZpZWxkU2V0RWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJ0c1NlbGVjdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXJ0c1NlbGVjdG9yXCIpO1xuICAgIGlmICghKHBhcnRzU2VsZWN0b3IgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBhcnRzRmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYXJ0c0ZpbHRlclwiKTtcbiAgICBpZiAoIShwYXJ0c0ZpbHRlciBpbnN0YW5jZW9mIEhUTUxEaXZFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHBhcnRzU2VsZWN0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIHByaW9yaXR5X2dyb3VwLmNsYXNzTGlzdC5yZW1vdmUoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgcGFydHNGaWx0ZXIuY2xhc3NMaXN0LnJlbW92ZShcImRpc2FibGVkXCIpO1xuICAgICAgICB1cGRhdGVSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBnYWNoYVNlbGVjdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYWNoYVNlbGVjdG9yXCIpO1xuICAgIGlmICghKGdhY2hhU2VsZWN0b3IgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGdhY2hhU2VsZWN0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIHByaW9yaXR5X2dyb3VwLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgcGFydHNGaWx0ZXIuY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuICAgICAgICB1cGRhdGVSZXN1bHRzKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBvdGhlckl0ZW1zU2VsZWN0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm90aGVySXRlbXNTZWxlY3RvclwiKTtcbiAgICBpZiAoIShvdGhlckl0ZW1zU2VsZWN0b3IgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIG90aGVySXRlbXNTZWxlY3Rvci5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgcHJpb3JpdHlfZ3JvdXAuY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuICAgICAgICBwYXJ0c0ZpbHRlci5jbGFzc0xpc3QuYWRkKFwiZGlzYWJsZWRcIik7XG4gICAgICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICB9KTtcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGFzeW5jICgpID0+IHtcbiAgICBzZXRJdGVtVHlwZVNlbGVjdG9yRnVuY3Rpb25hbGl0eSgpO1xuICAgIHJlc3RvcmVTZWxlY3Rpb24oKTtcbiAgICBhd2FpdCBkb3dubG9hZEl0ZW1zKCk7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJzaG93X2FmdGVyX2xvYWRcIikpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImhpZGVfYWZ0ZXJfbG9hZFwiKSkge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBsZXZlbHJhbmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZXZlbHJhbmdlXCIpO1xuICAgIGlmICghKGxldmVscmFuZ2UgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGNvbnN0IG1heExldmVsID0gZ2V0TWF4SXRlbUxldmVsKCk7XG4gICAgbGV2ZWxyYW5nZS52YWx1ZSA9IGAke01hdGgubWluKHBhcnNlSW50KGxldmVscmFuZ2UudmFsdWUpLCBtYXhMZXZlbCl9YDtcbiAgICBsZXZlbHJhbmdlLm1heCA9IGAke21heExldmVsfWA7XG4gICAgbGV2ZWxyYW5nZS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImlucHV0XCIpKTtcbiAgICB1cGRhdGVSZXN1bHRzKCk7XG4gICAgY29uc3Qgc29ydF9oZWxwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcmlvcml0eV9sZWdlbmRcIik7XG4gICAgaWYgKHNvcnRfaGVscCBpbnN0YW5jZW9mIEhUTUxMZWdlbmRFbGVtZW50KSB7XG4gICAgICAgIHNvcnRfaGVscC5hcHBlbmRDaGlsZChjcmVhdGVQb3B1cExpbmsoXCIgKD8pXCIsIGNyZWF0ZUhUTUwoW1wicFwiLFxuICAgICAgICAgICAgXCJSZW9yZGVyIHRoZSBzdGF0cyB0byB5b3VyIGxpa2luZyB0byBhZmZlY3QgdGhlIHJlc3VsdHMgbGlzdC5cIiwgW1wiYnJcIl0sXG4gICAgICAgICAgICBcIkRyYWcgYSBzdGF0IHVwIG9yIGRvd24gdG8gY2hhbmdlIGl0cyBpbXBvcnRhbmNlIChmb3IgZXhhbXBsZSBkcmFnIExvYiBhYm92ZSBDaGFyZ2UpLlwiLCBbXCJiclwiXSxcbiAgICAgICAgICAgIFwiRHJhZyBhIHN0YXQgb250byBhbm90aGVyIHRvIGNvbWJpbmUgdGhlbSAoZm9yIGV4YW1wbGUgU3RyIG9udG8gRGV4LCB0aGUgcmVzdWx0cyB3aWxsIGRpc3BsYXkgU3RyK0RleCkuXCIsIFtcImJyXCJdLFxuICAgICAgICAgICAgXCJEcmFnIGEgY29tYmluZWQgc3RhdCBvbnRvIGl0c2VsZiB0byBzZXBhcmF0ZSB0aGVtLlwiXSkpKTtcbiAgICB9XG59KTtcblxuZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgIGlmICghKGV2ZW50LnRhcmdldCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC50YXJnZXQuY2xhc3NOYW1lID09PSBcIml0ZW1fcmVtb3ZhbFwiKSB7XG4gICAgICAgIGlmICghZXZlbnQudGFyZ2V0LmRhdGFzZXQuaXRlbV9pbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGV4Y2x1ZGVkX2l0ZW1faWRzLmFkZChwYXJzZUludChldmVudC50YXJnZXQuZGF0YXNldC5pdGVtX2luZGV4KSk7XG4gICAgICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTmFtZSA9PT0gXCJpdGVtX3JlbW92YWxfcmVtb3ZhbFwiKSB7XG4gICAgICAgIGlmICghZXZlbnQudGFyZ2V0LmRhdGFzZXQuaXRlbV9pbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGV4Y2x1ZGVkX2l0ZW1faWRzLmRlbGV0ZShwYXJzZUludChldmVudC50YXJnZXQuZGF0YXNldC5pdGVtX2luZGV4KSk7XG4gICAgICAgIHVwZGF0ZVJlc3VsdHMoKTtcbiAgICB9XG59KTsiLCJleHBvcnQgdHlwZSBWYXJpYWJsZV9zdG9yYWdlX3R5cGVzID0gbnVtYmVyIHwgc3RyaW5nIHwgYm9vbGVhbjtcblxudHlwZSBTdG9yYWdlX3ZhbHVlID0gYCR7XCJzXCIgfCBcIm5cIiB8IFwiYlwifSR7c3RyaW5nfWA7XG5cbmZ1bmN0aW9uIHZhcmlhYmxlX3RvX3N0cmluZyh2YWx1ZTogVmFyaWFibGVfc3RvcmFnZV90eXBlcyk6IFN0b3JhZ2VfdmFsdWUge1xuICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgICAgIHJldHVybiBgcyR7dmFsdWV9YCBhcyBjb25zdDtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgcmV0dXJuIGBuJHt2YWx1ZX1gIGFzIGNvbnN0O1xuICAgICAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID8gXCJiMVwiIDogXCJiMFwiO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc3RyaW5nX3RvX3ZhcmlhYmxlKHZ2OiBTdG9yYWdlX3ZhbHVlKTogVmFyaWFibGVfc3RvcmFnZV90eXBlcyB7XG4gICAgY29uc3QgcHJlZml4ID0gdnZbMF07XG4gICAgY29uc3QgdmFsdWUgPSB2di5zdWJzdHJpbmcoMSk7XG4gICAgc3dpdGNoIChwcmVmaXgpIHtcbiAgICAgICAgY2FzZSAncyc6IC8vc3RyaW5nXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIGNhc2UgJ24nOiAvL251bWJlclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpO1xuICAgICAgICBjYXNlICdiJzogLy9ib29sZWFuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPT09IFwiMVwiID8gdHJ1ZSA6IGZhbHNlO1xuICAgIH1cbiAgICB0aHJvdyBgaW52YWxpZCB2YWx1ZTogJHt2dn1gO1xufVxuXG5mdW5jdGlvbiBpc19zdG9yYWdlX3ZhbHVlKGtleTogc3RyaW5nKToga2V5IGlzIFN0b3JhZ2VfdmFsdWUge1xuICAgIHJldHVybiBrZXkubGVuZ3RoID49IDEgJiYgXCJzbmJcIi5pbmNsdWRlcyhrZXlbMF0pO1xufVxuXG5leHBvcnQgY2xhc3MgVmFyaWFibGVfc3RvcmFnZSB7XG4gICAgc3RhdGljIGdldF92YXJpYWJsZSh2YXJpYWJsZV9uYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgc3RvcmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYCR7dmFyaWFibGVfbmFtZX1gKTtcbiAgICAgICAgaWYgKHR5cGVvZiBzdG9yZWQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzX3N0b3JhZ2VfdmFsdWUoc3RvcmVkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHJpbmdfdG9fdmFyaWFibGUoc3RvcmVkKTtcbiAgICB9XG4gICAgc3RhdGljIHNldF92YXJpYWJsZSh2YXJpYWJsZV9uYW1lOiBzdHJpbmcsIHZhbHVlOiBWYXJpYWJsZV9zdG9yYWdlX3R5cGVzKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGAke3ZhcmlhYmxlX25hbWV9YCwgdmFyaWFibGVfdG9fc3RyaW5nKHZhbHVlKSk7XG4gICAgfVxuICAgIHN0YXRpYyBkZWxldGVfdmFyaWFibGUodmFyaWFibGVfbmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGAke3ZhcmlhYmxlX25hbWV9YCk7XG4gICAgfVxuICAgIHN0YXRpYyBjbGVhcl9hbGwoKSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0IHZhcmlhYmxlcygpIHtcbiAgICAgICAgbGV0IHJlc3VsdDogeyBba2V5OiBzdHJpbmddOiBWYXJpYWJsZV9zdG9yYWdlX3R5cGVzIH0gPSB7fTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IGxvY2FsU3RvcmFnZS5rZXkoaSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc19zdG9yYWdlX3ZhbHVlKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0W2tleV0gPSBzdHJpbmdfdG9fdmFyaWFibGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufSJdfQ==
