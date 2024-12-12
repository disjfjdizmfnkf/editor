/* eslint-disable */
import { Module } from 'vuex'
import { v4 as uuidv4 } from 'uuid'
import { cloneDeep, isUndefined } from 'lodash'
import { GlobalDataProps, asyncAndCommit } from './index'
import { insertAt } from '../helper'
import { MoveDirection } from '../plugins/dataOperations'
export interface ComponentData {
  props: { [key: string]: any };
  id: string;
  name: string;
  layerName?: string;
  isHidden?: boolean;
  isLocked?: boolean;
}
export interface PageData {
  props: { [key: string]: any };
  setting: { [key: string]: any };
  id?: number;
  title?: string;
  desc?: string;
  coverImg?: string;
  uuid?: string;
  latestPublishAt?: string;
  updatedAt?: string;
  isTemplate?: boolean;
  isHot?: boolean;
  isNew?: boolean;
  author?: string;
  copiedCount?: number;
  status?: string;
  user?: {
    gender: string;
    nickName: string;
    picture: string;
    userName: string;
  };
}
export interface ChannelProps {
  id: number;
  name: string;
  workId: number;
}

export interface HistoryProps {
  id: string;
  componentId?: string;
  type: 'add' | 'delete' | 'modify';
  data: any;
  index?: number;
}
export interface EditProps {
  // 页面所有组件
  components: ComponentData[];
  // 当前被选中的组件 id
  currentElement: string;
  // 当前正在 inline editing 的组件
  currentEditing: string;
  // 当前数据已经被修改
  isDirty: boolean;
  // 当前模版是否修改但未发布
  isChangedNotPublished: boolean;
  // 当前被复制的组件
  copiedComponent?: ComponentData;
  // 当前 work 的数据
  page: PageData;
  // 当前 work 的 channels
  channels: ChannelProps[];
  // 当前操作的历史记录
  histories: HistoryProps[];
  // 当前历史记录的操作位置
  historyIndex: number;
}
const pageDefaultProps = {
  backgroundColor: '#ffffff',
  backgroundImage: '',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  height: '560px'
}
// the max numbers for history items
const maxHistoryNumber = 20
const pushHistory = (state: EditProps, historyRecord: HistoryProps) => {
  // 执行undo之后(也就是指针不指向-1时)添加新的记录
  if (state.historyIndex !== -1) {
    // 删除index指针之后所有的记录
    state.histories = state.histories.slice(0, state.historyIndex)
    // 重新将 index 置为 -1
    state.historyIndex = -1
  }
  // 判断历史记录的长度是否超出限制
  if (state.histories.length < maxHistoryNumber) {
    state.histories.push(historyRecord)
  } else {
    // if histories length is larger then max number,
    state.histories.shift() // 删除第一项
    state.histories.push(historyRecord) // 在最后添加新的一项
  }
}

// 利用字符串字面量和三元运算符处理 undo和redo 下的modify操作
const modifyHistory = (
  state: EditProps,
  history: HistoryProps,
  type: 'undo' | 'redo'
) => {
  // history对象，每条历史记录
  const { componentId, data } = history
  // 从历史记录对象的data中获取属性key，新旧属性值
  const { key, oldValue, newValue } = data
  // modify the page setting
  if (!componentId) {
    state.page.props[key] = type === 'undo' ? oldValue : newValue
  } else {
    const updatedComponent = state.components.find(
      component => component.id === componentId
    ) as any
    // 判断是单个属性值还是一组属性值的修改
    if (Array.isArray(key)) {
      key.forEach((keyName: string, index) => {
        updatedComponent.props[keyName] =
          type === 'undo' ? oldValue[index] : newValue[index]
      })
    } else {
      updatedComponent.props[key] = type === 'undo' ? oldValue : newValue
    }
  }
}
let globalTimeout = 0
let cachedOldValue: any

const debounceChange = (
  cachedValue: any,
  callback: () => void,
  timeout = 1000
) => {
  if (globalTimeout) {
    clearTimeout(globalTimeout)
  }
  if (isUndefined(cachedOldValue)) {
    cachedOldValue = cachedValue
  }
  globalTimeout = setTimeout(() => {
    callback()
    globalTimeout = 0
    cachedOldValue = undefined
  }, timeout)
}
const editorModule: Module<EditProps, GlobalDataProps> = {
  state: {
    components: [],
    currentElement: '',
    currentEditing: '',
    isDirty: false,
    isChangedNotPublished: false,
    page: { props: pageDefaultProps, setting: {} },
    channels: [],
    histories: [],
    historyIndex: -1
  },
  mutations: {
    // reset editorState to clear
    resetEditor (state) {
      state.page = { props: pageDefaultProps, setting: {} }
      state.components = []
      state.histories = []
      state.isDirty = false
      state.isChangedNotPublished = false
    },
    addComponentToEditor (state, component) {
      component.id = uuidv4()
      component.layerName = '图层' + (state.components.length + 1)
      state.components.push(component)
      pushHistory(state, {
        id: uuidv4(),
        componentId: component.id,
        type: 'add',
        data: cloneDeep(component)
      })
      state.isDirty = true
      state.isChangedNotPublished = true
    },
    // undo history
    undo (state) {
      // 之前没有使用过undo，指针还在初始位置-1
      if (state.historyIndex === -1) {
        // undo to the last item of the histories array
        state.historyIndex = state.histories.length - 1
      } else {
        // 回退到前一步
        state.historyIndex--
      }
      // get the record
      const history = state.histories[state.historyIndex]
      // process the history data
      switch (history.type) {
        case 'add':
          // if we create a component, then we should remove it
          state.components = state.components.filter(
            component => component.id !== history.componentId
          )
          break
        case 'delete':
          // 根据原来的索引将删除的数组添加到原数组 参数(array, index, data)
          state.components = insertAt(
            state.components,
            history.index as number,
            history.data
          )
          break
        case 'modify': {
          // modifyHistory: 从history中解构出data
          // 获取data中的key value之后使用find修改对应的key属性的值为oldValue
          modifyHistory(state, history, 'undo')
          break
        }
        default:
          break
      }
    },
    redo (state) {
      // 只有undo之后才有redo
      if (state.historyIndex === -1) {
        return
      }
      // get the record 获取到历史记录信息
      const history = state.histories[state.historyIndex]
      // process the history data
      switch (history.type) {
        case 'add':
          state.components.push(history.data)
          // state.components = insertAt(state.components, history.index as number, history.data)
          break
        case 'delete':
          state.components = state.components.filter(
            component => component.id !== history.componentId
          )
          break
        case 'modify': {
          modifyHistory(state, history, 'redo')
          break
        }
        default:
          break
      }
      // 回到新历史
      state.historyIndex++
    },
    setActive (state, id) {
      state.currentElement = id
    },
    setEditing (state, id) {
      state.currentEditing = id
    },
    updatePage (state, { key, value, level }) {
      const pageData = state.page as { [key: string]: any }
      if (level) {
        if (level === 'props') {
          const oldValue = pageData[level][key]
          debounceChange(oldValue, () => {
            pushHistory(state, {
              id: uuidv4(),
              type: 'modify',
              data: { oldValue: cachedOldValue, newValue: value, key }
            })
          })
        }
        pageData[level][key] = value
      } else {
        pageData[key] = value
      }
      state.isDirty = true
      state.isChangedNotPublished = true
    },
    moveComponent (state, data: { direction: MoveDirection; amount: number }) {
      const updatedComponent = state.components.find(
        component => component.id === state.currentElement
      )
      if (updatedComponent) {
        const store = this as any
        const oldTop = parseInt(updatedComponent.props.top)
        const oldLeft = parseInt(updatedComponent.props.left)
        const { direction, amount } = data
        switch (direction) {
          case 'Up': {
            const newValue = oldTop - amount + 'px'
            store.commit('updateComponent', {
              key: 'top',
              value: newValue,
              isProps: true
            })
            break
          }
          case 'Down': {
            const newValue = oldTop + amount + 'px'
            store.commit('updateComponent', {
              key: 'top',
              value: newValue,
              isProps: true
            })
            break
          }
          case 'Left': {
            const newValue = oldLeft - amount + 'px'
            store.commit('updateComponent', {
              key: 'left',
              value: newValue,
              isProps: true
            })
            break
          }
          case 'Right': {
            const newValue = oldLeft + amount + 'px'
            store.commit('updateComponent', {
              key: 'left',
              value: newValue,
              isProps: true
            })
            break
          }
          default:
            break
        }
      }
    },
    // 完成右侧列表中属性的修改，传入id修改对应属性(来自图层列表的属性)，默认修改currentElement的属性
    updateComponent (state, { id, key, value, isProps }) {
      const updatedComponent = state.components.find(
        component => component.id === (id || state.currentElement)
      ) as any
      if (updatedComponent) {
        if (isProps) {
          const oldValue = Array.isArray(key)
            ? key.map((key: string) => updatedComponent.props[key])
            : updatedComponent.props[key]

          debounceChange(oldValue, () => {
            pushHistory(state, {
              id: uuidv4(),
              componentId: id || state.currentElement,
              type: 'modify',
              data: { oldValue: cachedOldValue, newValue: value, key }
            })
          })
          if (Array.isArray(key)) {
            // 数组使用forEach函数修改key对应的vale
            key.forEach((keyName: string, index) => {
              updatedComponent.props[keyName] = value[index]
            })
          } else {
            updatedComponent.props[key] = value
          }
        } else {
          updatedComponent[key] = value
        }
        state.isDirty = true
        state.isChangedNotPublished = true
      }
    },
    copyComponent (state, index) {
      const currentComponent = state.components.find(
        component => component.id === index
      )
      if (currentComponent) {
        // 如果使用pinia action，直接可以用this获取state中的数据
        state.copiedComponent = currentComponent
      }
    },
    pasteCopiedComponent (state) {
      // 判断是否有组件被复制
      if (state.copiedComponent) {
        // lodash提供的深拷贝函数，浅拷贝只是拷贝了对原来对象的引用，拷贝的是同一个对象
        const clone = cloneDeep(state.copiedComponent)
        // 使用新的id
        clone.id = uuidv4()
        clone.layerName = clone.layerName + '副本'
        state.components.push(clone)
        state.isDirty = true
        state.isChangedNotPublished = true
        // 将操作的类型和数据传入history数组中
        pushHistory(state, {
          id: uuidv4(),
          componentId: clone.id,
          type: 'add',
          data: cloneDeep(clone)
        })
      }
    },
    deleteComponent (state, id) {
      // find the current component and index
      const componentData = state.components.find(
        component => component.id === id
      ) as ComponentData
      const componentIndex = state.components.findIndex(
        component => component.id === id
      )
      state.components = state.components.filter(
        component => component.id !== id
      )
      pushHistory(state, {
        id: uuidv4(),
        componentId: componentData.id,
        type: 'delete',
        data: componentData,
        index: componentIndex
      })
      state.isDirty = true
      state.isChangedNotPublished = true
    },
    getWork (state, { data }) {
      const { content, ...rest } = data
      state.page = { ...state.page, ...rest }
      if (content.props) {
        state.page.props = { ...state.page.props, ...content.props }
      }
      if (content.setting) {
        state.page.setting = { ...state.page.setting, ...content.setting }
      }
      state.components = content.components
    },
    getChannels (state, { data }) {
      state.channels = data.list
    },
    createChannel (state, { data }) {
      state.channels = [...state.channels, data]
    },
    deleteChannel (state, { extraData }) {
      state.channels = state.channels.filter(
        channel => channel.id !== extraData.id
      )
    },
    saveWork (state) {
      state.isDirty = false
      state.page.updatedAt = new Date().toISOString()
    },
    copyWork (state) {
      state.page.updatedAt = new Date().toISOString()
    },
    publishWork (state) {
      state.isChangedNotPublished = false
      state.page.latestPublishAt = new Date().toISOString()
    },
    publishTemplate (state) {
      state.page.isTemplate = true
    }
  },
  actions: {
    // 同步work
    // getWork ({ commit }, id) {
    //   return asyncAndCommit(`/worksState/${id}`, 'getWork', commit)
    // },
    // getChannels ({ commit }, id) {
    //   return asyncAndCommit(
    //     `/channel/getWorkChannels/${id}`,
    //     'getChannels',
    //     commit
    //   )
    // },
    // createChannel ({ commit }, payload) {
    //   return asyncAndCommit('/channel', 'createChannel', commit, {
    //     method: 'post',
    //     data: payload
    //   })
    // },
    // deleteChannel ({ commit }, id) {
    //   return asyncAndCommit(
    //     `channel/${id}`,
    //     'deleteChannel',
    //     commit,
    //     { method: 'delete' },
    //     { id }
    //   )
    // },
    // saveWork ({ commit, state }, payload) {
    //   const { id, data } = payload
    //   if (data) {
    //   } else {
    //     // save current work
    //     const { title, desc, props, coverImg, setting } = state.page
    //     const postData = {
    //       title,
    //       desc,
    //       coverImg,
    //       content: {
    //         components: state.components,
    //         props,
    //         setting
    //       }
    //     }
    //     return asyncAndCommit(`/worksState/${id}`, 'saveWork', commit, {
    //       method: 'patch',
    //       data: postData
    //     })
    //   }
    // },
    // copyWork ({ commit }, id) {
    //   return asyncAndCommit(`/worksState/copy/${id}`, 'copyWork', commit, {
    //     method: 'post'
    //   })
    // },
    // publishWork ({ commit }, id) {
    //   return asyncAndCommit(`/worksState/publish/${id}`, 'publishWork', commit, {
    //     method: 'post'
    //   })
    // },
    // publishTemplate ({ commit }, id) {
    //   return asyncAndCommit(
    //     `/worksState/publish-template/${id}`,
    //     'publishTemplate',
    //     commit,
    //     { method: 'post' }
    //   )
    // },
    saveAndPublishWork ({ dispatch, state }, payload) {
      const { id } = state.page
      return dispatch('saveWork', payload)
        .then(() => dispatch('publishWork', id))
        .then(() => dispatch('getChannels', id))
        .then(() => {
          if (state.channels.length === 0) {
            return dispatch('createChannel', { name: '默认', workId: id })
          } else {
            return Promise.resolve({})
          }
        })
    }
  },
  getters: {
    getCurrentElement: state => {
      return state.components.find(
        component => component.id === state.currentElement
      )
    },
    checkUndoDisable: state => {
      // 没有历史记录或者当前指针在索引0位置
      if (state.histories.length === 0 || state.historyIndex === 0) {
        return true
      }
      return false
    },
    checkRedoDisable: state => {
      // 1 没有历史记录
      // 2 指针已经指向最新的记录
      // 3 之前并没有使用过undo
      if (
        state.histories.length === 0 ||
        state.historyIndex === state.histories.length ||
        state.historyIndex === -1
      ) {
        return true
      }
      return false
    }
  }
}

export default editorModule
