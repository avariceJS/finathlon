import assert from 'node:assert/strict'
import {
  readFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test, { after } from 'node:test'
import ts from 'typescript'

// Compile the original modules to a temporary directory and mock only workbook I/O and Supabase.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const source = path.join(repo, 'src/entities/question-bank')
const dir = mkdtempSync(path.join(tmpdir(), 'finathlon-qa-'))
after(() => rmSync(dir, { recursive: true, force: true }))
mkdirSync(path.join(dir, 'validators'), { recursive: true })
const files = [
  'excel/index.ts',
  'excel/validators/index.ts',
  ...[
    'single-choice',
    'multiple-choice',
    'matching',
    'short-answer',
    'sequence',
  ].map((n) => `excel/validators/${n}.ts`),
]
for (const file of files) {
  const raw = readFileSync(path.join(source, file), 'utf8')
  let js = ts.transpileModule(raw, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  js = js.replace(
    /from ['"](\.[^'"]+)['"]/g,
    (_, m) => `from '${m === './validators' ? './validators/index' : m}.mjs'`,
  )
  writeFileSync(
    path.join(dir, file.replace(/^excel\//, '').replace(/\.ts$/, '.mjs')),
    js,
  )
}
writeFileSync(
  path.join(dir, 'xlsx-reader.mjs'),
  'export async function readXlsxRows(f){if(f.throwError)throw new Error(f.throwError);return f.rows}\n',
)
let js = ts.transpileModule(readFileSync(path.join(source, 'api.ts'), 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
js = js.replace("from '@/shared/supabase'", "from './supabase-mock.mjs'")
writeFileSync(path.join(dir, 'api.mjs'), js)
writeFileSync(
  path.join(dir, 'supabase-mock.mjs'),
  `
export const calls=[]
let response={data:null,error:null}
export function setResponse(value){response=value;calls.length=0}
function chain(){return new Proxy(function(){},{get(_target,key){
 if(key==='then')return (resolve,reject)=>Promise.resolve(response).then(resolve,reject)
 return (...args)=>{calls.push({method:String(key),args});return chain()}
}})}
export const supabase={
 from(table){calls.push({method:'from',args:[table]});return chain()},
 rpc(fn,args){calls.push({method:'rpc',args:[fn,args]});return Promise.resolve(response)}
}
`,
)
const { parseAndValidateExcelFile: parse } = await import(
  pathToFileURL(path.join(dir, 'index.mjs')).href
)
const api = await import(pathToFileURL(path.join(dir, 'api.mjs')).href)
const { calls, setResponse } = await import(
  pathToFileURL(path.join(dir, 'supabase-mock.mjs')).href
)
const H = [
  '№',
  'Задание',
  'Балл',
  'Тип',
  'Вопрос',
  'Вар.1',
  'Вар.2',
  'Вар.3',
  'Вар.4',
  'Вар.5',
  'Вар.6',
  'Правильный ответ',
]
const row = (
  n = 1,
  task = 1,
  type = 'Один ответ',
  opts = ['Да', 'Нет'],
  answer = '1',
  points = '2',
) => [
  String(n),
  String(task),
  points,
  type,
  `Вопрос ${n}`,
  ...Array.from({ length: 6 }, (_, i) => opts[i] ?? ''),
  answer,
]
const sample = (...rows) => ({ name: 'qa.xlsx', size: 500, rows: [H, ...rows] })
const hasError = (r, field, line) =>
  r.errors.some(
    (e) => e.field === field && (line === undefined || e.rowNumber === line),
  )
const check = (name, input, verify) =>
  test(name, async () => verify(await parse(input)))

check('Один ответ: корректный индекс', sample(row()), (r) => {
  assert.equal(r.isValid, true)
  assert.equal(r.tasks[0].variants[0].correctAnswer, 1)
})
check(
  'Несколько ответов: допустимая комбинация',
  sample(row(1, 1, 'Несколько ответов', ['A', 'B', 'C'], '1;3')),
  (r) => {
    assert.equal(r.isValid, true)
    assert.deepEqual(r.tasks[0].variants[0].correctAnswer, [1, 3])
  },
)
check(
  'Соответствие: пары',
  sample(
    row(
      1,
      1,
      'Соответствие',
      ['Актив | Имущество', 'Пассив | Обязательство'],
      '',
    ),
  ),
  (r) => assert.equal(r.isValid, true),
)
check(
  'Короткий ответ: альтернативы',
  sample(row(1, 1, 'Короткий ответ', [], 'да;нет')),
  (r) => assert.equal(r.isValid, true),
)
check(
  'Последовательность: упорядоченные варианты',
  sample(row(1, 1, 'Последовательность', ['Шаг 1', 'Шаг 2'], '')),
  (r) => assert.equal(r.isValid, true),
)
check('Два вопроса одного задания', sample(row(1, 5), row(2, 5)), (r) => {
  assert.equal(r.stats.tasksCount, 1)
  assert.equal(r.stats.variantsCount, 2)
})
check(
  'Банк на 150 вопросов',
  sample(
    ...Array.from({ length: 150 }, (_, i) => row(i + 1, Math.floor(i / 3) + 1)),
  ),
  (r) => {
    assert.equal(r.isValid, true)
    assert.equal(r.stats.variantsCount, 150)
  },
)
check('Дублирующийся номер', sample(row(1, 1), row(1, 2)), (r) => {
  assert.equal(r.isValid, false)
  assert.ok(hasError(r, '№', 3))
})
check(
  'Отсутствует текст вопроса',
  sample(row().map((v, i) => (i === 4 ? '' : v))),
  (r) => {
    assert.equal(r.isValid, false)
    assert.ok(hasError(r, 'Вопрос', 2))
  },
)
check(
  'Отрицательный балл',
  sample(row(1, 1, 'Один ответ', ['A', 'B'], '1', '-2')),
  (r) => {
    assert.equal(r.isValid, false)
    assert.ok(hasError(r, 'Балл', 2))
  },
)
check(
  'Неверный правильный ответ',
  sample(row(1, 1, 'Один ответ', ['A', 'B'], '3')),
  (r) => {
    assert.equal(r.isValid, false)
    assert.ok(hasError(r, 'Правильный ответ', 2))
  },
)
check(
  'Типы в рамках задания должны совпадать',
  sample(row(1, 1), row(2, 1, 'Короткий ответ', [], 'да')),
  (r) => {
    assert.equal(r.isValid, false)
    assert.ok(hasError(r, 'Тип', 3))
  },
)
check(
  'Заголовок не совпадает с шаблоном',
  {
    name: 'qa.xlsx',
    size: 500,
    rows: [[...H.slice(0, 4), 'Неверный заголовок', ...H.slice(5)], row()],
  },
  (r) => {
    assert.equal(r.isValid, false)
    assert.ok(hasError(r, 'Колонка 5', 1))
  },
)
check(
  'Баллы с десятичной запятой',
  sample(row(1, 1, 'Один ответ', ['A', 'B'], '1', '0,01')),
  (r) => assert.equal(r.tasks[0].variants[0].points, 0.01),
)
check(
  'Недопустимый нулевой балл',
  sample(row(1, 1, 'Один ответ', ['A', 'B'], '1', '0')),
  (r) => assert.ok(hasError(r, 'Балл', 2)),
)
check(
  'Чтение книги: ошибка передаётся в результат',
  { name: 'qa.xlsx', size: 500, throwError: 'bad workbook' },
  (r) => {
    assert.equal(r.isValid, false)
    assert.ok(hasError(r, 'Файл'))
  },
)

const respond = (data, error = null) => setResponse({ data, error })
test('API: создание не заменяет существующий банк по умолчанию', async () => {
  respond('bank-1')
  const r = await api.saveOrReplaceQuestionBank({
    olympiadId: 'o',
    gradeCategory: '6-7',
    tasks: [],
  })
  assert.equal(r.bankId, 'bank-1')
  assert.equal(calls[0].args[0], 'upsert_question_bank')
  assert.equal(calls[0].args[1].p_replace_existing, false)
})
test('API: замена требует явного признака', async () => {
  respond('bank-1')
  await api.saveOrReplaceQuestionBank({
    olympiadId: 'o',
    gradeCategory: '6-7',
    tasks: [],
    replaceExisting: true,
  })
  assert.equal(calls[0].args[1].p_replace_existing, true)
})
test('API: ошибка дубликата классифицируется', async () => {
  respond(null, { message: 'BANK_ALREADY_EXISTS', details: 'bank-1' })
  await assert.rejects(
    api.saveOrReplaceQuestionBank({
      olympiadId: 'o',
      gradeCategory: '6-7',
      tasks: [],
    }),
    (e) => e instanceof api.BankAlreadyExistsError,
  )
})
test('API: редактирование передаёт нужные поля', async () => {
  respond({
    id: 'v',
    task_id: 't',
    bank_id: 'b',
    row_number: 1,
    question_text: 'Текст',
    options: ['A', 'B'],
    correct_answer: 1,
    points: 2,
    current_version: 2,
    created_at: 'x',
    updated_at: 'x',
  })
  await api.updateQuestionVariant('v', {
    questionText: 'Текст',
    options: ['A', 'B'],
    correctAnswer: 1,
    points: 2,
  })
  assert.deepEqual(calls.find((c) => c.method === 'update').args[0], {
    question_text: 'Текст',
    options: ['A', 'B'],
    correct_answer: 1,
    points: 2,
  })
})
test('API: удаление адресовано выбранному банку', async () => {
  respond(null)
  await api.deleteQuestionBank('bank-1')
  assert.deepEqual(calls.find((c) => c.method === 'eq').args, ['id', 'bank-1'])
})
test('API: ошибка доступа при удалении не скрывается', async () => {
  respond(null, { message: 'Forbidden' })
  await assert.rejects(api.deleteQuestionBank('b'), /Forbidden/)
})
test('API: история запрашивается в обратном хронологическом порядке', async () => {
  respond([])
  await api.getVariantHistory('variant-1')
  assert.deepEqual(calls.find((c) => c.method === 'order').args, [
    'created_at',
    { ascending: false },
  ])
})
