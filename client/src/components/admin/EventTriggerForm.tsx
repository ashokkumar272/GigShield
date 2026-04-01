import { useState } from 'react'
import type { EventTriggerPayload, EventTriggerResponse } from '../../types/api'
import { TextField } from '../forms/TextField'
import { SelectField } from '../forms/SelectField'
import { SubmitButton } from '../forms/SubmitButton'

type EventTriggerFormProps = {
  onSubmit: (payload: EventTriggerPayload) => Promise<EventTriggerResponse>
  onSuccess: (response: EventTriggerResponse) => void
}

export function EventTriggerForm({ onSubmit, onSuccess }: EventTriggerFormProps) {
  const [city, setCity] = useState('Mumbai')
  const [eventType, setEventType] = useState<EventTriggerPayload['event_type']>('rainfall')
  const [severity, setSeverity] = useState<EventTriggerPayload['severity']>('high')
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await onSubmit({
        city,
        event_type: eventType,
        severity,
        timestamp: new Date(timestamp).toISOString(),
      })
      onSuccess(response)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to trigger event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Trigger Disruption Event</h3>
      <SelectField
        label="Event Type"
        value={eventType}
        onChange={(value) => setEventType(value as EventTriggerPayload['event_type'])}
        options={[
          { label: 'Rainfall', value: 'rainfall' },
          { label: 'AQI', value: 'aqi' },
          { label: 'Curfew Strike', value: 'curfew_strike' },
        ]}
      />
      <SelectField
        label="Severity"
        value={severity}
        onChange={(value) => setSeverity(value as EventTriggerPayload['severity'])}
        options={[
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Critical', value: 'critical' },
        ]}
      />
      <TextField label="City" value={city} onChange={setCity} />
      <TextField label="Timestamp" value={timestamp} onChange={setTimestamp} type="datetime-local" />
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <SubmitButton isLoading={isSubmitting}>Trigger Event</SubmitButton>
    </form>
  )
}
