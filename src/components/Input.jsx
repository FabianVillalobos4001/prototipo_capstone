export default function Input({ label, ...props }) {
  return (
    <label className="grid gap-1">
      {label && <span className="text-sm font-medium">{label}</span>}
      <input
        className="border rounded-xl px-3 py-2 outline-none focus:ring-2 ring-black/40"
        {...props}
      />
    </label>
  )
}
