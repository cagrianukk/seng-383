import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StatsPanel from './StatsPanel'
import * as api from '../api'

vi.mock('../api')

const weekStats = {
  week: '2026-11-16',
  total: { assigned: 3, done: 2, rate: 67 },
  byArea: [
    { area: 'language', assigned: 2, done: 1, rate: 50 },
    { area: 'social', assigned: 0, done: 0, rate: 0 },
    { area: 'motor', assigned: 1, done: 1, rate: 100 },
  ],
}

const emptyStats = {
  week: '2026-11-23',
  total: { assigned: 0, done: 0, rate: 0 },
  byArea: [
    { area: 'language', assigned: 0, done: 0, rate: 0 },
    { area: 'social', assigned: 0, done: 0, rate: 0 },
    { area: 'motor', assigned: 0, done: 0, rate: 0 },
  ],
}

describe('StatsPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 18, 12, 0))
    api.getChildren.mockResolvedValue([{ id: 1, name: 'Demo Çocuk' }])
    api.getStats.mockResolvedValue(weekStats)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  test('bu haftanın toplam tamamlanma oranını gösterir (FR-M7-01)', async () => {
    render(<StatsPanel />)

    expect(await screen.findByText('%67')).toBeInTheDocument()
    expect(screen.getByText('(2 / 3 görev)')).toBeInTheDocument()
    expect(screen.getByText('16.11.2026 – 22.11.2026')).toBeInTheDocument()
    expect(api.getStats).toHaveBeenCalledWith(1, '2026-11-16')
  })

  test('gelişim alanına göre oranları çubuk olarak gösterir (FR-M7-02)', async () => {
    render(<StatsPanel />)
    await screen.findByText('%67')

    expect(screen.getByRole('progressbar', { name: 'Dil' })).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByRole('progressbar', { name: 'Sosyal' })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('progressbar', { name: 'Motor' })).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('1 / 2 · %50')).toBeInTheDocument()
  })

  test('görevsiz haftada hata değil "görev yok" mesajı gösterir (FR-M7-03)', async () => {
    api.getStats.mockResolvedValue(emptyStats)
    render(<StatsPanel />)

    expect(await screen.findByText('Bu hafta için görev yok (0 görev).')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('önceki ve sonraki hafta butonları haftayı değiştirir', async () => {
    render(<StatsPanel />)
    await screen.findByText('%67')

    fireEvent.click(screen.getByRole('button', { name: /Sonraki hafta/ }))
    await waitFor(() => expect(api.getStats).toHaveBeenLastCalledWith(1, '2026-11-23'))
    expect(screen.getByText('23.11.2026 – 29.11.2026')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Önceki hafta/ }))
    fireEvent.click(screen.getByRole('button', { name: /Önceki hafta/ }))
    await waitFor(() => expect(api.getStats).toHaveBeenLastCalledWith(1, '2026-11-09'))
  })

  test('API hatasını gösterir', async () => {
    api.getStats.mockRejectedValue(new Error('Bu çocuğa erişim yetkiniz yok'))
    render(<StatsPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Bu çocuğa erişim yetkiniz yok')
  })
})
