import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import styles from './RegisterPage.module.css';
import { CustomSelect } from '@/shared/ui/custom-select/CustomSelect';

export const RegisterFFPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    login: '', firstName: '', lastName: '', middleName: '',
    birthDate: '', phone: '', email: '',
    institution: '', category: '', okso: '', faculty: '', department: '', subdivision: '', course: '',
    section: '', noCoAuthor: false,
    coAuthorName: '', coAuthorEmail: '', coAuthorPhone: '',
    supervisorName: '', supervisorPosition: '', supervisorDegree: '', supervisorEmail: '', supervisorPhone: '',
    consentData: false, consentPublish: false
  });

  const [fileNames, setFileNames] = useState({
    work: '', titlePage: '', antiPlagiarism: ''
  });

  // Логика ограничения возраста (не старше 35 лет)
  const calculateMinDate = () => {
    const today = new Date();
    const minYear = today.getFullYear() - 35;
    return `${minYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileKey: keyof typeof fileNames) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileNames(prev => ({ ...prev, [fileKey]: file.name }));
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
    } else {
      console.log('Данные формы ФФ:', formData, fileNames);
      alert('Регистрация успешно завершена!');
      navigate('/');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <img src="/logoreg.png" alt="Финатлон" className={styles.logoImage} />
          <h1 className={styles.title}>Регистрация</h1>
          <button type="button" className={styles.closeBtn} onClick={() => navigate('/')}>✕</button>
        </header>

        <form onSubmit={handleNext} className={styles.formContent}>
          
          {/* ================= ШАГ 1 ================= */}
          {step === 1 && (
            <div className={styles.step}>
              <h2>Основная информация</h2>
              <div className={styles.grid}>
                <label className={styles.field}>Логин <input required name="login" value={formData.login} onChange={handleChange} className={styles.input} type="text" placeholder="Мой логин*" /></label>
                <label className={styles.field}>Имя <input required name="firstName" value={formData.firstName} onChange={handleChange} className={styles.input} type="text" placeholder="Мое имя*" /></label>
                
                <label className={styles.field}>Фамилия <input required name="lastName" value={formData.lastName} onChange={handleChange} className={styles.input} type="text" placeholder="Моя фамилия*" /></label>
                <label className={styles.field}>Отчество <input name="middleName" value={formData.middleName} onChange={handleChange} className={styles.input} type="text" placeholder="Мое отчество*" /></label>

                <label className={styles.field}>Дата рождения 
                  <input required name="birthDate" value={formData.birthDate} onChange={handleChange} className={styles.input} type="date" min={calculateMinDate()} max={todayStr} />
                </label>
                <label className={styles.field}>Телефон <input required name="phone" value={formData.phone} onChange={handleChange} className={styles.input} type="tel" placeholder="+7*" /></label>

                <label className={styles.field}>E-mail <input required name="email" value={formData.email} onChange={handleChange} className={styles.input} type="email" placeholder="@*" /></label>
              </div>

              <hr className={styles.divider} />

              <h2>Образование и статус</h2>
              <div className={styles.grid}>
                <label className={`${styles.field} ${styles.fullWidth}`}>Полное наименование учебного заведения 
                  <input required name="institution" value={formData.institution} onChange={handleChange} className={styles.input} type="text" placeholder="Название*" />
                </label>

                <label className={styles.field}>Категория участника
                  <CustomSelect 
                    name="category" value={formData.category} onChange={handleSelectChange} placeholder="Выберите категорию*"
                    options={[
                      { value: 'bachelor', label: 'Студент Бакалавриата' },
                      { value: 'master', label: 'Студент Магистратуры' },
                      { value: 'specialist', label: 'Студент Специалитета' },
                      { value: 'phd', label: 'Аспирант' },
                      { value: 'young', label: 'Молодой ученый (до 35 лет)' },
                      { value: 'teacher', label: 'Преподаватель (до 35 лет)' },
                    ]} 
                  />
                </label>
                <label className={styles.field}>Код специальности по ОКСО <input required name="okso" value={formData.okso} onChange={handleChange} className={styles.input} type="text" placeholder="Например 00.00.00*" /></label>

                <label className={styles.field}>Факультет <input required name="faculty" value={formData.faculty} onChange={handleChange} className={styles.input} type="text" /></label>
                <label className={styles.field}>Кафедра <input required name="department" value={formData.department} onChange={handleChange} className={styles.input} type="text" /></label>

                <label className={styles.field}>Подразделение <input required name="subdivision" value={formData.subdivision} onChange={handleChange} className={styles.input} type="text" /></label>
                <label className={styles.field}>Курс <input required name="course" value={formData.course} onChange={handleChange} className={styles.input} type="text" /></label>
              </div>
            </div>
          )}

          {/* ================= ШАГ 2 ================= */}
          {step === 2 && (
            <div className={styles.step}>
              <h2>Выбранная секция</h2>
              <div className={styles.grid}>
                <label className={`${styles.field} ${styles.fullWidth}`}>Выберите секцию
                  <CustomSelect 
                    name="section" value={formData.section} onChange={handleSelectChange} placeholder="Секция не выбрана*"
                    options={[]} /* Пока массив пустой */
                  />
                </label>
              </div>

              <hr className={styles.innerDivider} />

              <label className={styles.checkboxRow}>
                <input type="checkbox" name="noCoAuthor" checked={formData.noCoAuthor} onChange={handleChange} />
                <span className={styles.checkboxText}>
                  Без соавторства и научного руководителя/куратора
                  <span className={styles.checkboxSubText}>(укажите, если научная работа была написана не в соавторстве и без научного руководителя)</span>
                </span>
              </label>

              {!formData.noCoAuthor && (
                <>
                  <h2>В соавторстве</h2>
                  <div className={styles.grid}>
                    <label className={`${styles.field} ${styles.fullWidth}`}>ФИО соавтора <input name="coAuthorName" value={formData.coAuthorName} onChange={handleChange} className={styles.input} type="text" /></label>
                    <label className={styles.field}>E-mail <input name="coAuthorEmail" value={formData.coAuthorEmail} onChange={handleChange} className={styles.input} type="email" /></label>
                    <label className={styles.field}>Телефон <input name="coAuthorPhone" value={formData.coAuthorPhone} onChange={handleChange} className={styles.input} type="tel" /></label>
                  </div>

                  <h2>Научный руководитель</h2>
                  <div className={styles.grid}>
                    <label className={`${styles.field} ${styles.fullWidth}`}>ФИО научного руководителя <input name="supervisorName" value={formData.supervisorName} onChange={handleChange} className={styles.input} type="text" /></label>
                    <label className={`${styles.field} ${styles.fullWidth}`}>Должность <input name="supervisorPosition" value={formData.supervisorPosition} onChange={handleChange} className={styles.input} type="text" /></label>
                    <label className={`${styles.field} ${styles.fullWidth}`}>Ученая степень <input name="supervisorDegree" value={formData.supervisorDegree} onChange={handleChange} className={styles.input} type="text" /></label>
                    <label className={styles.field}>E-mail <input name="supervisorEmail" value={formData.supervisorEmail} onChange={handleChange} className={styles.input} type="email" /></label>
                    <label className={styles.field}>Телефон <input name="supervisorPhone" value={formData.supervisorPhone} onChange={handleChange} className={styles.input} type="tel" /></label>
                  </div>
                </>
              )}

              <h2>Загрузка</h2>
              <div className={styles.grid}>
                
                <div className={styles.field}>Работа
                  <label className={`${styles.input} ${styles.fileUploadLabel}`}>
                    <span className={`${styles.fileText} ${fileNames.work ? styles.fileTextSelected : ''}`}>
                      {fileNames.work || 'doc, docx*'}
                    </span>
                    <span>📎</span>
                    <input required accept=".doc,.docx" type="file" onChange={(e) => handleFileChange(e, 'work')} />
                  </label>
                </div>

                <div className={styles.field}>Титульный лист
                  <label className={`${styles.input} ${styles.fileUploadLabel}`}>
                    <span className={`${styles.fileText} ${fileNames.titlePage ? styles.fileTextSelected : ''}`}>
                      {fileNames.titlePage || 'doc, docx*'}
                    </span>
                    <span>📎</span>
                    <input required accept=".doc,.docx" type="file" onChange={(e) => handleFileChange(e, 'titlePage')} />
                  </label>
                </div>

                <div className={styles.field}>Справка Антиплагиат
                  <label className={`${styles.input} ${styles.fileUploadLabel}`}>
                    <span className={`${styles.fileText} ${fileNames.antiPlagiarism ? styles.fileTextSelected : ''}`}>
                      {fileNames.antiPlagiarism || 'jpg, pdf*'}
                    </span>
                    <span>📎</span>
                    <input required accept=".pdf,.jpg,.jpeg" type="file" onChange={(e) => handleFileChange(e, 'antiPlagiarism')} />
                  </label>
                </div>
              </div>

              <hr className={styles.divider} />

              <label className={styles.checkboxRow}>
                <input required type="checkbox" name="consentData" checked={formData.consentData} onChange={handleChange} />
                <span className={styles.checkboxText}>Даю согласие на обработку персональных данных и получение информационных материалов форума*</span>
              </label>

              <label className={styles.checkboxRow}>
                <input required type="checkbox" name="consentPublish" checked={formData.consentPublish} onChange={handleChange} />
                <span className={styles.checkboxText}>Даю согласие на публикацию конкурсной работы на сайте форума с указанием персональных данных*</span>
              </label>

            </div>
          )}

          <footer className={styles.footer}>
            <button type="submit" className={styles.submitBtn}>
              {step === 2 ? 'Завершить регистрацию' : 'Продолжить'}
            </button>
          </footer>

        </form>
      </div>
    </div>
  );
};