<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { createBezierSVG, CurveManager, CurveNodeManager, path_stroke_color, path_fill_color, control_ahead_color, control_back_color } from '../utils/Curve';

const lock_guideline_button = ref<HTMLElement | null>(null);
const lock_guideline_icon = ref<HTMLElement | null>(null);
const lock_guideline_icon_unlocked = ref<HTMLElement | null>(null);
const ruler_horizontal = ref<HTMLElement | null>(null);
const ruler_vertical = ref<HTMLElement | null>(null);
const main_canvas = ref<HTMLElement | null>(null);
const main_canvas_large = ref<HTMLElement | null>(null);

let canvas_size_width: number = 1000;
let canvas_size_height: number = 1000;
// 画布的逻辑像素大小
let ruler_size: number = 20;
// 标尺的实际像素宽度

let dragging: boolean = false;
// 是否正在拖动画布
let drag_start = { x: 0, y: 0 };
// 本次拖动的起点

let painting_handle: boolean = false;
// 是否正在绘制节点延伸出的手柄
let painting_handle_start = { x: 0, y: 0 };
// 拖动手柄的起点，即节点的位置

let new_curve_handle: SVGSVGElement | null = null;
// 临时存储正在拖动新创建手柄的引用

let dragging_node_b: boolean = false;
let dragging_node_b_ready: boolean = false;
let dragging_node: SVGSVGElement | null = null;
// 临时存储正在拖动已创建节点或手柄点的引用
let dragging_node_start = { x: 0, y: 0 };

let last_on_curve_node: SVGSVGElement | null = null;
// 存储当前路径的上一个主要节点，作为加入新节点的索引之一

let scale_min: number = 0.02;
let scale_max: number = 100;
let scale: number = 0.4;

let offset = { x: 0, y: 0};
let offset_start = { x: 0, y: 0};

let guideline_lock: boolean = false;

// type edit_mode = 
//     | "select"
//     | "node"
//     | "pen";

// const emit = defineEmits<{
//     (e: 'add_point', point: { x: number; y: number }): void
//     (e: 'delete_point', point: { x: number; y: number }): void
// }>();

let curve_manager: CurveManager;
let current_curve: CurveNodeManager | null = null;

let node_selecting: Set<SVGSVGElement> = new Set();

let new_selected_temp: SVGSVGElement | null = null;

let preview_curve: SVGSVGElement | null = null;
let preview_curve_1: SVGSVGElement | null = null;
let preview_color = "rgba(0, 255, 0, 0.6)";

let main_node_shape: NodeShape = "square-blue-light";
let control_node_shape: NodeShape = "circle-blue-light";
let main_node_shape_selected: NodeShape = "square-orange-light";

let current_ch = "a";

let node_id_i = 0;
let path_id_i = 0;
let component_id_i = 0;

type NodeShape =
    | "circle-blue-light"   | "square-blue-light"
    | "circle-blue-dark"    | "square-blue-dark"
    | "circle-green-light"  | "square-green-light"
    | "circle-green-dark"   | "square-green-dark"
    | "circle-orange-light" | "square-orange-light"
    | "circle-orange-dark"  | "square-orange-dark"
    | "circle-red-light"    | "square-red-light"
    | "circle-red-dark"     | "square-red-dark"
    | "circle-purple-light" | "square-purple-light"
    | "circle-purple-dark"  | "square-purple-dark"
    | "circle-teal-light"   | "square-teal-light"
    | "circle-teal-dark"    | "square-teal-dark"
    | "circle-pink-light"   | "square-pink-light"
    | "circle-pink-dark"    | "square-pink-dark"
    | "circle-coral-light"  | "square-coral-light"
    | "circle-coral-dark"   | "square-coral-dark"
    | "circle-yellow-light" | "square-yellow-light"
    | "circle-yellow-dark"  | "square-yellow-dark"
    | "circle-lime-light"   | "square-lime-light"
    | "circle-lime-dark"    | "square-lime-dark"
    | "circle-indigo-light" | "square-indigo-light"
    | "circle-indigo-dark"  | "square-indigo-dark"
    | "circle-brown-light"  | "square-brown-light"
    | "circle-brown-dark"   | "square-brown-dark"
    | "circle-cyan-light"   | "square-cyan-light"
    | "circle-cyan-dark"    | "square-cyan-dark"
    | "circle-rose-light"   | "square-rose-light"
    | "circle-rose-dark"    | "square-rose-dark";

const presetMap: Record<NodeShape, { kind: "circle" | "rect"; stroke: string; fill: string }> = {
    // 蓝色系
    "circle-blue-light": { kind: "circle", stroke: "rgba(74,144,226,0.3)", fill: "rgba(74,144,226,0.3)" },
    "square-blue-light": { kind: "rect", stroke: "rgba(74,144,226,1)", fill: "rgba(74,144,226,0.3)" },
    "circle-blue-dark": { kind: "circle", stroke: "rgba(44,62,80,0.3)", fill: "rgba(44,62,80,0.3)" },
    "square-blue-dark": { kind: "rect", stroke: "rgba(44,62,80,1)", fill: "rgba(44,62,80,0.3)" },

    // 绿色系
    "circle-green-light": { kind: "circle", stroke: "rgba(39,174,96,0.3)", fill: "rgba(39,174,96,0.3)" },
    "square-green-light": { kind: "rect", stroke: "rgba(39,174,96,1)", fill: "rgba(39,174,96,0.3)" },
    "circle-green-dark": { kind: "circle", stroke: "rgba(20,90,50,0.3)", fill: "rgba(20,90,50,0.3)" },
    "square-green-dark": { kind: "rect", stroke: "rgba(20,90,50,1)", fill: "rgba(20,90,50,0.3)" },

    // 橙色系
    "circle-orange-light": { kind: "circle", stroke: "rgba(245,166,35,0.3)", fill: "rgba(245,166,35,0.3)" },
    "square-orange-light": { kind: "rect", stroke: "rgba(245,166,35,1)", fill: "rgba(245,166,35,0.3)" },
    "circle-orange-dark": { kind: "circle", stroke: "rgba(211,84,0,0.3)", fill: "rgba(211,84,0,0.3)" },
    "square-orange-dark": { kind: "rect", stroke: "rgba(211,84,0,1)", fill: "rgba(211,84,0,0.3)" },

    // 红色系
    "circle-red-light": { kind: "circle", stroke: "rgba(231,76,60,0.3)", fill: "rgba(231,76,60,0.3)" },
    "square-red-light": { kind: "rect", stroke: "rgba(231,76,60,1)", fill: "rgba(231,76,60,0.3)" },
    "circle-red-dark": { kind: "circle", stroke: "rgba(146,43,33,0.3)", fill: "rgba(146,43,33,0.3)" },
    "square-red-dark": { kind: "rect", stroke: "rgba(146,43,33,1)", fill: "rgba(146,43,33,0.3)" },

    // 紫色系
    "circle-purple-light": { kind: "circle", stroke: "rgba(155,89,182,0.3)", fill: "rgba(155,89,182,0.3)" },
    "square-purple-light": { kind: "rect", stroke: "rgba(155,89,182,1)", fill: "rgba(155,89,182,0.3)" },
    "circle-purple-dark": { kind: "circle", stroke: "rgba(91,44,111,0.3)", fill: "rgba(91,44,111,0.3)" },
    "square-purple-dark": { kind: "rect", stroke: "rgba(91,44,111,1)", fill: "rgba(91,44,111,0.3)" },

    // 青色系
    "circle-teal-light": { kind: "circle", stroke: "rgba(26,188,156,0.3)", fill: "rgba(26,188,156,0.3)" },
    "square-teal-light": { kind: "rect", stroke: "rgba(26,188,156,1)", fill: "rgba(26,188,156,0.3)" },
    "circle-teal-dark": { kind: "circle", stroke: "rgba(17,122,101,0.3)", fill: "rgba(17,122,101,0.3)" },
    "square-teal-dark": { kind: "rect", stroke: "rgba(17,122,101,1)", fill: "rgba(17,122,101,0.3)" },

    // 粉色系
    "circle-pink-light": { kind: "circle", stroke: "rgba(236,112,99,0.3)", fill: "rgba(236,112,99,0.3)" },
    "square-pink-light": { kind: "rect", stroke: "rgba(236,112,99,1)", fill: "rgba(236,112,99,0.3)" },
    "circle-pink-dark": { kind: "circle", stroke: "rgba(146,43,33,0.3)", fill: "rgba(146,43,33,0.3)" },
    "square-pink-dark": { kind: "rect", stroke: "rgba(146,43,33,1)", fill: "rgba(146,43,33,0.3)" },

    // 珊瑚色系
    "circle-coral-light": { kind: "circle", stroke: "rgba(230,126,34,0.3)", fill: "rgba(230,126,34,0.3)" },
    "square-coral-light": { kind: "rect", stroke: "rgba(230,126,34,1)", fill: "rgba(230,126,34,0.3)" },
    "circle-coral-dark": { kind: "circle", stroke: "rgba(186,74,0,0.3)", fill: "rgba(186,74,0,0.3)" },
    "square-coral-dark": { kind: "rect", stroke: "rgba(186,74,0,1)", fill: "rgba(186,74,0,0.3)" },

    // 黄色系
    "circle-yellow-light": { kind: "circle", stroke: "rgba(241,196,15,0.3)", fill: "rgba(241,196,15,0.3)" },
    "square-yellow-light": { kind: "rect", stroke: "rgba(241,196,15,1)", fill: "rgba(241,196,15,0.3)" },
    "circle-yellow-dark": { kind: "circle", stroke: "rgba(183,149,11,0.3)", fill: "rgba(183,149,11,0.3)" },
    "square-yellow-dark": { kind: "rect", stroke: "rgba(183,149,11,1)", fill: "rgba(183,149,11,0.3)" },

    // 青柠色系
    "circle-lime-light": { kind: "circle", stroke: "rgba(163,228,215,0.3)", fill: "rgba(163,228,215,0.3)" },
    "square-lime-light": { kind: "rect", stroke: "rgba(163,228,215,1)", fill: "rgba(163,228,215,0.3)" },
    "circle-lime-dark": { kind: "circle", stroke: "rgba(39,174,96,0.3)", fill: "rgba(39,174,96,0.3)" },
    "square-lime-dark": { kind: "rect", stroke: "rgba(39,174,96,1)", fill: "rgba(39,174,96,0.3)" },

    // 靛蓝色系
    "circle-indigo-light": { kind: "circle", stroke: "rgba(93,109,126,0.3)", fill: "rgba(93,109,126,0.3)" },
    "square-indigo-light": { kind: "rect", stroke: "rgba(93,109,126,1)", fill: "rgba(93,109,126,0.3)" },
    "circle-indigo-dark": { kind: "circle", stroke: "rgba(44,62,80,0.3)", fill: "rgba(44,62,80,0.3)" },
    "square-indigo-dark": { kind: "rect", stroke: "rgba(44,62,80,1)", fill: "rgba(44,62,80,0.3)" },

    // 棕色系
    "circle-brown-light": { kind: "circle", stroke: "rgba(161,134,111,0.3)", fill: "rgba(161,134,111,0.3)" },
    "square-brown-light": { kind: "rect", stroke: "rgba(161,134,111,1)", fill: "rgba(161,134,111,0.3)" },
    "circle-brown-dark": { kind: "circle", stroke: "rgba(110,75,43,0.3)", fill: "rgba(110,75,43,0.3)" },
    "square-brown-dark": { kind: "rect", stroke: "rgba(110,75,43,1)", fill: "rgba(110,75,43,0.3)" },

    // 青色系
    "circle-cyan-light": { kind: "circle", stroke: "rgba(118,215,196,0.3)", fill: "rgba(118,215,196,0.3)" },
    "square-cyan-light": { kind: "rect", stroke: "rgba(118,215,196,1)", fill: "rgba(118,215,196,0.3)" },
    "circle-cyan-dark": { kind: "circle", stroke: "rgba(17,122,101,0.3)", fill: "rgba(17,122,101,0.3)" },
    "square-cyan-dark": { kind: "rect", stroke: "rgba(17,122,101,1)", fill: "rgba(17,122,101,0.3)" },

    // 玫瑰色系
    "circle-rose-light": { kind: "circle", stroke: "rgba(217,136,128,0.3)", fill: "rgba(217,136,128,0.3)" },
    "square-rose-light": { kind: "rect", stroke: "rgba(217,136,128,1)", fill: "rgba(217,136,128,0.3)" },
    "circle-rose-dark": { kind: "circle", stroke: "rgba(148,49,38,0.3)", fill: "rgba(148,49,38,0.3)" },
    "square-rose-dark": { kind: "rect", stroke: "rgba(148,49,38,1)", fill: "rgba(148,49,38,0.3)" },
};




// 在浏览器 localStorage 中存储画布缩放和拖动数据
function get_initial_settings()
{
    let new_scale = localStorage.getItem("ss_board_scale");
    if(new_scale != null && !isNaN(Number(new_scale)))
        scale = Number(new_scale);

    let new_offset_x = localStorage.getItem("ss_board_offset_x");
    if (new_offset_x != null && !isNaN(Number(new_offset_x))) {
        offset.x = Number(new_offset_x);
    } else {
        offset.x = (main_canvas_large.value!.getBoundingClientRect().width) / 2;
    }

    let new_offset_y = localStorage.getItem("ss_board_offset_y");
    if (new_offset_y != null && !isNaN(Number(new_offset_y))) {
        offset.y = Number(new_offset_y);
    } else {
        offset.y = (main_canvas_large.value!.getBoundingClientRect().height) / 2;
    }

    load_file();
}

function load_file() {
    (async () => {
        const result: string | null = await loadString("file.json");
        if(result !== null) {
            let obj = JSON.parse(result);
            canvas_size_width = obj["canvas_size_width"] ?? 1000;
            canvas_size_height = obj["canvas_size_height"] ?? 1000;
            // scale = obj["editor_scale"] ?? 1;
            // offset.x = obj["editor_offset_x"] ?? 0;
            // offset.y = obj["editor_offset_y"] ?? 0;
            Object.keys(obj["components"]).forEach(component_id => {
                let paths = obj["components"][component_id]["paths"];
                Object.keys(paths).forEach(path_id => {
                    let new_path: CurveNodeManager = CurveManager.getInstance().addCurve(path_id);
                    new_path.closed = paths[path_id]["fill"];
                    new_path.stroke_width = paths[path_id]["stroke_width"];
                    Object.keys(paths[path_id]["vertices"]).forEach(vertex_id => {
                        let vertex = paths[path_id]["vertices"][vertex_id];
                        let new_vertex = createNodeAt(vertex["x"], canvas_size_height - vertex["y"], main_canvas!.value!, "square-blue-light", "test_id", "vertex", 4, 1, 0);

                        let new_temp = curve_manager.add_node_by_curve({ main_node: new_vertex, type: "curve", x: vertex["x"], y: (canvas_size_height - vertex["y"]), nextOnCurve: null, lastOnCurve: last_on_curve_node, this_curve: new_path, node_id: String(node_id_i) });
                        node_id_i += 1;
                        last_on_curve_node = new_vertex;

                        if(vertex["control_1"]["active"]) {
                            new_curve_handle = createNodeAt(vertex["control_1"]["x"], canvas_size_height - vertex["control_1"]["y"], main_canvas!.value!, control_node_shape, "test_id", "vertex", 4, 1, 0);
                
                            curve_manager.add_node_by_curve({ main_node: new_curve_handle, type: null, x: vertex["control_1"]["x"], y: canvas_size_height - vertex["control_1"]["y"], nextOnCurve: last_on_curve_node, lastOnCurve: null, this_curve: new_path, node_id: String(node_id_i) });
                            node_id_i += 1;
                        }

                        if(vertex["control_2"]["active"]) {
                            new_curve_handle = createNodeAt(vertex["control_2"]["x"], canvas_size_height - vertex["control_2"]["y"], main_canvas!.value!, control_node_shape, "test_id", "vertex", 4, 1, 0);
                
                            curve_manager.add_node_by_curve({ main_node: new_curve_handle, type: null, x: vertex["control_2"]["x"], y: canvas_size_height - vertex["control_2"]["y"], nextOnCurve: last_on_curve_node, lastOnCurve: null, this_curve: new_path, node_id: String(node_id_i) });
                            node_id_i += 1;
                        }

                        new_temp?.update_svg_curve(main_canvas!.value!, scale);
                    });
                });
            });
        }

        reset_curve_drawing();
        update_canvas();
        update_ruler();
        update_node();
    })();
}

function save_file() {
    let file = {
        "canvas_size_width": canvas_size_width,
        "canvas_size_height": canvas_size_height,
        "family_name": "default",
        "basic_spacing": 1000,
        "editor_scale": scale,
        "editor_offset_x": offset.x,
        "editor_offset_y": offset.y,
        "editor_guideline_h": [
            500
        ],
        "editor_guideline_v": [
            500
        ],
        "editor_guideline_lock": false,
        "editor_edit_mode": "pen",
        "editor_cutting_board": [
            "a"
        ],
        "editor_fill_color": path_fill_color,
        "editor_stroke_color": path_stroke_color,
        "ch": {

        } as Record<string, any>,
        "components": {

        } as Record<string, any>
    };

    let component_id: string = "1";
    let ch = "a";
    file.ch[ch] = {
        "variant": {

        },
        "spacing": 1,
        "hooks_id": [

        ],
        "components": {

        },
        "editor_hide": false, "editor_lock": false
    };
    file.ch[ch].components[component_id] = {
        "component_id": "1",
        "transform": "none"
    };
    file.components[component_id] = {
        "paths": {

        } as Record<string, any>,
        "editor_hide": false, "editor_lock": false,
        "editor_selected": false,
        "components": [

        ]
    };
    let path_id_cnt = 0;
    for(let curve of curve_manager.getCurves()) {
        let path_id = String(path_id_cnt);
        path_id_cnt += 1;
        file.components[component_id].paths[path_id] = {
            "fill": curve.closed,
            "stroke_width": curve.stroke_width,
            "render_mode": "auto",
            "vertices": {

            },
            "editor_hide": false, "editor_lock": false,
            "editor_selected": false
        };
        let this_node = curve.startNode;
        while(this_node != null) {
            file.components[component_id].paths[path_id].vertices[this_node.node_id] = {
                "x": this_node.x,
                "y": canvas_size_height - this_node.y,
                "start": this_node === curve.startNode,
                "end": this_node === curve.endNode,
                "smooth": this_node.smooth,
                "editor_selected": false, ////
                "relate_last": this_node.node_id, "relate_next": this_node.node_id,
                "control_1": {
                    "active": this_node.control1 !== null,
                    "x": this_node.control1?.x ?? this_node.x,
                    "y": canvas_size_height - (this_node.control1?.y ?? this_node.y),
                },
                "control_2": {
                    "active": this_node.control2 !== null,
                    "x": this_node.control2?.x ?? this_node.x,
                    "y": canvas_size_height - (this_node.control2?.y ?? this_node.y),
                }
            };

            this_node = this_node.nextOnCurve;
        }
    }

    return JSON.stringify(file, null, 4);
}

function download_file(content: string, filename: string) {
    // 根据扩展名决定 MIME 类型
    const ext = filename.split('.')?.pop()?.toLowerCase() ?? "txt";
    let mimeType;

    if (ext === "json") {
        mimeType = "application/json;charset=utf-8";
        // 若 content 是对象，自动格式化
        if (typeof content === "object") {
            content = JSON.stringify(content, null, 4);
        }
    } else if (ext === "svg") {
        mimeType = "image/svg+xml;charset=utf-8";
    } else {
        mimeType = "application/octet-stream";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const DB_NAME = 'app_storage';
const STORE_NAME = 'store';

async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveString(key: string, value: string): Promise<void> {
    if (navigator.storage?.persist) await navigator.storage.persist();
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
}

async function loadString(key: string): Promise<string | null> {
    const db = await openDB();
    const result = await new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
}

// 切换辅助线锁定状态
function toggle_guideline_lock() {
    if(guideline_lock === false) {
        lock_guideline_icon.value!.style.visibility = "visible";
        lock_guideline_icon_unlocked.value!.style.visibility = "hidden";
    } else {
        lock_guideline_icon.value!.style.visibility = "hidden";
        lock_guideline_icon_unlocked.value!.style.visibility = "visible";
    }

    guideline_lock = !guideline_lock;
}

// 标尺刻度辅助函数
function getStepAndPrecision(scale: number) {
    const roughStep = 50 / scale;
    const steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    let step = steps[0];
    for (const s of steps) {
        if (s >= roughStep) {
            step = s;
            break;
        }
    }

    let precision = 0;
    if (step < 1) {
        precision = Math.ceil(-Math.log10(step));
    }
    return { step, precision };
}

// 分别更新重绘水平和垂直标尺
function update_ruler() {
    update_ruler_horizontal();
    update_ruler_vertical();
}

function update_ruler_horizontal() {
    const w = ruler_horizontal.value!.getBoundingClientRect().width;
    const h = ruler_horizontal.value!.getBoundingClientRect().height;

    ruler_horizontal.value!.replaceChildren(); // 清空原有的矢量刻度线


    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.display = "block";

    const { step, precision } = getStepAndPrecision(scale);
    const origin = offset.x * scale;

    for(let i = 0; ; i += 1) {
        let j = i / 10;
        const x = origin + j * scale * step;

        if(x > w + scale * step) {
            break;
        }

        if(x < 0 - scale * step) {
            continue;
        }

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(x));
        line.setAttribute("y1", String(h));
        line.setAttribute("x2", String(x));
        if(i % 10 == 0) {
            line.setAttribute("y2", "0");

            const text = document.createElementNS(svgNS, "text");
            text.textContent = `${(j * step).toFixed(precision)}`;
            text.setAttribute("x", String(x + 5));
            text.setAttribute("y", String(h / 3));
            text.setAttribute("font-size", "10px");
            text.setAttribute("fill", "#888");
            text.setAttribute("text-anchor", "right");
            text.setAttribute("dominant-baseline", "middle");
            
            svg.appendChild(text);
        } else if(i % 2 == 0) {
            line.setAttribute("y2", String(h / 2));
        } else {
            line.setAttribute("y2", String(h / 4 * 3));
        }
        line.setAttribute("stroke", "#888");
        line.setAttribute("stroke-width", "1");

        svg.appendChild(line);
    }

    for(let i = 0; ; i -= 1) {
    
        let j = i / 10;
        const x = origin + j * scale * step;

        if(x < 0 - scale * step) {
            break;
        }

        if(x > w + scale * step) {
            continue;
        }

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(x));
        line.setAttribute("y1", String(h));
        line.setAttribute("x2", String(x));
        if(i % 10 == 0) {
            line.setAttribute("y2", "0");

            const text = document.createElementNS(svgNS, "text");
            text.textContent = `${(j * step).toFixed(precision)}`;
            text.setAttribute("x", String(x + 5));
            text.setAttribute("y", String(h / 3));
            text.setAttribute("font-size", "10px");
            text.setAttribute("fill", "#888");
            text.setAttribute("text-anchor", "right");
            text.setAttribute("dominant-baseline", "middle");
            
            svg.appendChild(text);
        } else if(i % 2 == 0) {
            line.setAttribute("y2", String(h / 2));
        } else {
            line.setAttribute("y2", String(h / 4 * 3));
        }
        line.setAttribute("stroke", "#888");
        line.setAttribute("stroke-width", "1");

        svg.appendChild(line);
    }

    ruler_horizontal.value!.appendChild(svg);
    
}

function update_ruler_vertical() {
    const w = ruler_vertical.value!.getBoundingClientRect().width;
    const h = ruler_vertical.value!.getBoundingClientRect().height;

    ruler_vertical.value!.replaceChildren();

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.display = "block";

    const { step, precision } = getStepAndPrecision(scale);
    const origin = offset.y * scale;


    for(let i = 0; ; i += 1) {
        let j = i / 10;
        const x = origin + j * scale * step;

        if(x > h + scale * step) {
            break;
        }

        if(x < 0 - scale * step) {
            continue;
        }

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("y1", String(x));
        line.setAttribute("x1", String(w));
        line.setAttribute("y2", String(x));
        if(i % 10 == 0) {
            line.setAttribute("x2", "0");

            const cx = w / 3;
            const cy = x - 5;

            const text = document.createElementNS(svgNS, "text");
            text.textContent = `${(canvas_size_height - j * step).toFixed(precision)}`;
            text.setAttribute("x", String(cx));
            text.setAttribute("y", String(cy));
            text.setAttribute("font-size", "10px");
            text.setAttribute("fill", "#888");
            text.setAttribute("text-anchor", "right");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
            
            svg.appendChild(text);
        } else if(i % 2 == 0) {
            line.setAttribute("x2", String(w / 2));
        } else {
            line.setAttribute("x2", String(w / 4 * 3));
        }
        line.setAttribute("stroke", "#888");
        line.setAttribute("stroke-width", "1");

        svg.appendChild(line);
    }

    for(let i = 0; ; i -= 1) {
        let j = i / 10;
        const x = origin + j * scale * step;

        if(x < 0 - scale * step) {
            break;
        }

        if(x > h + scale * step) {
            continue;
        }

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("y1", String(x));
        line.setAttribute("x1", String(w));
        line.setAttribute("y2", String(x));
        if(i % 10 == 0) {
            line.setAttribute("x2", "0");

            const cx = w / 3;
            const cy = x - 5;

            const text = document.createElementNS(svgNS, "text");
            text.textContent = `${(canvas_size_height - j * step).toFixed(precision)}`;
            text.setAttribute("x", String(cx));
            text.setAttribute("y", String(cy));
            text.setAttribute("font-size", "10px");
            text.setAttribute("fill", "#888");
            text.setAttribute("text-anchor", "right");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
            
            svg.appendChild(text);
        } else if(i % 2 == 0) {
            line.setAttribute("x2", String(w / 2));
        } else {
            line.setAttribute("x2", String(w / 4 * 3));
        }
        line.setAttribute("stroke", "#888");
        line.setAttribute("stroke-width", "1");

        svg.appendChild(line);
    }

    ruler_vertical.value!.appendChild(svg);
}

// 重绘主画布
function update_canvas() {
    const left = ruler_size + offset.x * scale;
    const top = ruler_size + offset.y * scale;

    // main_canvas.value!.style.left = `${left}px`;
    // main_canvas.value!.style.top = `${top}px`;

    main_canvas.value!.style.transform = `translate(${left}px, ${top}px)`;

    main_canvas.value!.style.width = `${canvas_size_width * scale}px`;
    main_canvas.value!.style.height = `${canvas_size_height * scale}px`;
}

function update_node() {
    let curves = curve_manager.getCurves();
    for(const curve of curves) {
        let start_node = curve.startNode;
        while(start_node !== null) {

            start_node.main_node.style.transform =
                `translate(${start_node.x * scale - Number(start_node.main_node.dataset.size)}px, 
                           ${start_node.y * scale - Number(start_node.main_node.dataset.size)}px)`;

            if (start_node.control1 != null) {
                start_node.control1.main_node.style.transform =
                    `translate(${start_node.control1.x * scale - Number(start_node.control1.main_node.dataset.size)}px, 
                               ${start_node.control1.y * scale - Number(start_node.control1.main_node.dataset.size)}px)`;
            }

            if (start_node.control2 != null) {
                start_node.control2.main_node.style.transform =
                    `translate(${start_node.control2.x * scale - Number(start_node.control2.main_node.dataset.size)}px, 
                               ${start_node.control2.y * scale - Number(start_node.control2.main_node.dataset.size)}px)`;
            }

            start_node.update_svg_curve(main_canvas!.value!, scale);

            start_node = start_node.nextOnCurve;
        }
    }
}

function update_preview(e: WheelEvent | MouseEvent) {
    const rect = main_canvas!.value!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if((e.buttons & 1) === 0 && last_on_curve_node !== null) {
        let p0_x = x, p0_y = y;
        let p1_x = p0_x, p1_y = p0_y;
        let p3_x = curve_manager.find_node_by_curve({ main_node: last_on_curve_node })!.x, p3_y = curve_manager.find_node_by_curve({ main_node: last_on_curve_node })!.y;
        let p2_x = curve_manager.find_node_by_curve({ main_node: last_on_curve_node })!.control1?.x ?? p3_x, p2_y = curve_manager.find_node_by_curve({ main_node: last_on_curve_node })!.control1?.y ?? p3_y;

        p2_x *= scale, p2_y *= scale;
        p3_x *= scale, p3_y *= scale;

        let _p3_x = curve_manager.findCurveByDom(last_on_curve_node)!.startNode!.x, _p3_y = curve_manager.findCurveByDom(last_on_curve_node)!.startNode!.y;
        let _p2_x = curve_manager.findCurveByDom(last_on_curve_node)!.startNode!.control2?.x ?? _p3_x, _p2_y = curve_manager.findCurveByDom(last_on_curve_node)!.startNode!.control2?.y ?? _p3_y;

        _p2_x *= scale, _p2_y *= scale;
        _p3_x *= scale, _p3_y *= scale;


        if(preview_curve === null) {
            preview_curve = createBezierSVG([p0_x, p0_y], [p1_x, p1_y], [p2_x, p2_y], [p3_x, p3_y], 0.5, preview_color, main_canvas!.value!);
            if(curve_manager.findCurveByDom(last_on_curve_node)!.closed)
                preview_curve_1 = createBezierSVG([p0_x, p0_y], [p1_x, p1_y], [_p2_x, _p2_y], [_p3_x, _p3_y], 0.5, preview_color, main_canvas!.value!);
        } else {
            const d = `M ${p0_x},${p0_y} C ${p1_x},${p1_y} ${p2_x},${p2_y} ${p3_x},${p3_y}`;
            const d1 = `M ${p0_x},${p0_y} C ${p1_x},${p1_y} ${_p2_x},${_p2_y} ${_p3_x},${_p3_y}`;
            preview_curve.firstElementChild!.setAttribute("d", d);
            if(preview_curve_1 !== null)
                preview_curve_1.firstElementChild!.setAttribute("d", d1);
        }
    }
}

function clear_select() {
    let preset = presetMap[main_node_shape];
    let preset_control = presetMap[control_node_shape];


    for(const node of node_selecting) {
        node.firstElementChild!.setAttribute("fill", preset.fill);
        node.firstElementChild!.setAttribute("stroke", preset.stroke);
        const temp_node = curve_manager.find_node_by_curve({ main_node: node });
        temp_node?.control1?.main_node.firstElementChild!.setAttribute("fill", preset_control.fill);
        temp_node?.control1?.main_node.firstElementChild!.setAttribute("stroke", preset_control.stroke);
        temp_node?.control2?.main_node.firstElementChild!.setAttribute("fill", preset_control.fill);
        temp_node?.control2?.main_node.firstElementChild!.setAttribute("stroke", preset_control.stroke);
    }

    node_selecting.clear();
}

function add_select(new_node: SVGSVGElement) {
    node_selecting.add(new_node);
                
    let preset = presetMap[main_node_shape_selected];

    new_node.firstElementChild!.setAttribute("stroke", preset.stroke);
    new_node.firstElementChild!.setAttribute("fill", preset.fill);
    const temp_node = curve_manager.find_node_by_curve({ main_node: new_node });
    temp_node?.control1?.main_node.firstElementChild!.setAttribute("fill", preset.fill);
    temp_node?.control1?.main_node.firstElementChild!.setAttribute("stroke", preset.stroke);
    temp_node?.control2?.main_node.firstElementChild!.setAttribute("fill", preset.fill);
    temp_node?.control2?.main_node.firstElementChild!.setAttribute("stroke", preset.stroke);
}

function remove_select(old_node: SVGSVGElement) {
    node_selecting.delete(old_node);

    let preset = presetMap[main_node_shape];
    let preset_control = presetMap[control_node_shape];
    old_node.firstElementChild!.setAttribute("stroke", preset.stroke);
    old_node.firstElementChild!.setAttribute("fill", preset.fill);
    const temp_node = curve_manager.find_node_by_curve({ main_node: old_node });
    temp_node?.control1?.main_node.firstElementChild!.setAttribute("fill", preset_control.fill);
    temp_node?.control1?.main_node.firstElementChild!.setAttribute("stroke", preset_control.stroke);
    temp_node?.control2?.main_node.firstElementChild!.setAttribute("fill", preset_control.fill);
    temp_node?.control2?.main_node.firstElementChild!.setAttribute("stroke", preset_control.stroke);
}

let animationFrameId: number;

let page_start: boolean = true;

function animationLoop() {
    update_canvas();
    update_ruler();

    if(page_start && ruler_horizontal.value!.getBoundingClientRect().width != 0 && ruler_vertical.value!.getBoundingClientRect().width != 0 && ruler_horizontal.value!.getBoundingClientRect().height != 0 && ruler_vertical.value!.getBoundingClientRect().height != 0)
    {
        // offset.x = (main_canvas_large.value!.getBoundingClientRect().width) / 2;
        // offset.y = (main_canvas_large.value!.getBoundingClientRect().height) / 2;
        get_initial_settings();

        update_canvas();
        update_ruler();

        page_start = false;
        // cancelAnimationFrame(animationFrameId);
    }

    animationFrameId = requestAnimationFrame(animationLoop);
}

onMounted(() => {
    animationFrameId = requestAnimationFrame(animationLoop);

    window.addEventListener("mouseup", e => {
        if(e.button === 1 && dragging === true) {
            // 抬起中键停止拖动画布
            dragging = false;
            document.body.style.cursor = "default";
        } else if(e.button === 0) {
            preview_curve && (preview_curve.style.display = "inline");
            preview_curve_1 && (preview_curve_1.style.display = "inline");
            update_preview(e);

            if(painting_handle === true) {
                // 抬起左键停止拖动手柄
                painting_handle = false;
                new_curve_handle = null;
            }

            if(dragging_node_b_ready === true) {
                // 抬起左键停止拖动正在拖动的点
                dragging_node_b_ready = dragging_node_b = false;
            }

            let file_str = save_file();
            if(saveString("file.json", file_str) === null)
                alert("Failed to cache data");
        }
    });

    window.addEventListener("mousemove", e => {

        const rect = main_canvas!.value!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if((e.buttons & 4) !== 0 && dragging === true) {

            // 按下中键时移动，更新画布拖动数据
            const dx = e.clientX - drag_start.x;
            const dy = e.clientY - drag_start.y;

            offset = { x: offset_start.x + dx / scale, y: offset_start.y + dy / scale};

            // update_canvas();
            // update_ruler();
            // update_node();

            localStorage.setItem("ss_board_offset_x", String(offset.x));
            localStorage.setItem("ss_board_offset_y", String(offset.y));
        } else if((e.buttons & 1) !== 0 && painting_handle === true) {
            // 按下左键时移动，正在拖动手柄
            if(new_curve_handle === null && (Math.abs(x - painting_handle_start.x) > 1 || Math.abs(y - painting_handle_start.y) > 1)) {
                // 还没有创建过手柄点，且值得创建
                new_curve_handle = createNodeAt(x, y, main_canvas!.value!, control_node_shape, "test_id", "vertex", 4, 1, 0);
                
                curve_manager.add_node_by_curve({ main_node: new_curve_handle, type: null, x: x / scale, y: y / scale, nextOnCurve: last_on_curve_node, lastOnCurve: null, this_curve: current_curve!, node_id: String(node_id_i) });
                node_id_i += 1;

                // 添加对称手柄
                let other_x = 2 * curve_manager.find_node_by_curve({ main_node: last_on_curve_node! })!.x - x, other_y = 2 * curve_manager.find_node_by_curve({ main_node: last_on_curve_node! })!.y - y;
                curve_manager.add_node_by_curve({ main_node: createNodeAt(other_x, other_y, main_canvas!.value!, control_node_shape, "test_id", "vertex", 4, 1, 0), type: null, x: other_x / scale, y: other_y / scale, nextOnCurve: last_on_curve_node, lastOnCurve: null, this_curve: current_curve!, node_id: String(node_id_i) });
                node_id_i += 1;
                curve_manager.find_node_by_curve({ main_node: last_on_curve_node! })!.set_both_control({ one_control: new_curve_handle, control_mode: 2 });curve_manager.find_node_by_curve({ main_node: last_on_curve_node! })!.update_svg_curve(main_canvas!.value!, scale);

            } else if(new_curve_handle !== null) {
                // 已经创建了手柄点，更新其坐标
                new_curve_handle.style.transform = `translate(${x - Number(new_curve_handle.dataset.size)}px, ${y - Number(new_curve_handle.dataset.size)}px)`;

                curve_manager.find_node_by_curve({ main_node: new_curve_handle })!.x = x / scale;
                curve_manager.find_node_by_curve({ main_node: new_curve_handle })!.y = y / scale;

                // 更新对称手柄

                curve_manager.find_node_by_curve({ main_node: last_on_curve_node! })!.set_both_control({ one_control: new_curve_handle, control_mode: 2 });
                curve_manager.find_node_by_curve({ main_node: last_on_curve_node! })!.update_svg_curve(main_canvas!.value!, scale);
            }
        } else if((e.buttons & 1) !== 0 && dragging_node_b_ready === true) {
            // 按下左键时移动，正在拖动已创建的节点
            // 包括主节点和控制手柄
            if(Math.abs(x - dragging_node_start.x) > 1 || Math.abs(y - dragging_node_start.y) > 1)
                dragging_node_b = true;
            const dragging_node_n = curve_manager.find_node_by_curve({ main_node: dragging_node! });
            if(dragging_node_b) {
                if(dragging_node_n!.type !== null) {
                    // 是主节点
                    const dx = x - Number(dragging_node!.dataset.size) - parseFloat(dragging_node!.style.transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/)![1]);
                    const dy = y - Number(dragging_node!.dataset.size) - parseFloat(dragging_node!.style.transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/)![2]);
                    const new_x = x / scale, new_y = y / scale;

                    //移动场上所有选中的点
                    dragging_node_n?.move_together_selected({ dx, dy, logic_dx: new_x - dragging_node_n!.x, logic_dy: new_y - dragging_node_n!.y, node_list: node_selecting });

                    for(const node of node_selecting) {
                        curve_manager.find_node_by_curve({ main_node: node })?.update_svg_curve(main_canvas!.value!, scale);
                    }
                } else {
                    // 是控制点
                    dragging_node!.style.transform = `translate(${x - Number(dragging_node!.dataset.size)}px, ${y - Number(dragging_node!.dataset.size)}px)`;
                    dragging_node_start = { x, y };

                    dragging_node_n!.x = x / scale;
                    dragging_node_n!.y = y / scale;
                    dragging_node_n!.nextOnCurve!.set_both_control({ one_control: dragging_node!, control_mode: 0 });
                    dragging_node_n!.nextOnCurve!.update_svg_curve(main_canvas!.value!, scale);
                }
            }
        }

        update_preview(e);
    });

    window.addEventListener("wheel", e => {
        const rect = main_canvas!.value!.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        if(e.ctrlKey) {
            // 按下 ctrl 且存在滚轮动作，缩放画布
            e.preventDefault();
            change_canvas_size(e.deltaY, x, y, false);
        } else if(e.altKey) {
            e.preventDefault();
            change_canvas_size(e.deltaY, x, y, true);
        } else {

        }

        update_preview(e);
    }, { passive: false });

    window.addEventListener("keydown", e => {
        if(e.key === "Enter" || e.key === "Escape") {
            reset_curve_drawing();
        } else if(e.key === "Delete") {
            console.log("FUCK");
            
        }
    });

    window.addEventListener("contextmenu", e => {
        e.preventDefault();
    });

    curve_manager = CurveManager.getInstance();
});

onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId);
});

function change_canvas_size(dy: number, x: number, y: number, fixed: boolean) {
    if(fixed)
        x = canvas_size_width / 2 * scale, y = canvas_size_height / 2 * scale;
    let wheel_delta = dy < 0 ? 1.1 : 0.9;
    const old_scale = scale;
    let new_scale = Math.min(Math.max(scale * wheel_delta, scale_min), scale_max);
    // let new_scale = scale * wheel_delta;

    // wheel_delta = e.deltaY < 0 ? 0.01 : -0.01;
    // new_scale = Math.min(Math.max(scale + wheel_delta, scale_min), scale_max);

    if(new_scale == scale) {
        return;
    }

    const x_new = x / scale * new_scale;
    const y_new = y / scale * new_scale;
    
    offset = { x: offset.x * (old_scale / new_scale), y: offset.y * (old_scale / new_scale)};
    scale = new_scale;

    // update_canvas();
    // update_ruler();
    update_node();

    offset = { x: offset.x + (x - x_new) / scale, y: offset.y + (y - y_new) / scale};

    // update_canvas();
    // update_ruler();
    update_node();

    localStorage.setItem("ss_board_scale", String(scale));
    localStorage.setItem("ss_board_offset_x", String(offset.x));
    localStorage.setItem("ss_board_offset_y", String(offset.y));
}

function handle_mouse_down(e: MouseEvent) {
    if(e.button === 0) {
        preview_curve && (preview_curve.style.display = "none");
        preview_curve_1 && (preview_curve_1.style.display = "none");
        const target = e.target as HTMLElement;
        if(target.dataset.type !== "vertex") {
            // 在空白位置按下左键，创建节点
            const rect = main_canvas!.value!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // emit("add_point", { x: x / scale, y: y / scale });

            if(current_curve === null)
                current_curve = curve_manager.addCurve("a");

            let new_curve_node = createNodeAt(x, y, main_canvas!.value!, "square-blue-light", "test_id", "vertex", 4, 1, 0);
            
            curve_manager.add_node_by_curve({ main_node: new_curve_node, type: "curve", x: x / scale, y: y / scale, nextOnCurve: null, lastOnCurve: last_on_curve_node, this_curve: current_curve, node_id: String(node_id_i) })?.update_svg_curve(main_canvas!.value!, scale);
            node_id_i += 1;

            last_on_curve_node = new_curve_node;
            clear_select();
            add_select(last_on_curve_node);

            painting_handle = true;
            painting_handle_start = { x, y };
        }
        

    } else if(e.button === 1) {
        const target = e.target as HTMLElement;
        if(target === main_canvas!.value || target === main_canvas_large!.value) {
            // 在空白位置按下中键，拖动画布
            document.body.style.cursor = "grab";
            dragging = true;
            drag_start = { x: e.clientX, y: e.clientY};
            offset_start = { x: offset.x, y: offset.y};
        }
        
    } else if(e.button === 2) {
        reset_curve_drawing();
        let file_str = save_file();
        // download_file(file_str, "test.json");
        if(saveString("file.json", file_str) === null)
            alert("Failed to cache data");
    }
}

function reset_curve_drawing() {
    current_curve = null;
    last_on_curve_node = null;
    preview_curve?.remove();
    preview_curve = null;
    preview_curve_1?.remove();
    preview_curve_1 = null;
    path_id_i += 1;
    new_curve_handle = null;
}

/**
 * 在指定容器创建一个节点 SVG 元素
 * @param x 相对于容器的 x 坐标（中心位置）
 * @param y 相对于容器的 y 坐标（中心位置）
 * @param container 容器 DOM 元素
 * @param shape 10 种预设 NodeShape
 * @param id 节点唯一 ID
 * @param type 节点类型标记字符串
 * @param size 节点大小（半径或半边长）
 * @param strokeWidth 边框宽度
 * @param rotation 矩形旋转角度（角度制，可选，圆形忽略）
 * @returns 创建好的 SVG 元素
 */
function createNodeAt(
    x: number,
    y: number,
    container: HTMLElement,
    shape: NodeShape,
    id: string,
    type: string,
    size: number,
    strokeWidth: number,
    rotation: number = 0
): SVGSVGElement {
    const svgNS = "http://www.w3.org/2000/svg";

    const preset = presetMap[shape];

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", (size * 2).toString());
    svg.setAttribute("height", (size * 2).toString());
    svg.style.position = "absolute";
    // svg.style.left = `${x - size}px`;
    // svg.style.top = `${y - size}px`;

    svg.style.left = "0px";
    svg.style.top = "0px";
    svg.style.transform = `translate(${x - size}px, ${y - size}px)`;

    svg.style.overflow = "visible";
    svg.style.zIndex = "100";

    svg.dataset.size = size.toString();

    if (preset.kind === "circle") {
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", size.toString());
        circle.setAttribute("cy", size.toString());
        circle.setAttribute("r", size.toString());
        circle.setAttribute("stroke", preset.stroke);
        circle.setAttribute("stroke-width", strokeWidth.toString());
        circle.setAttribute("fill", preset.fill);

        circle.dataset.id = id;
        circle.dataset.type = type;

        // ⭐ 增加鼠标悬停时放大 20% 的效果
        circle.addEventListener("mouseenter", () => {
            const newSize = size * 1.2;
            circle.setAttribute("r", newSize.toString());
        });

        circle.addEventListener("mouseleave", () => {
            circle.setAttribute("r", size.toString());
        });

        svg.appendChild(circle);
    } else {
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", (size * 2).toString());
        rect.setAttribute("height", (size * 2).toString());
        rect.setAttribute("rx", (size * 0.25).toString()); // 圆角
        rect.setAttribute("stroke", preset.stroke);
        rect.setAttribute("stroke-width", strokeWidth.toString());
        rect.setAttribute("fill", preset.fill);

        rect.dataset.id = id;
        rect.dataset.type = type;

        if (rotation !== 0) {
            // 以中心为原点旋转
            rect.setAttribute("transform", `rotate(${rotation} ${size} ${size})`);
        }

        // ⭐ 增加鼠标悬停时放大 20% 的效果
        rect.addEventListener("mouseenter", () => {
            const newSize = size * 1.2;
            rect.setAttribute("width", (newSize * 2).toString());
            rect.setAttribute("height", (newSize * 2).toString());
            rect.setAttribute("rx", (newSize * 0.25).toString()); // 圆角
            rect.setAttribute("x", `${(size - newSize)}`);
            rect.setAttribute("y", `${(size - newSize)}`);
        });

        rect.addEventListener("mouseleave", () => {
            rect.setAttribute("width", (size * 2).toString());
            rect.setAttribute("height", (size * 2).toString());
            rect.setAttribute("rx", (size * 0.25).toString()); // 圆角
            rect.setAttribute("x", "0");
            rect.setAttribute("y", "0");
        });

        svg.appendChild(rect);
    }

    svg.addEventListener("mousedown", (e) => {
        if(e.button === 0) {

            const rect = main_canvas!.value!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            dragging_node_start = { x, y };
            dragging_node_b_ready = true;
            dragging_node = svg;

            if(!e.ctrlKey && svg.firstElementChild!.tagName === "rect") {
                if(!node_selecting.has(svg))
                    clear_select();
                add_select(svg);
                new_selected_temp = svg;
            } else if(e.ctrlKey && svg.firstElementChild!.tagName === "rect") {
                if(!node_selecting.has(svg)) {
                    add_select(svg);
                    new_selected_temp = svg;
                }
            }
        }
    });

    svg.addEventListener("mouseup", e => {
        if(e.button === 0) {
            if(svg.firstElementChild!.tagName === "rect" && !dragging_node_b && !e.ctrlKey) {
                clear_select();
                add_select(svg);
            } else if(e.ctrlKey && svg.firstElementChild!.tagName === "rect" && !dragging_node_b) {
                if(node_selecting.has(svg) && svg != new_selected_temp) {
                    remove_select(svg);
                }
            }

            new_selected_temp = null;
        }
    })

    svg.addEventListener("wheel", e => {
        if(!e.ctrlKey && !e.altKey && svg.firstElementChild!.tagName === "rect") {
            e.preventDefault();
            if(e.deltaY < 0) {
                if(!node_selecting.has(svg)) {
                    add_select(svg);
                    new_selected_temp = svg;
                } else {
                    const start_node = curve_manager.find_node_by_curve({ main_node: svg });
                    let this_node = start_node?.nextOnCurve;
                    while(this_node != null) {
                        if(!node_selecting.has(this_node.main_node)) {
                            add_select(this_node.main_node);
                            new_selected_temp = this_node.main_node;
                            break;
                        }

                        this_node = this_node.nextOnCurve;
                    }
                }
            } else {
                // if(node_selecting.has(svg)) {
                //     remove_select(svg);
                // } else {
                //     const start_node = curve_manager.find_node_by_curve({ main_node: svg });
                //     let this_node = start_node?.nextOnCurve;
                //     while(this_node != null) {
                //         if(node_selecting.has(this_node.main_node)) {
                //             remove_select(this_node.main_node);
                //             break;
                //         }

                //         this_node = this_node.nextOnCurve;
                //     }
                // }

                if(!node_selecting.has(svg)) {
                    add_select(svg);
                    new_selected_temp = svg;
                } else {
                    const start_node = curve_manager.find_node_by_curve({ main_node: svg });
                    let this_node = start_node?.lastOnCurve;
                    while(this_node != null) {
                        if(!node_selecting.has(this_node.main_node)) {
                            add_select(this_node.main_node);
                            new_selected_temp = this_node.main_node;
                            break;
                        }

                        this_node = this_node.lastOnCurve;
                    }
                }
            }
        }
    });

    container.appendChild(svg);
    return svg;
}









</script>

<template>
    <div class="painting_area" ref="painting_area">
        <button class="lock_guideline_button" ref="lock_guideline_button" @click="toggle_guideline_lock">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="lock_guideline_icon" ref="lock_guideline_icon" viewBox="0 0 16 16" style="position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; visibility: hidden;">
                <path fill-rule="evenodd" d="M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4m0 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3"/>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="lock_guideline_icon_unlocked" ref="lock_guideline_icon_unlocked" viewBox="0 0 16 16" style="position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;">
                <path fill-rule="evenodd" d="M8 0c1.07 0 2.041.42 2.759 1.104l.14.14.062.08a.5.5 0 0 1-.71.675l-.076-.066-.216-.205A3 3 0 0 0 5 4v2h6.5A2.5 2.5 0 0 1 14 8.5v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4"/>
            </svg>
        </button>

        <div class="ruler_horizontal" ref="ruler_horizontal"></div>
        <div class="ruler_vertical" ref="ruler_vertical"></div>
        <div class="main_canvas_large" ref="main_canvas_large" style="position: absolute; top: 0; right: 0; width: 100%; height: 100%; background-color: #eee;" @mousedown="handle_mouse_down">
            <div class="main_canvas" ref="main_canvas" style="background-color: white; position: absolute;"></div>
        </div>
    </div>
</template>

<style scoped>
    .painting_area {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .lock_guideline_button {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 20px;
        height: 20px;
        z-index: 100;
        background-color: white;
        border: none;
    }

    :root {
        --canvas_size_width: 1000;
        --canvas_size_height: 1000;
        --ruler_size: 20;
    }

    .ruler_horizontal {
        position: absolute;
        z-index: 100;
        top: 0px;
        left: 20px;
        height: 20px;
        width: 100%;
        border-bottom: 1px solid #000;
        box-sizing: border-box;
        background-color: white;
        user-select: none;
    }

    .ruler_vertical {
        position: absolute;
        z-index: 100;
        left: 0px;
        top: 20px;
        width: 20px;
        height: 100%;
        border-right: 1px solid #000;
        box-sizing: border-box;
        background-color: white;
        user-select: none;
    }

</style>
