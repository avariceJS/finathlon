import { useRef, useEffect } from 'react';
import styles from './RichTextEditor.module.css';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Синхронизация внешнего значения с редактором (только при инициализации)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    const url = prompt('Введите URL ссылки:', 'https://');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>Дополнительный текст</label>
      
      <div className={styles.toolbar}>
        <button type="button" onClick={() => execCommand('bold')} title="Жирный"><b>Ж</b></button>
        <button type="button" onClick={() => execCommand('italic')} title="Курсив"><i>К</i></button>
        <button type="button" onClick={() => execCommand('underline')} title="Подчеркнутый"><u>Ч</u></button>
        <button type="button" onClick={() => execCommand('formatBlock', 'H2')} title="Заголовок">Загаловок</button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Список">Список</button>
        <button type="button" onClick={addLink} title="Ссылка">Ссылка</button>
      </div>

      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{ minHeight: '120px' }} // Компактный размер
      />
    </div>
  );
}