import { useRef } from 'react'

import { Button } from '@/shared/ui/button/Button'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './RichTextEditor.module.css'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
}

export type { RichTextEditorProps }
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newValue)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = start + before.length + selectedText.length
    })
  }

  const insertHeading = () => {
    insertAtCursor('<h2>', '</h2>')
  }

  const insertList = () => {
    insertAtCursor('<ul><li>', '</li></ul>')
  }

  const insertLink = () => {
    const url = window.prompt('Введите URL ссылки:')
    if (url) {
      insertAtCursor(`<a href="${url}">${url}</a>`, '')
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <Button size="sm" variant="ghost" onClick={insertHeading}>Заголовок</Button>
        <Button size="sm" variant="ghost" onClick={insertList}>Список</Button>
        <Button size="sm" variant="ghost" onClick={insertLink}>Ссылка</Button>
      </div>
      <TextField
        multiline
        label="Дополнительный текст"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        ref={textareaRef as never}
      />
    </div>
  )
}
