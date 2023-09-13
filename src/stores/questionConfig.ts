import { defineStore } from 'pinia'

type Question = {
  type: 'essay' | 'true_or_false' | 'single_choice' | 'multiple_choice' | 'fill_blank'
  options?: string[]
  content: string | string[]
  answer: string
  answerd?: boolean
}

type QuestionsList = {
  id: string
  name: string
  questions: Question[]
}

type Repo = {
  name: string
  url: string
  description: string
}

type Record = {
  id: string
  index: number
}

type Errors = {
  id: string
  questions: Question[]
}

// questionConfig.ts
export const questionConfig = defineStore('questionConfig', {
  state: () => ({
    questions: [] as QuestionsList[],
    record: [] as Record[],
    errors: [] as Errors[],
    questionNow: '',
    generateMode: false,
    memoryMode: false
  }),
  getters: {},
  actions: {
    async listQuestion(url: string = 'https://ideology.yby.zone/list.json') {
      const res = await fetch(url)
      const data = (await res.json()) as Repo[]
      return data
    },
    addQuestion(url: string, name: string) {
      // download question from url
      // and add it to the questions list
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          this.questions.push({
            id: name + '_' + Date.now(),
            name: name,
            questions: data as Question[]
          })
        })
    },
    deleteQuestion(id: string) {
      this.questions = this.questions.filter((item) => item.id !== id)
    },
    addRecord(id: string, index: number) {
      const find = this.record.find((e) => e.id === id)
      if (find) {
        find.index = index
      } else {
        this.record.push({
          id,
          index
        })
      }
    },
    addError(id: string, question: Question) {
      const find = this.errors.find((e) => e.id === id)
      if (find) {
        find.questions.push(question)
      } else {
        this.errors.push({
          id,
          questions: [question]
        })
      }
    },
    addAnsweredMark(id: string, index: number) {
      const find = this.questions.find((e) => e.id === id)
      if (find) {
        find.questions[index].answerd = true
      }
    }
  },
  persist: true
})
