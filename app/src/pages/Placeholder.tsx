import { Link } from 'react-router-dom'

interface PlaceholderProps {
  title: string
  description: string
}

/** Khung trang chờ xây dựng: luôn có tiêu đề, không để trang trắng. */
export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-emerald-900">{title}</h1>
      <p className="mt-4 text-gray-600">{description}</p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
      >
        Về trang chủ
      </Link>
    </main>
  )
}
