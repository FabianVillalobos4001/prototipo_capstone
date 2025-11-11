export default function Button({ children, className='', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl font-semibold shadow-sm active:scale-[.98] bg-black text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
