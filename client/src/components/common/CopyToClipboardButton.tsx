import { useState } from 'react'

type CopyToClipboardButtonProps = {
  value: string
  label?: string
}

export function CopyToClipboardButton({ value, label = 'Copy' }: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      onClick={onCopy}
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
