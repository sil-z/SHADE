<script setup lang="ts">
import { ref } from 'vue'
import Board from './Board.vue'

defineProps<{ msg: string }>()

const count = ref(0)

if (false)
    console.log(count)

function update_board_size(size: number)
{
    size;
}

function add_point(point: any)
{
    point;
}

</script>

<template>

    <el-splitter style="height: 100%; width: 100%; position: relative;">
        <el-splitter-panel min="50" size="20%" style="position: relative;">
            <el-splitter layout="vertical" style="position: relative;">
                <el-splitter-panel min="50" size="40%" style="position: relative;">
                    <div class="floater">
                        <el-scrollbar>
                            <div class="panel">工作台：放置矢量图形编辑工具；包括：切换编辑模式（选择/节点/钢笔）；导入/导出；系统设置；帮助；默认绘图参数设置（粗细/闭合与否）</div>
                        </el-scrollbar>
                    </div>
                </el-splitter-panel>

                <el-splitter-panel min="50" style="position: relative;">
                    <div class="floater">
                        <el-scrollbar>
                            <div class="panel">控制台：选中图形属性编辑栏，包括颜色/粗细/节点坐标/手柄角度等一切数值属性；包括节点合并/删除/更改为平滑节点/路径描边/简化/添加极值点等作用于特定对象的工具</div>
                        </el-scrollbar>
                    </div>
                </el-splitter-panel>
                
            </el-splitter>
            
        </el-splitter-panel>
        <el-splitter-panel min="50" style="overflow: hidden; position: relative;" @update:size="update_board_size">
            <div class="floater">
                <Board @add_point="add_point"/>
            </div>
        </el-splitter-panel>
        <el-splitter-panel min="50" size="20%" style="position: relative;">

            <el-splitter layout="vertical" style="position: relative;">
                <el-splitter-panel min="50" style="position: relative;">
                    <div class="floater">
                        <div class="panel">字体编辑器：对字体结构进行编辑；包括：连字显示器；字符选择器（包括间距，变体，连字等设置）；预制对象编辑器；字体属性设置器（包括feature文件）</div>
                    </div>
                </el-splitter-panel>

                

                <el-splitter-panel min="50" size="20%" style="position: relative;">
                    <div class="floater">
                        <div class="panel">日志：显示操作列表以及其他提示</div>
                    </div>
                </el-splitter-panel>

            </el-splitter>




            
        </el-splitter-panel>
    </el-splitter>

</template>

<style scoped>

.floater {
    position: absolute;  /* 脱离文档流，相对于父容器定位 */
    
    /* 外部固定边距 */
    top: 6px;
    right: 6px;
    bottom: 6px;
    left: 6px;

    border-radius: 8px;                /* 圆角 */
    border: 1px solid rgba(0,0,0,0.5);
    background-color: white;            /* 背景色 */
    box-shadow: 0 0px 0px rgba(0,0,0,0.5); /* 漂浮感 */
    overflow: hidden;                   /* 内部不超出圆角 */
}



</style>