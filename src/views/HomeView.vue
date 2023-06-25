<template>
  <div class="card-box">
    <n-card hoverable title="思政课在线题库">
      <template #header-extra>
        <n-space>
          <n-switch v-model:value="generateMode">
            <template #checked> 随机模式 </template>
            <template #unchecked> 顺序模式 </template>
          </n-switch>
          <n-button size="small" circle @click="showSettings = true">
            <n-icon>
              <SettingsOutline />
            </n-icon>
          </n-button>
        </n-space>
      </template>
      <n-thing>
        <template #header>
          <span>{{ getQuestionType(currentQuestion?.type) }}</span>
        </template>
        <n-h3>{{ currentQuestionIndex }}. {{ currentQuestion?.content.toString() }}</n-h3>
      </n-thing>
      <template #footer>
        <n-list hoverable clickable>
          <div v-if="currentQuestion?.type === 'multiple_choice' ||
            currentQuestion?.type === 'single_choice'
            ">
            <n-list-item @click="checkAnswer" :data-right-num="currentQuestion?.answer.split('').length" :data-right-flag="currentQuestion?.answer.split('').includes(String.fromCharCode(65 + index))
              " v-for="(option, index) in currentQuestion?.options" :key="index">
              {{ option }}
            </n-list-item>
          </div>
          <div v-else-if="currentQuestion?.type === 'true_or_false'">
            <n-list-item @click="checkAnswer" :data-right-flag="['对', '错'][index] === currentQuestion?.answer"
              :data-right-num="1" v-for="(option, index) in ['正确', '错误']" :key="index">
              {{ option }}
            </n-list-item>
          </div>
          <div v-else-if="currentQuestion?.type === 'essay'">
            <n-form-item label="答案" label-placement="left" :show-feedback="false">
              <n-input type="textarea" :autosize="{
                maxRows: 20
              }" :value="currentQuestion?.answer" />
            </n-form-item>
          </div>
          <div v-else-if="currentQuestion?.type === 'fill_blank'">
            <n-list-item v-for="(list, index) in currentQuestion?.answer.split('；')">
              <n-form-item :label="`填空 ${index + 1}`" label-placement="left" :show-feedback="false">
                <n-input type="textarea" autosize :value="list" />
              </n-form-item>
            </n-list-item>
          </div>
        </n-list>
      </template>
      <template #action>
        <div style="display: flex; justify-content: space-between">
          <div>
            <n-form-item label="题序:" label-placement="left" :show-feedback="false">
              <n-input-number :min="1" :max="questions.length" style="max-width: 90px"
                v-model:value="currentQuestionIndex" />
            </n-form-item>
          </div>
          <n-space>
            <n-button v-show="currentQuestionIndex > 1" size="small" round @click="prevQuestion">上一题</n-button>
            <n-button v-show="currentQuestionIndex < questions.length" size="small" round
              @click="nextQuestion">下一题</n-button>
          </n-space>
        </div>
      </template>
    </n-card>
    <n-modal v-model:show="showSettings">
      <n-card class="card-box-modal" title="设置" role="dialog" aria-modal="true">
        <template #header-extra>
          <n-button size="small" circle @click="showSettings = false">
            <n-icon>
              <CloseOutline />
            </n-icon>
          </n-button>
        </template>
        <n-form-item label="题库：" label-placement="left">
          <n-select v-model:value="questionChosen" :options="questionOptions" />
        </n-form-item>
        <n-form-item label="显示模式：" label-placement="left">
          <n-switch v-model:value="memoryMode">
            <template #checked> 背题模式 </template>
            <template #unchecked> 普通模式 </template>
          </n-switch>
        </n-form-item>
        <template #footer> © Powered by Yby.zone </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import {
  NCard,
  NButton,
  NIcon,
  NThing,
  NH3,
  NSwitch,
  NSpace,
  NInputNumber,
  NFormItem,
  NList,
  NListItem,
  NInput,
  NModal,
  NSelect
} from 'naive-ui'
import { SettingsOutline, CloseOutline } from '@vicons/ionicons5'

const questionChosen = ref<string>("毛泽东思想和中国特色社会主义理论体系概论")
const questionOptions = [
  {
    label: '毛泽东思想和中国特色社会主义理论体系概论',
    value: 'https://source.yby.zone/ideology/q_mao.json'
  },
  {
    label: '习近平新时代中国特色社会主义思想概论',
    value: 'https://source.yby.zone/ideology/q_xi.json'
  }
]

watch(questionChosen, () => {
  const url = questionOptions.find((item) => item.value === questionChosen.value)!.value
  getQuestions(url)
  localStorage.setItem('questionChosen', questionChosen.value!)
})

interface Question {
  type: string
  content: string
  options?: string[]
  answer: string
}

const questions = ref<Question[]>([])
const currentQuestion = ref<Question>()
const currentQuestionIndex = ref<number>(0)
const generateMode = ref<boolean>(false)
const nextQuestion = () => {
  if (generateMode.value) {
    currentQuestionIndex.value = Math.floor(Math.random() * questions.value.length)
  } else {
    currentQuestionIndex.value = currentQuestionIndex.value + 1
  }
}
const prevQuestion = () => {
  currentQuestionIndex.value = currentQuestionIndex.value - 1
}
const getQuestions = (url: string) => {
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      questions.value = data
      currentQuestion.value = data[currentQuestionIndex.value - 1]
      nextTick(() => {
        if (memoryMode.value) {
          const listItems = document.querySelectorAll('.n-list-item') as NodeListOf<HTMLElement>
          listItems.forEach((item: HTMLElement) => {
            if (item.dataset.rightFlag === 'true') {
              item.style.backgroundColor = '#67c23a'
              item.style.color = '#fff'
            }
          })
        }
      })
    })
}

const error_flag = ref<boolean>(false)
const right_num = ref<number>(0)
const checkAnswer = (e: Event) => {
  const element = e.currentTarget as HTMLElement
  const count = element.dataset.rightNum
  if (element.dataset.rightFlag === 'true') {
    element.style.backgroundColor = '#67c23a'
    right_num.value = right_num.value + 1
    if (!error_flag.value && right_num.value === Number(count)) {
      setTimeout(() => {
        if (!error_flag.value) {
          nextQuestion()
        }
      }, 500)
    }
  } else {
    element.style.backgroundColor = '#f56c6c'
    error_flag.value = true
  }
  element.style.color = '#fff'
}

const getQuestionType = (type?: string) => {
  switch (type) {
    case 'essay':
      return '解答题'
    case 'true_or_false':
      return '判断题'
    case 'single_choice':
      return '单选题'
    case 'multiple_choice':
      return '多选题'
    case 'fill_blank':
      return '填空题'
    default:
      return '未知题型'
  }
}

const showSettings = ref<boolean>(false)

onMounted(() => {
  const questionChosenValue: string = localStorage.getItem('questionChosen')
    ? localStorage.getItem('questionChosen')!
    : 'https://source.yby.zone/ideology/q_mao.json'
  questionChosen.value = questionChosenValue
  const currentQuestionIndexValue: number = localStorage.getItem('currentQuestionIndex')
    ? Number(localStorage.getItem('currentQuestionIndex'))
    : 1
  currentQuestionIndex.value = currentQuestionIndexValue
  const generateModeValue: boolean = localStorage.getItem('generatMode')
    ? Boolean(localStorage.getItem('generatMode'))
    : false
  generateMode.value = generateModeValue
  const memoryModeValue: boolean = localStorage.getItem('memoryMode')
    ? Boolean(localStorage.getItem('memoryMode'))
    : false
  memoryMode.value = memoryModeValue
})

watch(currentQuestionIndex, (newValue) => {
  localStorage.setItem('currentQuestionIndex', newValue.toString())
  currentQuestion.value = questions.value[newValue - 1]
  error_flag.value = false
  right_num.value = 0
  // reset color
  const listItems = document.querySelectorAll('.n-list-item') as NodeListOf<HTMLElement>
  listItems.forEach((item: HTMLElement) => {
    item.style.backgroundColor = '#fff'
    item.style.color = 'var(--n-text-color)'
  })

  nextTick(() => {
    if (memoryMode.value) {
      const listItems = document.querySelectorAll('.n-list-item') as NodeListOf<HTMLElement>
      listItems.forEach((item: HTMLElement) => {
        if (item.dataset.rightFlag === 'true') {
          item.style.backgroundColor = '#67c23a'
          item.style.color = '#fff'
        }
      })
    }
  })
})

watch(generateMode, (newValue) => {
  localStorage.setItem('generateMode', newValue.toString())
})

const memoryMode = ref<boolean>(false)
watch(memoryMode, (newValue) => {
  if (newValue) {
    const listItems = document.querySelectorAll('.n-list-item') as NodeListOf<HTMLElement>
    listItems.forEach((item: HTMLElement) => {
      if (item.dataset.rightFlag === 'true') {
        item.style.backgroundColor = '#67c23a'
        item.style.color = '#fff'
      }
    })
  }
  localStorage.setItem('memoryMode', newValue.toString())
})
</script>

<style scoped>
.card-box {
  width: 420px;
  height: 660px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.card-box-modal {
  max-width: 420px;
  min-height: 660px;
}

.n-card {
  width: 100%;
  height: 100%;
}

.n-list-item {
  border-radius: 5px !important;
}

.n-list-item:hover {
  cursor: pointer;
  background-color: #eeeef0;
}

@media screen and (max-width: 768px) {
  .card-box {
    width: 100%;
    height: 100vh;
    position: relative;
    left: 0;
    top: 0;
    transform: translate(0, 0);
  }

  .card-box-modal {
    width: 100%;
    height: 100vh;
  }
}
</style>
