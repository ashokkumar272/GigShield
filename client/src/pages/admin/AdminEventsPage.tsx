import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import { EventTriggerForm } from '../../components/admin/EventTriggerForm'
import { EventResultPanel } from '../../components/admin/EventResultPanel'
import type { EventTriggerPayload, EventTriggerResponse } from '../../types/api'
import { useToast } from '../../components/common/ToastProvider'

export function AdminEventsPage() {
  const [result, setResult] = useState<EventTriggerResponse | null>(null)
  const { pushToast } = useToast()

  const onSubmit = async (payload: EventTriggerPayload) => {
    const response = await apiClient.triggerEvent(payload)
    pushToast({
      title: 'Event submitted',
      description: `${response.claims_created} claims created`,
      tone: 'success',
    })
    return response
  }

  return (
    <AppShell mode="admin" title="Event Trigger Console" subtitle="Trigger rainfall, AQI, and curfew events manually.">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EventTriggerForm onSubmit={onSubmit} onSuccess={setResult} />
        <EventResultPanel result={result} />
      </div>
    </AppShell>
  )
}
