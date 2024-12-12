import hotkeys, { KeyHandler } from 'hotkeys-js'
import { onMounted, onUnmounted } from 'vue'

export type Options = {
  filter?: typeof hotkeys.filter;
  element?: HTMLElement;
  splitKey?: string;
  scope?: string;
  keyup?: boolean;
  keydown?: boolean;
};
hotkeys.filter = () => {
  return true
}

// 使用hotkey库，创建hooks，实现一系列快捷键时间的绑定和卸载
const useHotKey = (keys: string, callback: KeyHandler, options: Options = {}) => {
  onMounted(() => {
    hotkeys(keys, options, callback)
  })
  onUnmounted(() => {
    hotkeys.unbind(keys, callback)
  })
}

export default useHotKey
