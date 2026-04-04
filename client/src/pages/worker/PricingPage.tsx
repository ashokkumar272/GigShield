import { useEffect, useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { apiClient } from '../../lib/apiClient'
import type {
  PremiumBreakdownResponse,
  SeverityPredictionResponse,
} from '../../types/api'
import { LoadingSkeleton } from '../../components/state/LoadingSkeleton'
import { RetryPanel } from '../../components/state/RetryPanel'
import { PremiumBreakdownCard } from '../../components/worker/PremiumBreakdownCard'
import { SelectField } from '../../components/forms/SelectField'
import { SubmitButton } from '../../components/forms/SubmitButton'
import { TextField } from '../../components/forms/TextField'
import { InlineError } from '../../components/forms/InlineError'

export function PricingPage() {
  const [data, setData] = useState<PremiumBreakdownResponse | null>(null)
  const [prediction, setPrediction] = useState<SeverityPredictionResponse | null>(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionError, setPredictionError] = useState('')

  const [distanceKm, setDistanceKm] = useState('6.5')
  const [weatherCondition, setWeatherCondition] = useState('clear')
  const [trafficLevel, setTrafficLevel] = useState('medium')
  const [vehicleType, setVehicleType] = useState('bike')
  const [temperatureC, setTemperatureC] = useState('30')
  const [humidityPct, setHumidityPct] = useState('65')
  const [precipitationMm, setPrecipitationMm] = useState('1.2')
  const [preparationTimeMin, setPreparationTimeMin] = useState('18')
  const [courierExperienceYrs, setCourierExperienceYrs] = useState('3')
  const [workerAge, setWorkerAge] = useState('28')
  const [workerRating, setWorkerRating] = useState('4.5')
  const [orderType, setOrderType] = useState('delivery')
  const [weatherRisk, setWeatherRisk] = useState('0.35')
  const [trafficRisk, setTrafficRisk] = useState('0.45')
  const [severityScore, setSeverityScore] = useState('55')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      setData(await apiClient.getPricingPreview())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load weekly cost')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleSeveritySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPredictionError('')
    setPredictionLoading(true)

    try {
      const response = await apiClient.predictSeverity({
        distance_km: Number(distanceKm),
        weather_condition: weatherCondition,
        traffic_level: trafficLevel,
        vehicle_type: vehicleType,
        temperature_c: Number(temperatureC),
        humidity_pct: Number(humidityPct),
        precipitation_mm: Number(precipitationMm),
        preparation_time_min: Number(preparationTimeMin),
        courier_experience_yrs: Number(courierExperienceYrs),
        worker_age: Number(workerAge),
        worker_rating: Number(workerRating),
        order_type: orderType,
        weather_risk: Number(weatherRisk),
        traffic_risk: Number(trafficRisk),
        severity_score: Number(severityScore),
      })
      setPrediction(response)
    } catch (submitError) {
      setPredictionError(submitError instanceof Error ? submitError.message : 'Unable to run severity prediction')
      setPrediction(null)
    } finally {
      setPredictionLoading(false)
    }
  }

  return (
    <AppShell
      mode="worker"
      title="Weekly Cost"
      subtitle="Simple view of your weekly amount."
      bannerText="Easy weekly cost and severity risk prediction from your live inputs."
      bannerTone="indigo"
    >
      {loading && <LoadingSkeleton lines={5} />}
      {!loading && error && <RetryPanel title="Unable to load weekly cost" message={error} onRetry={() => void load()} />}
      {!loading && !error && data && <PremiumBreakdownCard data={data} />}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Severity Model Input</h3>
        <p className="mt-1 text-sm text-slate-600">Submit the 15 final datapoints. The backend processes these and returns model output.</p>

        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" onSubmit={handleSeveritySubmit}>
          <TextField label="Distance (km)" value={distanceKm} onChange={setDistanceKm} type="number" />
          <SelectField
            label="Weather Condition"
            value={weatherCondition}
            onChange={setWeatherCondition}
            options={[
              { label: 'Clear', value: 'clear' },
              { label: 'Cloudy', value: 'cloudy' },
              { label: 'Rainy', value: 'rainy' },
              { label: 'Stormy', value: 'stormy' },
              { label: 'Fog', value: 'fog' },
            ]}
          />
          <SelectField
            label="Traffic Level"
            value={trafficLevel}
            onChange={setTrafficLevel}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Severe', value: 'severe' },
            ]}
          />
          <SelectField
            label="Vehicle Type"
            value={vehicleType}
            onChange={setVehicleType}
            options={[
              { label: 'Bike', value: 'bike' },
              { label: 'Scooter', value: 'scooter' },
              { label: 'Cycle', value: 'cycle' },
              { label: 'Motorcycle', value: 'motorcycle' },
              { label: 'EV', value: 'ev' },
            ]}
          />
          <TextField label="Temperature (C)" value={temperatureC} onChange={setTemperatureC} type="number" />
          <TextField label="Humidity (%)" value={humidityPct} onChange={setHumidityPct} type="number" />
          <TextField label="Precipitation (mm)" value={precipitationMm} onChange={setPrecipitationMm} type="number" />
          <TextField
            label="Preparation Time (min)"
            value={preparationTimeMin}
            onChange={setPreparationTimeMin}
            type="number"
          />
          <TextField
            label="Courier Experience (years)"
            value={courierExperienceYrs}
            onChange={setCourierExperienceYrs}
            type="number"
          />
          <TextField label="Worker Age" value={workerAge} onChange={setWorkerAge} type="number" />
          <TextField label="Worker Rating" value={workerRating} onChange={setWorkerRating} type="number" />
          <SelectField
            label="Order Type"
            value={orderType}
            onChange={setOrderType}
            options={[
              { label: 'Delivery', value: 'delivery' },
              { label: 'Bulk', value: 'bulk' },
              { label: 'Express', value: 'express' },
            ]}
          />
          <TextField label="Weather Risk" value={weatherRisk} onChange={setWeatherRisk} type="number" />
          <TextField label="Traffic Risk" value={trafficRisk} onChange={setTrafficRisk} type="number" />
          <TextField label="Severity Score" value={severityScore} onChange={setSeverityScore} type="number" />

          <div className="md:col-span-2 lg:col-span-3">
            <InlineError message={predictionError} />
            <SubmitButton isLoading={predictionLoading}>Predict Severity</SubmitButton>
          </div>
        </form>

        {prediction && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Prediction complete</p>
            <p className="mt-1">Scaled severity: {prediction.predicted_severity_score_scaled.toFixed(4)}</p>
            <p>
              Raw severity:{' '}
              {prediction.predicted_severity_score === null
                ? 'Not available'
                : prediction.predicted_severity_score.toFixed(2)}
            </p>
          </div>
        )}
      </section>
    </AppShell>
  )
}
