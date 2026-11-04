import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from './LoginPage'

describe('LoginPage', () => {
  test('e-posta ve şifre alanlarını ve giriş butonunu gösterir', () => {
    render(<LoginPage onLogin={() => {}} />)

    expect(screen.getByLabelText('E-posta')).toBeInTheDocument()
    expect(screen.getByLabelText('Şifre')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeInTheDocument()
  })

  test('rol seçimi göstermez (FR-M1-02)', () => {
    render(<LoginPage onLogin={() => {}} />)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/rol/i)).not.toBeInTheDocument()
  })

  test('giriş başarısız olursa hata mesajını gösterir (FR-M1-04)', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('E-posta veya şifre hatalı'))
    render(<LoginPage onLogin={onLogin} />)

    fireEvent.change(screen.getByLabelText('E-posta'), {
      target: { value: 'parent@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Şifre'), {
      target: { value: 'yanlis-sifre' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta veya şifre hatalı')
    expect(onLogin).toHaveBeenCalledWith('parent@example.com', 'yanlis-sifre')
  })
})