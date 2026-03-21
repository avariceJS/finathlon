import type {
    ContactsData,
    FooterColumn,
    SocialLink,
  } from '@/pages/home/model/types'
  import { Container } from '@/shared/ui/container/Container'
  
  import styles from './Footer.module.css'
  
  type FooterProps = {
    contacts: ContactsData
    columns: FooterColumn[]
    socials: SocialLink[]
  }
  
  export function Footer({ contacts, columns, socials }: FooterProps) {
    return (
      <footer className={styles.footer}>
        <Container className={styles.inner}>
          <div className={styles.contacts}>
            <p className={styles.title}>Контакты:</p>
            <a className={styles.link} href={`tel:${contacts.phone}`}>
              {contacts.phone}
            </a>
            <a className={styles.link} href={`mailto:${contacts.email}`}>
              {contacts.email}
            </a>
            <p className={styles.meta}>{contacts.address}</p>
          </div>
  
          {columns.map((column) => (
            <div key={column.id} className={styles.column}>
              {column.links.map((link) => (
                <a key={link.label} className={styles.link} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
  
          <div className={styles.column}>
            {socials.map((social) => (
              <a key={social.id} className={styles.link} href={social.href}>
                {social.label}
              </a>
            ))}
          </div>
        </Container>
      </footer>
    )
  }