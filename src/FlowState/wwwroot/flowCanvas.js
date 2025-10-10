
export function getBoundingClientRect(el) {
    return el ? el.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
};
