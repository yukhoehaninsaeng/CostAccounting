import { Suspense } from 'react'
import InventoryContent from './_content'

export default function InventoryPage() {
  return (
    <Suspense>
      <InventoryContent />
    </Suspense>
  )
}
