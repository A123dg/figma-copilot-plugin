import uiHtml from './ui/index.html';

type SolidRGB = { r: number; g: number; b: number };

interface FillInfo {
  type: 'SOLID' | 'LINEAR_GRADIENT' | 'RADIAL_GRADIENT' | 'IMAGE' | 'OTHER';
  color?: SolidRGB;
  opacity?: number;
}

interface StrokeInfo {
  color: SolidRGB;
  opacity: number;
  weight: number;
  align: string;
  type: string;
}

interface AutoLayoutInfo {
  direction: string;
  gap: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  alignItems: string;
  justifyContent: string;
}

interface ScannedNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;

  fills?: FillInfo[];
  strokes?: StrokeInfo[];
  borderRadius?: number | [number, number, number, number];
  autoLayout?: AutoLayoutInfo;

  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  textColor?: SolidRGB;

  componentName?: string;

  imageUrl?: null;
  children?: ScannedNode[];
}

function round10(n: number) {
  return Math.round(n / 10) * 10;
}

function parseFills(node: any): FillInfo[] {
  const fills = node?.fills;
  if (!fills || fills === figma.mixed || !Array.isArray(fills)) return [];
  return fills.map((f: any) => {
    if (f.type === 'SOLID') {
      return {
        type: 'SOLID' as const,
        color: { r: f.color.r, g: f.color.g, b: f.color.b },
        opacity: f.opacity ?? 1,
      };
    }
    if (f.type === 'LINEAR_GRADIENT' || f.type === 'RADIAL_GRADIENT') {
      return { type: f.type as 'LINEAR_GRADIENT' | 'RADIAL_GRADIENT', opacity: f.opacity ?? 1 };
    }
    if (f.type === 'IMAGE') {
      return { type: 'IMAGE' as const, opacity: f.opacity ?? 1 };
    }
    return { type: 'OTHER' as const };
  });
}

function parseStrokes(node: any): StrokeInfo[] {
  const strokes = node?.strokes;
  if (!strokes || strokes === figma.mixed || !Array.isArray(strokes)) return [];
  return strokes.map((s: any) => ({
    color: { r: s.color.r, g: s.color.g, b: s.color.b },
    opacity: s.opacity ?? 1,
    weight: s.weight ?? 1,
    align: s.strokeAlign ?? 'INSIDE',
    type: s.type ?? 'SOLID',
  }));
}

function parseBorderRadius(node: any): number | [number, number, number, number] | undefined {
  if (!('cornerRadius' in node)) return undefined;
  const cr = node.cornerRadius;
  if (cr === figma.mixed) {
    try {
      return [
        node.topLeftRadius ?? 0,
        node.topRightRadius ?? 0,
        node.bottomRightRadius ?? 0,
        node.bottomLeftRadius ?? 0,
      ];
    } catch {
      return undefined;
    }
  }
  return typeof cr === 'number' ? cr : undefined;
}

function parseAutoLayout(node: any): AutoLayoutInfo | undefined {
  if (!('layoutMode' in node) || node.layoutMode === 'NONE') return undefined;
  return {
    direction: node.layoutMode,
    gap: node.itemSpacing ?? 0,
    paddingTop: node.paddingTop ?? 0,
    paddingRight: node.paddingRight ?? 0,
    paddingBottom: node.paddingBottom ?? 0,
    paddingLeft: node.paddingLeft ?? 0,
    alignItems: node.primaryAxisAlign ?? 'MIN',
    justifyContent: node.counterAxisAlign ?? 'MIN',
  };
}

const MAX_DEPTH = 8;
const MAX_NODES = 600;
let nodeCount = 0;

function scanNode(node: SceneNode, depth: number): ScannedNode | null {
  if (nodeCount >= MAX_NODES) return null;
  nodeCount++;

  const base: ScannedNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: Math.round(node.x * 100) / 100,
    y: Math.round(node.y * 100) / 100,
    width: Math.round(node.width * 100) / 100,
    height: Math.round(node.height * 100) / 100,
    visible: node.visible,
    opacity: (node as any).opacity ?? 1,
  };

  const n = node as any;

  const fills = parseFills(n);
  if (fills.length) base.fills = fills;

  const strokes = parseStrokes(n);
  if (strokes.length) base.strokes = strokes;

  const br = parseBorderRadius(n);
  if (br !== undefined) base.borderRadius = br;

  // auto-layout
  if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    const al = parseAutoLayout(n);
    if (al) base.autoLayout = al;
  }

  // TEXT
  if (node.type === 'TEXT') {
    base.text = n.characters;
    base.fontSize = n.fontSize === figma.mixed ? undefined : n.fontSize;
    base.fontFamily = n.fontName === figma.mixed ? undefined : n.fontName?.family;
    base.fontWeight = n.fontName === figma.mixed ? undefined : n.fontName?.style;
    base.textAlign = n.textAlignHorizontal === figma.mixed ? undefined : n.textAlignHorizontal;

    const tf = fills.find((f) => f.type === 'SOLID');
    if (tf?.color) base.textColor = tf.color;
  }

  // INSTANCE
  if (node.type === 'INSTANCE') {
    const mainComp = (node as InstanceNode).mainComponent;
    if (mainComp) base.componentName = mainComp.name;
  }

  // IMAGE fill flag
  if (fills.some((f) => f.type === 'IMAGE')) {
    base.imageUrl = null;
  }

  // children
  if ('children' in node && depth < MAX_DEPTH) {
    const children: ScannedNode[] = [];
    for (const child of (node as any).children) {
      const scanned = scanNode(child as SceneNode, depth + 1);
      if (scanned) children.push(scanned);
    }
    if (children.length) base.children = children;
  }

  return base;
}

function scanDocument() {
  nodeCount = 0;

  const pages: { id: string; name: string; screens: ScannedNode[] }[] = [];

  const fontSet = new Set<string>();
  const colorSet = new Map<string, SolidRGB>();

  for (const page of figma.root.children) {
    const screens: ScannedNode[] = [];
    for (const node of page.children) {
      const scanned = scanNode(node, 0);
      if (scanned) screens.push(scanned);
    }
    pages.push({ id: page.id, name: page.name, screens });
  }

  function collectStyles(nodes: ScannedNode[]) {
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

      if (n.fontFamily) fontSet.add(`${n.fontFamily} ${n.fontWeight || 'Regular'}`);

      if (n.children) collectStyles(n.children);
    }
  }
  for (const p of pages) collectStyles(p.screens);

  const sizeCount = new Map<string, { w: number; h: number; count: number }>();
  const bgCount = new Map<string, { rgb: SolidRGB; count: number }>();

  for (const p of pages) {
    for (const s of p.screens) {
      if (s.type !== 'FRAME') continue;
      const w = round10(s.width);
      const h = round10(s.height);
      const k = `${w}x${h}`;
      sizeCount.set(k, { w, h, count: (sizeCount.get(k)?.count ?? 0) + 1 });

      const solidBg = s.fills?.find((f) => f.type === 'SOLID');
      if (solidBg?.color) {
        const r = Math.round(solidBg.color.r * 100) / 100;
        const g = Math.round(solidBg.color.g * 100) / 100;
        const b = Math.round(solidBg.color.b * 100) / 100;
        const bk = `${r},${g},${b}`;
        bgCount.set(bk, { rgb: { r, g, b }, count: (bgCount.get(bk)?.count ?? 0) + 1 });
      }
    }
  }

  const bestSize =
    [...sizeCount.values()].sort((a, b) => b.count - a.count)[0] ?? { w: 1440, h: 900, count: 1 };
  const bestBg = [...bgCount.values()].sort((a, b) => b.count - a.count)[0]?.rgb;

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

function ensurePage(name: string): PageNode {
  const existing = figma.root.children.find((p) => p.name === name);
  if (existing) return existing;
  const page = figma.createPage();
  page.name = name;
  return page;
}

function normName(s: string) {
  return s.trim().toLowerCase();
}

function generateScreens(names: string[], targetPageName = 'Generated') {
  const scan = scanDocument();
  const targetPage = ensurePage(targetPageName);
  figma.currentPage = targetPage;

  const existing = new Set<string>();
  for (const p of scan.pages) for (const s of p.screens) existing.add(normName(s.name));

  const wanted = names.map((n) => n.trim()).filter(Boolean);
  const missing = wanted.filter((n) => !existing.has(normName(n)));
  const skippedExisting = wanted.filter((n) => existing.has(normName(n)));

  const { width, height } = scan.styleHints.defaultSize;
  const bg: SolidRGB | undefined = scan.styleHints.defaultBg;

  const created: { id: string; name: string }[] = [];
  const gapX = 200;
  const gapY = 200;
  const cols = 3;

  missing.forEach((name, i) => {
    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(width, height);
    if (bg) frame.fills = [{ type: 'SOLID', color: bg }];

    frame.x = (i % cols) * (width + gapX);
    frame.y = Math.floor(i / cols) * (height + gapY);

    targetPage.appendChild(frame);
    created.push({ id: frame.id, name: frame.name });
  });

  return { created, skippedExisting };
}

interface PromptAction {
  type: 'add_frame' | 'add_text' | 'add_rectangle' | 'update_fill' | 'update_size' | 'rename';
  params: Record<string, any>;
}

function generateFromPrompt(prompt: string, targetPageName = 'From Prompt'): { actions: PromptAction[]; applied: any[] } {
  const scan = scanDocument();
  const targetPage = ensurePage(targetPageName);
  figma.currentPage = targetPage;

  const { width: defaultWidth, height: defaultHeight } = scan.styleHints.defaultSize;
  const defaultBg = scan.styleHints.defaultBg;

  const actions: PromptAction[] = [];
  const applied: any[] = [];

  const lines = prompt.split('|').map((s) => s.trim());

  let yOffset = 0;
  const itemGapY = 150;

  for (const line of lines) {
    if (!line) continue;

    if (line.toLowerCase().startsWith('add frame')) {
      const match = line.match(/add frame\s+['"]([^'"]+)['"]/i);
      if (match) {
        const frameName = match[1];
        const frame = figma.createFrame();
        frame.name = frameName;
        frame.resize(defaultWidth, defaultHeight);
        if (defaultBg) frame.fills = [{ type: 'SOLID', color: defaultBg }];

        frame.y = yOffset;
        targetPage.appendChild(frame);

        actions.push({ type: 'add_frame', params: { name: frameName } });
        applied.push({ type: 'frame', id: frame.id, name: frameName });
        yOffset += defaultHeight + itemGapY;
      }
    } else if (line.toLowerCase().startsWith('add text')) {
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
    } else if (line.toLowerCase().match(/add\s+(rect|rectangle)/)) {
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
    } else if (line.toLowerCase().startsWith('fill')) {
      const nodeMatch = line.match(/fill\s+(\S+)/i);
      const colorMatch = line.match(/#([0-9A-F]{6})/i);

      if (nodeMatch && colorMatch) {
        const nodeId = nodeMatch[1];
        const hex = colorMatch[1];
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        const node = figma.getNodeById(nodeId) as any;
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

async function updateNode(params: { nodeId: string; updates: Record<string, any> }) {
  const node = figma.getNodeById(params.nodeId) as SceneNode | null;
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  const u = params.updates ?? {};

  // TEXT updates
  if (node.type === 'TEXT') {
    const text = node as TextNode;

    if (u.fontName || u.characters || u.fontSize) {
      const desiredFont = u.fontName ?? text.fontName;
      if (desiredFont && desiredFont !== figma.mixed) {
        await figma.loadFontAsync(desiredFont);
      }
    }

    if (typeof u.fontSize === 'number') text.fontSize = u.fontSize;

    if (u.fontName && u.fontName.family && u.fontName.style) {
      text.fontName = { family: u.fontName.family, style: u.fontName.style };
    }

    if (typeof u.characters === 'string') text.characters = u.characters;
  }

  // Fills
  if (u.fills && 'fills' in (node as any)) {
    (node as any).fills = u.fills;
  }

  // Opacity
  if (typeof u.opacity === 'number' && 'opacity' in (node as any)) {
    (node as any).opacity = u.opacity;
  }

  // Position
  if (typeof u.x === 'number') (node as any).x = u.x;
  if (typeof u.y === 'number') (node as any).y = u.y;

  // Resize (if supported)
  if (typeof u.width === 'number' && typeof u.height === 'number' && 'resize' in (node as any)) {
    (node as any).resize(u.width, u.height);
  }

  return { ok: true, nodeId: node.id, type: node.type };
}

/**
 * NEW: attach_node (re-parent existing node into a parent that supports children)
 * - parentId can be Frame/Group/Component/Page/etc. (any ChildrenMixin)
 * - nodeId is any SceneNode
 * - index optional: insertChild(index, node), else appendChild
 */
function attachNode(params: { parentId: string; nodeId: string; index?: number }) {
  const parent = figma.getNodeById(params.parentId) as (BaseNode & ChildrenMixin) | null;
  const node = figma.getNodeById(params.nodeId) as SceneNode | null;

  if (!parent) throw new Error(`Parent not found: ${params.parentId}`);
  if (!node) throw new Error(`Node not found: ${params.nodeId}`);

  if (!('appendChild' in parent) || typeof (parent as any).appendChild !== 'function') {
    throw new Error(`Parent cannot contain children: ${parent.type} (${parent.id})`);
  }

  // If node is already inside parent, no-op (still return ok)
  if ((node as any).parent?.id === parent.id) {
    return { ok: true, parentId: parent.id, nodeId: node.id, parentType: parent.type, note: 'Already attached' };
  }

  // Move node under parent
  if (typeof params.index === 'number' && Number.isFinite(params.index)) {
    parent.insertChild(params.index, node);
  } else {
    parent.appendChild(node);
  }

  return { ok: true, parentId: parent.id, nodeId: node.id, parentType: parent.type };
}

figma.showUI(uiHtml, { width: 360, height: 140 });

figma.ui.onmessage = async (msg: any) => {
  if (msg?.type !== 'MCP_REQUEST') return;

  const { id, method, params } = msg;

  try {
    let result: any;
    if (method === 'scan_document') result = scanDocument();
    else if (method === 'generate_screens') result = generateScreens(params?.names ?? [], params?.targetPageName ?? 'Generated');
    else if (method === 'generate_from_prompt') result = generateFromPrompt(params?.prompt ?? '', params?.targetPageName ?? 'From Prompt');
    else if (method === 'update_node') result = await updateNode({ nodeId: params?.nodeId, updates: params?.updates ?? {} });
    else if (method === 'attach_node') result = attachNode({ parentId: params?.parentId, nodeId: params?.nodeId, index: params?.index });
    else throw new Error(`Unknown method: ${method}`);

    figma.ui.postMessage({ type: 'MCP_RESPONSE', id, ok: true, result });
  } catch (e: any) {
    figma.ui.postMessage({ type: 'MCP_RESPONSE', id, ok: false, error: e?.message ?? String(e) });
  }
};
