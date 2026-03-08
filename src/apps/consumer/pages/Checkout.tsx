import { CreditCard, ShieldCheck } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { getCourseBySlug } from '../courseData'

export default function Checkout() {
  const { courseSlug } = useParams()
  const { consumerExperience } = useApp()
  const { storefront } = consumerExperience.courses
  const course = getCourseBySlug(courseSlug || '')

  if (!course) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-olu-muted">Course not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
          <CreditCard size={18} />
        </div>
        <div>
          <h1 className="font-black text-2xl">Checkout</h1>
          <p className="text-olu-muted text-sm">{storefront.description}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-[1.05fr,0.95fr] gap-4">
        <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-olu-muted mb-2">Order summary</p>
          <h2 className="font-bold text-xl">{course.title}</h2>
          <p className="text-sm text-olu-muted mt-2">{course.subtitle}</p>
          <div className="flex items-center justify-between mt-6">
            <span className="text-olu-muted">Price</span>
            <span className="font-black text-2xl">${course.price}</span>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#111111] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-sky-300" />
            <p className="font-semibold">Payment CTA</p>
          </div>
          <p className="text-sm text-olu-muted leading-relaxed">
            First version only needs a clear conversion surface, not full payment integration. This page establishes the route and CTA hierarchy.
          </p>
          <button className="mt-6 w-full py-3 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-opacity">
            Complete purchase
          </button>
        </div>
      </div>
    </div>
  )
}
