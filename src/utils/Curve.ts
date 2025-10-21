
export type NodeType = "move" | "line" | "curve" | null;

export class CurveNode {
    main_node: SVGSVGElement;
    type: NodeType;
    x: number;
    y: number;
    nextOnCurve: CurveNode | null;
    lastOnCurve: CurveNode | null;
    control1: CurveNode | null = null;
    control2: CurveNode | null = null;
    smooth: boolean = false;
    end_node: boolean = false;
    start_node: boolean = false;
    control_mode: Number = 2; // 0 不同步手柄 | 1 同步方向 | 2 同步方向和长度
    synmove_mode: Number = 1; // 0 不使手柄与主节点一起移动 | 1 相对
    // 如果是主节点，则传入时暂无控制点，必须附带前继点，不会附带后继点
    // 如果是控制点，传入时必须附带后继点，即其对应主节点
    // 主节点必然先于控制点创建

    nextCurve: SVGSVGElement | null = null;
    control1_conn: SVGSVGElement | null = null;
    control2_conn: SVGSVGElement | null = null;

    constructor(params: {
        main_node: SVGSVGElement;
        type: NodeType;
        x: number;
        y: number;
        nextOnCurve: CurveNode | null;
        lastOnCurve: CurveNode | null;
    }) {
        this.main_node = params.main_node;
        this.type = params.type;
        this.x = params.x;
        this.y = params.y;
        this.lastOnCurve = params.lastOnCurve;
        this.nextOnCurve = params.nextOnCurve;
    }

    // 移动一个手柄时同步另一个
    set_both_control(params: {
        one_control: SVGSVGElement;
        control_mode: Number; // 如果为 2 则覆盖本地设置
    }) {

        let other_control: CurveNode | null = (this.control1?.main_node === params.one_control) ? this.control2 : this.control1;
        let one_control_n: CurveNode | null = CurveManager.getInstance().find_node_by_curve({ main_node: params.one_control });
        if(other_control === null || one_control_n === null)
            return;

        const t_match_1 = one_control_n.main_node.style.transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
        const t_match_2 = this.main_node.style.transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);

        if(params.control_mode === 2 || this.control_mode === 2) {
            other_control.x = 2 * this.x - one_control_n.x, other_control.y = 2 * this.y - one_control_n.y;
            other_control.main_node.style.transform = `translate(${2 * parseFloat(t_match_2![1]) - parseFloat(t_match_1![1])}px, ${2 * parseFloat(t_match_2![2]) - parseFloat(t_match_1![2])}px)`;
        } else if(this.control_mode === 1) {

        }
    }

    // 主节点移动时，进行手柄同步等相关设置
    move_together(params: {
        dx: number;
        dy: number;
        logic_dx: number;
        logic_dy: number;
        synmove_mode: Number; // 为 1 则覆盖本地设置
    }) {
        if(this.synmove_mode === 0 && params.synmove_mode === 0)
            return;
        if(this.control1 !== null) {
            const t_match = this.control1.main_node.style.transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
            this.control1.main_node.style.transform = `translate(${parseFloat(t_match![1]) + params.dx}px, ${parseFloat(t_match![2]) + params.dy}px)`;
            this.control1.x += params.logic_dx;
            this.control1.y += params.logic_dy;
        }

        if(this.control2 !== null) {
            const t_match = this.control2.main_node.style.transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
            this.control2.main_node.style.transform = `translate(${parseFloat(t_match![1]) + params.dx}px, ${parseFloat(t_match![2]) + params.dy}px)`;
            this.control2.x += params.logic_dx;
            this.control2.y += params.logic_dy;
        }
    }

    move_together_selected(params: {
        dx: number;
        dy: number;
        logic_dx: number;
        logic_dy: number;
        node_list: Set<SVGSVGElement>;
    }) {
        for(const node of params.node_list) {
            const node_n = CurveManager.getInstance().find_node_by_curve({ main_node: node });
            node_n!.move_together({ dx: params.dx, dy: params.dy, logic_dx: params.logic_dx, logic_dy: params.logic_dy, synmove_mode: 0 });
            node_n!.x += params.logic_dx, node_n!.y += params.logic_dy;
            const t_match = node.style.transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
            node.style.transform = `translate(${parseFloat(t_match![1]) + params.dx}px, ${parseFloat(t_match![2]) + params.dy}px)`;
        }
    }

    update_svg_curve(container: HTMLElement, scale: number) {
        if(this.control1 !== null) {
            // const t_match_1 = get_transform_xy(this.main_node.style.transform), t_match_2 = get_transform_xy(this.control1.main_node.style.transform);
            // const x1 = t_match_1!["x"] + parseFloat(this.main_node.dataset.size!), y1 = t_match_1!["y"] + parseFloat(this.main_node.dataset.size!), x2 = t_match_2!["x"] + parseFloat(this.control1.main_node.dataset.size!), y2 = t_match_2!["y"] + parseFloat(this.control1.main_node.dataset.size!);

            let x1 = this.x, y1 = this.y;
            let x2 = this.control1.x, y2 = this.control1.y;

            x1 *= scale, y1 *= scale;
            x2 *= scale, y2 *= scale;

            if(this.control1_conn === null) {
                this.control1_conn = createLineSVG([x1, y1], [x2, y2], 0.5, "rgba(0, 0, 255, 0.4)", container);
            } else {
                this.control1_conn.firstElementChild!.setAttribute("x1", x1.toString());
                this.control1_conn.firstElementChild!.setAttribute("y1", y1.toString());
                this.control1_conn.firstElementChild!.setAttribute("x2", x2.toString());
                this.control1_conn.firstElementChild!.setAttribute("y2", y2.toString());
            }
        }

        if(this.control2 !== null) {
            // const t_match_1 = get_transform_xy(this.main_node.style.transform), t_match_2 = get_transform_xy(this.control2.main_node.style.transform);
            // const x1 = t_match_1!["x"] + parseFloat(this.main_node.dataset.size!), y1 = t_match_1!["y"] + parseFloat(this.main_node.dataset.size!), x2 = t_match_2!["x"] + parseFloat(this.control2.main_node.dataset.size!), y2 = t_match_2!["y"] + parseFloat(this.control2.main_node.dataset.size!);

            let x1 = this.x, y1 = this.y;
            let x2 = this.control2.x, y2 = this.control2.y;

            x1 *= scale, y1 *= scale;
            x2 *= scale, y2 *= scale;

            if(this.control2_conn === null) {
                this.control2_conn = createLineSVG([x1, y1], [x2, y2], 0.5, "rgba(255, 0, 0, 0.4)", container);
            } else {
                this.control2_conn.firstElementChild!.setAttribute("x1", x1.toString());
                this.control2_conn.firstElementChild!.setAttribute("y1", y1.toString());
                this.control2_conn.firstElementChild!.setAttribute("x2", x2.toString());
                this.control2_conn.firstElementChild!.setAttribute("y2", y2.toString());
            }
        }

        if(this.nextOnCurve !== null) {

            let p0_x = this.x, p0_y = this.y;
            let p1_x = (this.control1?.x ?? p0_x), p1_y = (this.control1?.y ?? p0_y);
            let p3_x = this.nextOnCurve.x, p3_y = this.nextOnCurve.y;
            let p2_x = (this.nextOnCurve.control2?.x ?? p3_x), p2_y = this.nextOnCurve.control2?.y ?? p3_y;

            p0_x *= scale, p0_y *= scale;
            p1_x *= scale, p1_y *= scale;
            p2_x *= scale, p2_y *= scale;
            p3_x *= scale, p3_y *= scale;

            if(this.nextCurve === null) {
                this.nextCurve = createBezierSVG([p0_x, p0_y], [p1_x, p1_y], [p2_x, p2_y], [p3_x, p3_y], 1, "black", container);
            } else {
                const path = this.nextCurve.querySelector("path");
                if(path) {
                    const d = `M ${p0_x},${p0_y} C ${p1_x},${p1_y} ${p2_x},${p2_y} ${p3_x},${p3_y}`;
                    path.setAttribute("d", d);
                }
            }
        }
        
        let temp_start = CurveManager.getInstance().findCurveByDom(this.main_node);
        if(this.nextOnCurve === null && temp_start?.closed && temp_start.startNode !== this) {
            let p0_x = this.x, p0_y = this.y;
            let p1_x = (this.control1?.x ?? p0_x), p1_y = (this.control1?.y ?? p0_y);
            let p3_x = temp_start.startNode!.x, p3_y = temp_start.startNode!.y;
            let p2_x = (temp_start.startNode!.control2?.x ?? p3_x), p2_y = temp_start.startNode!.control2?.y ?? p3_y;

            p0_x *= scale, p0_y *= scale;
            p1_x *= scale, p1_y *= scale;
            p2_x *= scale, p2_y *= scale;
            p3_x *= scale, p3_y *= scale;

            if(this.nextCurve === null) {
                this.nextCurve = createBezierSVG([p0_x, p0_y], [p1_x, p1_y], [p2_x, p2_y], [p3_x, p3_y], 1, "black", container);
            } else {
                const path = this.nextCurve.querySelector("path");
                if(path) {
                    const d = `M ${p0_x},${p0_y} C ${p1_x},${p1_y} ${p2_x},${p2_y} ${p3_x},${p3_y}`;
                    path.setAttribute("d", d);
                }
            }
        }

        if(this.lastOnCurve !== null) {

            let p0_x = this.lastOnCurve.x, p0_y = this.lastOnCurve.y;
            let p1_x = (this.lastOnCurve.control1?.x ?? p0_x), p1_y = (this.lastOnCurve.control1?.y ?? p0_y);
            let p3_x = this.x, p3_y = this.y;
            let p2_x = (this.control2?.x ?? p3_x), p2_y = this.control2?.y ?? p3_y;

            p0_x *= scale, p0_y *= scale;
            p1_x *= scale, p1_y *= scale;
            p2_x *= scale, p2_y *= scale;
            p3_x *= scale, p3_y *= scale;
            

            if(this.lastOnCurve.nextCurve === null) {
                this.lastOnCurve.nextCurve = createBezierSVG([p0_x, p0_y], [p1_x, p1_y], [p2_x, p2_y], [p3_x, p3_y], 1, "black", container);
            } else {
                const path = this.lastOnCurve.nextCurve.querySelector("path");
                if(path) {
                    const d = `M ${p0_x},${p0_y} C ${p1_x},${p1_y} ${p2_x},${p2_y} ${p3_x},${p3_y}`;
                    path.setAttribute("d", d);
                }
            }
        }

        if(this.lastOnCurve === null && temp_start?.closed && temp_start.endNode !== null && temp_start.endNode !== this) {
            // let p3_x = this.x, p3_y = this.y;
            // let p2_x = (this.control2?.x ?? p3_x), p2_y = (this.control2?.y ?? p3_y);
            // let p0_x = temp_start.endNode!.x, p0_y = temp_start.endNode!.y;
            // let p1_x = (temp_start.endNode!.control1?.x ?? p0_x), p1_y = temp_start.endNode!.control1?.y ?? p0_y;

            // p0_x *= scale, p0_y *= scale;
            // p1_x *= scale, p1_y *= scale;
            // p2_x *= scale, p2_y *= scale;
            // p3_x *= scale, p3_y *= scale;

            // if(this.nextCurve === null) {
            //     this.nextCurve = createBezierSVG([p0_x, p0_y], [p1_x, p1_y], [p2_x, p2_y], [p3_x, p3_y], 1, "black", container);
            // } else {
            //     const path = this.nextCurve.querySelector("path");
            //     if(path) {
            //         const d = `M ${p0_x},${p0_y} C ${p1_x},${p1_y} ${p2_x},${p2_y} ${p3_x},${p3_y}`;
            //         path.setAttribute("d", d);
            //     }
            // }

            temp_start.endNode.update_svg_curve(container, scale);
        }

        const curve_manager = CurveManager.getInstance();
        curve_manager.findCurveByDom(this.main_node)?.update_path(container);
    }
}

export class CurveNodeManager {
    startNode: CurveNode | null = null;
    endNode: CurveNode | null = null;
    id: string;
    class_id: string;
    path_d: string = "";
    curve: SVGSVGElement | null = null;
    closed: boolean = true;

    constructor(params: {
        id: string;
        class_id: string;
    }) {
        this.id = params.id;
        this.class_id = params.class_id;
    }

    private domMap: Map<SVGSVGElement, CurveNode> = new Map();

    addNode(params: {
        main_node: SVGSVGElement;
        type: NodeType;
        x: number;
        y: number;
        nextOnCurve: CurveNode | null;
        lastOnCurve: CurveNode | null;
    }): CurveNode | null {
        if(params.type === null) {
            if(params.nextOnCurve === null)
                return null;
            const node = new CurveNode({
                main_node: params.main_node,
                type: params.type,
                x: params.x,
                y: params.y,
                nextOnCurve: params.nextOnCurve,
                lastOnCurve: null,
            });

            if(node.nextOnCurve!.control1 === null)
                node.nextOnCurve!.control1 = node;
            else
                node.nextOnCurve!.control2 = node;
            this.domMap.set(node.main_node, node);
        } else {
            let last: CurveNode | null = params.lastOnCurve;
            // 如果 last 为 null，则自动找到链表尾部作为前继节点
            let end_flag = false;
            if (!last && this.startNode) {
                end_flag = true;
                last = this.startNode;
                while (last.nextOnCurve) {
                    last = last.nextOnCurve;
                }
            }

            if(params.lastOnCurve?.nextOnCurve === null)
                end_flag = true;

            const node = new CurveNode({
                main_node: params.main_node,
                type: params.type,
                x: params.x,
                y: params.y,
                nextOnCurve: null,
                lastOnCurve: last,
            });

            // 调整链表关系
            if (last) {
                node.nextOnCurve = last.nextOnCurve; // 新节点接在 last 后
                last.nextOnCurve = node;
                if (node.nextOnCurve) {
                    node.nextOnCurve.lastOnCurve = node;
                }
            } else {
                // 链表为空，新节点成为 startNode
                this.startNode = node;
            }

            this.domMap.set(node.main_node, node);
            if(end_flag)
                this.endNode = node;
            return node;
        }

        
        return null;
    }

    /**
     * 根据 DOM 查找节点
     */
    findByDom(main_node: SVGSVGElement): CurveNode | null {
        return this.domMap.get(main_node) ?? null;
    }

    /**
     * 删除 on-curve 节点
     */
    removeNodeByDom(main_node: SVGSVGElement): boolean {
        const nodeToRemove = this.domMap.get(main_node);
        if (!nodeToRemove || nodeToRemove.type === null) return false;

        const prev = nodeToRemove.lastOnCurve;
        const next = nodeToRemove.nextOnCurve;

        if (prev) prev.nextOnCurve = next;
        if (next) next.lastOnCurve = prev;

        if (nodeToRemove === this.startNode) {
            this.startNode = next;
        }

        if (nodeToRemove.main_node) {
            this.domMap.delete(nodeToRemove.main_node);
        }

        return true;
    }

    update_path(container: HTMLElement) {
        this.path_d = "";
        let this_node = this.startNode;
        while(this_node != null && this_node.nextCurve != null) {
            let one_path_d = this_node.nextCurve.querySelector("path")!.getAttribute("d")!;
            if(this_node !== this.startNode)
                one_path_d = removeLeadingM(one_path_d);
            this_node.nextCurve.style.contentVisibility = "hidden";
            this.path_d += one_path_d;
            this.path_d += " ";
            this_node = this_node.nextOnCurve;
        }

        if(this.curve === null) {
            this.curve = createPathSVG(this.path_d, 1, "black", true, "rgba(127,127,127,0.5)", container);
        } else {
            const path = this.curve.querySelector("path");
            if(path) {
                path.setAttribute("d", this.path_d);
            }
        }
    }

    save() {
        if(this.startNode === null)
            return;
        let res: { cl: string; num: { num_x: number; num_y: number }[] }[] = [];
        res.push({ cl: "M", num: [{ num_x: this.startNode.x, num_y: this.startNode.y }] });
        let this_node: CurveNode | null = this.startNode.nextOnCurve;
        while(this_node !== null) {
            
        }
    }
}

// ---------------------- 单例 CurveManager ----------------------
export class CurveManager {
    private static _instance: CurveManager | null = null;
    private curves: CurveNodeManager[] = [];
    idCounter = 0;

    private constructor() {} // 私有化构造函数

    private domMap: Map<SVGSVGElement, CurveNodeManager> = new Map();

    findCurveByDom(main_node: SVGSVGElement): CurveNodeManager | null {
        return this.domMap.get(main_node) ?? null;
    }


    static getInstance(): CurveManager {
        if (!CurveManager._instance) {
            CurveManager._instance = new CurveManager();
        }
        return CurveManager._instance;
    }

    addCurve(class_id: string): CurveNodeManager {
        const curve = new CurveNodeManager({
            id: (this.idCounter++).toString(),
            class_id,
        });
        this.curves.push(curve);
        return curve;
    }

    removeCurve(id: string): boolean {
        const index = this.curves.findIndex(m => m.id === id);
        if (index !== -1) {
            this.curves.splice(index, 1);
            return true;
        }
        return false;
    }

    getCurves(): CurveNodeManager[] {
        return this.curves;
    }

    getCurveById(id: string): CurveNodeManager | undefined {
        return this.curves.find(m => m.id === id);
    }

    // 自动加入节点
    add_node_by_curve(params: {
        main_node: SVGSVGElement;
        type: NodeType;
        x: number;
        y: number;
        nextOnCurve: SVGSVGElement | null;
        lastOnCurve: SVGSVGElement | null;
        this_curve: CurveNodeManager;
    }): CurveNode | null {

        this.domMap.set(params.main_node, params.this_curve);
        return params.this_curve.addNode({ main_node: params.main_node, type: params.type, x: params.x, y: params.y, nextOnCurve: params.nextOnCurve !== null ? params.this_curve.findByDom(params.nextOnCurve) : null, lastOnCurve: params.lastOnCurve !== null ? params.this_curve.findByDom(params.lastOnCurve) : null });

    }

    find_node_by_curve(params: {
        main_node: SVGSVGElement;
    }): CurveNode | null {
        return this.findCurveByDom(params.main_node)?.findByDom(params.main_node) ?? null;
    }
}




export function get_transform_xy( transform: string | undefined ): { x: number, y: number } | undefined {
    // 正则匹配 translate(xpx, ypx)
    if(transform === undefined)
        return undefined;
    const regex = /translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/;
    const match = transform.match(regex);

    if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        return { x, y };
    } else {
        return undefined;
    }
}

export function createLineSVG(
    start: [number, number],
    end: [number, number],
    strokeWidth: number,
    strokeColor: string,
    container: HTMLElement,
): SVGSVGElement {
    const [x1, y1] = start;
    const [x2, y2] = end;

    // 创建SVG命名空间元素
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    // 设置SVG宽高，保证能够覆盖直线
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.pointerEvents = "none"; // 避免遮挡交互
    svg.setAttribute("width", `${window.screen.width}px`);
    svg.setAttribute("height", `${window.screen.height}px`);
    svg.style.zIndex = "50";
    // svg.style.transform = `translate(${-offset[0]}px, ${-offset[1]}px)`;
    svg.style.overflow = "visible";


    // 创建直线
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1.toString());
    line.setAttribute("y1", y1.toString());
    line.setAttribute("x2", x2.toString());
    line.setAttribute("y2", y2.toString());
    line.setAttribute("stroke-width", strokeWidth.toString());
    line.setAttribute("stroke", strokeColor);

    // 挂载线到svg
    svg.appendChild(line);
    // 挂载svg到传入容器
    container.appendChild(svg);

    return svg;
}

export function createBezierSVG(
    p0: [number, number],  // 起点
    p1: [number, number],  // 控制点1
    p2: [number, number],  // 控制点2
    p3: [number, number],  // 终点
    strokeWidth: number,
    strokeColor: string,
    container: HTMLElement,
): SVGSVGElement {
    const [x0, y0] = p0;
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    // 设置SVG宽高，保证能够覆盖整个容器
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.pointerEvents = "none";
    svg.setAttribute("width", `${window.screen.width}px`);
    svg.setAttribute("height", `${window.screen.height}px`);
    svg.style.zIndex = "50";
    svg.style.overflow = "visible";

    // 创建贝塞尔曲线路径
    const path = document.createElementNS(svgNS, "path");
    const d = `M ${x0},${y0} C ${x1},${y1} ${x2},${y2} ${x3},${y3}`;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", strokeColor);
    path.setAttribute("stroke-width", strokeWidth.toString());

    // 挂载曲线到svg
    svg.appendChild(path);
    container.appendChild(svg);

    return svg;
}

//just test
//yeah

export function createPathSVG(
    d: string,                   // 路径描述字符串
    strokeWidth: number,         // 线宽
    strokeColor: string,         // 描边颜色
    fill: boolean,               // 是否填充
    fillColor: string,           // 填充颜色
    container: HTMLElement,      // 要挂载的容器
): SVGSVGElement {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    // 布局样式
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "40";
    svg.style.overflow = "visible";

    // 尺寸覆盖全屏（可根据需要调整）
    svg.setAttribute("width", `${window.screen.width}px`);
    svg.setAttribute("height", `${window.screen.height}px`);

    // 创建 path
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);

    // 设置填充
    if (fill) {
        path.setAttribute("fill", fillColor);
    } else {
        path.setAttribute("fill", "none");
    }

    path.setAttribute("stroke", strokeColor);
    path.setAttribute("stroke-width", strokeWidth.toString());

    // 组装与挂载
    svg.appendChild(path);
    container.appendChild(svg);

    return svg;
}

/**
 * 去掉路径字符串开头的 M x y，支持科学计数法
 * @param d 路径字符串
 */
export function removeLeadingM(d: string): string {
    const regex = /^\s*[Mm]\s*(-?\d+(\.\d+)?([eE][-+]?\d+)?)[ ,]+(-?\d+(\.\d+)?([eE][-+]?\d+)?)/;
    return d.replace(regex, '');
}