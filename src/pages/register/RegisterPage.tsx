import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import styles from './RegisterPage.module.css';
import { CustomSelect } from '@/shared/ui/custom-select/CustomSelect';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    login: '', password: '',
    lastName: '', firstName: '', middleName: '', email: '', phone: '', birthDate: '',
    country: '', district: '', region: '', zip: '', cityType: '', city: '',
    school: '', grade: '', orphan: '', healthIssues: '',
    instName: '', instAddress: '', instPhone: '', instEmail: '',
    teacherName: '', teacherPhone: '', teacherEmail: '',
    parentName: '', parentPhone: '', parentEmail: '',
    reason: '', financeInterest: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (step < 3) {
      setStep(step + 1);
    } else {
      console.log('Собранные данные:', formData);
      alert('Форма успешно отправлена!');
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
              <h2>Пользователь</h2>
              <div className={styles.grid}>
                <label className={styles.field}>Логин <input required name="login" value={formData.login} onChange={handleChange} className={styles.input} type="text" placeholder="Мой логин*" /></label>
                <label className={styles.field}>Пароль <input required name="password" value={formData.password} onChange={handleChange} className={styles.input} type="password" placeholder="Мой пароль*" /></label>
              </div>

              <hr className={styles.divider} /> 

              <h2>Личные данные</h2>
              <div className={styles.grid}>
                <label className={styles.field}>Фамилия <input required name="lastName" value={formData.lastName} onChange={handleChange} className={styles.input} type="text" placeholder="Моя фамилия*" /></label>
                <label className={styles.field}>Имя <input required name="firstName" value={formData.firstName} onChange={handleChange} className={styles.input} type="text" placeholder="Мое имя*" /></label>
                
                <label className={styles.field}>Отчество <input name="middleName" value={formData.middleName} onChange={handleChange} className={styles.input} type="text" placeholder="Мое отчество (необязательно)" /></label>
                <div className={styles.emptyCell}></div>

                <hr className={styles.innerDivider} /> 

                <label className={styles.field}>E-mail <input required name="email" value={formData.email} onChange={handleChange} className={styles.input} type="email" placeholder="@*" /></label>
                <label className={styles.field}>Телефон <input required name="phone" value={formData.phone} onChange={handleChange} className={styles.input} type="tel" placeholder="+7*" /></label>

                <hr className={styles.innerDivider} /> 

                <label className={styles.field}>Дата рождения <input required name="birthDate" value={formData.birthDate} onChange={handleChange} className={styles.input} type="date" /></label>
                <div className={styles.emptyCell}></div>

                <label className={styles.field}>Страна <input required name="country" value={formData.country} onChange={handleChange} className={styles.input} type="text" placeholder="Моя страна*" /></label>
                <label className={styles.field}>Федеральный округ <input required name="district" value={formData.district} onChange={handleChange} className={styles.input} type="text" placeholder="Центральный, Южный...*" /></label>

                <label className={styles.field}>Субъект РФ <input required name="region" value={formData.region} onChange={handleChange} className={styles.input} type="text" placeholder="Республика, край...*" /></label>
                <label className={styles.field}>Почтовый индекс <input required name="zip" value={formData.zip} onChange={handleChange} className={styles.input} type="text" placeholder="Индекс*" /></label>

                <label className={styles.field}>Тип населенного пункта
                  <CustomSelect 
                    name="cityType" 
                    value={formData.cityType} 
                    onChange={handleSelectChange}
                    placeholder="Выберите тип*"
                    options={[
                      { value: 'city', label: 'Город' },
                      { value: 'village', label: 'Село/Деревня' }
                    ]} 
                  />
                </label>
                <label className={styles.field}>Населенный пункт <input required name="city" value={formData.city} onChange={handleChange} className={styles.input} type="text" placeholder="Город, село...*" /></label>

                <hr className={styles.innerDivider} /> 

                <label className={styles.field}>Школа/Колледж <input required name="school" value={formData.school} onChange={handleChange} className={styles.input} type="text" placeholder="Название*" /></label>
                <label className={styles.field}>Класс/Курс <input required name="grade" value={formData.grade} onChange={handleChange} className={styles.input} type="text" placeholder="Класс*" /></label>
                <hr className={styles.innerDivider} /> 

                <label className={styles.field}>Сирота
                  <CustomSelect 
                    name="orphan" 
                    value={formData.orphan} 
                    onChange={handleSelectChange}
                    placeholder="Выберите вариант*"
                    options={[
                      { value: 'yes', label: 'Да' },
                      { value: 'no', label: 'Нет' }
                    ]} 
                  />
                </label>
                <label className={styles.field}>ОВЗ (ограниченные возможности) <input name="healthIssues" value={formData.healthIssues} onChange={handleChange} className={styles.input} type="text" placeholder="Впишите свой ответ (если есть)" /></label>
              </div>
            </div>
          )}

          {/* ================= ШАГ 2 ================= */}
          {step === 2 && (
            <div className={styles.step}>
              <h2>Личные данные (Образовательное учреждение)</h2>
              <div className={styles.grid}>
                <label className={styles.field}>Название <input required name="instName" value={formData.instName} onChange={handleChange} className={styles.input} type="text" placeholder="Лицей, МБОУ...*" /></label>
                <label className={styles.field}>Адрес <input required name="instAddress" value={formData.instAddress} onChange={handleChange} className={styles.input} type="text" placeholder="ул....*" /></label>
                
                <label className={styles.field}>Телефон <input required name="instPhone" value={formData.instPhone} onChange={handleChange} className={styles.input} type="tel" placeholder="+7*" /></label>
                <label className={styles.field}>E-mail <input required name="instEmail" value={formData.instEmail} onChange={handleChange} className={styles.input} type="email" placeholder="@*" /></label>
              </div>

              <hr className={styles.divider} />

              <h2>Дополнительно</h2>
              <div className={styles.grid}>
                <label className={styles.field}>ФИО учителя <input required name="teacherName" value={formData.teacherName} onChange={handleChange} className={styles.input} type="text" placeholder="ФИО*" /></label>
                <label className={styles.field}>Телефон учителя <input required name="teacherPhone" value={formData.teacherPhone} onChange={handleChange} className={styles.input} type="tel" placeholder="+7*" /></label>
                <label className={styles.field}>E-mail учителя <input required name="teacherEmail" value={formData.teacherEmail} onChange={handleChange} className={styles.input} type="email" placeholder="@*" /></label>
              </div>

              <hr className={styles.divider} />

              <div className={styles.grid}>
                <label className={styles.field}>ФИО родителя/опекуна <input required name="parentName" value={formData.parentName} onChange={handleChange} className={styles.input} type="text" placeholder="ФИО*" /></label>
                <label className={styles.field}>Телефон родителя/опекуна <input required name="parentPhone" value={formData.parentPhone} onChange={handleChange} className={styles.input} type="tel" placeholder="+7*" /></label>
                <label className={styles.field}>E-mail родителя/опекуна <input required name="parentEmail" value={formData.parentEmail} onChange={handleChange} className={styles.input} type="email" placeholder="@*" /></label>
              </div>
            </div>
          )}

          {/* ================= ШАГ 3 ================= */}
          {step === 3 && (
            <div className={styles.step}>
              <label className={styles.field}>
                <h2>Чем вызвано мое решение принять участие в олимпиаде?</h2>
                <textarea required name="reason" value={formData.reason} onChange={handleChange} placeholder="Впишите свой ответ..." className={`${styles.input} ${styles.textarea}`}></textarea>
              </label>

              <label className={styles.field} style={{ marginTop: '32px' }}>
                <h2>Почему меня интересует сфера финансов?</h2>
                <textarea required name="financeInterest" value={formData.financeInterest} onChange={handleChange} placeholder="Впишите свой ответ..." className={`${styles.input} ${styles.textarea}`}></textarea>
              </label>
            </div>
          )}

          <footer className={styles.footer}>
            <p className={styles.legalText}>
              Продолжая, вы соглашаетесь на обработку своих персональных данных на условиях{' '}
              <a href="#">Согласия на обработку персональных данных</a> и принимаете условия{' '}
              <a href="#">Пользовательского соглашения</a>.
            </p>
            <button type="submit" className={styles.submitBtn}>
              {step === 3 ? 'Завершить регистрацию' : 'Продолжить'}
            </button>
          </footer>

        </form>
      </div>
    </div>
  );
};