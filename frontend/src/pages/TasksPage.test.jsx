import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import TasksPage from './TasksPage'
import * as api from '../api'

vi.mock('../api')

const specialist = { id: 2, name: 'Demo Uzman', role: 'specialist' }

const myOpen = {
  id: 10,
  title: 'Duygu kartlarıyla oyna',
  description: 'Kartlardaki 5 duyguyu adlandır.',
  area: 'social',
  dueDate: '2026-11-19',
  status: 'open',
  assignedBy: 2,
}
const myDone = {
  id: 11,
  title: 'Kitap oku',
  description: '',
  area: 'language',
  dueDate: '2026-11-17',
  status: 'done',
  assignedBy: 2,
}
const othersTask = {
  id: 12,
  title: 'Lego ile kule yap',
  description: 'En az 10 parça.',
  area: 'motor',
  dueDate: '2026-11-21',
  status: 'open',
  assignedBy: 1,
}

function fillForm({ title, description, area, dueDate }) {
  fireEvent.change(screen.getByLabelText('Başlık'), { target: { value: title } })
  if (description !== undefined) {
    fireEvent.change(screen.getByLabelText('Açıklama'), { target: { value: description } })
  }
  if (area !== undefined) {
    fireEvent.change(screen.getByLabelText('Gelişim alanı'), { target: { value: area } })
  }
  fireEvent.change(screen.getByLabelText('Son tarih'), { target: { value: dueDate } })
}

describe('TasksPage', () => {
  beforeEach(() => {
    api.getChildren.mockResolvedValue([{ id: 1, name: 'Demo Çocuk' }])
    api.getTasks.mockResolvedValue([myOpen, myDone, othersTask])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('sadece kendi atadığı görevleri durumlarıyla listeler (FR-M4-04)', async () => {
    render(<TasksPage user={specialist} />)

    const list = await screen.findByRole('list', { name: 'Atadığım görevler' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)

    expect(items[0]).toHaveTextContent('Duygu kartlarıyla oyna')
    expect(items[0]).toHaveTextContent('Sosyal · Son tarih: 19.11.2026')
    expect(items[0]).toHaveTextContent('Açık')

    expect(items[1]).toHaveTextContent('Kitap oku')
    expect(items[1]).toHaveTextContent('Tamamlandı')

    expect(screen.queryByText('Lego ile kule yap')).not.toBeInTheDocument()
    expect(api.getTasks).toHaveBeenCalledWith(1)
  })

  test('hiç görev atamamışsa boş mesajı gösterir', async () => {
    api.getTasks.mockResolvedValue([othersTask])
    render(<TasksPage user={specialist} />)

    expect(await screen.findByText('Henüz görev atamadınız.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  test('formu doldurup görevi atar, listeyi yeniler ve formu temizler (FR-M4-01)', async () => {
    api.getTasks.mockResolvedValue([])
    api.createTask.mockResolvedValue(myOpen)
    render(<TasksPage user={specialist} />)
    await screen.findByText('Henüz görev atamadınız.')

    api.getTasks.mockResolvedValue([myOpen])
    fillForm({
      title: 'Duygu kartlarıyla oyna',
      description: 'Kartlardaki 5 duyguyu adlandır.',
      area: 'social',
      dueDate: '2026-11-19',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ata' }))

    expect(await screen.findByText('Duygu kartlarıyla oyna')).toBeInTheDocument()
    expect(api.createTask).toHaveBeenCalledWith(1, {
      title: 'Duygu kartlarıyla oyna',
      description: 'Kartlardaki 5 duyguyu adlandır.',
      area: 'social',
      dueDate: '2026-11-19',
    })
    expect(screen.getByRole('status')).toHaveTextContent('Görev atandı.')
    expect(screen.getByLabelText('Başlık')).toHaveValue('')
    expect(screen.getByLabelText('Son tarih')).toHaveValue('')
  })

  test('açıklama boş bırakılabilir', async () => {
    api.createTask.mockResolvedValue(myDone)
    render(<TasksPage user={specialist} />)
    await screen.findByRole('list', { name: 'Atadığım görevler' })

    fillForm({ title: 'Kitap oku', dueDate: '2026-11-17' })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ata' }))

    await waitFor(() => expect(api.createTask).toHaveBeenCalled())
    expect(api.createTask).toHaveBeenCalledWith(1, {
      title: 'Kitap oku',
      description: '',
      area: 'language',
      dueDate: '2026-11-17',
    })
  })

  test('backend hatasını gösterir ve formu korur', async () => {
    api.createTask.mockRejectedValue(new Error('Geçersiz gelişim alanı'))
    render(<TasksPage user={specialist} />)
    await screen.findByRole('list', { name: 'Atadığım görevler' })

    fillForm({ title: 'Deneme', dueDate: '2026-11-19' })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ata' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Geçersiz gelişim alanı')
    expect(screen.getByLabelText('Başlık')).toHaveValue('Deneme')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  test('görevler yüklenemezse hata gösterir', async () => {
    api.getTasks.mockRejectedValue(new Error('Bu çocuğa erişim yetkiniz yok'))
    render(<TasksPage user={specialist} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Bu çocuğa erişim yetkiniz yok')
  })

  test('bağlı çocuk yoksa mesaj gösterir ve görev atanamaz', async () => {
    api.getChildren.mockResolvedValue([])
    render(<TasksPage user={specialist} />)

    expect(await screen.findByText('Henüz görev atayabileceğiniz bir çocuk yok.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Görevi ata' })).toBeDisabled()
    expect(api.getTasks).not.toHaveBeenCalled()
  })

  test('birden fazla çocuk varsa seçilen çocuğun görevlerini ve atamasını kullanır', async () => {
    api.getChildren.mockResolvedValue([
      { id: 1, name: 'Demo Çocuk' },
      { id: 5, name: 'İkinci Çocuk' },
    ])
    render(<TasksPage user={specialist} />)
    await screen.findByText('Duygu kartlarıyla oyna')

    api.getTasks.mockResolvedValue([])
    fireEvent.change(screen.getByLabelText('Çocuk'), { target: { value: '5' } })

    expect(await screen.findByText('Henüz görev atamadınız.')).toBeInTheDocument()
    expect(api.getTasks).toHaveBeenLastCalledWith(5)

    api.createTask.mockResolvedValue(myOpen)
    fillForm({ title: 'Yeni görev', dueDate: '2026-11-20' })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ata' }))

    await waitFor(() => expect(api.createTask).toHaveBeenCalled())
    expect(api.createTask).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Yeni görev' }))
  })
})
