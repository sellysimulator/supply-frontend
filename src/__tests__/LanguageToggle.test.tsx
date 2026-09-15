import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { LanguageToggle } from '../components/layout/LanguageToggle'

/** A scrap of interface that must follow the toggle. */
function Sample() {
  const { t } = useTranslation()
  return <h1>{t('catalog.title')}</h1>
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('Language toggle', () => {
  it('offers the other language, named in that language', () => {
    render(<LanguageToggle />)
    expect(screen.getByRole('button', { name: 'Cambiar a español' })).toBeInTheDocument()
  })

  it('translates the interface when used, and offers the way back', async () => {
    render(
      <>
        <LanguageToggle />
        <Sample />
      </>,
    )
    expect(screen.getByRole('heading')).toHaveTextContent('Catalog')

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a español' }))

    expect(screen.getByRole('heading')).toHaveTextContent('Catálogo')
    expect(screen.getByRole('button', { name: 'Switch to English' })).toBeInTheDocument()
  })

  it('remembers the choice for the next visit', async () => {
    render(<LanguageToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a español' }))
    expect(window.localStorage.getItem('supply-language')).toBe('es')
  })
})
