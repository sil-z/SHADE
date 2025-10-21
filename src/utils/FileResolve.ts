import { fa, tr } from "element-plus/es/locales.mjs";

function matchNextNumber(str: string, startIndex: number) {
    const regex = /[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/;
    const subStr = str.slice(startIndex);
    const match = regex.exec(subStr);
    if (!match) return null;
    const matchedText = match[0];
    const matchStart = startIndex + match.index;
    const matchEnd = matchStart + matchedText.length;
    return { str: matchedText, end: matchEnd };
}

function matchNextCommandLetter(str: string, startIndex: number) {
    const regex = /[MmLlHhVvCcSsQqTtAaZz]/;
    const subStr = str.slice(startIndex);
    const match = regex.exec(subStr);
    if (!match) return null;
    const matchedCmd = match[0];
    const matchStart = startIndex + match.index;
    const matchEnd = matchStart + 1;
    return { str: matchedCmd, end: matchEnd };
}

function writeD(obj: any) {
    let res_str = [];
    for(let cmd of obj) {
        let cl = cmd.cl;
        res_str.push(cl);
        res_str.push(" ");
        for(let { num_x, num_y } of cmd.num) {
            res_str.push(num_x);
            res_str.push(",");
            res_str.push(num_y);
            res_str.push(" ");
        }

        res_str.push("\n");
    }

    return res_str.join();
}

function matchNextCommand(str: string, startIndex: number): any {
    let res;
    const match_1 = matchNextCommandLetter(str, startIndex);
    if(match_1 === null)
        return null;
    const n_cmd = match_1.str;
    let end_1 = match_1.end;
    let match_2 = matchNextCommandLetter(str, end_1);

    let p_cnt;
    if(n_cmd === 'C' || n_cmd === 'c') {
        p_cnt = 6;
    } else if(n_cmd === 'S' || n_cmd === 's' || n_cmd === 'Q' || n_cmd === 'q') {
        p_cnt = 4;
    } else if(n_cmd === 'M' || n_cmd === 'm' || n_cmd === 'L' || n_cmd === 'l' || n_cmd === 'T' || n_cmd === 't') {
        p_cnt = 2;
    } else if(n_cmd === 'H' || n_cmd === 'h' || n_cmd === 'V' || n_cmd === 'v') {
        p_cnt = 1;
    } else if(n_cmd === 'A' || n_cmd === 'a') {
        res = { cmd: n_cmd, end: end_1 };
        console.log("Path includes arc which is not supported yet and will be ignored.");
        return res;
    } else if(n_cmd === 'Z' || n_cmd === 'z') {
        res = { cmd: n_cmd, end: end_1 };
        return res;
    } else {
        console.log("hello how are you");
        return res;
    }

    while(true) {
        res = { cmd: n_cmd, params: [] as number[], end: 0 };
        let temp_res: number[] = [];
        for(let i = 0; i < p_cnt; i += 1) {
            let match_x = matchNextNumber(str, end_1);
            if(match_x === null || match_2 !== null && match_x.end > match_2.end)
                return res;
            res.end = match_x.end;
            end_1 = match_x.end;
            temp_res.push(Number(match_x.str));
        }

        for(let num of temp_res) {
            res.params.push(num);
        }
    }
}


