import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import styles from './RegisterPage.module.css';
import { CustomSelect } from '@/shared/ui/custom-select/CustomSelect';

export const RegisterFinalistPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    participationFormat: '',
    citizenshipType: '', 
    venue: '',
    
    passportFio: '',
    passportSeries: '',
    passportNumber: '',
    passportIssuedBy: '',
    passportIssueDate: '',
    
    passportRegistration: '',
    
    foreignCitizenship: '',
    migrationAddress: '',
    university: '',
    
    securityConsent: false
  });

  const [fileName, setFileName] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Данные финалиста:', formData, fileName);
    alert('Данные успешно сохранены!');
    navigate('/');
  };

  const isForeigner = formData.citizenshipType === 'foreign';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        
        <header className={styles.header}>
          <img src="/logoreg.png" alt="Финатлон" className={styles.logoImage} />
          <h1 className={styles.title}>Заполнение данных</h1>
          <button type="button" className={styles.closeBtn} onClick={() => navigate('/')}>✕</button>
        </header>

        <form onSubmit={handleSubmit} className={styles.formContent}>
          
          <div className={styles.step}>
            <h2>Финалистам</h2>
            <div className={styles.grid}>
              
              <label className={styles.field}>Формат участия
                <CustomSelect 
                  name="participationFormat" 
                  value={formData.participationFormat} 
                  onChange={handleSelectChange} 
                  placeholder="Выберите формат*"
                  options={[
                    { value: 'offline', label: 'Очно' },
                    { value: 'online', label: 'Онлайн' }
                  ]} 
                />
              </label>

              <label className={styles.field}>Гражданство
                <CustomSelect 
                  name="citizenshipType" 
                  value={formData.citizenshipType} 
                  onChange={handleSelectChange} 
                  placeholder="Выберите*"
                  options={[
                    { value: 'rf', label: 'РФ' },
                    { value: 'foreign', label: 'Иностранный гражданин' }
                  ]} 
                />
              </label>

              <label className={`${styles.field} ${styles.fullWidth}`}>
                <span>Выбор площадки <span style={{ color: '#a0a0a0', fontWeight: 400 }}>(Секция, ВУЗ, День, Время и Адрес проведения)</span></span>
                <input required name="venue" value={formData.venue} onChange={handleChange} className={styles.input} type="text" placeholder="*" />
              </label>

              <div className={`${styles.field} ${styles.fullWidth}`}>Загрузка Презентации
                <label className={`${styles.input} ${styles.fileUploadLabel}`}>
                  <span className={`${styles.fileText} ${fileName ? styles.fileTextSelected : ''}`}>
                    {fileName || 'pptx*'}
                  </span>
                  <span>📎</span>
                  <input required accept=".ppt,.pptx" type="file" onChange={handleFileChange} />
                </label>
              </div>

            </div>

            <hr className={styles.divider} />

            <h2>Паспортные данные</h2>
            <div className={styles.grid}>
              
              <label className={`${styles.field} ${styles.fullWidth}`}>ФИО
                <input required name="passportFio" value={formData.passportFio} onChange={handleChange} className={styles.input} type="text" />
              </label>

              {isForeigner && (
                <label className={`${styles.field} ${styles.fullWidth}`}>Гражданство
                  <input required name="foreignCitizenship" value={formData.foreignCitizenship} onChange={handleChange} className={styles.input} type="text" />
                </label>
              )}

              <label className={styles.field}>Серия
                <input required name="passportSeries" value={formData.passportSeries} onChange={handleChange} className={styles.input} type="text" />
              </label>
              <label className={styles.field}>Номер
                <input required name="passportNumber" value={formData.passportNumber} onChange={handleChange} className={styles.input} type="text" />
              </label>

              <label className={`${styles.field} ${styles.fullWidth}`}>Кем выдан
                <input required name="passportIssuedBy" value={formData.passportIssuedBy} onChange={handleChange} className={styles.input} type="text" />
              </label>

              <label className={`${styles.field} ${styles.fullWidth}`}>Дата выдачи
                <input required name="passportIssueDate" value={formData.passportIssueDate} onChange={handleChange} className={styles.input} type="date" />
              </label>

              {!isForeigner ? (
                <label className={`${styles.field} ${styles.fullWidth}`}>Регистрация
                  <input required name="passportRegistration" value={formData.passportRegistration} onChange={handleChange} className={styles.input} type="text" />
                </label>
              ) : (
                <>
                  <label className={`${styles.field} ${styles.fullWidth}`}>Адрес регистрации по месту пребывания в РФ <span style={{ color: '#a0a0a0', fontWeight: 400 }}>(миграционный учет)</span>
                    <input required name="migrationAddress" value={formData.migrationAddress} onChange={handleChange} className={styles.input} type="text" />
                  </label>
                  <label className={`${styles.field} ${styles.fullWidth}`}>ВУЗ
                    <input required name="university" value={formData.university} onChange={handleChange} className={styles.input} type="text" />
                  </label>
                </>
              )}

            </div>

            <hr className={styles.divider} />

            <label className={styles.checkboxRow}>
              <input required type="checkbox" name="securityConsent" checked={formData.securityConsent} onChange={handleChange} />
              <span className={styles.checkboxText}>
                Для оформления пропуска на территорию я даю согласие на передачу моих паспортных/визовых данных службе безопасности площадки
              </span>
            </label>

          </div>

          <footer className={styles.footer}>
            <button type="submit" className={styles.submitBtn}>Продолжить</button>
          </footer>

        </form>
      </div>
    </div>
  );
};