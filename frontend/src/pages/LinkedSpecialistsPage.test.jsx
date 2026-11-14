import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LinkedSpecialistsPage from './LinkedSpecialistsPage'
import * as api from '../api'

vi.mock('../api')

const psychologist = {
  id: 2,
  name: 'Demo Uzman',
  email: 'specialist@example.com',
  specialistType: 'psychologist',
}
const teacher = { id: 4, name: 'Demo Öğretmen', email: 'teacher@example.com', specialistType: 'teacher' }

describe('LinkedSpecialistsPage', () => {
  beforeEach(() => {
    api.getChildren.mockResolvedValue([{ id: 1, name: 'Demo Çocuk' }])
    api.getSpecialists.mockResolvedValue([psychologist])
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetAllMocks()
  })

  test('bağlı uzmanları türüyle listeler (FR-M2-03)', async () => {
    render(<LinkedSpecialistsPage />)
    expect(await screen.findByText('Demo Uzman')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Demo Uzman – Psikolog')
    expect(api.getSpecialists).toHaveBeenCalledWith(1)
  })

  test('uzman bağlar ve listeyi yeniler (FR-M2-01)', async () => {
    api.linkSpecialist.mockResolvedValue(teacher)
    render(<LinkedSpecialistsPage />)
    await screen.findByText('Demo Uzman')

    api.getSpecialists.mockResolvedValue([psychologist, teacher])
    fireEvent.change(screen.getByLabelText('Uzmanın e-postası'), {
      target: { value: 'teacher@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Uzman türü'), { target: { value: 'teacher' } })
    fireEvent.click(screen.getByRole('button', { name: 'Bağla' }))

    expect(await screen.findByText('Demo Öğretmen')).toBeInTheDocument()
    expect(api.linkSpecialist).toHaveBeenCalledWith(1, 'teacher@example.com', 'teacher')
  })

  test('kayıtlı olmayan e-postada hata mesajı gösterir (FR-M2-02)', async () => {
    api.linkSpecialist.mockRejectedValue(new Error('Bu e-posta ile kayıtlı bir uzman bulunamadı'))
    render(<LinkedSpecialistsPage />)
    await screen.findByText('Demo Uzman')

    fireEvent.change(screen.getByLabelText('Uzmanın e-postası'), {
      target: { value: 'yok@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Bağla' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Bu e-posta ile kayıtlı bir uzman bulunamadı'
    )
  })

  test('onay verilmezse bağı kaldırmaz (FR-M2-04)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<LinkedSpecialistsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Bağı kaldır' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(api.unlinkSpecialist).not.toHaveBeenCalled()
  })

  test('onay verilirse bağı kaldırır', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.unlinkSpecialist.mockResolvedValue()
    render(<LinkedSpecialistsPage />)

    const button = await screen.findByRole('button', { name: 'Bağı kaldır' })
    api.getSpecialists.mockResolvedValue([])
    fireEvent.click(button)

    await waitFor(() => expect(api.unlinkSpecialist).toHaveBeenCalledWith(1, 2))
    expect(await screen.findByText('Henüz bağlı uzman yok.')).toBeInTheDocument()
  })
})
