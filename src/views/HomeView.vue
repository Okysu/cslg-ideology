<template>
  <div id="box" class="card-box">
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
          <n-button size="small" circle @click="showDrawer = true">
            <n-icon>
              <ListOutline />
            </n-icon>
          </n-button>
        </n-space>
      </template>
      <n-thing>
        <template #header>
          {{ currentQuestionIndex }}/{{ questions.length }}
          <span>{{ getQuestionType(currentQuestion?.type) }}</span>
        </template>
        <template v-if="errorMode" #header-extra>
          <n-space>
            <n-button size="small" round @click="removeErrorQuestion(currentQuestion!)">
              <n-icon>
                <TrashBinOutline />
              </n-icon>
            </n-button>
            <n-button size="small" round @click="reGetQuestions">
              <n-icon>
                <ExitOutline />
              </n-icon>
            </n-button>
          </n-space>
        </template>
        <n-h3>{{ currentQuestion?.content?.toString() ?? currentQuestion?.content  }}</n-h3>
      </n-thing>
      <template #footer>
        <n-list hoverable clickable>
          <div
            v-if="
              currentQuestion?.type === 'multiple_choice' ||
              currentQuestion?.type === 'single_choice'
            "
          >
            <n-list-item
              @click="checkAnswer"
              :data-right-num="currentQuestion?.answer.split('').length"
              :data-right-flag="
                currentQuestion?.answer.split('').includes(String.fromCharCode(65 + index))
              "
              v-for="(option, index) in currentQuestion?.options"
              :key="index"
            >
              {{ option }}
            </n-list-item>
          </div>
          <div v-else-if="currentQuestion?.type === 'true_or_false'">
            <n-list-item
              @click="checkAnswer"
              :data-right-flag="['对', '错'][index] === currentQuestion?.answer"
              :data-right-num="1"
              v-for="(option, index) in ['正确', '错误']"
              :key="index"
            >
              {{ option }}
            </n-list-item>
          </div>
          <div v-else-if="currentQuestion?.type === 'essay'">
            <n-form-item label="答案" label-placement="left" :show-feedback="false">
              <n-input
                type="textarea"
                :autosize="{
                  maxRows: 20
                }"
                :value="currentQuestion?.answer"
              />
            </n-form-item>
          </div>
          <div v-else-if="currentQuestion?.type === 'fill_blank'">
            <n-list-item v-for="(list, index) in currentQuestion?.answer.split('；')">
              <n-form-item
                :label="`填空 ${index + 1}`"
                label-placement="left"
                :show-feedback="false"
              >
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
              <n-input-number
                :min="1"
                :max="questions.length"
                style="max-width: 90px"
                v-model:value="currentQuestionIndex"
              />
            </n-form-item>
          </div>
          <n-space>
            <n-button v-show="currentQuestionIndex > 1" size="small" round @click="prevQuestion"
              >上一题</n-button
            >
            <n-button
              v-show="currentQuestionIndex < questions.length"
              size="small"
              round
              @click="nextQuestion"
              >下一题</n-button
            >
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
        <n-tabs type="line" animated>
          <n-tab-pane name="settings" tab="基本设置">
            <n-form-item label="显示模式：" label-placement="left">
              <n-switch v-model:value="memoryMode">
                <template #checked> 背题模式 </template>
                <template #unchecked> 普通模式 </template>
              </n-switch>
            </n-form-item>
            <n-form-item label="题库：" label-placement="left">
              <n-select v-model:value="questionChosen" :options="questionOptions" />
            </n-form-item>
          </n-tab-pane>
          <n-tab-pane name="questions" tab="题库商店">
            <n-list hoverable clickable>
              <n-list-item v-for="(item, index) in questionRepo" :key="index" @click="">
                <n-thing :title="item.name" :description="item.description">
                  <template
                    #header-extra
                    v-if="questionslist.find((question) => item.name === question.name)"
                  >
                    <n-tag type="success" size="small"> 已下载 </n-tag>
                  </template>
                  <n-button
                    v-if="!questionslist.find((question) => item.name === question.name)"
                    @click="useQuestionConfig.addQuestion(item.url, item.name)"
                    size="small"
                  >
                    下载
                  </n-button>
                </n-thing>
              </n-list-item>
            </n-list>
          </n-tab-pane>
          <n-tab-pane name="errors" tab="错题集">
            <n-list hoverable clickable>
              <n-list-item v-for="(item, index) in errors" :key="index" @click="">
                <n-thing
                  :title="questionslist.find((e) => e.id === item.id)?.name"
                  :description="`${item.questions.length} 条`"
                >
                  <n-space>
                    <n-button
                      @click="
                        ;(questions = item.questions),
                          (currentQuestionIndex = 1),
                          (currentQuestion = questions[0]),
                          (errorMode = true)
                      "
                      size="small"
                    >
                      加载错题集
                    </n-button>
                    <n-button
                      size="small"
                      @click=";(item.questions = []), (errorMode = false), reGetQuestions()"
                    >
                      清空错题集
                    </n-button>
                  </n-space>
                </n-thing>
              </n-list-item>
            </n-list>
          </n-tab-pane>
        </n-tabs>
        <template #footer> © Powered by Yby.zone </template>
      </n-card>
    </n-modal>
    <n-drawer display-directive="show" v-model:show="showDrawer" :height="400" placement="top">
      <n-drawer-content title="答题卡">
        <n-space>
          <template v-for="(list, index) in questions">
            <div v-memo="[list]">
              <n-button
                size="medium"
                :type="confirmType(list)"
                circle
                @click=";(currentQuestionIndex = index + 1), (showDrawer = false)"
              >
                {{ index + 1 }}
              </n-button>
            </div>
          </template>
        </n-space>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
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
  NSelect,
  NTabs,
  NTabPane,
  NTag,
  NDrawer,
  NDrawerContent
} from 'naive-ui'
import {
  SettingsOutline,
  CloseOutline,
  TrashBinOutline,
  ExitOutline,
  ListOutline
} from '@vicons/ionicons5'

import { questionConfig } from '@/stores/questionConfig'
import { storeToRefs } from 'pinia'

import SwipeHandler from '@/utils/SwipeScreen'

const useQuestionConfig = questionConfig()

const showDrawer = ref<boolean>(false)

const {
  questions: questionslist,
  questionNow: questionChosen,
  record,
  errors,
  generateMode,
  memoryMode
} = storeToRefs(useQuestionConfig)

const questionRepo = ref<{ name: string; url: string; description: string }[]>([])

const questionOptions = computed(() => {
  return questionslist.value.map((e) => {
    return {
      label: e.name,
      value: e.id
    }
  })
})

useQuestionConfig.listQuestion().then((res) => {
  questionRepo.value = res
})

watch(questionChosen, () => {
  getQuestions(questionChosen.value)
})

const reGetQuestions = () => {
  getQuestions(questionChosen.value)
}

const confirmType = (question: Question) => {
  if (question.answerd === true && !question.error) return 'success'
  if (question.answerd === true && question.error) return 'error'
  return 'default'
}

interface Question {
  type: 'essay' | 'true_or_false' | 'single_choice' | 'multiple_choice' | 'fill_blank'
  options?: string[]
  content: string | string[]
  answer: string
  answerd?: boolean
  error?: boolean
}

const questions = ref<Question[]>([])
const currentQuestion = ref<Question>()
const currentQuestionIndex = ref<number>(0)
const nextQuestion = () => {
  if (generateMode.value) {
    currentQuestionIndex.value = Math.floor(Math.random() * questions.value.length)
  } else {
    if (currentQuestionIndex.value < questions.value.length)
      currentQuestionIndex.value = currentQuestionIndex.value + 1
    else return
  }
  if (errorMode.value) return
  useQuestionConfig.addRecord(questionChosen.value, currentQuestionIndex.value)
}
const prevQuestion = () => {
  if (generateMode.value) {
    currentQuestionIndex.value = Math.floor(Math.random() * questions.value.length)
  } else {
    if (currentQuestionIndex.value > 1) currentQuestionIndex.value = currentQuestionIndex.value - 1
    else return
  }
  if (errorMode.value) return
  useQuestionConfig.addRecord(questionChosen.value, currentQuestionIndex.value)
}

const getQuestions = (id: string) => {
  const questions_chosen = questionslist.value.find((e) => e.id === id)
  questionError.value = errors.value.find((e) => e.id === id)?.questions ?? []
  if (questions_chosen) {
    questions.value = questions_chosen.questions
    const question_record = record.value.find((e) => e.id === id)
    if (question_record) {
      currentQuestionIndex.value = question_record.index
    } else {
      currentQuestionIndex.value = 1
    }
    const question_error = errors.value.find((e) => e.id === id)
    if (question_error) {
      questions.value.forEach((question) => {
        if (question_error.questions.find((e) => e.content === question.content)) {
          question.error = true
        }
      })
    }
  }
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
}

const error_flag = ref<boolean>(false)
const right_num = ref<number>(0)
const checkAnswer = (e: Event) => {
  const element = e.currentTarget as HTMLElement
  const count = element.dataset.rightNum
  useQuestionConfig.addAnsweredMark(questionChosen.value, currentQuestionIndex.value - 1)
  if (element.dataset.rightFlag === 'true') {
    element.style.backgroundColor = '#67c23a'
    right_num.value = right_num.value + 1
    if (!error_flag.value && right_num.value === Number(count)) {
      setTimeout(() => {
        if (!error_flag.value) {
          nextQuestion()
        }
      }, 550)
    }
  } else {
    if (!error_flag.value) {
      addErrorQuestion(currentQuestion.value!)
      currentQuestion.value!.error = true
    }
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
  getQuestions(questionChosen.value)
  const element = document.getElementById('box') as HTMLElement
  new SwipeHandler(element, nextQuestion, prevQuestion)
})

watch(currentQuestionIndex, (newValue) => {
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
})

const questionError = ref<Question[]>([])
const errorMode = ref<boolean>(false)

const addErrorQuestion = (question: Question) => {
  // check if question is already in error list
  const isExist = questionError.value.some((item) => item.content === question.content)
  if (!isExist) {
    useQuestionConfig.addError(questionChosen.value, question)
  }
}

const removeErrorQuestion = (question: Question) => {
  const index = questionError.value.findIndex((item) => item.content === question.content)
  questionError.value.splice(index, 1)
  if (questionError.value.length === 0) {
    errorMode.value = false
    reGetQuestions()
  }
  if (index === questionError.value.length) {
    currentQuestionIndex.value--
  }
  currentQuestion.value = questions.value[currentQuestionIndex.value - 1]
}
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
