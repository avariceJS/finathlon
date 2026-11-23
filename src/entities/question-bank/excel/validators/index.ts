import type { QuestionType } from '../../types'
import type { Validator } from '../types'
import { validateSingleChoice } from './single-choice'
import { validateMultipleChoice } from './multiple-choice'
import { validateMatching } from './matching'
import { validateShortAnswer } from './short-answer'
import { validateSequence } from './sequence'

export const VALIDATORS: Record<QuestionType, Validator> = {
  single_choice: validateSingleChoice,
  multiple_choice: validateMultipleChoice,
  matching: validateMatching,
  short_answer: validateShortAnswer,
  sequence: validateSequence,
}