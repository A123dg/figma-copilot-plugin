/// <reference types="@figma/plugin-typings" />

export const getDocument = () => {
    return figma.root;
};

export const getNodeById = (id: string) => {
    return figma.getNodeById(id);
};

export const createRectangle = (x: number, y: number, width: number, height: number) => {
    const rectangle = figma.createRectangle();
    rectangle.x = x;
    rectangle.y = y;
    rectangle.resize(width, height);
    figma.currentPage.appendChild(rectangle);
    return rectangle;
};

export const updateNodeProperties = (id: string, properties: Partial<SceneNode>) => {
    const node = figma.getNodeById(id) as SceneNode | null;
    if (!node) throw new Error('Node not found');
    Object.assign(node, properties as any);
    return node;
};

export const deleteNode = (id: string) => {
    const node = figma.getNodeById(id) as BaseNode | null;
    if (!node) return;
    node.remove();
};