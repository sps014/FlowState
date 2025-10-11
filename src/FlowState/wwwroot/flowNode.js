export function moveNode(nodeEl,x,y)
{
    nodeEl.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
}

export function getTransformPosition(nodeEl)
{
    const style = window.getComputedStyle(nodeEl);
    const matrix = new DOMMatrixReadOnly(style.transform);

    return { x: matrix.m41, y: matrix.m42 }; 
}