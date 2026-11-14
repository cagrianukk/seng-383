import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import ChildTasksPage from './ChildTasksPage'
import * as api from '../api'

vi.mock('../api')

const openTask = {
  id: 2,
  title: 'Duygu kartlarıyla oyna',
  description: 'Kartlardaki 5 duyguyu adlandır.',
  area: 'social',
  dueDate: '2026-11-19',
  status: 'open',
  assignedBy: 2,
}
const doneTask = {
  id: 1,
  title: '10 dakika kitap oku',
  description: '',
  area: 'language',
  dueDate: '2026-11-17',
  status: 'done',
  assignedBy: 1,
}

describe('ChildTasksPage', () => {
  beforeEach(() => {
    api.getChildren.mockResolvedValue([{ id: 1, name: 'Demo Çocuk' }])
    api.getTasks.mockResolvedValue([doneTask, openTask])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('çocuğun kendi görevlerini alanı ve son tarihiyle listeler (FR-M4-02)', async () => {
    render(<ChildTasksPage />)

    expect(await screen.findByText('Duygu kartlarıyla oyna')).toBeInTheDocument()
    expect(api.getTasks).toHaveBeenCalledWith(1)
    expect(screen.getByText('Sosyal · Son tarih: 19.11.2026')).toBeInTheDocument()
    expect(screen.getByText('Dil · Son tarih: 17.11.2026')).toBeInTheDocument()
  })

  test('açık görevler önce gelir; tamamlanan görevde buton yerine "Tamamlandı" yazar', async () => {
    render(<ChildTasksPage />)
    await screen.findByText('Duygu kartlarıyla oyna')

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Duygu kartlarıyla oyna')
    expect(within(items[0]).getByRole('button', { name: 'Tamamladım' })).toBeInTheDocument()
    expect(within(items[1]).getByText('Tamamlandı')).toBeInTheDocument()
    expect(within(items[1]).queryByRole('button')).not.toBeInTheDocument()
  })

  test('"Tamamladım" görevi tamamlandı olarak işaretler (FR-M4-03)', async () => {
    api.markTaskDone.mockResolvedValue({ ...openTask, status: 'done' })
    render(<ChildTasksPage />)
    await screen.findByText('Duygu kartlarıyla oyna')

    fireEvent.click(screen.getByRole('button', { name: 'Tamamladım' }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Tamamladım' })).not.toBeInTheDocument()
    )
    expect(screen.getAllByText('Tamamlandı')).toHaveLength(2)
    expect(api.markTaskDone).toHaveBeenCalledWith(1, 2)
  })

  test('işaretleme başarısız olursa hata mesajı gösterir ve görev açık kalır', async () => {
    api.markTaskDone.mockRejectedValue(new Error('Bu görevi işaretleme yetkin yok'))
    render(<ChildTasksPage />)
    await screen.findByText('Duygu kartlarıyla oyna')

    fireEvent.click(screen.getByRole('button', { name: 'Tamamladım' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Bu görevi işaretleme yetkin yok')
    expect(screen.getByRole('button', { name: 'Tamamladım' })).toBeInTheDocument()
  })

  test('görev yoksa bilgi mesajı gösterir', async () => {
    api.getTasks.mockResolvedValue([])
    render(<ChildTasksPage />)

    expect(await screen.findByText('Henüz sana atanmış bir görev yok.')).toBeInTheDocument()
  })
})
