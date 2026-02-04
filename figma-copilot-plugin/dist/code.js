/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/code.ts"
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const index_html_1 = __importDefault(__webpack_require__(/*! ./ui/index.html */ "./src/ui/index.html"));
function round10(n) {
    return Math.round(n / 10) * 10;
}
function parseFills(node) {
    const fills = node === null || node === void 0 ? void 0 : node.fills;
    if (!fills || fills === figma.mixed || !Array.isArray(fills))
        return [];
    return fills.map((f) => {
        var _a, _b, _c;
        if (f.type === 'SOLID') {
            return {
                type: 'SOLID',
                color: { r: f.color.r, g: f.color.g, b: f.color.b },
                opacity: (_a = f.opacity) !== null && _a !== void 0 ? _a : 1,
            };
        }
        if (f.type === 'LINEAR_GRADIENT' || f.type === 'RADIAL_GRADIENT') {
            return { type: f.type, opacity: (_b = f.opacity) !== null && _b !== void 0 ? _b : 1 };
        }
        if (f.type === 'IMAGE') {
            return { type: 'IMAGE', opacity: (_c = f.opacity) !== null && _c !== void 0 ? _c : 1 };
        }
        return { type: 'OTHER' };
    });
}
function parseStrokes(node) {
    const strokes = node === null || node === void 0 ? void 0 : node.strokes;
    if (!strokes || strokes === figma.mixed || !Array.isArray(strokes))
        return [];
    return strokes.map((s) => {
        var _a, _b, _c, _d;
        return ({
            color: { r: s.color.r, g: s.color.g, b: s.color.b },
            opacity: (_a = s.opacity) !== null && _a !== void 0 ? _a : 1,
            weight: (_b = s.weight) !== null && _b !== void 0 ? _b : 1,
            align: (_c = s.strokeAlign) !== null && _c !== void 0 ? _c : 'INSIDE',
            type: (_d = s.type) !== null && _d !== void 0 ? _d : 'SOLID',
        });
    });
}
function parseBorderRadius(node) {
    var _a, _b, _c, _d;
    if (!('cornerRadius' in node))
        return undefined;
    const cr = node.cornerRadius;
    if (cr === figma.mixed) {
        try {
            return [
                (_a = node.topLeftRadius) !== null && _a !== void 0 ? _a : 0,
                (_b = node.topRightRadius) !== null && _b !== void 0 ? _b : 0,
                (_c = node.bottomRightRadius) !== null && _c !== void 0 ? _c : 0,
                (_d = node.bottomLeftRadius) !== null && _d !== void 0 ? _d : 0,
            ];
        }
        catch (_e) {
            return undefined;
        }
    }
    return typeof cr === 'number' ? cr : undefined;
}
function parseAutoLayout(node) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!('layoutMode' in node) || node.layoutMode === 'NONE')
        return undefined;
    return {
        direction: node.layoutMode,
        gap: (_a = node.itemSpacing) !== null && _a !== void 0 ? _a : 0,
        paddingTop: (_b = node.paddingTop) !== null && _b !== void 0 ? _b : 0,
        paddingRight: (_c = node.paddingRight) !== null && _c !== void 0 ? _c : 0,
        paddingBottom: (_d = node.paddingBottom) !== null && _d !== void 0 ? _d : 0,
        paddingLeft: (_e = node.paddingLeft) !== null && _e !== void 0 ? _e : 0,
        alignItems: (_f = node.primaryAxisAlign) !== null && _f !== void 0 ? _f : 'MIN',
        justifyContent: (_g = node.counterAxisAlign) !== null && _g !== void 0 ? _g : 'MIN',
    };
}
const MAX_DEPTH = 8;
const MAX_NODES = 600;
let nodeCount = 0;
function scanNode(node, depth) {
    var _a, _b, _c;
    if (nodeCount >= MAX_NODES)
        return null;
    nodeCount++;
    const base = {
        id: node.id,
        name: node.name,
        type: node.type,
        x: Math.round(node.x * 100) / 100,
        y: Math.round(node.y * 100) / 100,
        width: Math.round(node.width * 100) / 100,
        height: Math.round(node.height * 100) / 100,
        visible: node.visible,
        opacity: (_a = node.opacity) !== null && _a !== void 0 ? _a : 1,
    };
    const n = node;
    const fills = parseFills(n);
    if (fills.length)
        base.fills = fills;
    const strokes = parseStrokes(n);
    if (strokes.length)
        base.strokes = strokes;
    const br = parseBorderRadius(n);
    if (br !== undefined)
        base.borderRadius = br;
    // auto-layout
    if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        const al = parseAutoLayout(n);
        if (al)
            base.autoLayout = al;
    }
    // TEXT
    if (node.type === 'TEXT') {
        base.text = n.characters;
        base.fontSize = n.fontSize === figma.mixed ? undefined : n.fontSize;
        base.fontFamily = n.fontName === figma.mixed ? undefined : (_b = n.fontName) === null || _b === void 0 ? void 0 : _b.family;
        base.fontWeight = n.fontName === figma.mixed ? undefined : (_c = n.fontName) === null || _c === void 0 ? void 0 : _c.style;
        base.textAlign = n.textAlignHorizontal === figma.mixed ? undefined : n.textAlignHorizontal;
        const tf = fills.find((f) => f.type === 'SOLID');
        if (tf === null || tf === void 0 ? void 0 : tf.color)
            base.textColor = tf.color;
    }
    // INSTANCE
    if (node.type === 'INSTANCE') {
        const mainComp = node.mainComponent;
        if (mainComp)
            base.componentName = mainComp.name;
    }
    // IMAGE fill flag
    if (fills.some((f) => f.type === 'IMAGE')) {
        base.imageUrl = null;
    }
    // children
    if ('children' in node && depth < MAX_DEPTH) {
        const children = [];
        for (const child of node.children) {
            const scanned = scanNode(child, depth + 1);
            if (scanned)
                children.push(scanned);
        }
        if (children.length)
            base.children = children;
    }
    return base;
}
function scanDocument() {
    var _a, _b, _c, _d, _e, _f, _g;
    nodeCount = 0;
    const pages = [];
    const fontSet = new Set();
    const colorSet = new Map();
    for (const page of figma.root.children) {
        const screens = [];
        for (const node of page.children) {
            const scanned = scanNode(node, 0);
            if (scanned)
                screens.push(scanned);
        }
        pages.push({ id: page.id, name: page.name, screens });
    }
    function collectStyles(nodes) {
        for (const n of nodes) {
            if (n.fills) {
                for (const f of n.fills) {
                    if (f.type === 'SOLID' && f.color) {
                        const key = `${f.color.r},${f.color.g},${f.color.b}`;
                        colorSet.set(key, f.color);
                    }
                }
            }
            if (n.textColor) {
                const key = `${n.textColor.r},${n.textColor.g},${n.textColor.b}`;
                colorSet.set(key, n.textColor);
            }
            if (n.fontFamily)
                fontSet.add(`${n.fontFamily} ${n.fontWeight || 'Regular'}`);
            if (n.children)
                collectStyles(n.children);
        }
    }
    for (const p of pages)
        collectStyles(p.screens);
    const sizeCount = new Map();
    const bgCount = new Map();
    for (const p of pages) {
        for (const s of p.screens) {
            if (s.type !== 'FRAME')
                continue;
            const w = round10(s.width);
            const h = round10(s.height);
            const k = `${w}x${h}`;
            sizeCount.set(k, { w, h, count: ((_b = (_a = sizeCount.get(k)) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0) + 1 });
            const solidBg = (_c = s.fills) === null || _c === void 0 ? void 0 : _c.find((f) => f.type === 'SOLID');
            if (solidBg === null || solidBg === void 0 ? void 0 : solidBg.color) {
                const r = Math.round(solidBg.color.r * 100) / 100;
                const g = Math.round(solidBg.color.g * 100) / 100;
                const b = Math.round(solidBg.color.b * 100) / 100;
                const bk = `${r},${g},${b}`;
                bgCount.set(bk, { rgb: { r, g, b }, count: ((_e = (_d = bgCount.get(bk)) === null || _d === void 0 ? void 0 : _d.count) !== null && _e !== void 0 ? _e : 0) + 1 });
            }
        }
    }
    const bestSize = (_f = [...sizeCount.values()].sort((a, b) => b.count - a.count)[0]) !== null && _f !== void 0 ? _f : { w: 1440, h: 900, count: 1 };
    const bestBg = (_g = [...bgCount.values()].sort((a, b) => b.count - a.count)[0]) === null || _g === void 0 ? void 0 : _g.rgb;
    return {
        pages,
        styleHints: {
            defaultSize: { width: bestSize.w, height: bestSize.h },
            defaultBg: bestBg,
            allColors: [...colorSet.values()],
            allFonts: [...fontSet],
        },
        meta: {
            totalNodes: nodeCount,
            maxDepth: MAX_DEPTH,
            maxNodes: MAX_NODES,
            truncated: nodeCount >= MAX_NODES,
        },
    };
}
function ensurePage(name) {
    const existing = figma.root.children.find((p) => p.name === name);
    if (existing)
        return existing;
    const page = figma.createPage();
    page.name = name;
    return page;
}
function normName(s) {
    return s.trim().toLowerCase();
}
function generateScreens(names, targetPageName = 'Generated') {
    const scan = scanDocument();
    const targetPage = ensurePage(targetPageName);
    figma.currentPage = targetPage;
    const existing = new Set();
    for (const p of scan.pages)
        for (const s of p.screens)
            existing.add(normName(s.name));
    const wanted = names.map((n) => n.trim()).filter(Boolean);
    const missing = wanted.filter((n) => !existing.has(normName(n)));
    const skippedExisting = wanted.filter((n) => existing.has(normName(n)));
    const { width, height } = scan.styleHints.defaultSize;
    const bg = scan.styleHints.defaultBg;
    const created = [];
    const gapX = 200;
    const gapY = 200;
    const cols = 3;
    missing.forEach((name, i) => {
        const frame = figma.createFrame();
        frame.name = name;
        frame.resize(width, height);
        if (bg)
            frame.fills = [{ type: 'SOLID', color: bg }];
        frame.x = (i % cols) * (width + gapX);
        frame.y = Math.floor(i / cols) * (height + gapY);
        targetPage.appendChild(frame);
        created.push({ id: frame.id, name: frame.name });
    });
    return { created, skippedExisting };
}
function generateFromPrompt(prompt, targetPageName = 'From Prompt') {
    const scan = scanDocument();
    const targetPage = ensurePage(targetPageName);
    figma.currentPage = targetPage;
    const { width: defaultWidth, height: defaultHeight } = scan.styleHints.defaultSize;
    const defaultBg = scan.styleHints.defaultBg;
    const actions = [];
    const applied = [];
    const lines = prompt.split('|').map((s) => s.trim());
    let yOffset = 0;
    const itemGapY = 150;
    for (const line of lines) {
        if (!line)
            continue;
        if (line.toLowerCase().startsWith('add frame')) {
            const match = line.match(/add frame\s+['"]([^'"]+)['"]/i);
            if (match) {
                const frameName = match[1];
                const frame = figma.createFrame();
                frame.name = frameName;
                frame.resize(defaultWidth, defaultHeight);
                if (defaultBg)
                    frame.fills = [{ type: 'SOLID', color: defaultBg }];
                frame.y = yOffset;
                targetPage.appendChild(frame);
                actions.push({ type: 'add_frame', params: { name: frameName } });
                applied.push({ type: 'frame', id: frame.id, name: frameName });
                yOffset += defaultHeight + itemGapY;
            }
        }
        else if (line.toLowerCase().startsWith('add text')) {
            const textMatch = line.match(/add text\s+['"]([^'"]+)['"]/i);
            const posMatch = line.match(/at\s+(\d+),(\d+)/i);
            const sizeMatch = line.match(/size\s+(\d+)/i);
            if (textMatch) {
                const textContent = textMatch[1];
                const x = posMatch ? parseInt(posMatch[1]) : 100;
                const y = posMatch ? parseInt(posMatch[2]) : yOffset;
                const fontSize = sizeMatch ? parseInt(sizeMatch[1]) : 16;
                figma.loadFontAsync({ family: 'Roboto', style: 'Regular' }).then(() => {
                    const text = figma.createText();
                    text.characters = textContent;
                    text.fontSize = fontSize;
                    text.x = x;
                    text.y = y;
                    targetPage.appendChild(text);
                });
                actions.push({ type: 'add_text', params: { content: textContent, x, y, fontSize } });
                applied.push({ type: 'text', content: textContent, x, y });
            }
        }
        else if (line.toLowerCase().match(/add\s+(rect|rectangle)/)) {
            const sizeMatch = line.match(/(\d+)x(\d+)/i);
            const colorMatch = line.match(/#([0-9A-F]{6})/i);
            if (sizeMatch) {
                const width = parseInt(sizeMatch[1]);
                const height = parseInt(sizeMatch[2]);
                const rect = figma.createRectangle();
                rect.resize(width, height);
                rect.x = 100;
                rect.y = yOffset;
                if (colorMatch) {
                    const hex = colorMatch[1];
                    const r = parseInt(hex.substring(0, 2), 16) / 255;
                    const g = parseInt(hex.substring(2, 4), 16) / 255;
                    const b = parseInt(hex.substring(4, 6), 16) / 255;
                    rect.fills = [{ type: 'SOLID', color: { r, g, b } }];
                }
                targetPage.appendChild(rect);
                actions.push({ type: 'add_rectangle', params: { width, height, x: 100, y: yOffset } });
                applied.push({ type: 'rectangle', width, height, x: 100, y: yOffset });
                yOffset += height + itemGapY;
            }
        }
        else if (line.toLowerCase().startsWith('fill')) {
            const nodeMatch = line.match(/fill\s+(\S+)/i);
            const colorMatch = line.match(/#([0-9A-F]{6})/i);
            if (nodeMatch && colorMatch) {
                const nodeId = nodeMatch[1];
                const hex = colorMatch[1];
                const r = parseInt(hex.substring(0, 2), 16) / 255;
                const g = parseInt(hex.substring(2, 4), 16) / 255;
                const b = parseInt(hex.substring(4, 6), 16) / 255;
                const node = figma.getNodeById(nodeId);
                if (node && 'fills' in node) {
                    node.fills = [{ type: 'SOLID', color: { r, g, b } }];
                    actions.push({ type: 'update_fill', params: { nodeId, r, g, b } });
                    applied.push({ type: 'color_update', nodeId, color: { r, g, b } });
                }
            }
        }
    }
    return { actions, applied };
}
function updateNode(params) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const node = figma.getNodeById(params.nodeId);
        if (!node)
            throw new Error(`Node not found: ${params.nodeId}`);
        const u = (_a = params.updates) !== null && _a !== void 0 ? _a : {};
        // TEXT updates
        if (node.type === 'TEXT') {
            const text = node;
            if (u.fontName || u.characters || u.fontSize) {
                const desiredFont = (_b = u.fontName) !== null && _b !== void 0 ? _b : text.fontName;
                if (desiredFont && desiredFont !== figma.mixed) {
                    yield figma.loadFontAsync(desiredFont);
                }
            }
            if (typeof u.fontSize === 'number')
                text.fontSize = u.fontSize;
            if (u.fontName && u.fontName.family && u.fontName.style) {
                text.fontName = { family: u.fontName.family, style: u.fontName.style };
            }
            if (typeof u.characters === 'string')
                text.characters = u.characters;
        }
        // Fills
        if (u.fills && 'fills' in node) {
            node.fills = u.fills;
        }
        // Opacity
        if (typeof u.opacity === 'number' && 'opacity' in node) {
            node.opacity = u.opacity;
        }
        // Position
        if (typeof u.x === 'number')
            node.x = u.x;
        if (typeof u.y === 'number')
            node.y = u.y;
        // Resize (if supported)
        if (typeof u.width === 'number' && typeof u.height === 'number' && 'resize' in node) {
            node.resize(u.width, u.height);
        }
        return { ok: true, nodeId: node.id, type: node.type };
    });
}
/**
 * NEW: attach_node (re-parent existing node into a parent that supports children)
 * - parentId can be Frame/Group/Component/Page/etc. (any ChildrenMixin)
 * - nodeId is any SceneNode
 * - index optional: insertChild(index, node), else appendChild
 */
function attachNode(params) {
    var _a;
    const parent = figma.getNodeById(params.parentId);
    const node = figma.getNodeById(params.nodeId);
    if (!parent)
        throw new Error(`Parent not found: ${params.parentId}`);
    if (!node)
        throw new Error(`Node not found: ${params.nodeId}`);
    if (!('appendChild' in parent) || typeof parent.appendChild !== 'function') {
        throw new Error(`Parent cannot contain children: ${parent.type} (${parent.id})`);
    }
    // If node is already inside parent, no-op (still return ok)
    if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.id) === parent.id) {
        return { ok: true, parentId: parent.id, nodeId: node.id, parentType: parent.type, note: 'Already attached' };
    }
    // Move node under parent
    if (typeof params.index === 'number' && Number.isFinite(params.index)) {
        parent.insertChild(params.index, node);
    }
    else {
        parent.appendChild(node);
    }
    return { ok: true, parentId: parent.id, nodeId: node.id, parentType: parent.type };
}
figma.showUI(index_html_1.default, { width: 360, height: 140 });
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    if ((msg === null || msg === void 0 ? void 0 : msg.type) !== 'MCP_REQUEST')
        return;
    const { id, method, params } = msg;
    try {
        let result;
        if (method === 'scan_document')
            result = scanDocument();
        else if (method === 'generate_screens')
            result = generateScreens((_a = params === null || params === void 0 ? void 0 : params.names) !== null && _a !== void 0 ? _a : [], (_b = params === null || params === void 0 ? void 0 : params.targetPageName) !== null && _b !== void 0 ? _b : 'Generated');
        else if (method === 'generate_from_prompt')
            result = generateFromPrompt((_c = params === null || params === void 0 ? void 0 : params.prompt) !== null && _c !== void 0 ? _c : '', (_d = params === null || params === void 0 ? void 0 : params.targetPageName) !== null && _d !== void 0 ? _d : 'From Prompt');
        else if (method === 'update_node')
            result = yield updateNode({ nodeId: params === null || params === void 0 ? void 0 : params.nodeId, updates: (_e = params === null || params === void 0 ? void 0 : params.updates) !== null && _e !== void 0 ? _e : {} });
        else if (method === 'attach_node')
            result = attachNode({ parentId: params === null || params === void 0 ? void 0 : params.parentId, nodeId: params === null || params === void 0 ? void 0 : params.nodeId, index: params === null || params === void 0 ? void 0 : params.index });
        else
            throw new Error(`Unknown method: ${method}`);
        figma.ui.postMessage({ type: 'MCP_RESPONSE', id, ok: true, result });
    }
    catch (e) {
        figma.ui.postMessage({ type: 'MCP_RESPONSE', id, ok: false, error: (_f = e === null || e === void 0 ? void 0 : e.message) !== null && _f !== void 0 ? _f : String(e) });
    }
});


/***/ },

/***/ "./src/ui/index.html"
/*!***************************!*\
  !*** ./src/ui/index.html ***!
  \***************************/
(module) {

module.exports = "<!doctype html>\n<html>\n  <head>\n    <meta charset=\"UTF-8\" />\n    <title>MCP Bridge</title>\n    <style>\n      body { font-family: Inter, system-ui, Arial; margin: 0; }\n      .wrap { padding: 12px; }\n      .muted { color: #666; font-size: 12px; }\n      .status { font-size: 12px; margin-top: 6px; }\n    </style>\n  </head>\n  <body>\n    <div class=\"wrap\">\n      <div><b>MCP Bridge</b></div>\n      <div id=\"status\" class=\"status\">Connecting...</div>\n      <div class=\"muted\" style=\"margin-top:10px\">\n        Keep this window open. Copilot calls MCP tools → server → this plugin.\n      </div>\n    </div>\n\n    <script>\n      const RELAY_URL = 'ws://127.0.0.1:8765';\n      const el = document.getElementById('status');\n\n      function setStatus(t) { el.textContent = t; }\n\n      let ws;\n      try {\n        ws = new WebSocket(RELAY_URL);\n\n        ws.onopen = () => setStatus('Connected → ' + RELAY_URL);\n        ws.onclose = () => setStatus('Disconnected');\n        ws.onerror = () => setStatus('Error (start relay server first)');\n\n        // relay -> plugin main\n        ws.onmessage = (event) => {\n          try {\n            const msg = JSON.parse(event.data);\n            parent.postMessage({ pluginMessage: { type: 'MCP_REQUEST', ...msg } }, '*');\n          } catch {}\n        };\n\n        // plugin main -> relay\n        window.onmessage = (event) => {\n          const m = event.data && event.data.pluginMessage;\n          if (m && m.type === 'MCP_RESPONSE') {\n            ws.send(JSON.stringify({ id: m.id, ok: m.ok, result: m.result, error: m.error }));\n          }\n        };\n      } catch (e) {\n        setStatus('Failed to init WebSocket');\n      }\n    </script>\n  </body>\n</html>";

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/code.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=code.js.map