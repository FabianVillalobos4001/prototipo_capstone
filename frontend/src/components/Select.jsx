export default function Select({ label, options=[], ...props }) {
  return (
    <label className="grid gap-1">
      {label && <span className="text-sm font-medium">{label}</span>}
      <select
        className="border rounded-xl px-3 py-2 outline-none focus:ring-2 ring-black/40"
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
