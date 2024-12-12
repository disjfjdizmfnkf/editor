import { createVNode, render } from 'vue'
import ContextMenu from './ContextMenu.vue'
export interface ActionItem {
  action: (cid?: string) => void;
  text: string;
  shortcut: string;
}
const createContextMenu = (actions: ActionItem[], triggerClass = 'edit-wrapper') => {
  const container = document.createElement('div')
  const options = {
    actions,
    triggerClass
  }
  // 返回一个VNode实例
  const vm = createVNode(ContextMenu, options)
  // 渲染vue实例到container中
  render(vm, container)
  document.body.appendChild(container)

  return () => {
    // 清除dom容器上的实例
    render(null, container)
    // 移除dom容器
    document.body.removeChild(container)
  }
}

export default createContextMenu
