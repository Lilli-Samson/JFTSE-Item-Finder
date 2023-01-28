(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLeafStates = getLeafStates;
exports.makeCheckboxTree = makeCheckboxTree;
var _html = require("./html");
function getChildren(node) {
  const parent = node.parentElement;
  if (!(parent instanceof HTMLUListElement)) {
    return [];
  }
  for (let childIndex = 0; childIndex < parent.children.length; childIndex++) {
    if (parent.children[childIndex] !== node) {
      continue;
    }
    const potentialSiblingList = parent.children[childIndex + 3];
    if (!(potentialSiblingList instanceof HTMLUListElement)) {
      break;
    }
    return Array.from(potentialSiblingList.children).filter(e => e instanceof HTMLInputElement);
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
  const parentUL = node.parentElement;
  if (!(parentUL instanceof HTMLUListElement)) {
    return;
  }
  const grandparentUL = parentUL.parentElement;
  if (!(grandparentUL instanceof HTMLUListElement)) {
    return;
  }
  let candidate;
  for (const child of grandparentUL.children) {
    if (child instanceof HTMLInputElement) {
      candidate = child;
      continue;
    }
    if (child === parentUL) {
      return candidate;
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
  node.addEventListener("change", function (e) {
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
    if (element instanceof HTMLInputElement) {
      applyCheckListener(element);
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
    const node = [(0, _html.createHTML)(["input", {
      type: "checkbox",
      id: treeNode,
      checked: "true"
    }]), (0, _html.createHTML)(["label", {
      for: treeNode
    }, treeNode])];
    if (disabled) {
      node[0].classList.add("disabled");
      node[1].classList.add("disabled");
    }
    return node;
  } else {
    const list = (0, _html.createHTML)(["ul"]);
    for (let i = 0; i < treeNode.length; i++) {
      const node = treeNode[i];
      const last = i === treeNode.length - 1;
      for (const e of makeCheckboxTreeNode(node)) {
        list.appendChild(e);
      }
      if (!last && typeof node === "string") {
        list.appendChild((0, _html.createHTML)(["br"]));
      }
    }
    return [list];
  }
}
function makeCheckboxTree(treeNode) {
  let root = makeCheckboxTreeNode(treeNode)[0];
  if (!(root instanceof HTMLUListElement)) {
    throw "Internal error";
  }
  root.classList.add("treeview");
  applyCheckListeners(root);
  return root;
}
function getLeafStates(node) {
  let states = {};
  for (const element of node.children) {
    if (element instanceof HTMLInputElement) {
      if (getChildren(element).length === 0) {
        states[element.id] = element.checked;
      }
    } else if (element instanceof HTMLUListElement) {
      states = {
        ...states,
        ...getLeafStates(element)
      };
    }
  }
  return states;
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
exports.ItemSource = exports.Item = void 0;
exports.downloadItems = downloadItems;
exports.getMaxItemLevel = getMaxItemLevel;
exports.getResultsTable = getResultsTable;
var _html = require("./html");
const characters = ["Niki", "LunLun", "Lucy", "Shua", "Dhanpir", "Pochi", "Al"];
function isCharacter(character) {
  return characters.includes(character);
}
class ItemSource {
  constructor(item_name, price, ap = false, gacha_factor = 0) {
    this.item_name = item_name;
    this.price = price;
    if (ap) {
      this.price *= -1;
    }
    this.gacha_factor = gacha_factor;
  }
  display_string() {
    if (this.price) {
      const currency = this.is_ap ? "AP" : "Gold";
      const price = Math.abs(this.price);
      return `${this.item_name ? `"${this.item_name}" ` : ""}Shop ${price} ${currency}${this.gacha_factor ? ` x ${this.gacha_factor} ≈ ${this.gacha_factor * price} ${currency}` : ""}`;
    }
    let gf = this.gacha_factor.toFixed(1);
    if (gf.endsWith(".0")) {
      gf = gf.substring(0, gf.length - 2);
    }
    return `${this.item_name} x ${gf}`;
  }
  get is_ap() {
    return this.price < 0;
  }
  get is_gold() {
    return this.price > 0;
  }
  get is_gacha() {
    return this.gacha_factor !== 0;
  }
  item_name;
  price;
  gacha_factor;
}
exports.ItemSource = ItemSource;
class Item {
  id = 0;
  name_kr = "";
  name_en = "";
  name_shop = "";
  useType = "";
  maxUse = 0;
  hidden = false;
  resist = "";
  character = "Niki";
  part = "Hat";
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
}
exports.Item = Item;
class Gacha {
  constructor(shop_index, gacha_index, name) {
    this.shop_index = shop_index;
    this.gacha_index = gacha_index;
    this.name = name;
    for (const character of characters) {
      this.shop_items.set(character, new Map());
    }
  }
  add(shop_index, probability, character) {
    this.shop_items.get(character).set(shop_index, probability);
    this.character_probability.set(character, probability + (this.character_probability.get(character) || 0));
  }
  average_tries(shop_index, character = undefined) {
    const chars = character ? [character] : characters;
    const probability = chars.reduce((p, character) => p + (this.shop_items.get(character).get(shop_index) || 0), 0);
    if (probability === 0) {
      return 0;
    }
    const total_probability = chars.reduce((p, character) => p + this.character_probability.get(character), 0);
    return total_probability / probability;
  }
  shop_index;
  gacha_index;
  name;
  character_probability = new Map();
  shop_items = new Map();
}
const things = ["One thing", "Another thing", "Yet another thing"];
function f(thing) {
  const thinglist = thing ? [thing] : things;
}
let items = new Map();
let shop_items = new Map();
let gachas = [];
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
          item.max_str = parseInt(value);
          break;
        case "MAX_STA":
          item.max_sta = parseInt(value);
          break;
        case "MAX_DEX":
          item.max_dex = parseInt(value);
          break;
        case "MAX_WIL":
          item.max_wil = parseInt(value);
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
      gachas.push(new Gacha(index, parseInt(match.groups.item0), name));
    }
    const enabled = !!parseInt(match.groups.enabled);
    const price_type = match.groups.price_type === "MINT" ? "ap" : match.groups.price_type === "GOLD" ? "gold" : "none";
    const price = parseInt(match.groups.price);
    const parcel_from_shop = !!parseInt(match.groups.parcel_from_shop);
    const itemIDs = [parseInt(match.groups.item0), parseInt(match.groups.item1), parseInt(match.groups.item2), parseInt(match.groups.item3), parseInt(match.groups.item4), parseInt(match.groups.item5), parseInt(match.groups.item6), parseInt(match.groups.item7), parseInt(match.groups.item8), parseInt(match.groups.item9)];
    for (const itemID of itemIDs) {
      if (itemID === 0) {
        continue;
      }
      let oldItem = items.get(itemID);
      const newItem = new Item();
      newItem.name_en = match.groups.name_en ?? "";
      //todo: fill rest of item
      if (!oldItem) {
        oldItem = newItem;
      }
      if (category === "PARTS") {
        if (enabled) {
          oldItem.sources.push(new ItemSource(name === newItem.name_en ? "" : name, price, price_type === "ap"));
        }
        shop_items.set(index, oldItem);
      } else {
        shop_items.set(index, newItem);
      }
    }
    count++;
  }
  console.log(`Found ${count} shop items`);
}
function parseGachaData(data, gacha) {
  for (const match of data.matchAll(/<LotteryItem_(?<character>[^ ]*) Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="\d+" QuantityMax="\d+" ChansPer="(?<probability>\d+\.?\d*)" Effect="\d+" ProductOpt="\d+"\/>/g)) {
    if (!match.groups) {
      continue;
    }
    let character = match.groups.character;
    if (character === "Lunlun") {
      character = "LunLun";
    }
    if (!isCharacter(character)) {
      console.warn(`Found unknown character "${character} in lottery file ${gacha.gacha_index}`);
      continue;
    }
    gacha.add(parseInt(match.groups.shop_id), parseFloat(match.groups.probability), character);
  }
  for (const [character, map] of gacha.shop_items) {
    for (const [shop_id, probability] of map) {
      const item = shop_items.get(shop_id);
      if (!item) {
        console.warn(`Failed to find item ${shop_id} from "${gacha.name}" in shop`);
        continue;
      }
      item.sources.push(new ItemSource(gacha.name, 0, false, gacha.average_tries(shop_id, character)));
    }
  }
}
async function download(url, value = undefined, max_value = undefined) {
  const filename = url.slice(url.lastIndexOf("/") + 1);
  const element = document.getElementById("loading");
  if (element instanceof HTMLElement) {
    element.textContent = `Loading ${filename}, please wait...`;
  }
  const progressbar = document.getElementById("progressbar");
  if (progressbar instanceof HTMLProgressElement) {
    if (value) {
      progressbar.value = value;
    }
    if (max_value) {
      progressbar.max = max_value;
    }
  }
  const reply = await fetch(url);
  if (!reply.ok) {
    return "";
  }
  return reply.text();
}
async function downloadItems() {
  const itemSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res";
  const gachaSource = "https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res/lottery";
  let downloadCounter = 1;
  const itemURL = itemSource + "/Item_Parts_Ini3.xml";
  const itemData = await download(itemURL, downloadCounter++);
  const shopURL = itemSource + "/Shop_Ini3.xml";
  const shopData = await download(shopURL, downloadCounter++);
  parseItemData(itemData);
  parseShopData(shopData);
  console.log(`Found ${gachas.length} gachas`);
  for (const gacha of gachas) {
    const gacha_url = `${gachaSource}/Ini3_Lot_${`${gacha.gacha_index}`.padStart(2, "0")}.xml`;
    try {
      parseGachaData(await download(gacha_url, downloadCounter++, gachas.length + 2), gacha);
    } catch (e) {
      console.warn(`Failed downloading ${gacha_url} because ${e}`);
    }
  }
  console.log(`Loaded ${items.size} items`);
}
function itemToTableRow(item, sourceFilter) {
  //Name
  //Character
  //Part
  //Str
  //Sta
  //Dex
  //Wil
  //Smash
  //Movement
  //Charge
  //Lob
  //Serve
  //Max level
  const nameString = item => {
    if (item.name_shop !== item.name_en) {
      return item.name_en + "/" + item.name_shop;
    }
    return item.name_en;
  };
  const row = (0, _html.createHTML)(["tr", ["td", item.name_en], ["td", `${item.id}`], ["td", item.character], ["td", item.part], ["td", `${item.str}`], ["td", `${item.sta}`], ["td", `${item.dex}`], ["td", `${item.wil}`], ["td", `${item.smash}`], ["td", `${item.movement}`], ["td", `${item.charge}`], ["td", `${item.lob}`], ["td", `${item.serve}`], ["td", `${item.hp}`], ["td", `${item.level}`], ["td", item.sources.filter(sourceFilter).map(item => item.display_string()).join(", ")]]);
  return row;
}
function getResultsTable(filter, sourceFilter, priorizer) {
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
  const table = (0, _html.createHTML)(["table", ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["col"], ["tr", ["th", "Name"], ["th", "ID"], ["th", "Character"], ["th", "Part"], ["th", "Str"], ["th", "Sta"], ["th", "Dex"], ["th", "Wil"], ["th", "Smash"], ["th", "Movement"], ["th", "Charge"], ["th", "Lob"], ["th", "Serve"], ["th", "HP"], ["th", "Level"], ["th", "Source"]]]);
  for (const result of Object.values(results)) {
    for (const item of result) {
      table.appendChild(itemToTableRow(item, sourceFilter));
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

},{"./html":2}],4:[function(require,module,exports){
"use strict";

var _checkboxTree = require("./checkboxTree");
var _itemLookup = require("./itemLookup");
var _html = require("./html");
const characters = ["All", "Niki", "LunLun", "Lucy", "Shua", "Dhanpir", "Pochi", "Al"];
const partsFilter = ["Parts", ["Head", ["Hat", "Hair", "Dye"], "Upper", "Lower", "Legs", ["Shoes", "Socks"], "Aux", ["Hand", "Backpack", "Face"], "Racket"]];
const availabilityFilter = ["Availability", ["Shop", ["Gold", "AP"], "Allow gacha", "-Guardian", "Parcel enabled", "Parcel disabled", "Exclude statless items", "Exclude unavailable items"]];
function getName(node) {
  const parent = node.parentElement;
  if (!(parent instanceof HTMLUListElement)) {
    return "";
  }
  let found = false;
  for (const child of parent.children) {
    if (found) {
      return child.textContent;
    }
    if (child === node) {
      found = true;
    }
  }
}
function addFilterTrees() {
  const target = document.getElementById("characterFilters");
  if (!target) {
    return;
  }
  let first = true;
  for (const character of characters) {
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
    event.preventDefault();
  });
  document.addEventListener("drop", ({
    target
  }) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.className == "dropzone" && target !== dragged) {
      if (dragged.parentNode !== target.parentNode) {
        //disallow dragging across different lists
        return;
      }
      const list = Array.from(dragged.parentNode?.children ?? new HTMLCollection());
      const index = list.indexOf(dragged);
      dragged.remove();
      if (index > list.indexOf(target)) {
        target.before(dragged);
      } else {
        target.after(dragged);
      }
      updateResults();
    }
  });
}
applyDragDrop();
function compare(lhs, rhs) {
  if (lhs == rhs) {
    return 0;
  }
  return lhs < rhs ? -1 : 1;
}
function updateResults() {
  const filters = [];
  const sourceFilters = [];
  {
    //character filter
    const characterFilterList = document.getElementsByName("characterSelectors");
    for (const element of characterFilterList) {
      if (!(element instanceof HTMLInputElement)) {
        throw "Internal error";
      }
      if (element.checked) {
        const selected_character = element.value;
        if (selected_character !== "All") {
          filters.push(item => item.character === selected_character);
        }
        ;
        break;
      }
    }
  }
  {
    //parts filter
    const partsFilterList = document.getElementById("partsFilter")?.children[0];
    if (!(partsFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    const partsStates = (0, _checkboxTree.getLeafStates)(partsFilterList);
    filters.push(item => {
      return partsStates[item.part];
    });
  }
  {
    //availability filter
    const availabilityFilterList = document.getElementById("availabilityFilter")?.children[0];
    if (!(availabilityFilterList instanceof HTMLUListElement)) {
      throw "Internal error";
    }
    const availabilityStates = (0, _checkboxTree.getLeafStates)(availabilityFilterList);
    if (!availabilityStates["Gold"]) {
      sourceFilters.push(itemSource => !itemSource.is_gold);
    }
    if (!availabilityStates["AP"]) {
      sourceFilters.push(itemSource => !itemSource.is_ap);
    }
    if (!availabilityStates["Parcel enabled"]) {
      filters.push(item => !item.parcel_enabled);
    }
    if (!availabilityStates["Parcel disabled"]) {
      filters.push(item => item.parcel_enabled);
    }
    if (!availabilityStates["Allow gacha"]) {
      sourceFilters.push(itemSource => !itemSource.is_gacha);
    }
    if (availabilityStates["Exclude statless items"]) {
      filters.push(item => !!item.buffslots || !!item.charge || !!item.dex || !!item.hp || !!item.lob || !!item.movement || !!item.quickslots || !!item.serve || !!item.smash || !!item.sta || !!item.str || !!item.wil);
    }
    if (availabilityStates["Exclude unavailable items"]) {
      filters.push(item => item.sources.filter(source => sourceFilters.every(sourceFilter => sourceFilter(source))).length > 0);
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
    const namefilter = document.getElementById("nameFilter");
    if (!(namefilter instanceof HTMLInputElement)) {
      throw "Internal error";
    }
    const item_name = namefilter.value;
    if (item_name) {
      filters.push(item => item.name_en.toLowerCase().includes(item_name.toLowerCase()));
    }
  }
  const comparators = [];
  {
    const priorityList = document.getElementById("priority list");
    if (!(priorityList instanceof HTMLOListElement)) {
      throw "Internal error";
    }
    const texts = Array.from(priorityList.childNodes).filter(node => !node.textContent?.includes('\n')).map(node => node.textContent);
    for (const text of texts) {
      switch (text) {
        case "Movement Speed":
          comparators.push((lhs, rhs) => compare(lhs.movement, rhs.movement));
          break;
        case "Charge":
          comparators.push((lhs, rhs) => compare(lhs.charge, rhs.charge));
          break;
        case "Lob":
          comparators.push((lhs, rhs) => compare(lhs.lob, rhs.lob));
          break;
        case "Str":
          comparators.push((lhs, rhs) => compare(lhs.str, rhs.str));
          break;
        case "Dex":
          comparators.push((lhs, rhs) => compare(lhs.dex, rhs.dex));
          break;
        case "Sta":
          comparators.push((lhs, rhs) => compare(lhs.sta, rhs.sta));
          break;
        case "Will":
          comparators.push((lhs, rhs) => compare(lhs.wil, rhs.wil));
          break;
        case "Serve":
          comparators.push((lhs, rhs) => compare(lhs.serve, rhs.serve));
          break;
        case "Quickslots":
          comparators.push((lhs, rhs) => compare(lhs.quickslots, rhs.quickslots));
          break;
        case "Buffslots":
          comparators.push((lhs, rhs) => compare(lhs.buffslots, rhs.buffslots));
          break;
        case "HP":
          comparators.push((lhs, rhs) => compare(lhs.hp, rhs.hp));
          break;
        //case "AP cost":
        //    comparators.push((lhs: Item, rhs: Item) => compare(lhs. , rhs.));
        //    break;
        //case "Gold cost":
        //    comparators.push((lhs: Item, rhs: Item) => compare(lhs. , rhs.));
        //    break;
      }
    }
  }

  const table = (0, _itemLookup.getResultsTable)(item => filters.every(filter => filter(item)), itemSource => sourceFilters.every(filter => filter(itemSource)), (items, item) => {
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
  });
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
  const callback = () => {
    levelDisplay.textContent = `Max level requirement: ${levelrange.value}`;
    updateResults();
  };
  levelrange.addEventListener("input", callback);
  callback();
}
function setDisplayUpdates() {
  setMaxLevelDisplayUpdate();
  const namefilter = document.getElementById("nameFilter");
  if (!(namefilter instanceof HTMLElement)) {
    throw "Internal error";
  }
  namefilter.addEventListener("input", updateResults);
}
setDisplayUpdates();
window.addEventListener("load", async () => {
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
  levelrange.max = `${(0, _itemLookup.getMaxItemLevel)()}`;
  levelrange.value = levelrange.max;
  levelrange.dispatchEvent(new Event("input"));
  updateResults();
});

},{"./checkboxTree":1,"./html":2,"./itemLookup":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjaGVja2JveFRyZWUudHMiLCJodG1sLnRzIiwiaXRlbUxvb2t1cC50cyIsIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FDQUE7QUFJQSxTQUFTLFdBQVcsQ0FBQyxJQUFzQjtFQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYTtFQUNqQyxJQUFJLEVBQUUsTUFBTSxZQUFZLGdCQUFnQixDQUFDLEVBQUU7SUFDdkMsT0FBTyxFQUFFOztFQUViLEtBQUssSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLFVBQVUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRTtJQUN4RSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO01BQ3RDOztJQUVKLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQzVELElBQUksRUFBRSxvQkFBb0IsWUFBWSxnQkFBZ0IsQ0FBQyxFQUFFO01BQ3JEOztJQUVKLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUUsQ0FBQyxJQUE0QixDQUFDLFlBQVksZ0JBQWdCLENBQUM7O0VBRXhILE9BQU8sRUFBRTtBQUNiO0FBRUEsU0FBUyx5QkFBeUIsQ0FBQyxJQUFzQjtFQUNyRCxLQUFLLE1BQU0sS0FBSyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNuQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRTtNQUNoQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPO01BQzVCLEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSztNQUMzQix5QkFBeUIsQ0FBQyxLQUFLLENBQUM7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QUs7VUFDTixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUyxFQUFFLEdBQVMsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7VUFDckU7UUFDSixLQUFLLEtBQUs7VUFDTixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUyxFQUFFLEdBQVMsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7VUFDckU7UUFDSixLQUFLLEtBQUs7VUFDTixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUyxFQUFFLEdBQVMsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7VUFDckU7UUFDSixLQUFLLEtBQUs7VUFDTixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUyxFQUFFLEdBQVMsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7VUFDckU7UUFDSixLQUFLLE1BQU07VUFDUCxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUyxFQUFFLEdBQVMsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7VUFDckU7UUFDSixLQUFLLE9BQU87VUFDUixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUyxFQUFFLEdBQVMsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7VUFDekU7UUFDSixLQUFLLFlBQVk7VUFDYixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUyxFQUFFLEdBQVMsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7VUFDbkY7UUFDSixLQUFLLFdBQVc7VUFDWixXQUFXLENBQUMs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RUFBRTtJQUN0RSxJQUFJLE9BQU8sWUFBWSxXQUFXLEVBQUU7TUFDaEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTTs7O0VBR3RDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO0VBQ3hELElBQUksRUFBRSxVQUFVLFlBQVksZ0JBQWdCLENBQUMsRUFBRTtJQUMzQyxNQUFNLGdCQUFnQjs7RUFFMUIsVUFBVSxDQUFDLEdBQUcsR0FBRyxHQUFHLCtCQUFlLEdBQUUsRUFBRTtFQUN2QyxVQUFVLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHO0VBQ2pDLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7RUFDNUMsYUFBYSxFQUFFO0FBQ25CLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCB7IGNyZWF0ZUhUTUwgfSBmcm9tICcuL2h0bWwnO1xuXG5leHBvcnQgdHlwZSBUcmVlTm9kZSA9IHN0cmluZyB8IFRyZWVOb2RlW107XG5cbmZ1bmN0aW9uIGdldENoaWxkcmVuKG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpOiBIVE1MSW5wdXRFbGVtZW50W10ge1xuICAgIGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgICBpZiAoIShwYXJlbnQgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGZvciAobGV0IGNoaWxkSW5kZXggPSAwOyBjaGlsZEluZGV4IDwgcGFyZW50LmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleCsrKSB7XG4gICAgICAgIGlmIChwYXJlbnQuY2hpbGRyZW5bY2hpbGRJbmRleF0gIT09IG5vZGUpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBvdGVudGlhbFNpYmxpbmdMaXN0ID0gcGFyZW50LmNoaWxkcmVuW2NoaWxkSW5kZXggKyAzXTtcbiAgICAgICAgaWYgKCEocG90ZW50aWFsU2libGluZ0xpc3QgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20ocG90ZW50aWFsU2libGluZ0xpc3QuY2hpbGRyZW4pLmZpbHRlcigoZSk6IGUgaXMgSFRNTElucHV0RWxlbWVudCA9PiBlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBbXTtcbn1cblxuZnVuY3Rpb24gYXBwbHlDaGVja2VkVG9EZXNjZW5kYW50cyhub2RlOiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBnZXRDaGlsZHJlbihub2RlKSkge1xuICAgICAgICBpZiAoY2hpbGQuY2hlY2tlZCAhPT0gbm9kZS5jaGVja2VkKSB7XG4gICAgICAgICAgICBjaGlsZC5jaGVja2VkID0gbm9kZS5jaGVja2VkO1xuICAgICAgICAgICAgY2hpbGQuaW5kZXRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgYXBwbHlDaGVja2VkVG9EZXNjZW5kYW50cyhjaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudChub2RlOiBIVE1MSW5wdXRFbGVtZW50KTogSFRNTElucHV0RWxlbWVudCB8IHZvaWQge1xuICAgIGNvbnN0IHBhcmVudFVMID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghKHBhcmVudFVMIGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBncmFuZHBhcmVudFVMID0gcGFyZW50VUwucGFyZW50RWxlbWVudDtcbiAgICBpZiAoIShncmFuZHBhcmVudFVMIGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgY2FuZGlkYXRlOiBIVE1MSW5wdXRFbGVtZW50IHwgdm9pZDtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGdyYW5kcGFyZW50VUwuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgY2FuZGlkYXRlID0gY2hpbGQ7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGQgPT09IHBhcmVudFVMKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVBbmNlc3RvcnMobm9kZTogSFRNTElucHV0RWxlbWVudCkge1xuICAgIGNvbnN0IHBhcmVudCA9IGdldFBhcmVudChub2RlKTtcbiAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBmb3VuZENoZWNrZWQgPSBmYWxzZTtcbiAgICBsZXQgZm91bmRVbmNoZWNrZWQgPSBmYWxzZTtcbiAgICBsZXQgZm91bmRJbmRldGVybWluYXRlID0gZmFsc2VcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGdldENoaWxkcmVuKHBhcmVudCkpIHtcbiAgICAgICAgaWYgKGNoaWxkLmNoZWNrZWQpIHtcbiAgICAgICAgICAgIGZvdW5kQ2hlY2tlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3VuZFVuY2hlY2tlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoaWxkLmluZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgICAgIGZvdW5kSW5kZXRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZvdW5kSW5kZXRlcm1pbmF0ZSB8fCBmb3VuZENoZWNrZWQgJiYgZm91bmRVbmNoZWNrZWQpIHtcbiAgICAgICAgcGFyZW50LmluZGV0ZXJtaW5hdGUgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChmb3VuZENoZWNrZWQpIHtcbiAgICAgICAgcGFyZW50LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICBwYXJlbnQuaW5kZXRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIGlmIChmb3VuZFVuY2hlY2tlZCkge1xuICAgICAgICBwYXJlbnQuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICBwYXJlbnQuaW5kZXRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICB1cGRhdGVBbmNlc3RvcnMocGFyZW50KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlDaGVja0xpc3RlbmVyKG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgIGlmICghKHRhcmdldCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYXBwbHlDaGVja2VkVG9EZXNjZW5kYW50cyh0YXJnZXQpO1xuICAgICAgICB1cGRhdGVBbmNlc3RvcnModGFyZ2V0KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYXBwbHlDaGVja0xpc3RlbmVycyhub2RlOiBIVE1MVUxpc3RFbGVtZW50KSB7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICBhcHBseUNoZWNrTGlzdGVuZXIoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGFwcGx5Q2hlY2tMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VDaGVja2JveFRyZWVOb2RlKHRyZWVOb2RlOiBUcmVlTm9kZSk6IFtIVE1MSW5wdXRFbGVtZW50LCBIVE1MTGFiZWxFbGVtZW50XSB8IFtIVE1MVUxpc3RFbGVtZW50XSB7XG4gICAgaWYgKHR5cGVvZiB0cmVlTm9kZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBsZXQgZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHRyZWVOb2RlWzBdID09PSBcIi1cIikge1xuICAgICAgICAgICAgdHJlZU5vZGUgPSB0cmVlTm9kZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICBkaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub2RlOiBbSFRNTElucHV0RWxlbWVudCwgSFRNTExhYmVsRWxlbWVudF0gPSBbXG4gICAgICAgICAgICBjcmVhdGVIVE1MKFtcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiLCBpZDogdHJlZU5vZGUsIGNoZWNrZWQ6IFwidHJ1ZVwiIH1dKSxcbiAgICAgICAgICAgIGNyZWF0ZUhUTUwoW1wibGFiZWxcIiwgeyBmb3I6IHRyZWVOb2RlIH0sIHRyZWVOb2RlXSlcbiAgICAgICAgXTtcbiAgICAgICAgaWYgKGRpc2FibGVkKSB7XG4gICAgICAgICAgICBub2RlWzBdLmNsYXNzTGlzdC5hZGQoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgICAgIG5vZGVbMV0uY2xhc3NMaXN0LmFkZChcImRpc2FibGVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgbGlzdCA9IGNyZWF0ZUhUTUwoW1widWxcIl0pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRyZWVOb2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdHJlZU5vZGVbaV07XG4gICAgICAgICAgICBjb25zdCBsYXN0ID0gaSA9PT0gdHJlZU5vZGUubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZSBvZiBtYWtlQ2hlY2tib3hUcmVlTm9kZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGxpc3QuYXBwZW5kQ2hpbGQoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWxhc3QgJiYgdHlwZW9mIG5vZGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBsaXN0LmFwcGVuZENoaWxkKGNyZWF0ZUhUTUwoW1wiYnJcIl0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW2xpc3RdO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VDaGVja2JveFRyZWUodHJlZU5vZGU6IFRyZWVOb2RlKSB7XG4gICAgbGV0IHJvb3QgPSBtYWtlQ2hlY2tib3hUcmVlTm9kZSh0cmVlTm9kZSlbMF07XG4gICAgaWYgKCEocm9vdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgcm9vdC5jbGFzc0xpc3QuYWRkKFwidHJlZXZpZXdcIik7XG4gICAgYXBwbHlDaGVja0xpc3RlbmVycyhyb290KTtcbiAgICByZXR1cm4gcm9vdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExlYWZTdGF0ZXMobm9kZTogSFRNTFVMaXN0RWxlbWVudCkge1xuICAgIGxldCBzdGF0ZXM6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9ID0ge307XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoZ2V0Q2hpbGRyZW4oZWxlbWVudCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RhdGVzW2VsZW1lbnQuaWRdID0gZWxlbWVudC5jaGVja2VkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MVUxpc3RFbGVtZW50KSB7XG4gICAgICAgICAgICBzdGF0ZXMgPSB7IC4uLnN0YXRlcywgLi4uZ2V0TGVhZlN0YXRlcyhlbGVtZW50KSB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdGF0ZXM7XG59IiwidHlwZSBUYWdfbmFtZSA9IGtleW9mIEhUTUxFbGVtZW50VGFnTmFtZU1hcDtcbnR5cGUgQXR0cmlidXRlcyA9IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG50eXBlIEhUTUxfbm9kZTxUIGV4dGVuZHMgVGFnX25hbWU+ID0gW1QsIC4uLihIVE1MX25vZGU8VGFnX25hbWU+IHwgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBBdHRyaWJ1dGVzKVtdXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUhUTUw8VCBleHRlbmRzIFRhZ19uYW1lPihub2RlOiBIVE1MX25vZGU8VD4pOiBIVE1MRWxlbWVudFRhZ05hbWVNYXBbVF0ge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5vZGVbMF0pO1xuICAgIGZ1bmN0aW9uIGhhbmRsZShwYXJhbWV0ZXI6IEF0dHJpYnV0ZXMgfCBIVE1MX25vZGU8VGFnX25hbWU+IHwgSFRNTEVsZW1lbnQgfCBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbWV0ZXIgPT09IFwic3RyaW5nXCIgfHwgcGFyYW1ldGVyIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKHBhcmFtZXRlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwYXJhbWV0ZXIpKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZChjcmVhdGVIVE1MKHBhcmFtZXRlcikpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcGFyYW1ldGVyKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCBwYXJhbWV0ZXJba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBub2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGhhbmRsZShub2RlW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG59XG4iLCJpbXBvcnQgeyBjcmVhdGVIVE1MIH0gZnJvbSAnLi9odG1sJztcblxuY29uc3QgY2hhcmFjdGVycyA9IFtcIk5pa2lcIiwgXCJMdW5MdW5cIiwgXCJMdWN5XCIsIFwiU2h1YVwiLCBcIkRoYW5waXJcIiwgXCJQb2NoaVwiLCBcIkFsXCJdIGFzIGNvbnN0O1xuZXhwb3J0IHR5cGUgQ2hhcmFjdGVyID0gdHlwZW9mIGNoYXJhY3RlcnNbbnVtYmVyXTtcbmZ1bmN0aW9uIGlzQ2hhcmFjdGVyKGNoYXJhY3Rlcjogc3RyaW5nKTogY2hhcmFjdGVyIGlzIENoYXJhY3RlciB7XG4gICAgcmV0dXJuIChjaGFyYWN0ZXJzIGFzIHVua25vd24gYXMgc3RyaW5nW10pLmluY2x1ZGVzKGNoYXJhY3Rlcik7XG59XG5cbmV4cG9ydCB0eXBlIFBhcnQgPSBcIkhhdFwiIHwgXCJIYWlyXCIgfCBcIkR5ZVwiIHwgXCJVcHBlclwiIHwgXCJMb3dlclwiIHwgXCJTaG9lc1wiIHwgXCJTb2Nrc1wiIHwgXCJIYW5kXCIgfCBcIkJhY2twYWNrXCIgfCBcIkZhY2VcIiB8IFwiUmFja2V0XCI7XG5cbmV4cG9ydCBjbGFzcyBJdGVtU291cmNlIHtcbiAgICBjb25zdHJ1Y3RvcihpdGVtX25hbWU6IHN0cmluZywgcHJpY2U6IG51bWJlciwgYXA6IGJvb2xlYW4gPSBmYWxzZSwgZ2FjaGFfZmFjdG9yOiBudW1iZXIgPSAwKSB7XG4gICAgICAgIHRoaXMuaXRlbV9uYW1lID0gaXRlbV9uYW1lO1xuICAgICAgICB0aGlzLnByaWNlID0gcHJpY2U7XG4gICAgICAgIGlmIChhcCkge1xuICAgICAgICAgICAgdGhpcy5wcmljZSAqPSAtMTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdhY2hhX2ZhY3RvciA9IGdhY2hhX2ZhY3RvcjtcbiAgICB9XG4gICAgZGlzcGxheV9zdHJpbmcoKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHRoaXMucHJpY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbmN5ID0gdGhpcy5pc19hcCA/IFwiQVBcIiA6IFwiR29sZFwiO1xuICAgICAgICAgICAgY29uc3QgcHJpY2UgPSBNYXRoLmFicyh0aGlzLnByaWNlKTtcbiAgICAgICAgICAgIHJldHVybiBgJHt0aGlzLml0ZW1fbmFtZSA/IGBcIiR7dGhpcy5pdGVtX25hbWV9XCIgYCA6IFwiXCJ9U2hvcCAke3ByaWNlfSAke2N1cnJlbmN5fSR7dGhpcy5nYWNoYV9mYWN0b3IgPyBgIHggJHt0aGlzLmdhY2hhX2ZhY3Rvcn0g4omIICR7dGhpcy5nYWNoYV9mYWN0b3IgKiBwcmljZX0gJHtjdXJyZW5jeX1gIDogXCJcIn1gO1xuICAgICAgICB9XG4gICAgICAgIGxldCBnZiA9IHRoaXMuZ2FjaGFfZmFjdG9yLnRvRml4ZWQoMSk7XG4gICAgICAgIGlmIChnZi5lbmRzV2l0aChcIi4wXCIpKSB7XG4gICAgICAgICAgICBnZiA9IGdmLnN1YnN0cmluZygwLCBnZi5sZW5ndGggLSAyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYCR7dGhpcy5pdGVtX25hbWV9IHggJHtnZn1gO1xuICAgIH1cbiAgICBnZXQgaXNfYXAoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnByaWNlIDwgMDtcbiAgICB9XG4gICAgZ2V0IGlzX2dvbGQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnByaWNlID4gMDtcbiAgICB9XG4gICAgZ2V0IGlzX2dhY2hhKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nYWNoYV9mYWN0b3IgIT09IDA7XG4gICAgfVxuICAgIGl0ZW1fbmFtZTogc3RyaW5nO1xuICAgIHByaWNlOiBudW1iZXI7XG4gICAgZ2FjaGFfZmFjdG9yOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBJdGVtIHtcbiAgICBpZCA9IDA7XG4gICAgbmFtZV9rciA9IFwiXCI7XG4gICAgbmFtZV9lbiA9IFwiXCI7XG4gICAgbmFtZV9zaG9wID0gXCJcIjtcbiAgICB1c2VUeXBlID0gXCJcIjtcbiAgICBtYXhVc2UgPSAwO1xuICAgIGhpZGRlbiA9IGZhbHNlO1xuICAgIHJlc2lzdCA9IFwiXCI7XG4gICAgY2hhcmFjdGVyOiBDaGFyYWN0ZXIgPSBcIk5pa2lcIjtcbiAgICBwYXJ0OiBQYXJ0ID0gXCJIYXRcIjtcbiAgICBsZXZlbCA9IDA7XG4gICAgc3RyID0gMDtcbiAgICBzdGEgPSAwO1xuICAgIGRleCA9IDA7XG4gICAgd2lsID0gMDtcbiAgICBocCA9IDA7XG4gICAgcXVpY2tzbG90cyA9IDA7XG4gICAgYnVmZnNsb3RzID0gMDtcbiAgICBzbWFzaCA9IDA7XG4gICAgbW92ZW1lbnQgPSAwO1xuICAgIGNoYXJnZSA9IDA7XG4gICAgbG9iID0gMDtcbiAgICBzZXJ2ZSA9IDA7XG4gICAgbWF4X3N0ciA9IDA7XG4gICAgbWF4X3N0YSA9IDA7XG4gICAgbWF4X2RleCA9IDA7XG4gICAgbWF4X3dpbCA9IDA7XG4gICAgZWxlbWVudF9lbmNoYW50YWJsZSA9IGZhbHNlO1xuICAgIHBhcmNlbF9lbmFibGVkID0gZmFsc2U7XG4gICAgcGFyY2VsX2Zyb21fc2hvcCA9IGZhbHNlO1xuICAgIHNwaW4gPSAwO1xuICAgIGF0c3MgPSAwO1xuICAgIGRmc3MgPSAwO1xuICAgIHNvY2tldCA9IDA7XG4gICAgZ2F1Z2UgPSAwO1xuICAgIGdhdWdlX2JhdHRsZSA9IDA7XG4gICAgc291cmNlczogSXRlbVNvdXJjZVtdID0gW11cbn1cblxuY2xhc3MgR2FjaGEge1xuICAgIGNvbnN0cnVjdG9yKHNob3BfaW5kZXg6IG51bWJlciwgZ2FjaGFfaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuc2hvcF9pbmRleCA9IHNob3BfaW5kZXg7XG4gICAgICAgIHRoaXMuZ2FjaGFfaW5kZXggPSBnYWNoYV9pbmRleDtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgZm9yIChjb25zdCBjaGFyYWN0ZXIgb2YgY2hhcmFjdGVycykge1xuICAgICAgICAgICAgdGhpcy5zaG9wX2l0ZW1zLnNldChjaGFyYWN0ZXIsIG5ldyBNYXA8LypzaG9wX2lkOiovIG51bWJlciwgLypwcm9iYWJpbGl0eToqLyBudW1iZXI+KCkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhZGQoc2hvcF9pbmRleDogbnVtYmVyLCBwcm9iYWJpbGl0eTogbnVtYmVyLCBjaGFyYWN0ZXI6IENoYXJhY3Rlcikge1xuICAgICAgICB0aGlzLnNob3BfaXRlbXMuZ2V0KGNoYXJhY3RlcikhLnNldChzaG9wX2luZGV4LCBwcm9iYWJpbGl0eSk7XG4gICAgICAgIHRoaXMuY2hhcmFjdGVyX3Byb2JhYmlsaXR5LnNldChjaGFyYWN0ZXIsIHByb2JhYmlsaXR5ICsgKHRoaXMuY2hhcmFjdGVyX3Byb2JhYmlsaXR5LmdldChjaGFyYWN0ZXIpIHx8IDApKTtcbiAgICB9XG5cbiAgICBhdmVyYWdlX3RyaWVzKHNob3BfaW5kZXg6IG51bWJlciwgY2hhcmFjdGVyOiBDaGFyYWN0ZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgY2hhcnM6IHJlYWRvbmx5IENoYXJhY3RlcltdID0gY2hhcmFjdGVyID8gKFtjaGFyYWN0ZXJdKSA6IGNoYXJhY3RlcnM7XG4gICAgICAgIGNvbnN0IHByb2JhYmlsaXR5ID0gY2hhcnMucmVkdWNlKChwLCBjaGFyYWN0ZXIpID0+IHAgKyAodGhpcy5zaG9wX2l0ZW1zLmdldChjaGFyYWN0ZXIpIS5nZXQoc2hvcF9pbmRleCkgfHwgMCksIDApO1xuICAgICAgICBpZiAocHJvYmFiaWxpdHkgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRvdGFsX3Byb2JhYmlsaXR5ID0gY2hhcnMucmVkdWNlKChwLCBjaGFyYWN0ZXIpID0+IHAgKyB0aGlzLmNoYXJhY3Rlcl9wcm9iYWJpbGl0eS5nZXQoY2hhcmFjdGVyKSEsIDApO1xuICAgICAgICByZXR1cm4gdG90YWxfcHJvYmFiaWxpdHkgLyBwcm9iYWJpbGl0eTtcbiAgICB9XG5cbiAgICBzaG9wX2luZGV4OiBudW1iZXI7XG4gICAgZ2FjaGFfaW5kZXg6IG51bWJlcjtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgY2hhcmFjdGVyX3Byb2JhYmlsaXR5ID0gbmV3IE1hcDxDaGFyYWN0ZXIsIG51bWJlcj4oKTtcbiAgICBzaG9wX2l0ZW1zID0gbmV3IE1hcDxDaGFyYWN0ZXIsIE1hcDwvKnNob3BfaWQ6Ki8gbnVtYmVyLCAvKnByb2JhYmlsaXR5OiovIG51bWJlcj4+KCk7XG59XG5cbmNvbnN0IHRoaW5ncyA9IFtcIk9uZSB0aGluZ1wiLCBcIkFub3RoZXIgdGhpbmdcIiwgXCJZZXQgYW5vdGhlciB0aGluZ1wiXSBhcyBjb25zdDtcbnR5cGUgVGhpbmcgPSB0eXBlb2YgdGhpbmdzW251bWJlcl07XG5mdW5jdGlvbiBmKHRoaW5nOiBUaGluZyB8IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHRoaW5nbGlzdDogcmVhZG9ubHkgVGhpbmdbXSA9IHRoaW5nID8gW3RoaW5nXSA6IHRoaW5ncztcbn1cblxubGV0IGl0ZW1zID0gbmV3IE1hcDxudW1iZXIsIEl0ZW0+KCk7XG5sZXQgc2hvcF9pdGVtcyA9IG5ldyBNYXA8bnVtYmVyLCBJdGVtPigpO1xubGV0IGdhY2hhczogR2FjaGFbXSA9IFtdO1xuXG5mdW5jdGlvbiBwYXJzZUl0ZW1EYXRhKGRhdGE6IHN0cmluZykge1xuICAgIGlmIChkYXRhLmxlbmd0aCA8IDEwMDApIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBJdGVtcyBmaWxlIGlzIG9ubHkgJHtkYXRhLmxlbmd0aH0gYnl0ZXMgbG9uZ2ApO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFssIHJlc3VsdF0gb2YgZGF0YS5tYXRjaEFsbCgvXFw8SXRlbSAoLiopXFwvXFw+L2cpKSB7XG4gICAgICAgIGNvbnN0IGl0ZW06IEl0ZW0gPSBuZXcgSXRlbTtcbiAgICAgICAgZm9yIChjb25zdCBbLCBhdHRyaWJ1dGUsIHZhbHVlXSBvZiByZXN1bHQubWF0Y2hBbGwoL1xccz8oW149XSopPVwiKFteXCJdKilcIi9nKSkge1xuICAgICAgICAgICAgc3dpdGNoIChhdHRyaWJ1dGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiSW5kZXhcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5pZCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIl9OYW1lX1wiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWVfa3IgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk5hbWVfTlwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm5hbWVfZW4gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlVzZVR5cGVcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS51c2VUeXBlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNYXhVc2VcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tYXhVc2UgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJIaWRlXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uaGlkZGVuID0gISFwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJSZXNpc3RcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5yZXNpc3QgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkNoYXJcIjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk5JS0lcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNoYXJhY3RlciA9IFwiTmlraVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxVTkxVTlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJMdW5MdW5cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMVUNZXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIkx1Y3lcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJTSFVBXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIlNodWFcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJESEFOUElSXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIkRoYW5waXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJQT0NISVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY2hhcmFjdGVyID0gXCJQb2NoaVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFMXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyYWN0ZXIgPSBcIkFsXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRm91bmQgdW5rbm93biBjaGFyYWN0ZXIgXCIke3ZhbHVlfVwiYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlBhcnRcIjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQkFHXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJCYWNrcGFja1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkdMQVNTRVNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkZhY2VcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIQU5EXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJIYW5kXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiU09DS1NcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIlNvY2tzXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRk9PVFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiU2hvZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJDQVBcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnBhcnQgPSBcIkhhdFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlBBTlRTXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJMb3dlclwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlJBQ0tFVFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiUmFja2V0XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQk9EWVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ucGFydCA9IFwiVXBwZXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIQUlSXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJIYWlyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiRFlFXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJ0ID0gXCJEeWVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBGb3VuZCB1bmtub3duIHBhcnQgJHt2YWx1ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTGV2ZWxcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5sZXZlbCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNUUlwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnN0ciA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNUQVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnN0YSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRFWFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRleCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIldJTFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLndpbCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFkZEhQXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uaHAgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJBZGRRdWlja1wiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnF1aWNrc2xvdHMgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJBZGRCdWZmXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYnVmZnNsb3RzID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiU21hc2hTcGVlZFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNtYXNoID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTW92ZVNwZWVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubW92ZW1lbnQgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJDaGFyZ2VzaG90U3BlZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jaGFyZ2UgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJMb2JTcGVlZFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmxvYiA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNlcnZlU3BlZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXJ2ZSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk1BWF9TVFJcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tYXhfc3RyID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiTUFYX1NUQVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLm1heF9zdGEgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNQVhfREVYXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ubWF4X2RleCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIk1BWF9XSUxcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5tYXhfd2lsID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiRW5jaGFudEVsZW1lbnRcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5lbGVtZW50X2VuY2hhbnRhYmxlID0gISFwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJFbmFibGVQYXJjZWxcIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5wYXJjZWxfZW5hYmxlZCA9ICEhcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQmFsbFNwaW5cIjpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zcGluID0gcGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVRTU1wiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmF0c3MgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJERlNTXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZGZzcyA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNvY2tldFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNvY2tldCA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkdhdWdlXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZ2F1Z2UgPSBwYXJzZUludCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJHYXVnZUJhdHRsZVwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtLmdhdWdlX2JhdHRsZSA9IHBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBGb3VuZCB1bmtub3duIGl0ZW0gYXR0cmlidXRlIFwiJHthdHRyaWJ1dGV9XCJgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpdGVtcy5zZXQoaXRlbS5pZCwgaXRlbSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZVNob3BEYXRhKGRhdGE6IHN0cmluZykge1xuICAgIGNvbnN0IGRlYnVnU2hvcFBhcnNpbmcgPSBmYWxzZTtcbiAgICBpZiAoZGF0YS5sZW5ndGggPCAxMDAwKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgU2hvcCBmaWxlIGlzIG9ubHkgJHtkYXRhLmxlbmd0aH0gYnl0ZXMgbG9uZ2ApO1xuICAgIH1cbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGxldCBjdXJyZW50SW5kZXggPSAwO1xuICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgZGF0YS5tYXRjaEFsbCgvPFByb2R1Y3QgRElTUExBWT1cIlxcZCtcIiBISVRfRElTUExBWT1cIlxcZCtcIiBJbmRleD1cIig/PGluZGV4PlxcZCspXCIgRW5hYmxlPVwiKD88ZW5hYmxlZD4wfDEpXCIgTmV3PVwiXFxkK1wiIEhpdD1cIlxcZCtcIiBGcmVlPVwiXFxkK1wiIFNhbGU9XCJcXGQrXCIgRXZlbnQ9XCJcXGQrXCIgQ291cGxlPVwiXFxkK1wiIE5vYnV5PVwiXFxkK1wiIFJhbmQ9XCJbXlwiXStcIiBVc2VUeXBlPVwiW15cIl0rXCIgVXNlMD1cIlxcZCtcIiBVc2UxPVwiXFxkK1wiIFVzZTI9XCJcXGQrXCIgUHJpY2VUeXBlPVwiKD88cHJpY2VfdHlwZT4oPzpNSU5UKXwoPzpHT0xEKSlcIiBPbGRQcmljZTA9XCItP1xcZCtcIiBPbGRQcmljZTE9XCItP1xcZCtcIiBPbGRQcmljZTI9XCItP1xcZCtcIiBQcmljZTA9XCIoPzxwcmljZT4tP1xcZCspXCIgUHJpY2UxPVwiLT9cXGQrXCIgUHJpY2UyPVwiLT9cXGQrXCIgQ291cGxlUHJpY2U9XCItP1xcZCtcIiBDYXRlZ29yeT1cIig/PGNhdGVnb3J5PlteXCJdKilcIiBOYW1lPVwiKD88bmFtZT5bXlwiXSopXCIgR29sZEJhY2s9XCItP1xcZCtcIiBFbmFibGVQYXJjZWw9XCIoPzxwYXJjZWxfZnJvbV9zaG9wPjB8MSlcIiBDaGFyPVwiLT9cXGQrXCIgSXRlbTA9XCIoPzxpdGVtMD4tP1xcZCspXCIgSXRlbTE9XCIoPzxpdGVtMT4tP1xcZCspXCIgSXRlbTI9XCIoPzxpdGVtMj4tP1xcZCspXCIgSXRlbTM9XCIoPzxpdGVtMz4tP1xcZCspXCIgSXRlbTQ9XCIoPzxpdGVtND4tP1xcZCspXCIgSXRlbTU9XCIoPzxpdGVtNT4tP1xcZCspXCIgSXRlbTY9XCIoPzxpdGVtNj4tP1xcZCspXCIgSXRlbTc9XCIoPzxpdGVtNz4tP1xcZCspXCIgSXRlbTg9XCIoPzxpdGVtOD4tP1xcZCspXCIgSXRlbTk9XCIoPzxpdGVtOT4tP1xcZCspXCIgPyg/Okljb249XCJbXlwiXSpcIiA/KT8oPzpOYW1lX2tyPVwiW15cIl0qXCIgPyk/KD86TmFtZV9lbj1cIig/PG5hbWVfZW4+W15cIl0qKVwiID8pPyg/Ok5hbWVfdGg9XCJbXlwiXSpcIiA/KT9cXC8+L2cpKSB7XG4gICAgICAgIGlmICghbWF0Y2guZ3JvdXBzKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmRleCA9IHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pbmRleCk7XG4gICAgICAgIGlmIChjdXJyZW50SW5kZXggKyAxICE9PSBpbmRleCkge1xuICAgICAgICAgICAgZGVidWdTaG9wUGFyc2luZyAmJiBjb25zb2xlLndhcm4oYEZhaWxlZCBwYXJzaW5nIHNob3AgaXRlbSBpbmRleCAke2N1cnJlbnRJbmRleCArIDIgPT09IGluZGV4ID8gY3VycmVudEluZGV4ICsgMSA6IGAke2N1cnJlbnRJbmRleCArIDF9IHRvICR7aW5kZXggLSAxfWB9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudEluZGV4ID0gaW5kZXg7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBtYXRjaC5ncm91cHMubmFtZTtcbiAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBtYXRjaC5ncm91cHMuY2F0ZWdvcnk7XG4gICAgICAgIGlmIChjYXRlZ29yeSA9PT0gXCJMT1RURVJZXCIpIHtcbiAgICAgICAgICAgIGdhY2hhcy5wdXNoKG5ldyBHYWNoYShpbmRleCwgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0wKSwgbmFtZSkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVuYWJsZWQgPSAhIXBhcnNlSW50KG1hdGNoLmdyb3Vwcy5lbmFibGVkKTtcbiAgICAgICAgY29uc3QgcHJpY2VfdHlwZTogXCJhcFwiIHwgXCJnb2xkXCIgfCBcIm5vbmVcIiA9IG1hdGNoLmdyb3Vwcy5wcmljZV90eXBlID09PSBcIk1JTlRcIiA/IFwiYXBcIiA6IG1hdGNoLmdyb3Vwcy5wcmljZV90eXBlID09PSBcIkdPTERcIiA/IFwiZ29sZFwiIDogXCJub25lXCI7XG4gICAgICAgIGNvbnN0IHByaWNlID0gcGFyc2VJbnQobWF0Y2guZ3JvdXBzLnByaWNlKTtcbiAgICAgICAgY29uc3QgcGFyY2VsX2Zyb21fc2hvcCA9ICEhcGFyc2VJbnQobWF0Y2guZ3JvdXBzLnBhcmNlbF9mcm9tX3Nob3ApO1xuICAgICAgICBjb25zdCBpdGVtSURzID0gW1xuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0wKSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtMSksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTIpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW0zKSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtNCksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTUpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW02KSxcbiAgICAgICAgICAgIHBhcnNlSW50KG1hdGNoLmdyb3Vwcy5pdGVtNyksXG4gICAgICAgICAgICBwYXJzZUludChtYXRjaC5ncm91cHMuaXRlbTgpLFxuICAgICAgICAgICAgcGFyc2VJbnQobWF0Y2guZ3JvdXBzLml0ZW05KSxcbiAgICAgICAgXTtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtSUQgb2YgaXRlbUlEcykge1xuICAgICAgICAgICAgaWYgKGl0ZW1JRCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG9sZEl0ZW0gPSBpdGVtcy5nZXQoaXRlbUlEKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0l0ZW0gPSBuZXcgSXRlbSgpO1xuICAgICAgICAgICAgbmV3SXRlbS5uYW1lX2VuID0gbWF0Y2guZ3JvdXBzLm5hbWVfZW4gPz8gXCJcIjtcbiAgICAgICAgICAgIC8vdG9kbzogZmlsbCByZXN0IG9mIGl0ZW1cbiAgICAgICAgICAgIGlmICghb2xkSXRlbSkge1xuICAgICAgICAgICAgICAgIG9sZEl0ZW0gPSBuZXdJdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNhdGVnb3J5ID09PSBcIlBBUlRTXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICBvbGRJdGVtLnNvdXJjZXMucHVzaChuZXcgSXRlbVNvdXJjZShuYW1lID09PSBuZXdJdGVtLm5hbWVfZW4gPyBcIlwiIDogbmFtZSwgcHJpY2UsIHByaWNlX3R5cGUgPT09IFwiYXBcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzaG9wX2l0ZW1zLnNldChpbmRleCwgb2xkSXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaG9wX2l0ZW1zLnNldChpbmRleCwgbmV3SXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY291bnQrKztcbiAgICB9XG4gICAgY29uc29sZS5sb2coYEZvdW5kICR7Y291bnR9IHNob3AgaXRlbXNgKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VHYWNoYURhdGEoZGF0YTogc3RyaW5nLCBnYWNoYTogR2FjaGEpIHtcbiAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIGRhdGEubWF0Y2hBbGwoLzxMb3R0ZXJ5SXRlbV8oPzxjaGFyYWN0ZXI+W14gXSopIEluZGV4PVwiXFxkK1wiIF9OYW1lXz1cIlteXCJdKlwiIFNob3BJbmRleD1cIig/PHNob3BfaWQ+XFxkKylcIiBRdWFudGl0eU1pbj1cIlxcZCtcIiBRdWFudGl0eU1heD1cIlxcZCtcIiBDaGFuc1Blcj1cIig/PHByb2JhYmlsaXR5PlxcZCtcXC4/XFxkKilcIiBFZmZlY3Q9XCJcXGQrXCIgUHJvZHVjdE9wdD1cIlxcZCtcIlxcLz4vZykpIHtcbiAgICAgICAgaWYgKCFtYXRjaC5ncm91cHMpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBjaGFyYWN0ZXIgPSBtYXRjaC5ncm91cHMuY2hhcmFjdGVyO1xuICAgICAgICBpZiAoY2hhcmFjdGVyID09PSBcIkx1bmx1blwiKSB7XG4gICAgICAgICAgICBjaGFyYWN0ZXIgPSBcIkx1bkx1blwiO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNDaGFyYWN0ZXIoY2hhcmFjdGVyKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBGb3VuZCB1bmtub3duIGNoYXJhY3RlciBcIiR7Y2hhcmFjdGVyfSBpbiBsb3R0ZXJ5IGZpbGUgJHtnYWNoYS5nYWNoYV9pbmRleH1gKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGdhY2hhLmFkZChwYXJzZUludChtYXRjaC5ncm91cHMuc2hvcF9pZCksIHBhcnNlRmxvYXQobWF0Y2guZ3JvdXBzLnByb2JhYmlsaXR5KSwgY2hhcmFjdGVyKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbY2hhcmFjdGVyLCBtYXBdIG9mIGdhY2hhLnNob3BfaXRlbXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBbc2hvcF9pZCwgcHJvYmFiaWxpdHldIG9mIG1hcCkge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHNob3BfaXRlbXMuZ2V0KHNob3BfaWQpO1xuICAgICAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBGYWlsZWQgdG8gZmluZCBpdGVtICR7c2hvcF9pZH0gZnJvbSBcIiR7Z2FjaGEubmFtZX1cIiBpbiBzaG9wYCk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVtLnNvdXJjZXMucHVzaChuZXcgSXRlbVNvdXJjZShnYWNoYS5uYW1lLCAwLCBmYWxzZSwgZ2FjaGEuYXZlcmFnZV90cmllcyhzaG9wX2lkLCBjaGFyYWN0ZXIpKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkKHVybDogc3RyaW5nLCB2YWx1ZTogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLCBtYXhfdmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGZpbGVuYW1lID0gdXJsLnNsaWNlKHVybC5sYXN0SW5kZXhPZihcIi9cIikgKyAxKTtcbiAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkaW5nXCIpO1xuICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGBMb2FkaW5nICR7ZmlsZW5hbWV9LCBwbGVhc2Ugd2FpdC4uLmA7XG4gICAgfVxuICAgIGNvbnN0IHByb2dyZXNzYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcm9ncmVzc2JhclwiKTtcbiAgICBpZiAocHJvZ3Jlc3NiYXIgaW5zdGFuY2VvZiBIVE1MUHJvZ3Jlc3NFbGVtZW50KSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgcHJvZ3Jlc3NiYXIudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF4X3ZhbHVlKSB7XG4gICAgICAgICAgICBwcm9ncmVzc2Jhci5tYXggPSBtYXhfdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmVwbHkgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGlmICghcmVwbHkub2spIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHJldHVybiByZXBseS50ZXh0KCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZEl0ZW1zKCkge1xuICAgIGNvbnN0IGl0ZW1Tb3VyY2UgPSBcImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9zc3Rva2ljLXRnbS9KRlRTRS9kZXZlbG9wbWVudC9hdXRoLXNlcnZlci9zcmMvbWFpbi9yZXNvdXJjZXMvcmVzXCI7XG4gICAgY29uc3QgZ2FjaGFTb3VyY2UgPSBcImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9zc3Rva2ljLXRnbS9KRlRTRS9kZXZlbG9wbWVudC9lbXVsYXRvci9zcmMvbWFpbi9yZXNvdXJjZXMvcmVzL2xvdHRlcnlcIjtcbiAgICBsZXQgZG93bmxvYWRDb3VudGVyID0gMTtcbiAgICBjb25zdCBpdGVtVVJMID0gaXRlbVNvdXJjZSArIFwiL0l0ZW1fUGFydHNfSW5pMy54bWxcIjtcbiAgICBjb25zdCBpdGVtRGF0YSA9IGF3YWl0IGRvd25sb2FkKGl0ZW1VUkwsIGRvd25sb2FkQ291bnRlcisrKTtcbiAgICBjb25zdCBzaG9wVVJMID0gaXRlbVNvdXJjZSArIFwiL1Nob3BfSW5pMy54bWxcIjtcbiAgICBjb25zdCBzaG9wRGF0YSA9IGF3YWl0IGRvd25sb2FkKHNob3BVUkwsIGRvd25sb2FkQ291bnRlcisrKTtcbiAgICBwYXJzZUl0ZW1EYXRhKGl0ZW1EYXRhKTtcbiAgICBwYXJzZVNob3BEYXRhKHNob3BEYXRhKTtcbiAgICBjb25zb2xlLmxvZyhgRm91bmQgJHtnYWNoYXMubGVuZ3RofSBnYWNoYXNgKTtcbiAgICBmb3IgKGNvbnN0IGdhY2hhIG9mIGdhY2hhcykge1xuICAgICAgICBjb25zdCBnYWNoYV91cmwgPSBgJHtnYWNoYVNvdXJjZX0vSW5pM19Mb3RfJHtgJHtnYWNoYS5nYWNoYV9pbmRleH1gLnBhZFN0YXJ0KDIsIFwiMFwiKX0ueG1sYDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBhcnNlR2FjaGFEYXRhKGF3YWl0IGRvd25sb2FkKGdhY2hhX3VybCwgZG93bmxvYWRDb3VudGVyKyssIGdhY2hhcy5sZW5ndGggKyAyKSwgZ2FjaGEpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCBkb3dubG9hZGluZyAke2dhY2hhX3VybH0gYmVjYXVzZSAke2V9YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5sb2coYExvYWRlZCAke2l0ZW1zLnNpemV9IGl0ZW1zYCk7XG59XG5cbmZ1bmN0aW9uIGl0ZW1Ub1RhYmxlUm93KGl0ZW06IEl0ZW0sIHNvdXJjZUZpbHRlcjogKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpID0+IGJvb2xlYW4pOiBIVE1MVGFibGVSb3dFbGVtZW50IHtcbiAgICAvL05hbWVcbiAgICAvL0NoYXJhY3RlclxuICAgIC8vUGFydFxuICAgIC8vU3RyXG4gICAgLy9TdGFcbiAgICAvL0RleFxuICAgIC8vV2lsXG4gICAgLy9TbWFzaFxuICAgIC8vTW92ZW1lbnRcbiAgICAvL0NoYXJnZVxuICAgIC8vTG9iXG4gICAgLy9TZXJ2ZVxuICAgIC8vTWF4IGxldmVsXG5cbiAgICBjb25zdCBuYW1lU3RyaW5nID0gKGl0ZW06IEl0ZW0pID0+IHtcbiAgICAgICAgaWYgKGl0ZW0ubmFtZV9zaG9wICE9PSBpdGVtLm5hbWVfZW4pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLm5hbWVfZW4gKyBcIi9cIiArIGl0ZW0ubmFtZV9zaG9wO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVtLm5hbWVfZW47XG4gICAgfVxuXG4gICAgY29uc3Qgcm93ID0gY3JlYXRlSFRNTChcbiAgICAgICAgW1widHJcIixcbiAgICAgICAgICAgIFtcInRkXCIsIGl0ZW0ubmFtZV9lbl0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLmlkfWBdLFxuICAgICAgICAgICAgW1widGRcIiwgaXRlbS5jaGFyYWN0ZXJdLFxuICAgICAgICAgICAgW1widGRcIiwgaXRlbS5wYXJ0XSxcbiAgICAgICAgICAgIFtcInRkXCIsIGAke2l0ZW0uc3RyfWBdLFxuICAgICAgICAgICAgW1widGRcIiwgYCR7aXRlbS5zdGF9YF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLmRleH1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGAke2l0ZW0ud2lsfWBdLFxuICAgICAgICAgICAgW1widGRcIiwgYCR7aXRlbS5zbWFzaH1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGAke2l0ZW0ubW92ZW1lbnR9YF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLmNoYXJnZX1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGAke2l0ZW0ubG9ifWBdLFxuICAgICAgICAgICAgW1widGRcIiwgYCR7aXRlbS5zZXJ2ZX1gXSxcbiAgICAgICAgICAgIFtcInRkXCIsIGAke2l0ZW0uaHB9YF0sXG4gICAgICAgICAgICBbXCJ0ZFwiLCBgJHtpdGVtLmxldmVsfWBdLFxuICAgICAgICAgICAgW1widGRcIiwgaXRlbS5zb3VyY2VzLmZpbHRlcihzb3VyY2VGaWx0ZXIpLm1hcChpdGVtID0+IGl0ZW0uZGlzcGxheV9zdHJpbmcoKSkuam9pbihcIiwgXCIpLFxuICAgICAgICAgICAgXVxuICAgICAgICBdXG4gICAgKTtcbiAgICByZXR1cm4gcm93O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzdWx0c1RhYmxlKGZpbHRlcjogKGl0ZW06IEl0ZW0pID0+IGJvb2xlYW4sIHNvdXJjZUZpbHRlcjogKGl0ZW1Tb3VyY2U6IEl0ZW1Tb3VyY2UpID0+IGJvb2xlYW4sIHByaW9yaXplcjogKGl0ZW1zOiBJdGVtW10sIGl0ZW06IEl0ZW0pID0+IEl0ZW1bXSk6IEhUTUxUYWJsZUVsZW1lbnQge1xuICAgIGNvbnN0IHJlc3VsdHM6IHsgW2tleTogc3RyaW5nXTogSXRlbVtdIH0gPSB7XG4gICAgICAgIFwiSGF0XCI6IFtdLFxuICAgICAgICBcIkhhaXJcIjogW10sXG4gICAgICAgIFwiRHllXCI6IFtdLFxuICAgICAgICBcIlVwcGVyXCI6IFtdLFxuICAgICAgICBcIkxvd2VyXCI6IFtdLFxuICAgICAgICBcIlNob2VzXCI6IFtdLFxuICAgICAgICBcIlNvY2tzXCI6IFtdLFxuICAgICAgICBcIkhhbmRcIjogW10sXG4gICAgICAgIFwiQmFja3BhY2tcIjogW10sXG4gICAgICAgIFwiRmFjZVwiOiBbXSxcbiAgICAgICAgXCJSYWNrZXRcIjogW10sXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgWywgaXRlbV0gb2YgaXRlbXMpIHtcbiAgICAgICAgaWYgKGZpbHRlcihpdGVtKSkge1xuICAgICAgICAgICAgcmVzdWx0c1tpdGVtLnBhcnRdID0gcHJpb3JpemVyKHJlc3VsdHNbaXRlbS5wYXJ0XSwgaXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0YWJsZSA9IGNyZWF0ZUhUTUwoXG4gICAgICAgIFtcInRhYmxlXCIsXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJjb2xcIl0sXG4gICAgICAgICAgICBbXCJ0clwiLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiTmFtZVwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIklEXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiQ2hhcmFjdGVyXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiUGFydFwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIlN0clwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIlN0YVwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIkRleFwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIldpbFwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIlNtYXNoXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiTW92ZW1lbnRcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJDaGFyZ2VcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJMb2JcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJTZXJ2ZVwiXSxcbiAgICAgICAgICAgICAgICBbXCJ0aFwiLCBcIkhQXCJdLFxuICAgICAgICAgICAgICAgIFtcInRoXCIsIFwiTGV2ZWxcIl0sXG4gICAgICAgICAgICAgICAgW1widGhcIiwgXCJTb3VyY2VcIl0sXG4gICAgICAgICAgICBdXG4gICAgICAgIF1cbiAgICApO1xuICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIE9iamVjdC52YWx1ZXMocmVzdWx0cykpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJlc3VsdCkge1xuICAgICAgICAgICAgdGFibGUuYXBwZW5kQ2hpbGQoaXRlbVRvVGFibGVSb3coaXRlbSwgc291cmNlRmlsdGVyKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhYmxlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWF4SXRlbUxldmVsKCkge1xuICAgIC8vbm8gcmVkdWNlIGZvciBNYXA/XG4gICAgbGV0IG1heCA9IDA7XG4gICAgZm9yIChjb25zdCBbLCBpdGVtXSBvZiBpdGVtcykge1xuICAgICAgICBtYXggPSBNYXRoLm1heChtYXgsIGl0ZW0ubGV2ZWwpO1xuICAgIH1cbiAgICByZXR1cm4gbWF4O1xufSIsImltcG9ydCB7IG1ha2VDaGVja2JveFRyZWUsIFRyZWVOb2RlLCBnZXRMZWFmU3RhdGVzIH0gZnJvbSAnLi9jaGVja2JveFRyZWUnO1xuaW1wb3J0IHsgZG93bmxvYWRJdGVtcywgZ2V0UmVzdWx0c1RhYmxlLCBJdGVtLCBJdGVtU291cmNlLCBnZXRNYXhJdGVtTGV2ZWwgfSBmcm9tICcuL2l0ZW1Mb29rdXAnO1xuaW1wb3J0IHsgY3JlYXRlSFRNTCB9IGZyb20gJy4vaHRtbCc7XG5cbmNvbnN0IGNoYXJhY3RlcnMgPSBbXCJBbGxcIiwgXCJOaWtpXCIsIFwiTHVuTHVuXCIsIFwiTHVjeVwiLCBcIlNodWFcIiwgXCJEaGFucGlyXCIsIFwiUG9jaGlcIiwgXCJBbFwiLF07XG5cbmNvbnN0IHBhcnRzRmlsdGVyID0gW1xuICAgIFwiUGFydHNcIiwgW1xuICAgICAgICBcIkhlYWRcIiwgW1xuICAgICAgICAgICAgXCJIYXRcIixcbiAgICAgICAgICAgIFwiSGFpclwiLFxuICAgICAgICAgICAgXCJEeWVcIixcbiAgICAgICAgXSxcbiAgICAgICAgXCJVcHBlclwiLFxuICAgICAgICBcIkxvd2VyXCIsXG4gICAgICAgIFwiTGVnc1wiLCBbXG4gICAgICAgICAgICBcIlNob2VzXCIsXG4gICAgICAgICAgICBcIlNvY2tzXCIsXG4gICAgICAgIF0sXG4gICAgICAgIFwiQXV4XCIsIFtcbiAgICAgICAgICAgIFwiSGFuZFwiLFxuICAgICAgICAgICAgXCJCYWNrcGFja1wiLFxuICAgICAgICAgICAgXCJGYWNlXCJcbiAgICAgICAgXSxcbiAgICAgICAgXCJSYWNrZXRcIixcbiAgICBdLFxuXTtcblxuY29uc3QgYXZhaWxhYmlsaXR5RmlsdGVyID0gW1xuICAgIFwiQXZhaWxhYmlsaXR5XCIsIFtcbiAgICAgICAgXCJTaG9wXCIsIFtcbiAgICAgICAgICAgIFwiR29sZFwiLFxuICAgICAgICAgICAgXCJBUFwiLFxuICAgICAgICBdLFxuICAgICAgICBcIkFsbG93IGdhY2hhXCIsXG4gICAgICAgIFwiLUd1YXJkaWFuXCIsXG4gICAgICAgIFwiUGFyY2VsIGVuYWJsZWRcIixcbiAgICAgICAgXCJQYXJjZWwgZGlzYWJsZWRcIixcbiAgICAgICAgXCJFeGNsdWRlIHN0YXRsZXNzIGl0ZW1zXCIsXG4gICAgICAgIFwiRXhjbHVkZSB1bmF2YWlsYWJsZSBpdGVtc1wiLFxuICAgIF0sXG5dO1xuXG5mdW5jdGlvbiBnZXROYW1lKG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpOiBzdHJpbmcgfCBudWxsIHwgdm9pZCB7XG4gICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICAgIGlmICghKHBhcmVudCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHBhcmVudC5jaGlsZHJlbikge1xuICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGlsZC50ZXh0Q29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hpbGQgPT09IG5vZGUpIHtcbiAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkRmlsdGVyVHJlZXMoKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaGFyYWN0ZXJGaWx0ZXJzXCIpO1xuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZmlyc3QgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgY2hhcmFjdGVyIG9mIGNoYXJhY3RlcnMpIHtcbiAgICAgICAgY29uc3QgaWQgPSBgY2hhcmFjdGVyU2VsZWN0b3JzXyR7Y2hhcmFjdGVyfWA7XG4gICAgICAgIGNvbnN0IHJhZGlvX2J1dHRvbiA9IGNyZWF0ZUhUTUwoW1wiaW5wdXRcIiwgeyBpZDogaWQsIHR5cGU6IFwicmFkaW9cIiwgbmFtZTogXCJjaGFyYWN0ZXJTZWxlY3RvcnNcIiwgdmFsdWU6IGNoYXJhY3RlciB9XSk7XG4gICAgICAgIHJhZGlvX2J1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgdXBkYXRlUmVzdWx0cyk7XG4gICAgICAgIHRhcmdldC5hcHBlbmRDaGlsZChyYWRpb19idXR0b24pO1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChbXCJsYWJlbFwiLCB7IGZvcjogaWQgfSwgY2hhcmFjdGVyXSkpO1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoY3JlYXRlSFRNTChbXCJiclwiXSkpO1xuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgIHJhZGlvX2J1dHRvbi5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBmaWx0ZXJzOiBbVHJlZU5vZGUsIHN0cmluZ11bXSA9IFtcbiAgICAgICAgW3BhcnRzRmlsdGVyLCBcInBhcnRzRmlsdGVyXCJdLFxuICAgICAgICBbYXZhaWxhYmlsaXR5RmlsdGVyLCBcImF2YWlsYWJpbGl0eUZpbHRlclwiXSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgW2ZpbHRlciwgbmFtZV0gb2YgZmlsdGVycykge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChuYW1lKTtcbiAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0cmVlID0gbWFrZUNoZWNrYm94VHJlZShmaWx0ZXIpO1xuICAgICAgICB0cmVlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdXBkYXRlUmVzdWx0cyk7XG4gICAgICAgIHRhcmdldC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQodHJlZSk7XG4gICAgfVxufVxuXG5hZGRGaWx0ZXJUcmVlcygpO1xuXG5sZXQgZHJhZ2dlZDogSFRNTEVsZW1lbnQ7XG5cbmZ1bmN0aW9uIGFwcGx5RHJhZ0Ryb3AoKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdzdGFydFwiLCAoeyB0YXJnZXQgfSkgPT4ge1xuICAgICAgICBpZiAoISh0YXJnZXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkcmFnZ2VkID0gdGFyZ2V0O1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgKHsgdGFyZ2V0IH0pID0+IHtcbiAgICAgICAgaWYgKCEodGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhcmdldC5jbGFzc05hbWUgPT0gXCJkcm9wem9uZVwiICYmIHRhcmdldCAhPT0gZHJhZ2dlZCkge1xuICAgICAgICAgICAgaWYgKGRyYWdnZWQucGFyZW50Tm9kZSAhPT0gdGFyZ2V0LnBhcmVudE5vZGUpIHsgLy9kaXNhbGxvdyBkcmFnZ2luZyBhY3Jvc3MgZGlmZmVyZW50IGxpc3RzXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbGlzdCA9IEFycmF5LmZyb20oZHJhZ2dlZC5wYXJlbnROb2RlPy5jaGlsZHJlbiA/PyBuZXcgSFRNTENvbGxlY3Rpb24pO1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YoZHJhZ2dlZCk7XG4gICAgICAgICAgICBkcmFnZ2VkLnJlbW92ZSgpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID4gbGlzdC5pbmRleE9mKHRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuYmVmb3JlKGRyYWdnZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuYWZ0ZXIoZHJhZ2dlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1cGRhdGVSZXN1bHRzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuYXBwbHlEcmFnRHJvcCgpO1xuXG5mdW5jdGlvbiBjb21wYXJlKGxoczogbnVtYmVyLCByaHM6IG51bWJlcikge1xuICAgIGlmIChsaHMgPT0gcmhzKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gbGhzIDwgcmhzID8gLTEgOiAxO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVSZXN1bHRzKCkge1xuICAgIGNvbnN0IGZpbHRlcnM6ICgoaXRlbTogSXRlbSkgPT4gYm9vbGVhbilbXSA9IFtdO1xuICAgIGNvbnN0IHNvdXJjZUZpbHRlcnM6ICgoaXRlbVNvdXJjZTogSXRlbVNvdXJjZSkgPT4gYm9vbGVhbilbXSA9IFtdO1xuXG4gICAgeyAvL2NoYXJhY3RlciBmaWx0ZXJcbiAgICAgICAgY29uc3QgY2hhcmFjdGVyRmlsdGVyTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlOYW1lKFwiY2hhcmFjdGVyU2VsZWN0b3JzXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgY2hhcmFjdGVyRmlsdGVyTGlzdCkge1xuICAgICAgICAgICAgaWYgKCEoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkX2NoYXJhY3RlciA9IGVsZW1lbnQudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkX2NoYXJhY3RlciAhPT0gXCJBbGxcIikge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiBpdGVtLmNoYXJhY3RlciA9PT0gc2VsZWN0ZWRfY2hhcmFjdGVyKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgeyAvL3BhcnRzIGZpbHRlclxuICAgICAgICBjb25zdCBwYXJ0c0ZpbHRlckxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBhcnRzRmlsdGVyXCIpPy5jaGlsZHJlblswXTtcbiAgICAgICAgaWYgKCEocGFydHNGaWx0ZXJMaXN0IGluc3RhbmNlb2YgSFRNTFVMaXN0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJ0c1N0YXRlcyA9IGdldExlYWZTdGF0ZXMocGFydHNGaWx0ZXJMaXN0KTtcbiAgICAgICAgZmlsdGVycy5wdXNoKChpdGVtOiBJdGVtKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcGFydHNTdGF0ZXNbaXRlbS5wYXJ0XTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgeyAvL2F2YWlsYWJpbGl0eSBmaWx0ZXJcbiAgICAgICAgY29uc3QgYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXZhaWxhYmlsaXR5RmlsdGVyXCIpPy5jaGlsZHJlblswXTtcbiAgICAgICAgaWYgKCEoYXZhaWxhYmlsaXR5RmlsdGVyTGlzdCBpbnN0YW5jZW9mIEhUTUxVTGlzdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYXZhaWxhYmlsaXR5U3RhdGVzID0gZ2V0TGVhZlN0YXRlcyhhdmFpbGFiaWxpdHlGaWx0ZXJMaXN0KTtcbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJHb2xkXCJdKSB7XG4gICAgICAgICAgICBzb3VyY2VGaWx0ZXJzLnB1c2goaXRlbVNvdXJjZSA9PiAhaXRlbVNvdXJjZS5pc19nb2xkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWF2YWlsYWJpbGl0eVN0YXRlc1tcIkFQXCJdKSB7XG4gICAgICAgICAgICBzb3VyY2VGaWx0ZXJzLnB1c2goaXRlbVNvdXJjZSA9PiAhaXRlbVNvdXJjZS5pc19hcCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhdmFpbGFiaWxpdHlTdGF0ZXNbXCJQYXJjZWwgZW5hYmxlZFwiXSkge1xuICAgICAgICAgICAgZmlsdGVycy5wdXNoKGl0ZW0gPT4gIWl0ZW0ucGFyY2VsX2VuYWJsZWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYXZhaWxhYmlsaXR5U3RhdGVzW1wiUGFyY2VsIGRpc2FibGVkXCJdKSB7XG4gICAgICAgICAgICBmaWx0ZXJzLnB1c2goaXRlbSA9PiBpdGVtLnBhcmNlbF9lbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWF2YWlsYWJpbGl0eVN0YXRlc1tcIkFsbG93IGdhY2hhXCJdKSB7XG4gICAgICAgICAgICBzb3VyY2VGaWx0ZXJzLnB1c2goaXRlbVNvdXJjZSA9PiAhaXRlbVNvdXJjZS5pc19nYWNoYSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF2YWlsYWJpbGl0eVN0YXRlc1tcIkV4Y2x1ZGUgc3RhdGxlc3MgaXRlbXNcIl0pIHtcbiAgICAgICAgICAgIGZpbHRlcnMucHVzaChpdGVtID0+ICEhaXRlbS5idWZmc2xvdHMgfHwgISFpdGVtLmNoYXJnZSB8fCAhIWl0ZW0uZGV4IHx8ICEhaXRlbS5ocCB8fCAhIWl0ZW0ubG9iIHx8ICEhaXRlbS5tb3ZlbWVudCB8fCAhIWl0ZW0ucXVpY2tzbG90cyB8fCAhIWl0ZW0uc2VydmUgfHwgISFpdGVtLnNtYXNoIHx8ICEhaXRlbS5zdGEgfHwgISFpdGVtLnN0ciB8fCAhIWl0ZW0ud2lsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXZhaWxhYmlsaXR5U3RhdGVzW1wiRXhjbHVkZSB1bmF2YWlsYWJsZSBpdGVtc1wiXSkge1xuICAgICAgICAgICAgZmlsdGVycy5wdXNoKGl0ZW0gPT4gaXRlbS5zb3VyY2VzLmZpbHRlcihzb3VyY2UgPT4gc291cmNlRmlsdGVycy5ldmVyeShzb3VyY2VGaWx0ZXIgPT4gc291cmNlRmlsdGVyKHNvdXJjZSkpKS5sZW5ndGggPiAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHsgLy9taXNjIGZpbHRlclxuICAgICAgICBjb25zdCBsZXZlbHJhbmdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZXZlbHJhbmdlXCIpO1xuICAgICAgICBpZiAoIShsZXZlbHJhbmdlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXhMZXZlbCA9IHBhcnNlSW50KGxldmVscmFuZ2UudmFsdWUpO1xuICAgICAgICBmaWx0ZXJzLnB1c2goKGl0ZW06IEl0ZW0pID0+IGl0ZW0ubGV2ZWwgPD0gbWF4TGV2ZWwpO1xuXG4gICAgICAgIGNvbnN0IG5hbWVmaWx0ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hbWVGaWx0ZXJcIik7XG4gICAgICAgIGlmICghKG5hbWVmaWx0ZXIgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGl0ZW1fbmFtZSA9IG5hbWVmaWx0ZXIudmFsdWU7XG4gICAgICAgIGlmIChpdGVtX25hbWUpIHtcbiAgICAgICAgICAgIGZpbHRlcnMucHVzaChpdGVtID0+IGl0ZW0ubmFtZV9lbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGl0ZW1fbmFtZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb21wYXJhdG9yczogKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gbnVtYmVyKVtdID0gW107XG5cbiAgICB7XG4gICAgICAgIGNvbnN0IHByaW9yaXR5TGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicHJpb3JpdHkgbGlzdFwiKTtcbiAgICAgICAgaWYgKCEocHJpb3JpdHlMaXN0IGluc3RhbmNlb2YgSFRNTE9MaXN0RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0cyA9IEFycmF5LmZyb20ocHJpb3JpdHlMaXN0LmNoaWxkTm9kZXMpLmZpbHRlcihub2RlID0+ICFub2RlLnRleHRDb250ZW50Py5pbmNsdWRlcygnXFxuJykpLm1hcChub2RlID0+IG5vZGUudGV4dENvbnRlbnQpO1xuICAgICAgICBmb3IgKGNvbnN0IHRleHQgb2YgdGV4dHMpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodGV4dCkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJNb3ZlbWVudCBTcGVlZFwiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMubW92ZW1lbnQsIHJocy5tb3ZlbWVudCkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQ2hhcmdlXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy5jaGFyZ2UsIHJocy5jaGFyZ2UpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkxvYlwiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMubG9iLCByaHMubG9iKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJTdHJcIjpcbiAgICAgICAgICAgICAgICAgICAgY29tcGFyYXRvcnMucHVzaCgobGhzOiBJdGVtLCByaHM6IEl0ZW0pID0+IGNvbXBhcmUobGhzLnN0ciwgcmhzLnN0cikpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiRGV4XCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy5kZXgsIHJocy5kZXgpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlN0YVwiOlxuICAgICAgICAgICAgICAgICAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMuc3RhLCByaHMuc3RhKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJXaWxsXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy53aWwsIHJocy53aWwpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNlcnZlXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy5zZXJ2ZSwgcmhzLnNlcnZlKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJRdWlja3Nsb3RzXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy5xdWlja3Nsb3RzLCByaHMucXVpY2tzbG90cykpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiQnVmZnNsb3RzXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy5idWZmc2xvdHMsIHJocy5idWZmc2xvdHMpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkhQXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy5ocCwgcmhzLmhwKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vY2FzZSBcIkFQIGNvc3RcIjpcbiAgICAgICAgICAgICAgICAvLyAgICBjb21wYXJhdG9ycy5wdXNoKChsaHM6IEl0ZW0sIHJoczogSXRlbSkgPT4gY29tcGFyZShsaHMuICwgcmhzLikpO1xuICAgICAgICAgICAgICAgIC8vICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vY2FzZSBcIkdvbGQgY29zdFwiOlxuICAgICAgICAgICAgICAgIC8vICAgIGNvbXBhcmF0b3JzLnB1c2goKGxoczogSXRlbSwgcmhzOiBJdGVtKSA9PiBjb21wYXJlKGxocy4gLCByaHMuKSk7XG4gICAgICAgICAgICAgICAgLy8gICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0YWJsZSA9IGdldFJlc3VsdHNUYWJsZShcbiAgICAgICAgaXRlbSA9PiBmaWx0ZXJzLmV2ZXJ5KGZpbHRlciA9PiBmaWx0ZXIoaXRlbSkpLFxuICAgICAgICBpdGVtU291cmNlID0+IHNvdXJjZUZpbHRlcnMuZXZlcnkoZmlsdGVyID0+IGZpbHRlcihpdGVtU291cmNlKSksXG4gICAgICAgIChpdGVtcywgaXRlbSkgPT4ge1xuICAgICAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbaXRlbV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBhcmF0b3Igb2YgY29tcGFyYXRvcnMpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvbXBhcmF0b3IoaXRlbXNbMF0sIGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgLTE6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW1dO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFsuLi5pdGVtcywgaXRlbV07XG4gICAgICAgIH1cbiAgICApO1xuICAgIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdWx0c1wiKTtcbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRhcmdldC5pbm5lclRleHQgPSBcIlwiO1xuICAgIHRhcmdldC5hcHBlbmRDaGlsZCh0YWJsZSk7XG59XG5cbmZ1bmN0aW9uIHNldE1heExldmVsRGlzcGxheVVwZGF0ZSgpIHtcbiAgICBjb25zdCBsZXZlbERpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxldmVsRGlzcGxheVwiKTtcbiAgICBpZiAoIShsZXZlbERpc3BsYXkgaW5zdGFuY2VvZiBIVE1MTGFiZWxFbGVtZW50KSkge1xuICAgICAgICB0aHJvdyBcIkludGVybmFsIGVycm9yXCI7XG4gICAgfVxuICAgIGNvbnN0IGxldmVscmFuZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxldmVscmFuZ2VcIik7XG4gICAgaWYgKCEobGV2ZWxyYW5nZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICAgIGxldmVsRGlzcGxheS50ZXh0Q29udGVudCA9IGBNYXggbGV2ZWwgcmVxdWlyZW1lbnQ6ICR7bGV2ZWxyYW5nZS52YWx1ZX1gO1xuICAgICAgICB1cGRhdGVSZXN1bHRzKCk7XG4gICAgfTtcbiAgICBsZXZlbHJhbmdlLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBjYWxsYmFjayk7XG4gICAgY2FsbGJhY2soKTtcbn1cblxuZnVuY3Rpb24gc2V0RGlzcGxheVVwZGF0ZXMoKSB7XG4gICAgc2V0TWF4TGV2ZWxEaXNwbGF5VXBkYXRlKCk7XG4gICAgY29uc3QgbmFtZWZpbHRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmFtZUZpbHRlclwiKTtcbiAgICBpZiAoIShuYW1lZmlsdGVyIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IFwiSW50ZXJuYWwgZXJyb3JcIjtcbiAgICB9XG4gICAgbmFtZWZpbHRlci5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgdXBkYXRlUmVzdWx0cyk7XG59XG5cbnNldERpc3BsYXlVcGRhdGVzKCk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgZG93bmxvYWRJdGVtcygpO1xuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwic2hvd19hZnRlcl9sb2FkXCIpKSB7XG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJoaWRlX2FmdGVyX2xvYWRcIikpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgbGV2ZWxyYW5nZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxyYW5nZVwiKTtcbiAgICBpZiAoIShsZXZlbHJhbmdlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgXCJJbnRlcm5hbCBlcnJvclwiO1xuICAgIH1cbiAgICBsZXZlbHJhbmdlLm1heCA9IGAke2dldE1heEl0ZW1MZXZlbCgpfWA7XG4gICAgbGV2ZWxyYW5nZS52YWx1ZSA9IGxldmVscmFuZ2UubWF4O1xuICAgIGxldmVscmFuZ2UuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJpbnB1dFwiKSk7XG4gICAgdXBkYXRlUmVzdWx0cygpO1xufSk7Il19
