import { useCallback, useState } from 'react'
import type { PageId } from './types'
import { CURRENT_USER } from './types'
import { ThemeProvider } from './context/ThemeContext'
import { Layout } from './components/Layout'
import { Obligations } from './pages/Obligations'
import { Renewals } from './pages/Renewals'

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('obligations')

  const navigate = useCallback((page: PageId) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }, [])

  const page = (() => {
    switch (currentPage) {
      case 'renewals': return <Renewals navigate={navigate} tab="overview" />
      case 'renewals-all': return <Renewals navigate={navigate} tab="all" />
      case 'renewals-calendar': return <Renewals navigate={navigate} tab="calendar" />
      case 'renewal-details': return <Renewals navigate={navigate} tab="details" />
      case 'obligations':
      default: return <Obligations navigate={navigate} />
    }
  })()

  return (
    <ThemeProvider>
      <Layout currentPage={currentPage} navigate={navigate} user={CURRENT_USER}>
        {page}
      </Layout>
    </ThemeProvider>
  )
}
