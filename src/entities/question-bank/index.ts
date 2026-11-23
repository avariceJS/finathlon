export type {
  QuestionBankGradeCategory,
  QuestionType,
  MatchingPair,
  CorrectAnswerPayload,
  QuestionVariant,
  QuestionTask,
  QuestionBankSummary,
  QuestionBankDetail,
  ImportVariantInput,
  ImportTaskInput,
  UpdateQuestionVariantInput,
  QuestionVariantHistoryEntry,
} from './types'

export {
  listQuestionBanks,
  findExistingQuestionBank,
  getQuestionBankById,
  BankAlreadyExistsError,
  saveOrReplaceQuestionBank,
  updateQuestionVariant,
  deleteQuestionBank,
  getVariantHistory,
} from './api'

export { parseAndValidateExcelFile } from './excel'
export type { ExcelParseResult, ImportValidationError } from './excel/types'
