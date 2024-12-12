<template>
  <div class="file-upload">
    <div class="file-upload-container" @click.prevent="triggerUpload" v-bind="$attrs" drag>
      <slot v-if="fileStatus === 'loading'" name="loading">
        <button class="btn btn-primary" disabled>正在上传...</button>
      </slot>
      <slot v-else-if="fileStatus === 'success'" name="uploaded" :uploadedData="uploadedData">
        <button class="btn btn-primary">上传成功</button>
      </slot>
      <slot v-else name="default">
        <button class="btn btn-primary">点击上传</button>
      </slot>
    </div>
    <input
      type="file"
      class="file-input d-none"
      ref="fileInput"
      @change="handleFileChange"
    >
  </div>
</template>
<!-- 使用网络请求
<script lang="ts">
import { defineComponent, ref, PropType, watch } from 'vue'
import axios from 'axios'
type UploadStatus = 'ready' | 'loading' | 'success' | 'error'

type CheckFunction = (file: File) => boolean;
export default defineComponent({
  props: {
    action: {
      type: String,
      required: true
    },
    beforeUpload: {
      type: Function as PropType<CheckFunction>
    },
    uploaded: {
      type: Object
    }
  },
  inheritAttrs: false,
  emits: ['file-uploaded', 'file-uploaded-error'],
  setup (props, context) {
    const fileInput = ref<null | HTMLInputElement>(null)
    const fileStatus = ref<UploadStatus>(props.uploaded ? 'success' : 'ready')
    const uploadedData = ref(props.uploaded)
    watch(() => props.uploaded, (newValue) => {
      if (newValue) {
        fileStatus.value = 'success'
        uploadedData.value = newValue
      } else {
        fileStatus.value = 'ready'
      }
    })
    const triggerUpload = () => {
      if (fileInput.value) {
        fileInput.value.click()
      }
    }
    const handleFileChange = (e: Event) => {
      const currentTarget = e.target as HTMLInputElement
      if (currentTarget.files) {
        const files = Array.from(currentTarget.files)
        if (props.beforeUpload) {
          const result = props.beforeUpload(files[0])
          if (!result) {
            return
          }
        }
        fileStatus.value = 'loading'
        const formData = new FormData()
        formData.append('file', files[0])
        axios.post(props.action, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(resp => {
          fileStatus.value = 'success'
          uploadedData.value = resp.data
          resp.data.file = files[0]
          context.emit('file-uploaded', resp.data)
        }).catch((error) => {
          fileStatus.value = 'error'
          context.emit('file-uploaded-error', { error })
        }).finally(() => {
          // input值的改变才会触发change事件，避免无法上传两个相同文件，在结束后将input的值清空
          if (fileInput.value) {
            fileInput.value.value = ''
          }
        })
      }
    }
    return {
      fileInput,
      triggerUpload,
      fileStatus,
      uploadedData,
      handleFileChange
    }
  }
})
</script>
-->

<!-- 使用FileReader -->
<!--
<script lang="ts">
import { defineComponent, ref, PropType, watch } from 'vue'

type UploadStatus = 'ready' | 'loading' | 'success' | 'error'

type CheckFunction = (file: File) => boolean;

export default defineComponent({
  props: {
    action: {
      type: String,
      required: true
    },
    beforeUpload: {
      type: Function as PropType<CheckFunction>
    },
    uploaded: {
      type: Object
    }
  },
  inheritAttrs: false,
  emits: ['file-uploaded', 'file-uploaded-error'],
  setup (props @click.prevent="triggerUpload", context) {
    const fileInput = ref<null | HTMLInputElement>(null)
    const fileStatus = ref<UploadStatus>(props.uploaded ? 'success' : 'ready')
    const uploadedData = ref(props.uploaded)

    watch(() => props.uploaded, (newValue) => {
      if (newValue) {
        fileStatus.value = 'success'
        uploadedData.value = newValue
      } else {
        fileStatus.value = 'ready'
      }
    })

    const triggerUpload = () => {
      if (fileInput.value) {
        fileInput.value.click()
      }
    }

    const handleFileChange = (e: Event) => {
      const currentTarget = e.target as HTMLInputElement
      if (currentTarget.files) {
        const files = Array.from(currentTarget.files)
        if (props.beforeUpload) {
          const result = props.beforeUpload(files[0])
          if (!result) {
            return
          }
        }
        fileStatus.value = 'loading'

        // 使用 FileReader 读取文件
        const file = files[0]
        const reader = new FileReader()

        reader.onload = (event) => {
          if (event.target && event.target.result) {
            const dataUrl = event.target.result as string
            console.log(dataUrl)
            const mockResponse = {
              data: {
                file: file,
                url: dataUrl
              }
            }

            fileStatus.value = 'success'
            uploadedData.value = mockResponse.data
            context.emit('file-uploaded', mockResponse.data)
          }
        }

        reader.onerror = (error) => {
          fileStatus.value = 'error'
          context.emit('file-uploaded-error', { error })
        }

        reader.readAsDataURL(file)
      }
    }

    return {
      fileInput,
      triggerUpload,
      fileStatus,
      uploadedData,
      handleFileChange
    }
  }
})
</script>
-->

<script lang="ts">
import { defineComponent, ref, PropType, watch } from 'vue'

type UploadStatus = 'ready' | 'loading' | 'success' | 'error'

type CheckFunction = (file: File) => boolean;

export default defineComponent({
  props: {
    action: {
      type: String,
      required: true
    },
    beforeUpload: {
      type: Function as PropType<CheckFunction>
    },
    uploaded: {
      type: Object
    }
  },
  inheritAttrs: false,
  emits: ['file-uploaded', 'file-uploaded-error'],
  setup (props, context) {
    const fileInput = ref<null | HTMLInputElement>(null)
    const fileStatus = ref<UploadStatus>(props.uploaded ? 'success' : 'ready')
    const uploadedData = ref(props.uploaded)

    watch(() => props.uploaded, (newValue) => {
      if (newValue) {
        fileStatus.value = 'success'
        uploadedData.value = newValue
      } else {
        fileStatus.value = 'ready'
      }
    })

    const triggerUpload = () => {
      if (fileInput.value) {
        fileInput.value.click()
      }
    }

    const handleFileChange = (e: Event) => {
      const currentTarget = e.target as HTMLInputElement
      if (currentTarget.files) {
        const files = Array.from(currentTarget.files)
        if (props.beforeUpload) {
          const result = props.beforeUpload(files[0])
          if (!result) {
            return
          }
        }
        fileStatus.value = 'loading'

        // 使用 URL.createObjectURL 创建文件 URL
        const file = files[0]
        const fileUrl = URL.createObjectURL(file)
        console.log(fileUrl)
        const mockResponse = {
          data: {
            file: file,
            url: fileUrl
          }
        }

        fileStatus.value = 'success'
        uploadedData.value = mockResponse.data
        context.emit('file-uploaded', mockResponse.data)

        // 在不再需要 URL 时，释放资源
        setTimeout(() => {
          URL.revokeObjectURL(fileUrl)
        }, 5000) // 例如，5秒后释放 URL

        // input值的改变才会触发change事件，避免无法上传两个相同文件，在结束后将input的值清空
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      }
    }

    return {
      fileInput,
      triggerUpload,
      fileStatus,
      uploadedData,
      handleFileChange
    }
  }
})
</script>

<style scoped>
.file-input {
  display: none;
}
</style>
