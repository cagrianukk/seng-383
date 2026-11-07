import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChildListPage from './ChildListPage'
import * as api from '../api'

vi.mock('../api')

describe('ChildListPage (FR-M2-06)', () => {
  test('uzmanın bağlı olduğu çocukları türüyle gösterir', async () => {
    api.getChildren.mockResolvedValue([{ id: 1, name: 'Demo Çocuk', specialistType: 'psychologist' }])
    render(<ChildListPage />)

    expect(await screen.findByText('Demo Çocuk')).toBeInTheDocument()
    expect(screen.getByText('Psikolog')).toBeInTheDocument()
  })

  test('bağlı çocuk yoksa bilgi mesajı gösterir', async () => {
    api.getChildren.mockResolvedValue([])
    render(<ChildListPage />)

    expect(await screen.findByText('Henüz size bağlı bir çocuk yok.')).toBeInTheDocument()
  })
})
