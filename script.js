!function r(n,s,o){function c(t,e){if(!s[t]){if(!n[t]){var a="function"==typeof require&&require;if(!e&&a)return a(t,!0);if(i)return i(t,!0);throw(e=new Error("Cannot find module '"+t+"'")).code="MODULE_NOT_FOUND",e}a=s[t]={exports:{}},n[t][0].call(a.exports,function(e){return c(n[t][1][e]||e)},a,a.exports,r,n,s,o)}return s[t].exports}for(var i="function"==typeof require&&require,e=0;e<o.length;e++)c(o[e]);return c}({1:[function(e,t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.getLeafStates=function(e){var t={};for(const a of n(e))t[a.id.replaceAll("_"," ")]=a.checked;return t},a.makeCheckboxTree=function(e){e=function t(a){{if("string"==typeof a){let e=!1,t=("-"===a[0]&&(a=a.substring(1),e=!0),!1);"+"===a[0]&&(a=a.substring(1),t=!0);const r=(0,o.createHTML)(["li",["input",{type:"checkbox",id:a.replaceAll(" ","_"),...t&&{checked:"checked"}}],["label",{for:a.replaceAll(" ","_")},a]]);return e&&r.classList.add("disabled"),r}{const n=(0,o.createHTML)(["ul",{class:"checkbox"}]);for(let e=0;e<a.length;e++){const s=a[e];n.appendChild(t(s))}return(0,o.createHTML)(["li",n])}}}(e).children[0];if(!(e instanceof HTMLUListElement))throw"Internal error";!function e(t){for(const a of t.children)a instanceof HTMLLIElement?r(a.children[0]):a instanceof HTMLUListElement&&e(a)}(e);for(const t of n(e))c(t);return e},a.setLeafStates=function(e,t){for(const r of n(e)){var a=t[r.id.replaceAll("_"," ")];void 0!==a&&(r.checked=a,c(r))}};var o=e("./html");function s(e){var t=e.parentElement;if(t instanceof HTMLLIElement){var a=t.parentElement;if(a instanceof HTMLUListElement)for(let e=0;e<a.children.length;e++)if(a.children[e]===t){var r=a.children[e+1]?.children[0];if(r instanceof HTMLUListElement)return Array.from(r.children).filter(e=>e instanceof HTMLLIElement&&e.children[0]instanceof HTMLInputElement).map(e=>e.children[0]);break}}return[]}function c(r){r=function(t){var a=t.parentElement?.parentElement?.parentElement;if(a instanceof HTMLLIElement){t=a.parentElement;if(t instanceof HTMLUListElement){let e;for(const r of t.children)if(r instanceof HTMLLIElement&&r.children[0]instanceof HTMLInputElement)e=r;else if(r===a&&e)return e.children[0]}}}(r);if(r){let e=!1,t=!1,a=!1;for(const n of s(r))n.checked?e=!0:t=!0,n.indeterminate&&(a=!0);a||e&&t?r.indeterminate=!0:e?(r.checked=!0,r.indeterminate=!1):t&&(r.checked=!1,r.indeterminate=!1),c(r)}}function r(e){e.addEventListener("change",e=>{e=e.target;e instanceof HTMLInputElement&&(!function e(t){for(const a of s(t))a.checked!==t.checked&&(a.checked=t.checked,a.indeterminate=!1,e(a))}(e),c(e))})}function n(e){let t=[];for(const r of e.children){var a=r.children[0];a instanceof HTMLInputElement?0===s(a).length&&t.push(a):a instanceof HTMLUListElement&&(t=t.concat(n(a)))}return t}},{"./html":2}],2:[function(e,t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.createHTML=function a(t){const r=document.createElement(t[0]);function n(e){if("string"==typeof e||e instanceof HTMLElement)r.append(e);else if(Array.isArray(e))r.append(a(e));else for(const t in e)r.setAttribute(t,e[t])}for(let e=1;e<t.length;e++)n(t[e]);return r}},{}],3:[function(e,t,a){"use strict";Object.defineProperty(a,"__esModule",{value:!0}),a.characters=a.ShopItemSource=a.ItemSource=a.Item=a.GuardianItemSource=a.GachaItemSource=void 0,a.downloadItems=async function(){let e=1;var t=await o("https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res/Item_Parts_Ini3.xml",e++),a=await o("https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/auth-server/src/main/resources/res/Shop_Ini3.xml",e++),r=await o("https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/emulator/src/main/resources/res//GuardianStages.json",e++);(function(e){e.length<1e3&&console.warn(`Items file is only ${e.length} bytes long`);for(var[,t]of e.matchAll(/\<Item (.*)\/\>/g)){var a,r,n=new p;for([,a,r]of t.matchAll(/\s?([^=]*)="([^"]*)"/g))switch(a){case"Index":n.id=parseInt(r);break;case"_Name_":n.name_kr=r;break;case"Name_N":n.name_en=r;break;case"UseType":n.useType=r;break;case"MaxUse":n.maxUse=parseInt(r);break;case"Hide":n.hidden=!!parseInt(r);break;case"Resist":n.resist=r;break;case"Char":switch(r){case"NIKI":n.character="Niki";break;case"LUNLUN":n.character="LunLun";break;case"LUCY":n.character="Lucy";break;case"SHUA":n.character="Shua";break;case"DHANPIR":n.character="Dhanpir";break;case"POCHI":n.character="Pochi";break;case"AL":n.character="Al";break;default:console.warn(`Found unknown character "${r}"`)}break;case"Part":switch(String(r)){case"BAG":n.part="Backpack";break;case"GLASSES":n.part="Face";break;case"HAND":n.part="Hand";break;case"SOCKS":n.part="Socks";break;case"FOOT":n.part="Shoes";break;case"CAP":n.part="Hat";break;case"PANTS":n.part="Lower";break;case"RACKET":n.part="Racket";break;case"BODY":n.part="Upper";break;case"HAIR":n.part="Hair";break;case"DYE":n.part="Dye";break;default:console.warn("Found unknown part "+r)}break;case"Level":n.level=parseInt(r);break;case"STR":n.str=parseInt(r);break;case"STA":n.sta=parseInt(r);break;case"DEX":n.dex=parseInt(r);break;case"WIL":n.wil=parseInt(r);break;case"AddHP":n.hp=parseInt(r);break;case"AddQuick":n.quickslots=parseInt(r);break;case"AddBuff":n.buffslots=parseInt(r);break;case"SmashSpeed":n.smash=parseInt(r);break;case"MoveSpeed":n.movement=parseInt(r);break;case"ChargeshotSpeed":n.charge=parseInt(r);break;case"LobSpeed":n.lob=parseInt(r);break;case"ServeSpeed":n.serve=parseInt(r);break;case"MAX_STR":n.max_str=parseInt(r);break;case"MAX_STA":n.max_sta=parseInt(r);break;case"MAX_DEX":n.max_dex=parseInt(r);break;case"MAX_WIL":n.max_wil=parseInt(r);break;case"EnchantElement":n.element_enchantable=!!parseInt(r);break;case"EnableParcel":n.parcel_enabled=!!parseInt(r);break;case"BallSpin":n.spin=parseInt(r);break;case"ATSS":n.atss=parseInt(r);break;case"DFSS":n.dfss=parseInt(r);break;case"Socket":n.socket=parseInt(r);break;case"Gauge":n.gauge=parseInt(r);break;case"GaugeBattle":n.gauge_battle=parseInt(r);break;default:console.warn(`Found unknown item attribute "${a}"`)}S.set(n.id,n)}})(t),function(e){e.length<1e3&&console.warn(`Shop file is only ${e.length} bytes long`);let t=0,a=0;for(const m of e.matchAll(/<Product DISPLAY="\d+" HIT_DISPLAY="\d+" Index="(?<index>\d+)" Enable="(?<enabled>0|1)" New="\d+" Hit="\d+" Free="\d+" Sale="\d+" Event="\d+" Couple="\d+" Nobuy="\d+" Rand="[^"]+" UseType="[^"]+" Use0="\d+" Use1="\d+" Use2="\d+" PriceType="(?<price_type>(?:MINT)|(?:GOLD))" OldPrice0="-?\d+" OldPrice1="-?\d+" OldPrice2="-?\d+" Price0="(?<price>-?\d+)" Price1="-?\d+" Price2="-?\d+" CouplePrice="-?\d+" Category="(?<category>[^"]*)" Name="(?<name>[^"]*)" GoldBack="-?\d+" EnableParcel="(?<parcel_from_shop>0|1)" Char="-?\d+" Item0="(?<item0>-?\d+)" Item1="(?<item1>-?\d+)" Item2="(?<item2>-?\d+)" Item3="(?<item3>-?\d+)" Item4="(?<item4>-?\d+)" Item5="(?<item5>-?\d+)" Item6="(?<item6>-?\d+)" Item7="(?<item7>-?\d+)" Item8="(?<item8>-?\d+)" Item9="(?<item9>-?\d+)" ?(?:Icon="[^"]*" ?)?(?:Name_kr="[^"]*" ?)?(?:Name_en="(?<name_en>[^"]*)" ?)?(?:Name_th="[^"]*" ?)?\/>/g))if(m.groups){var r,n=parseInt(m.groups.index),s=(a,a=n,m.groups.name),o=m.groups.category,s=("LOTTERY"===o&&_.set(n,new h(n,parseInt(m.groups.item0),s)),!!parseInt(m.groups.enabled)),c="MINT"===m.groups.price_type?"ap":"GOLD"===m.groups.price_type?"gold":"none",i=parseInt(m.groups.price),l=(parseInt(m.groups.parcel_from_shop),[parseInt(m.groups.item0),parseInt(m.groups.item1),parseInt(m.groups.item2),parseInt(m.groups.item3),parseInt(m.groups.item4),parseInt(m.groups.item5),parseInt(m.groups.item6),parseInt(m.groups.item7),parseInt(m.groups.item8),parseInt(m.groups.item9)].filter(e=>!!e&&S.get(e)).map(e=>S.get(e)));if("PARTS"===o){if(1===l.length?f.set(n,l[0]):((r=new p).name_en=m.groups.name_en||m.groups.name,f.set(n,r)),s){var u=new L(n,i,"ap"==c,l);for(const d of l)d.sources.push(u)}}else"LOTTERY"===o?((r=new p).name_en=m.groups.name_en||m.groups.name,f.set(n,r),s&&r.sources.push(new L(n,i,"ap"==c,l))):((o=new p).name_en=m.groups.name_en||m.groups.name,f.set(n,o));t++}console.log(`Found ${t} shop items`)}(a),function(e){e=JSON.parse(e);if(Array.isArray(e)){var t=new Map;for(const l of e)if("object"==typeof l){var a=l.Name;if("string"==typeof a){var r=(Array.isArray(l.Rewards)?[...l.Rewards]:[]).filter(e=>"number"==typeof e&&f.has(e)).map(e=>f.get(e)),n=i(l.ExpMultiplier)||0,s=!!l.IsBossStage,o=i(l.MapId)||0;let e=i(l.BossTriggerTimerInSeconds)||-1;-1===e?e=t.get(o)||-1:0!==o&&t.set(o,e);for(const u of r){var c=new k(a,r,n,s,e);u.sources.push(c)}}}function i(e){if("number"==typeof e)return e}}}(r),console.log(`Found ${_.size} gachas`);for(var[,n]of _){var s=`https://raw.githubusercontent.com/sstokic-tgm/JFTSE/development/game-server/src/main/resources/res/lottery/Ini3_Lot_${(""+n.gacha_index).padStart(2,"0")}.xml`;try{!function(e,t){for(const o of e.split("\n"))if(o.includes("<LotteryItem_")){var a,r=o.match(/\s*<LotteryItem_(?<character>[^ ]*) Index="\d+" _Name_="[^"]*" ShopIndex="(?<shop_id>\d+)" QuantityMin="(?<quantity_min>\d+)" QuantityMax="(?<quantity_max>\d+)" ChansPer="(?<probability>\d+\.?\d*)\s*" Effect="\d+" ProductOpt="\d+"\/>/);if(r){if(r.groups){let e=r.groups.character;I(e="Lunlun"===e?"LunLun":e)?(a=f.get(parseInt(r.groups.shop_id)))?t.add(a,parseFloat(r.groups.probability),e,parseInt(r.groups.quantity_min),parseInt(r.groups.quantity_max)):console.warn(`Found unknown shop item id ${r.groups.shop_id} in lottery file `+t.gacha_index):console.warn(`Found unknown character "${e}" in lottery file `+t.gacha_index)}}else console.warn(`Failed parsing gacha ${t.gacha_index}:
`+o)}for(var[,n]of t.shop_items)for(var[s]of n)s.sources.push(new y(t.shop_index))}(await o(s,e++,_.size+3),n)}catch(e){console.warn(`Failed downloading ${s} because `+e)}}console.log(`Loaded ${S.size} items`)},a.getMaxItemLevel=function(){let e=0;for(var[,t]of S)e=Math.max(e,t.level);return e},a.getResultsTable=function(e,t,a,r){var n={Hat:[],Hair:[],Dye:[],Upper:[],Lower:[],Shoes:[],Socks:[],Hand:[],Backpack:[],Face:[],Racket:[]};for(var[,s]of S)e(s)&&(n[s.part]=a(n[s.part],s));var o=(0,v.createHTML)(["table",["tr",["th",{class:"Name_column"},"Name"],["th",{class:"ID_column numeric"},"ID"],["th",{class:"Character_column"},"Character"],["th",{class:"Part_column"},"Part"],["th",{class:"Str_column numeric"},"Str"],["th",{class:"Sta_column numeric"},"Sta"],["th",{class:"Dex_column numeric"},"Dex"],["th",{class:"Wil_column numeric"},"Wil"],["th",{class:"Smash_column numeric"},"Smash"],["th",{class:"Movement_column numeric"},"Movement"],["th",{class:"Charge_column numeric"},"Charge"],["th",{class:"Lob_column numeric"},"Lob"],["th",{class:"Serve_column numeric"},"Serve"],["th",{class:"HP_column numeric"},"HP"],["th",{class:"Level_column numeric"},"Level"],["th",{class:"Source_column"},"Source"]]]);function c(e,t){return{gold:e.gold+t.gold,ap:e.ap+t.ap,maps:function(e,t){var a,r,n={...e};for([a,r]of Object.entries(t))n[a]?n[a]=n[a].concat(r):n[a]=r;return n}(e.maps,t.maps)}}function i(e,t){var a,r,n={...e};for([a,r]of Object.entries(t)){if(1!==r.length)throw"Internal error";n[a]?n[a]=[Math.min(n[a][0],r[0])]:n[a]=r}return n}function l(r,n){return[...r.sources.values()].filter(t).reduce((e,t)=>{var a=(()=>{if(t instanceof L)return t.ap?{gold:0,ap:t.price,maps:{}}:{gold:t.price,ap:0,maps:{}};if(t instanceof y){var e=l(t.item,n);const a=t.gachaTries(r,n);return{gold:e.gold*a,ap:e.ap*a,maps:Object.fromEntries(Object.entries(e.maps).map(([e,t])=>[e,t.map(e=>e*a)]))}}if(t instanceof k)return{gold:0,ap:0,maps:Object.fromEntries([[t.guardian_map,[t.items.length]]])};throw"Internal error"})();return a=a,[(e=e).ap,e.gold]<[e.ap,e.gold]?{gold:e.gold,ap:e.ap,maps:i(e.maps,a.maps)}:{gold:a.gold,ap:a.ap,maps:i(e.maps,a.maps)}},{gold:0,ap:0,maps:{}})}var u={characters:new Set,Str:0,Sta:0,Dex:0,Wil:0,Smash:0,Movement:0,Charge:0,Lob:0,Serve:0,HP:0,Level:0,cost:{ap:0,gold:0,maps:{}}};for(const d of Object.values(n))if(0!==d.length){u.Str+=d[0].str,u.Sta+=d[0].sta,u.Dex+=d[0].dex,u.Wil+=d[0].wil,u.Smash+=d[0].smash,u.Movement+=d[0].movement,u.Charge+=d[0].charge,u.Lob+=d[0].lob,u.Serve+=d[0].serve,u.HP+=d[0].hp,u.Level=Math.max(d[0].level,u.Level);for(const p of d){for(const h of p.character?[p.character]:b)u.characters.add(h),o.appendChild(function(e,t,a){e=(0,v.createHTML)(["tr",["td",{class:"Name_column"},function(e,t){return(0,v.createHTML)(["div",(0,v.createHTML)(["button",{class:"item_removal","data-item_index":""+t},"X"]),e])}(e.name_en,e.id)],["td",{class:"ID_column numeric"},""+e.id],["td",{class:"Character_column"},e.character??"All"],["td",{class:"Part_column"},e.part],["td",{class:"Str_column numeric"},""+e.str],["td",{class:"Sta_column numeric"},""+e.sta],["td",{class:"Dex_column numeric"},""+e.dex],["td",{class:"Wil_column numeric"},""+e.wil],["td",{class:"Smash_column numeric"},""+e.smash],["td",{class:"Movement_column numeric"},""+e.movement],["td",{class:"Charge_column numeric"},""+e.charge],["td",{class:"Lob_column numeric"},""+e.lob],["td",{class:"Serve_column numeric"},""+e.serve],["td",{class:"HP_column numeric"},""+e.hp],["td",{class:"Level_column numeric"},""+e.level],["td",{class:"Source_column"},...H(w(e,t,a))]]);return e}(p,t,h));u.cost=c(l(p,r&&I(r)?r:void 0),u.cost)}}if(1===u.characters.size){var m=[];0<u.cost.gold&&m.push(u.cost.gold.toFixed(0)+" Gold"),0<u.cost.ap&&m.push(u.cost.ap.toFixed(0)+" AP"),o.appendChild((0,v.createHTML)(["tr",["td",{class:"total Name_column"},"Total:"],["td",{class:"total ID_column numeric"}],["td",{class:"total Character_column"}],["td",{class:"total Part_column"}],["td",{class:"total Str_column numeric"},""+u.Str],["td",{class:"total Sta_column numeric"},""+u.Sta],["td",{class:"total Dex_column numeric"},""+u.Dex],["td",{class:"total Wil_column numeric"},""+u.Wil],["td",{class:"total Smash_column numeric"},""+u.Smash],["td",{class:"total Movement_column numeric"},""+u.Movement],["td",{class:"total Charge_column numeric"},""+u.Charge],["td",{class:"total Lob_column numeric"},""+u.Lob],["td",{class:"total Serve_column numeric"},""+u.Serve],["td",{class:"total HP_column numeric"},""+u.HP],["td",{class:"total Level_column numeric"},""+u.Level],["td",{class:"total Source_column"},m.join(", ")]]));for(const f of o.getElementsByClassName("Character_column"))f instanceof HTMLElement&&(f.hidden=!0)}for(const g of["Str","Sta","Dex","Wil","Smash","Movement","Charge","Lob","Serve","HP"])if(0===u[g])for(const _ of o.getElementsByClassName(g+"_column"))_ instanceof HTMLElement&&(_.hidden=!0);return o},a.isCharacter=I,a.shop_items=a.items=void 0;var v=e("./html");const b=["Niki","LunLun","Lucy","Shua","Dhanpir","Pochi","Al"];function I(e){return b.includes(e)}a.characters=b;class r{shop_id;constructor(e){this.shop_id=e}get requiresGuardian(){if(this instanceof L)return!1;if(this instanceof y)return[...this.item.sources.values()].every(e=>e.requiresGuardian);if(this instanceof k)return!0;throw"Internal error"}get item(){var e=f.get(this.shop_id);if(e)return e;throw console.error("Failed finding item of itemSource "+this.shop_id),"Internal error"}}class L extends(a.ItemSource=r){price;ap;items;constructor(e,t,a,r){super(e),this.price=t,this.ap=a,this.items=r}}a.ShopItemSource=L;class y extends r{constructor(e){super(e)}gachaTries(e,t){var a=_.get(this.shop_id);if(a)return a.average_tries(e,t);throw"Internal error"}}a.GachaItemSource=y;class k extends r{guardian_map;items;xp;need_boss;boss_time;constructor(e,t,a,r,n){super(k.guardian_map_id(e)),this.guardian_map=e,this.items=t,this.xp=a,this.need_boss=r,this.boss_time=n}static guardian_map_id(e){let t=this.guardian_maps.indexOf(e);return-1===t&&(t=this.guardian_maps.length,this.guardian_maps.push(e)),-t}static guardian_maps=[""]}a.GuardianItemSource=k;class p{id=0;name_kr="";name_en="";useType="";maxUse=0;hidden=!1;resist="";character;part="Other";level=0;str=0;sta=0;dex=0;wil=0;hp=0;quickslots=0;buffslots=0;smash=0;movement=0;charge=0;lob=0;serve=0;max_str=0;max_sta=0;max_dex=0;max_wil=0;element_enchantable=!1;parcel_enabled=!1;parcel_from_shop=!1;spin=0;atss=0;dfss=0;socket=0;gauge=0;gauge_battle=0;sources=[]}a.Item=p;class h{shop_index;gacha_index;name;constructor(e,t,a){this.shop_index=e,this.gacha_index=t,this.name=a;for(const r of b)this.shop_items.set(r,new Map)}add(e,t,a,r,n){e.character&&e.character!==a&&(a=e.character),this.shop_items.get(a).set(e,[t,r,n]),this.character_probability.set(a,t+(this.character_probability.get(a)||0))}average_tries(a,e=void 0){var e=e?[e]:b,t=e.reduce((e,t)=>e+(this.shop_items.get(t).get(a)?.[0]||0),0);return 0===t?0:e.reduce((e,t)=>e+this.character_probability.get(t),0)/t}get total_probability(){return b.reduce((e,t)=>e+this.character_probability.get(t),0)}character_probability=new Map;shop_items=new Map}let S=new Map,f=(a.items=S,new Map),_=(a.shop_items=f,new Map),n;function E(e,t){let a=e.toFixed(t);for(;a.endsWith("0");)a=a.slice(0,-1);return a=a.endsWith(".")?a.slice(0,-1):a}async function o(e,t=void 0,a=void 0){var r=e.slice(e.lastIndexOf("/")+1),n=document.getElementById("loading"),n=(n instanceof HTMLElement&&(n.textContent=`Loading ${r}, please wait...`),document.getElementById("progressbar")),r=(n instanceof HTMLProgressElement&&(t&&(n.value=t),a)&&(n.max=a),await fetch(e));return r.ok?r.text():""}function M(e,a){e=(0,v.createHTML)(["a",{class:"popup_link"},e]);return e.addEventListener("click",e=>{var t;e instanceof MouseEvent&&(t=document.getElementById("top_div"))instanceof HTMLDivElement&&(e.stopPropagation(),n&&(n.close(),n.remove()),n=Array.isArray(a)?(0,v.createHTML)(["dialog",...a]):(0,v.createHTML)(["dialog",a]),t.appendChild(n),n.style.position="absolute",n.style.top=e.pageY+"px",n.style.left=e.pageX-300+"px",n.show())}),e}function i(e){var t,a=(0,v.createHTML)(["table",["tr",["th","Number of gachas"],["th","Chance for item"]]]);for(const n of[.1,.5,1,2,5,10]){var r=Math.round(e*n);0!==r&&a.appendChild((0,v.createHTML)(["tr",["td",{class:"numeric"},""+r],["td",{class:"numeric"},(100*(t=1/e,1-Math.pow(1-t,r))).toFixed(4)+"%"]]))}return a.appendChild((0,v.createHTML)(["tr"])),M(""+E(e,2),a)}function T(e,t){return 1===e&&1===t?"":e===t?" x "+t:` x ${e}-`+t}function l(a,e){var t=["Guardian map "+e.guardian_map,(0,v.createHTML)(["ul",{class:"layout"},["li","Items:",["ul",{class:"layout"},...e.items.reduce((e,t)=>[...e,(0,v.createHTML)(["li",{class:t===a?"highlighted":""},t.name_en])],[])]],["li","Requires boss: "+(e.need_boss?"Yes":"No")],...0<e.boss_time?[(0,v.createHTML)(["li","Boss time: "+(t=e.boss_time,Math.floor(t/60))+":"+(""+t%60).padStart(2,"0")])]:[],["li","EXP multiplier: "+e.xp]])];return M(e.guardian_map,t)}function w(s,o,c){return[...s.sources.values()].filter(o).map(e=>{var t,a=s,r=o,n=c;if(e instanceof y)return t=e.requiresGuardian?void 0:n,r=H(w(e.item,r,n)),[function(e,t,a){var r=a?(0,v.createHTML)(["table",["tr",["th","Item"],["th","Average Tries"]]]):(0,v.createHTML)(["table",["tr",["th","Item"],["th","Character"],["th","Average Tries"]]]),n=_.get(t.shop_id);if(!n)throw"Internal error";var s,o,c,i,l=new Map;for(const g of void 0===a?b:[a]){var u=n.shop_items.get(g);if(u)for(var[m,[d,p,h]]of u){var f=m.character||a,f=f?n.character_probability.get(f):n.total_probability,d=d/f,f=l.get(m)?.[0]||0;l.set(m,[f+d,p,h])}}for([s,[o,c,i]]of l)a?r.appendChild((0,v.createHTML)(["tr",e===s?{class:"highlighted"}:"",["td",s.name_en,T(c,i)],["td",{class:"numeric"},""+E(1/o,2)]])):r.appendChild((0,v.createHTML)(["tr",e===s?{class:"highlighted"}:"",["td",s.name_en,T(c,i)],["td",s.character||"*"],["td",{class:"numeric"},""+E(1/o,2)]]));return M(t.item.name_en,[(0,v.createHTML)(["a",n.name]),r])}(a,e,t)," x ",i(e.gachaTries(a,n)),...0<r.length?[" "]:[],...r];if(e instanceof L)return 1===e.items.length?[e.price+" "+(e.ap?"AP":"Gold")]:[function(e,t){var a=(0,v.createHTML)(["table",["tr",["th","Contents"]]]);for(const r of t.items)a.appendChild((0,v.createHTML)(["tr",r===e?{class:"highlighted"}:"",["td",r.name_en]]));return M(t.item.name_en,[(0,v.createHTML)(["a",t.item.name_en,a])])}(a,e),` ${e.price} `+(e.ap?"AP":"Gold")];if(e instanceof k)return[l(a,e)];throw"Internal error"})}function H(e){const t=[];function a(e){"string"==typeof e&&"string"==typeof t[t.length-1]?t[t.length-1]=t[t.length-1]+e:t.push(e)}let r=!0;for(const n of e)if(0===n.length)a(" ");else{r?r=!1:a(", ");for(const s of n)""!==s&&a(s)}return t}document.body.addEventListener("click",e=>{n&&n!==e.target&&(n.close(),n.remove(),n=void 0)})},{"./html":2}],4:[function(e,t,a){"use strict";var b=e("./checkboxTree"),I=e("./itemLookup"),L=e("./html"),y=e("./storage");const i=["Parts",["Head",["+Hat","+Hair","Dye"],"+Upper","+Lower","Legs",["+Shoes","Socks"],"Aux",["+Hand","+Backpack","+Face"],"+Racket"]],l=["Availability",["Shop",["+Gold","+AP"],"+Allow gacha","+Guardian","+Untradable","Unavailable items"]],k=new Set;!function(){const t=document.getElementById("characterFilters");if(t){let e=!0;for(const c of["All",...I.characters]){var a="characterSelectors_"+c,r=(0,L.createHTML)(["input",{id:a,type:"radio",name:"characterSelectors",value:c}]);r.addEventListener("input",u),t.appendChild(r),t.appendChild((0,L.createHTML)(["label",{for:a},c])),t.appendChild((0,L.createHTML)(["br"])),e&&(r.checked=!0,e=!1)}var n,s;for([n,s]of[[i,"partsFilter"],[l,"availabilityFilter"]]){const t=document.getElementById(s);if(!t)return;var o=(0,b.makeCheckboxTree)(n);o.addEventListener("change",u),t.innerText="",t.appendChild(o)}}}();let r;function S(e,t){return e==t?0:e<t?-1:1}function E(){var e;for(const t of document.getElementsByName("characterSelectors")){if(!(t instanceof HTMLInputElement))throw"Internal error";if(t.checked)return e=t.value,(0,I.isCharacter)(e)?e:void 0}}function n(){var e,t,a=y.Variable_storage.get_variable("Character"),r=(!function(e){for(const t of document.getElementsByName("characterSelectors")){if(!(t instanceof HTMLInputElement))throw"Internal error";if(t.value===e)return t.checked=!0}}("string"==typeof a&&(0,I.isCharacter)(a)?a:"All"),{});for([e,t]of Object.entries(y.Variable_storage.variables))"boolean"==typeof t&&(r[e]=t);a=document.getElementById("partsFilter")?.children[0];if(!(a instanceof HTMLUListElement))throw"Internal error";(0,b.setLeafStates)(a,r);a=document.getElementById("availabilityFilter")?.children[0];if(!(a instanceof HTMLUListElement))throw"Internal error";(0,b.setLeafStates)(a,r);a=document.getElementById("levelrange");if(!(a instanceof HTMLInputElement))throw"Internal error";var n=y.Variable_storage.get_variable("maxLevel"),n=(a.value="number"==typeof n?""+n:a.max,document.getElementById("nameFilter"));if(!(n instanceof HTMLInputElement))throw"Internal error";var s=y.Variable_storage.get_variable("nameFilter"),n=("string"==typeof s&&(n.value=s),y.Variable_storage.get_variable("excluded_item_ids"));if("string"==typeof n)for(const o of n.split(","))k.add(parseInt(o));k.delete(NaN),a.dispatchEvent(new Event("input"))}function u(){var e,t,a,r,n=E()||"All";if(y.Variable_storage.set_variable("Character",n),!((n=document.getElementById("partsFilter")?.children[0])instanceof HTMLUListElement))throw"Internal error";for([e,t]of Object.entries((0,b.getLeafStates)(n)))y.Variable_storage.set_variable(e,t);if(!((n=document.getElementById("availabilityFilter")?.children[0])instanceof HTMLUListElement))throw"Internal error";for([a,r]of Object.entries((0,b.getLeafStates)(n)))y.Variable_storage.set_variable(a,r);if(!((n=document.getElementById("levelrange"))instanceof HTMLInputElement))throw"Internal error";if(n=parseInt(n.value),y.Variable_storage.set_variable("maxLevel",n),!((n=document.getElementById("nameFilter"))instanceof HTMLInputElement))throw"Internal error";(n=n.value)?y.Variable_storage.set_variable("nameFilter",n):y.Variable_storage.delete_variable("nameFilter"),y.Variable_storage.set_variable("excluded_item_ids",Array.from(k).join(","));const s=[],o=[];let c;(c=E())&&s.push(e=>e.character===c);{n=document.getElementById("partsFilter")?.children[0];if(!(n instanceof HTMLUListElement))throw"Internal error";const p=(0,b.getLeafStates)(n);s.push(e=>p[e.part])}n=document.getElementById("availabilityFilter")?.children[0];if(!(n instanceof HTMLUListElement))throw"Internal error";n=(0,b.getLeafStates)(n);if(n.Gold||o.push(e=>!(e instanceof I.ShopItemSource&&!e.ap&&0<e.price)),n.AP||o.push(e=>!(e instanceof I.ShopItemSource&&e.ap&&0<e.price)),n.Untradable||s.push(e=>e.parcel_enabled),n["Allow gacha"]||o.push(e=>!(e instanceof I.GachaItemSource)),n.Guardian||o.push(e=>!e.requiresGuardian),!n["Unavailable items"]){const h=[...o];function i(e){if(t=e,h.every(e=>e(t))){var t;if(!(e instanceof I.GachaItemSource))return!0;for(const a of e.item.sources)if(i(a))return!0}return!1}o.push(i),s.push(function(e){for(const t of e.sources)if(i(t))return!0;return!1})}{n=document.getElementById("levelrange");if(!(n instanceof HTMLInputElement))throw"Internal error";const f=parseInt(n.value);s.push(e=>e.level<=f);n=document.getElementById("nameFilter");if(!(n instanceof HTMLInputElement))throw"Internal error";const g=n.value;g&&s.push(e=>e.name_en.toLowerCase().includes(g.toLowerCase()))}s.push(e=>!k.has(e.id));var l=document.getElementById("itemFilter");if(!(l instanceof HTMLDivElement))throw"Internal error";l.replaceChildren();for(const _ of k){var u=I.items.get(_);u&&l.appendChild((0,L.createHTML)(["div",(0,L.createHTML)(["button",{class:"item_removal_removal","data-item_index":""+_},"X"]),u.name_en]))}const m=[];n=document.getElementById("priority_list");if(!(n instanceof HTMLOListElement))throw"Internal error";for(const v of Array.from(n.childNodes).filter(e=>!e.textContent?.includes("\n")).map(e=>e.textContent))switch(v){case"Movement Speed":m.push((e,t)=>S(e.movement,t.movement));break;case"Charge":m.push((e,t)=>S(e.charge,t.charge));break;case"Lob":m.push((e,t)=>S(e.lob,t.lob));break;case"Str":m.push((e,t)=>S(e.str,t.str));break;case"Dex":m.push((e,t)=>S(e.dex,t.dex));break;case"Sta":m.push((e,t)=>S(e.sta,t.sta));break;case"Will":m.push((e,t)=>S(e.wil,t.wil));break;case"Serve":m.push((e,t)=>S(e.serve,t.serve));break;case"Quickslots":m.push((e,t)=>S(e.quickslots,t.quickslots));break;case"Buffslots":m.push((e,t)=>S(e.buffslots,t.buffslots));break;case"HP":m.push((e,t)=>S(e.hp,t.hp))}var n=(0,I.getResultsTable)(t=>s.every(e=>e(t)),t=>o.every(e=>e(t)),(e,t)=>{if(0===e.length)return[t];for(const a of m)switch(a(e[0],t)){case-1:return[t];case 1:return e}return[...e,t]},c),d=document.getElementById("results");d&&(d.innerText="",d.appendChild(n))}document.addEventListener("dragstart",({target:e})=>{e instanceof HTMLElement&&(r=e)}),document.addEventListener("dragover",e=>{e.preventDefault()}),document.addEventListener("drop",({target:e})=>{var t,a;e instanceof HTMLElement&&"dropzone"==e.className&&e!==r&&r.parentNode===e.parentNode&&(a=(t=Array.from(r.parentNode?.children??new HTMLCollection)).indexOf(r),r.remove(),a>t.indexOf(e)?e.before(r):e.after(r),u())});{const s=document.getElementById("levelDisplay");if(!(s instanceof HTMLLabelElement))throw"Internal error";const o=document.getElementById("levelrange");if(!(o instanceof HTMLInputElement))throw"Internal error";o.addEventListener("input",()=>{s.textContent="Max level requirement: "+o.value,u()})}e=document.getElementById("nameFilter");if(!(e instanceof HTMLElement))throw"Internal error";e.addEventListener("input",u),window.addEventListener("load",async()=>{n(),await(0,I.downloadItems)();for(const a of document.getElementsByClassName("show_after_load"))a instanceof HTMLElement&&(a.hidden=!1);for(const r of document.getElementsByClassName("hide_after_load"))r instanceof HTMLElement&&(r.style.display="none");var e=document.getElementById("levelrange");if(!(e instanceof HTMLInputElement))throw"Internal error";var t=(0,I.getMaxItemLevel)();e.value=""+Math.min(parseInt(e.value),t),e.max=""+t,e.dispatchEvent(new Event("input")),u()}),document.body.addEventListener("click",e=>{e.target instanceof HTMLElement&&("item_removal"===e.target.className?e.target.dataset.item_index&&(k.add(parseInt(e.target.dataset.item_index)),u()):"item_removal_removal"===e.target.className&&e.target.dataset.item_index&&(k.delete(parseInt(e.target.dataset.item_index)),u()))})},{"./checkboxTree":1,"./html":2,"./itemLookup":3,"./storage":5}],5:[function(e,t,a){"use strict";function n(e){var t=e[0],a=e.substring(1);switch(t){case"s":return a;case"n":return parseFloat(a);case"b":return"1"===a}throw"invalid value: "+e}function s(e){return 1<=e.length&&"snb".includes(e[0])}Object.defineProperty(a,"__esModule",{value:!0}),a.Variable_storage=void 0;a.Variable_storage=class{static get_variable(e){e=localStorage.getItem(""+e);if("string"==typeof e&&s(e))return n(e)}static set_variable(e,t){localStorage.setItem(""+e,function(e){switch(typeof e){case"string":return"s"+e;case"number":return"n"+e;case"boolean":return e?"b1":"b0"}}(t))}static delete_variable(e){localStorage.removeItem(""+e)}static clear_all(){localStorage.clear()}static get variables(){var t={};for(let e=0;e<localStorage.length;e++){var a,r=localStorage.key(e);"string"==typeof r&&("string"==typeof(a=localStorage.getItem(r))&&s(a))&&(t[r]=n(a))}return t}}},{}]},{},[4]);
