import dynamic from 'next/dynamic'
import BottomNav from '@/components/layout/BottomNav'

const MapClient = dynamic(() => import('./MapClient'), { ssr: false })

export default function MapPage({ searchParams }: { searchParams: { restaurant?: string } }) {
  return (
    <div className="relative bg-black" style={{ height: '100dvh' }}>
      <div className="absolute inset-0 bottom-20">
        <MapClient restaurantId={searchParams.restaurant} />
      </div>
      <BottomNav />
    </div>
  )
}
