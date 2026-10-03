import PageWrapper from '@/components/react-router/PageWrapper'
import { Link } from 'react-router'

const NotFoundPage = () => {
  return (
    <PageWrapper>
      <div className='flex flex-col items-center justify-center min-h-screen text-center text-gray-700'>
        <h1 className='text-5xl font-bold'>404</h1>
        <p className='mt-4 text-lg'>This page could not be found.</p>
        <Link to='/' className='mt-4 text-blue-500 underline'>
          Back to home
        </Link>
      </div>
    </PageWrapper>
  )
}

export default NotFoundPage
