import { Crown, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { useApp } from '../../../context/AppContext'

export default function Membership() {
  const { consumerExperience } = useApp()
  const { membership } = consumerExperience.community

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
          <Crown size={18} />
        </div>
        <div>
          <h1 className="font-black text-2xl">Membership</h1>
          <p className="text-olu-muted text-sm">{membership.subtitle}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {membership.tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={`rounded-[24px] border p-5 ${
              index === 1
                ? 'bg-white text-black border-white'
                : index === 2
                  ? 'bg-amber-500/10 border-amber-400/20'
                  : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-lg">{tier.name}</p>
              {index === 1 ? <Star size={16} className="text-black" fill="currentColor" /> : <Sparkles size={16} className={index === 2 ? 'text-amber-300' : 'text-white/70'} />}
            </div>
            <p className={`font-black text-3xl ${index === 1 ? 'text-black' : 'text-white'}`}>{tier.price}</p>
            <p className={`text-sm mt-2 ${index === 1 ? 'text-black/72' : 'text-olu-muted'}`}>{tier.note}</p>
            <div className="space-y-2 mt-5">
              {tier.perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2">
                  <ShieldCheck size={14} className={index === 1 ? 'text-black/70' : 'text-emerald-300'} />
                  <p className={`text-sm ${index === 1 ? 'text-black/72' : 'text-white/72'}`}>{perk}</p>
                </div>
              ))}
            </div>
            <button className={`mt-5 w-full py-3 rounded-2xl font-semibold transition-opacity ${index === 1 ? 'bg-black text-white hover:opacity-90' : 'bg-white text-black hover:opacity-90'}`}>
              {tier.name === 'Free' ? 'Stay free' : `Choose ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
