import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import WeeklyView from './WeeklyView'
import * as api from '../api'

vi.mock('../api')

const parent = { id: 1, name: 'Demo Veli', role: 'parent' }
const child = { id: 3, name: 'Demo Çocuk', role: 'child' }

const mondayEvent = { id: 1, title: 'Psikolog seansı', startsAt: '2026-11-16T10:00', createdBy: 2 }
const wednesdayEvent = { id: 2, title: 'Yüzme dersi', startsAt: '2026-11-18T15:30', createdBy: 1 }

function fillForm({ title, date, time }) {
  fireEvent.change(screen.getByLabelText('Başlık'), { target: { value: title } })
  fireEvent.change(screen.getByLabelText('Tarih'), { target: { value: date } })
  fireEvent.change(screen.getByLabelText('Saat'), { target: { value: time } })
}

describe('WeeklyView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 18, 12, 0))
    api.getChildren.mockResolvedValue([{ id: 1, name: 'Demo Çocuk' }])
    api.getEvents.mockResolvedValue([mondayEvent, wednesdayEvent])
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  test('bu haftayı açar ve etkinlikleri doğru günde saatiyle gösterir', async () => {
    render(<WeeklyView user={parent} />)

    const monday = await screen.findByRole('list', { name: 'Pazartesi' })
    expect(monday).toHaveTextContent('10:00')
    expect(monday).toHaveTextContent('Psikolog seansı')

    const wednesday = screen.getByRole('list', { name: 'Çarşamba' })
    expect(wednesday).toHaveTextContent('15:30')
    expect(wednesday).toHaveTextContent('Yüzme dersi')

    expect(screen.queryByRole('list', { name: 'Salı' })).not.toBeInTheDocument()
    expect(screen.getByText('16.11.2026 – 22.11.2026')).toBeInTheDocument()
    expect(api.getEvents).toHaveBeenCalledWith(1, '2026-11-16')
  })

  test('boş haftada "Bu hafta etkinlik yok" yazar', async () => {
    api.getEvents.mockResolvedValue([])
    render(<WeeklyView user={parent} />)

    expect(await screen.findByText('Bu hafta etkinlik yok.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  test('önceki ve sonraki hafta butonları haftayı değiştirir', async () => {
    render(<WeeklyView user={parent} />)
    await screen.findByRole('list', { name: 'Pazartesi' })

    fireEvent.click(screen.getByRole('button', { name: /Sonraki hafta/ }))
    await waitFor(() => expect(api.getEvents).toHaveBeenLastCalledWith(1, '2026-11-23'))
    expect(screen.getByText('23.11.2026 – 29.11.2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Önceki hafta/ }))
    fireEvent.click(screen.getByRole('button', { name: /Önceki hafta/ }))
    await waitFor(() => expect(api.getEvents).toHaveBeenLastCalledWith(1, '2026-11-09'))
  })

  test('çocukta ekleme formu yoktur (salt-okunur)', async () => {
    render(<WeeklyView user={child} />)
    await screen.findByRole('list', { name: 'Pazartesi' })

    expect(screen.queryByText('Etkinlik ekle')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Başlık')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Etkinliği ekle/ })).not.toBeInTheDocument()
  })

  test('form gönderilince POST atılır ve liste yenilenir', async () => {
    api.createEvent.mockResolvedValue({ id: 3 })
    render(<WeeklyView user={parent} />)
    await screen.findByRole('list', { name: 'Pazartesi' })

    fillForm({ title: 'Doktor kontrolü', date: '2026-11-19', time: '09:30' })
    fireEvent.click(screen.getByRole('button', { name: 'Etkinliği ekle' }))

    expect(await screen.findByText('Etkinlik eklendi.')).toBeInTheDocument()
    expect(api.createEvent).toHaveBeenCalledWith(1, {
      title: 'Doktor kontrolü',
      startsAt: '2026-11-19T09:30',
    })
    expect(api.getEvents).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText('Başlık')).toHaveValue('')
  })

  test('başka haftaya eklenen etkinlikten sonra o haftaya geçer', async () => {
    api.createEvent.mockResolvedValue({ id: 3 })
    render(<WeeklyView user={parent} />)
    await screen.findByRole('list', { name: 'Pazartesi' })

    fillForm({ title: 'Yüzme dersi', date: '2026-11-25', time: '15:30' })
    fireEvent.click(screen.getByRole('button', { name: 'Etkinliği ekle' }))

    await waitFor(() => expect(api.getEvents).toHaveBeenLastCalledWith(1, '2026-11-23'))
    expect(screen.getByText('23.11.2026 – 29.11.2026')).toBeInTheDocument()
  })

  test('backend hata verirse mesajı gösterir', async () => {
    api.createEvent.mockRejectedValue(new Error('Başlık zorunludur'))
    render(<WeeklyView user={parent} />)
    await screen.findByRole('list', { name: 'Pazartesi' })

    fillForm({ title: ' ', date: '2026-11-19', time: '09:30' })
    fireEvent.click(screen.getByRole('button', { name: 'Etkinliği ekle' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Başlık zorunludur')
  })
})
