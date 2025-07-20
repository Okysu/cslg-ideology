<template>
  <div id="quiz-container" class="card-box">
    <n-card hoverable title="思政课在线题库">
      <template #header-extra>
        <n-space>
          <n-switch v-model:value="isRandomMode">
            <template #checked> 随机模式 </template>
            <template #unchecked> 顺序模式 </template>
          </n-switch>
          <n-button size="small" circle @click="showSettingsModal = true">
            <n-icon>
              <SettingsOutline />
            </n-icon>
          </n-button>
          <n-button size="small" circle @click="showAnswerSheet = true">
            <n-icon>
              <ListOutline />
            </n-icon>
          </n-button>
        </n-space>
      </template>

      <n-thing>
        <template #header>
          {{ currentIndex }}/{{ totalQuestions }}
          <span>{{ questionTypeLabel }}</span>
        </template>
        <template v-if="isErrorMode" #header-extra>
          <n-space>
            <n-button size="small" round @click="removeFromErrorList(currentQuestion!)">
              <n-icon>
                <TrashBinOutline />
              </n-icon>
            </n-button>
            <n-button size="small" round @click="exitErrorMode">
              <n-icon>
                <ExitOutline />
              </n-icon>
            </n-button>
          </n-space>
        </template>
        <n-h3>{{ questionContent }}</n-h3>
      </n-thing>

      <template #footer>
        <n-list hoverable clickable>
          <div v-if="isChoiceQuestion">
            <n-list-item
              v-for="(option, index) in currentQuestion?.options"
              :key="index"
              @click="handleAnswerClick"
              :data-answer-count="correctAnswerCount"
              :data-is-correct="isCorrectOption(index)"
            >
              {{ option }}
            </n-list-item>
          </div>

          <div v-else-if="currentQuestion?.type === 'true_or_false'">
            <n-list-item
              v-for="(option, index) in TRUE_FALSE_OPTIONS"
              :key="index"
              @click="handleAnswerClick"
              :data-is-correct="TRUE_FALSE_VALUES[index] === currentQuestion?.answer"
              :data-answer-count="1"
            >
              {{ option }}
            </n-list-item>
          </div>

          <div v-else-if="currentQuestion?.type === 'essay'">
            <n-form-item label="答案" label-placement="left" :show-feedback="false">
              <n-input
                type="textarea"
                :autosize="{ maxRows: 20 }"
                :value="currentQuestion?.answer"
                readonly
              />
            </n-form-item>
          </div>

          <div v-else-if="currentQuestion?.type === 'fill_blank'">
            <n-list-item v-for="(answer, index) in fillBlankAnswers" :key="index">
              <n-form-item
                :label="`填空 ${index + 1}`"
                label-placement="left"
                :show-feedback="false"
              >
                <n-input type="textarea" autosize :value="answer" readonly />
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
                :max="totalQuestions"
                style="max-width: 90px"
                v-model:value="currentIndex"
              />
            </n-form-item>
          </div>
          <n-space>
            <n-button
              v-show="currentIndex > 1"
              size="small"
              round
              @click="goToPreviousQuestion"
            >
              上一题
            </n-button>
            <n-button
              v-show="currentIndex < totalQuestions"
              size="small"
              round
              @click="goToNextQuestion"
            >
              下一题
            </n-button>
          </n-space>
        </div>
      </template>
    </n-card>

    <n-modal v-model:show="showSettingsModal">
      <n-card class="card-box-modal" title="设置" role="dialog" aria-modal="true">
        <template #header-extra>
          <n-button size="small" circle @click="showSettingsModal = false">
            <n-icon>
              <CloseOutline />
            </n-icon>
          </n-button>
        </template>
        
        <n-tabs type="line" animated>
          <n-tab-pane name="settings" tab="基本设置">
            <n-form-item label="显示模式：" label-placement="left">
              <n-switch v-model:value="isMemoryMode">
                <template #checked> 背题模式 </template>
                <template #unchecked> 普通模式 </template>
              </n-switch>
            </n-form-item>
            <n-form-item label="题库：" label-placement="left">
              <n-select v-model:value="selectedQuestionBankId" :options="questionBankOptions" />
            </n-form-item>
          </n-tab-pane>

          <n-tab-pane name="questions" tab="题库商店">
            <n-form-item label="手动下载：" label-placement="left">
              <n-space vertical>
                <n-input
                  v-model:value="customDownloadUrl"
                  placeholder="请输入题库JSON文件地址"
                  clearable
                />
                <n-input
                  v-model:value="customDownloadName"
                  placeholder="请输入题库名称"
                  clearable
                />
                <n-button
                  @click="downloadCustomQuestionBank"
                  size="small"
                  type="primary"
                  :disabled="!customDownloadUrl || !customDownloadName"
                >
                  下载题库
                </n-button>
              </n-space>
            </n-form-item>
            
            <n-divider />
            
            <n-h4>已下载题库</n-h4>
            <n-list hoverable clickable>
              <n-list-item v-for="(bank, index) in questionBanks" :key="index">
                <n-thing :title="bank.name" :description="`${bank.questions.length} 题`">
                  <template #header-extra>
                    <n-button
                      @click="deleteQuestionBank(bank.id)"
                      size="small"
                      type="error"
                      ghost
                    >
                      删除
                    </n-button>
                  </template>
                </n-thing>
              </n-list-item>
            </n-list>
            
            <n-divider />
            
            <n-h4>在线题库</n-h4>
            <n-list hoverable clickable>
              <n-list-item v-for="(repo, index) in availableQuestionRepositories" :key="index">
                <n-thing :title="repo.name" :description="repo.description">
                  <n-button
                    @click="downloadQuestionBank(repo.url, repo.name)"
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
              <n-list-item v-for="(errorBank, index) in errorQuestionBanks" :key="index">
                <n-thing
                  :title="getQuestionBankName(errorBank.id)"
                  :description="`${errorBank.questions.length} 条`"
                >
                  <n-space>
                    <n-button @click="loadErrorQuestions(errorBank)" size="small">
                      加载错题集
                    </n-button>
                    <n-button size="small" @click="clearErrorQuestions(errorBank)">
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

    <n-drawer 
      display-directive="show" 
      v-model:show="showAnswerSheet"
      :height="400" 
      placement="top"
    >
      <n-drawer-content title="答题卡">
        <div class="answer-sheet-grid">
          <n-button
            v-for="(question, index) in visibleQuestions"
            :key="question.id || index"
            size="medium"
            :type="getQuestionButtonType(question)"
            circle
            @click="jumpToQuestion(index + 1)"
          >
            {{ index + 1 }}
          </n-button>
        </div>
        
        <div 
          v-if="totalQuestions > VISIBLE_QUESTIONS_LIMIT"
          class="load-more-container"
        >
          <n-button 
            v-if="!showAllQuestions"
            @click="loadMoreQuestions"
            size="small"
            type="primary"
            ghost
          >
            加载更多 ({{ totalQuestions - VISIBLE_QUESTIONS_LIMIT }} 题)
          </n-button>
        </div>
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
  NDrawer,
  NDrawerContent,
  NDivider,
  NH4,
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

// 常量定义
const TRUE_FALSE_OPTIONS = ['正确', '错误'] as const
const TRUE_FALSE_VALUES = ['对', '错'] as const
const VISIBLE_QUESTIONS_LIMIT = 100 // 答题卡初始显示数量限制

// 题目类型定义
interface Question {
  type: 'essay' | 'true_or_false' | 'single_choice' | 'multiple_choice' | 'fill_blank'
  options?: string[]
  content: string | string[]
  answer: string
  answerd?: boolean
  error?: boolean
  id?: string | number
}

interface QuestionRepository {
  name: string
  url: string
  description: string
}

// Store相关
const questionStore = questionConfig()
const {
  questions: questionBanks,
  questionNow: selectedQuestionBankId,
  record: studyRecords,
  errors: errorQuestionBanks,
  generateMode: isRandomMode,
  memoryMode: isMemoryMode
} = storeToRefs(questionStore)

// 响应式状态
const showAnswerSheet = ref(false)
const showSettingsModal = ref(false)
const questionRepositories = ref<QuestionRepository[]>([])
const currentQuestions = ref<Question[]>([])
const currentQuestion = ref<Question>()
const currentIndex = ref(1)
const isErrorMode = ref(false)
const isAnswerSubmitted = ref(false)
const correctAnswersSelected = ref(0)
const currentErrorQuestions = ref<Question[]>([])
const showAllQuestions = ref(false)
const customDownloadUrl = ref('')
const customDownloadName = ref('')

// 计算属性
const totalQuestions = computed(() => currentQuestions.value.length)

const questionTypeLabel = computed(() => {
  const typeMap = {
    essay: '解答题',
    true_or_false: '判断题',
    single_choice: '单选题',
    multiple_choice: '多选题',
    fill_blank: '填空题'
  }
  return typeMap[currentQuestion.value?.type as keyof typeof typeMap] || '未知题型'
})

const questionContent = computed(() => {
  const content = currentQuestion.value?.content
  return Array.isArray(content) ? content.join('') : content || ''
})

const isChoiceQuestion = computed(() => {
  const type = currentQuestion.value?.type
  return type === 'multiple_choice' || type === 'single_choice'
})

const correctAnswerCount = computed(() => {
  return currentQuestion.value?.answer.split('').length || 0
})

const fillBlankAnswers = computed(() => {
  return currentQuestion.value?.answer.split('；') || []
})

const questionBankOptions = computed(() => {
  return questionBanks.value.map(bank => ({
    label: bank.name,
    value: bank.id
  }))
})

const visibleQuestions = computed(() => {
  if (showAllQuestions.value || totalQuestions.value <= VISIBLE_QUESTIONS_LIMIT) {
    return currentQuestions.value
  }
  return currentQuestions.value.slice(0, VISIBLE_QUESTIONS_LIMIT)
})

const availableQuestionRepositories = computed(() => {
  return questionRepositories.value.filter(repo => 
    !questionBanks.value.some(bank => bank.name === repo.name)
  )
})

// 初始化
onMounted(async () => {
  try {
    questionRepositories.value = await questionStore.listQuestion()
    loadQuestionBank(selectedQuestionBankId.value)
    initializeSwipeHandler()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

// 监听器
watch(selectedQuestionBankId, (newId) => {
  if (newId) {
    loadQuestionBank(newId)
  }
})

watch(currentIndex, (newIndex) => {
  updateCurrentQuestion(newIndex)
})

watch(isMemoryMode, (newValue) => {
  if (newValue) {
    highlightCorrectAnswers()
  }
})

// 核心功能函数
const loadQuestionBank = (bankId: string) => {
  const selectedBank = questionBanks.value.find(bank => bank.id === bankId)
  if (!selectedBank) return

  currentQuestions.value = [...selectedBank.questions]
  currentErrorQuestions.value = errorQuestionBanks.value.find(e => e.id === bankId)?.questions || []
  
  // 恢复学习进度
  const studyRecord = studyRecords.value.find(record => record.id === bankId)
  currentIndex.value = studyRecord?.index || 1
  
  // 标记错题
  markErrorQuestions()
  
  nextTick(() => {
    if (isMemoryMode.value) {
      highlightCorrectAnswers()
    }
  })
}

const updateCurrentQuestion = (index: number) => {
  if (index < 1 || index > totalQuestions.value) return
  
  currentQuestion.value = currentQuestions.value[index - 1]
  resetAnswerState()
  
  nextTick(() => {
    resetAnswerStyles()
    if (isMemoryMode.value) {
      highlightCorrectAnswers()
    }
  })
}

const goToNextQuestion = () => {
  if (isRandomMode.value) {
    currentIndex.value = Math.floor(Math.random() * totalQuestions.value) + 1
  } else if (currentIndex.value < totalQuestions.value) {
    currentIndex.value++
  }
  
  if (!isErrorMode.value) {
    questionStore.addRecord(selectedQuestionBankId.value, currentIndex.value)
  }
}

const goToPreviousQuestion = () => {
  if (isRandomMode.value) {
    currentIndex.value = Math.floor(Math.random() * totalQuestions.value) + 1
  } else if (currentIndex.value > 1) {
    currentIndex.value--
  }
  
  if (!isErrorMode.value) {
    questionStore.addRecord(selectedQuestionBankId.value, currentIndex.value)
  }
}

const handleAnswerClick = (event: Event) => {
  const element = event.currentTarget as HTMLElement
  const isCorrect = element.dataset.isCorrect === 'true'
  const answerCount = Number(element.dataset.answerCount)
  
  questionStore.addAnsweredMark(selectedQuestionBankId.value, currentIndex.value - 1)
  
  if (isCorrect) {
    element.style.backgroundColor = '#67c23a'
    element.style.color = '#fff'
    correctAnswersSelected.value++
    
    if (!isAnswerSubmitted.value && correctAnswersSelected.value === answerCount) {
      setTimeout(() => {
        if (!isAnswerSubmitted.value) {
          goToNextQuestion()
        }
      }, 550)
    }
  } else {
    if (!isAnswerSubmitted.value) {
        addToErrorList(currentQuestion.value!)
        if (currentQuestion.value) {
          currentQuestion.value.error = true
        }
    }
    
    element.style.backgroundColor = '#f56c6c'
    element.style.color = '#fff'
    
    isAnswerSubmitted.value = true
  }
}

const isCorrectOption = (optionIndex: number): boolean => {
  if (!currentQuestion.value?.answer) return false
  
  const correctAnswers = currentQuestion.value.answer.split('')
  const optionLetter = String.fromCharCode(65 + optionIndex) // A, B, C, D...
  return correctAnswers.includes(optionLetter)
}

// 答题卡相关
const getQuestionButtonType = (question: Question): 'success' | 'error' | 'default' => {
    if (question.answerd === true && !question.error) return 'success'
    if (question.answerd === true && question.error) return 'error'
    return 'default'
}

const jumpToQuestion = (index: number) => {
  currentIndex.value = index
  showAnswerSheet.value = false
}

const loadMoreQuestions = () => {
  showAllQuestions.value = true
}

// 错题集相关
const addToErrorList = (question: Question) => {
  const isAlreadyInErrorList = currentErrorQuestions.value.some(
    item => item.content === question.content
  )
  
  if (!isAlreadyInErrorList) {
    questionStore.addError(selectedQuestionBankId.value, question)
    currentErrorQuestions.value.push(question)
  }
}

const removeFromErrorList = (question: Question) => {
  const index = currentErrorQuestions.value.findIndex(
    item => item.content === question.content
  )
  
  if (index !== -1) {
    currentErrorQuestions.value.splice(index, 1)
    
    if (currentErrorQuestions.value.length === 0) {
      exitErrorMode()
      return
    }
    
    // 调整当前题目索引
    if (index === currentErrorQuestions.value.length) {
      currentIndex.value--
    }
    
    updateCurrentQuestion(currentIndex.value)
  }
}

const loadErrorQuestions = (errorBank: any) => {
  currentQuestions.value = errorBank.questions
  currentIndex.value = 1
  isErrorMode.value = true
  showSettingsModal.value = false
}

const clearErrorQuestions = (errorBank: any) => {
  errorBank.questions = []
  if (isErrorMode.value) {
    exitErrorMode()
  }
}

const exitErrorMode = () => {
  isErrorMode.value = false
  loadQuestionBank(selectedQuestionBankId.value)
}

// 工具函数
const markErrorQuestions = () => {
  currentQuestions.value.forEach(question => {
    const isInErrorList = currentErrorQuestions.value.some(
      errorQuestion => errorQuestion.content === question.content
    )
    question.error = isInErrorList
  })
}

const resetAnswerState = () => {
  isAnswerSubmitted.value = false
  correctAnswersSelected.value = 0
}

const resetAnswerStyles = () => {
  const listItems = document.querySelectorAll('.n-list-item') as NodeListOf<HTMLElement>
  listItems.forEach(item => {
    item.style.backgroundColor = '#fff'
    item.style.color = 'var(--n-text-color)'
  })
}

const highlightCorrectAnswers = () => {
  nextTick(() => {
    const listItems = document.querySelectorAll('.n-list-item') as NodeListOf<HTMLElement>
    listItems.forEach(item => {
      if (item.dataset.isCorrect === 'true') {
        item.style.backgroundColor = '#67c23a'
        item.style.color = '#fff'
      }
    })
  })
}

const initializeSwipeHandler = () => {
  const container = document.getElementById('quiz-container')
  if (container) {
    new SwipeHandler(container, goToNextQuestion, goToPreviousQuestion)
  }
}

// 题库管理
const downloadQuestionBank = (url: string, name: string) => {
  questionStore.addQuestion(url, name)
}

const downloadCustomQuestionBank = () => {
  if (customDownloadUrl.value && customDownloadName.value) {
    questionStore.addQuestion(customDownloadUrl.value, customDownloadName.value)
    // 清空输入框
    customDownloadUrl.value = ''
    customDownloadName.value = ''
  }
}

const deleteQuestionBank = (bankId: string) => {
  // 如果当前选中的题库被删除，需要重新选择
  if (selectedQuestionBankId.value === bankId) {
    const remainingBanks = questionBanks.value.filter(bank => bank.id !== bankId)
    if (remainingBanks.length > 0) {
      selectedQuestionBankId.value = remainingBanks[0].id
    } else {
      selectedQuestionBankId.value = ''
    }
  }
  
  questionStore.deleteQuestion(bankId)
}

const getQuestionBankName = (bankId: string): string => {
  return questionBanks.value.find(bank => bank.id === bankId)?.name || '未知题库'
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
  width: 420px;
  height: 660px;
  overflow-y: auto;
}

.n-card {
  width: 100%;
  height: 100%;
}

.n-list-item {
  border-radius: 5px !important;
  transition: all 0.2s ease;
}

.n-list-item:hover {
  cursor: pointer;
  background-color: #eeeef0;
}

.answer-sheet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.load-more-container {
  text-align: center;
  padding: 20px 0;
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
    overflow-y: auto;
  }
  
  .answer-sheet-grid {
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 8px;
  }
}

.n-modal .n-card {
  display: flex;
  flex-direction: column;
}

.n-modal .n-card .n-card__content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>