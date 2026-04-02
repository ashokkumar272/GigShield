type SummaryCardProps = {
  isProtectedToday: boolean
  potentialPayout: number
}

export function SummaryCard({ isProtectedToday, potentialPayout }: SummaryCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-xl font-bold text-slate-900">
        {isProtectedToday ? "You're covered for today" : 'No protection for today'}
      </h3>

      {isProtectedToday ? (
        <>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">Up to ₹{potentialPayout.toLocaleString('en-IN')}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">We'll automatically send money if needed</p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">Activate plan to stay safe</p>
      )}
    </section>
  )
}
