import { useEffect, useId, useRef, type ClipboardEvent } from 'react'

import { sanitizeRichText } from '@/shared/lib/richText'
import styles from './RichTextEditor.module.css'

export type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const labelId = useId()
  const editorRef = useRef<HTMLDivElement>(null)
  const emittedValue = useRef<string | null>(null)

  useEffect(() => {
    // Do not replace the DOM after each keystroke: doing so resets the selection.
    if (editorRef.current && value !== emittedValue.current) {
      editorRef.current.innerHTML = sanitizeRichText(value)
      emittedValue.current = value
    }
  }, [value])

  const emitChange = () => {
    if (!editorRef.current) return
    const html = sanitizeRichText(editorRef.current.innerHTML)
    emittedValue.current = html
    onChange(html)
  }

  const execCommand = (command: string, argument?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, argument)
    emitChange()
  }

  const addLink = () => {
    const url = window.prompt('Введите URL ссылки:', 'https://')
    if (!url) return
    try {
      const parsed = new URL(url)
      if (!['https:', 'http:', 'mailto:'].includes(parsed.protocol))
        throw new Error('scheme')
      execCommand('createLink', parsed.href)
    } catch {
      window.alert('Используйте ссылку https://, http:// или mailto:')
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const html = event.clipboardData.getData('text/html')
    if (html) execCommand('insertHTML', sanitizeRichText(html))
    else execCommand('insertText', event.clipboardData.getData('text/plain'))
  }

  return (
    <div className={styles.wrapper}>
      <span id={labelId} className={styles.label}>
        Дополнительный текст
      </span>
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Форматирование текста"
        onMouseDown={(event) => event.preventDefault()}
      >
        <button
          type="button"
          onClick={() => execCommand('bold')}
          aria-label="Жирный"
        >
          <b>Ж</b>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          aria-label="Курсив"
        >
          <i>К</i>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          aria-label="Подчёркнутый"
        >
          <u>Ч</u>
        </button>
        <button type="button" onClick={() => execCommand('formatBlock', 'H2')}>
          Заголовок
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
        >
          Список
        </button>
        <button type="button" onClick={addLink}>
          Ссылка
        </button>
      </div>
      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelId}
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={handlePaste}
        onDrop={(event) => event.preventDefault()}
      />
    </div>
  )
}
