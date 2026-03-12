import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, DollarSign, Coins, ArrowRight, X } from 'lucide-react'

interface WalletModalProps {
  open: boolean
  onClose: () => void
}

type Step = 'balance' | 'method' | 'amount' | 'confirm'
type Method = 'fiat' | 'usdc' | null

export default function WalletModal({ open, onClose }: WalletModalProps) {
  const [step, setStep] = useState<Step>('balance')
  const [method, setMethod] = useState<Method>(null)
  const [amount, setAmount] = useState('')

  const balances = {
    fiat: 1234.56,
    usdc: 846.25,
  }

  const handleWithdraw = () => {
    // TODO: API call
    alert(`Withdraw ${amount} ${method === 'fiat' ? 'USD' : 'USDC'}`)
    onClose()
    setStep('balance')
    setAmount('')
    setMethod(null)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-olu-surface border border-olu-border rounded-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-olu-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--olu-glass-hover)] flex items-center justify-center">
                <Wallet size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold">Wallet</h3>
                <p className="text-olu-muted text-xs">Manage your earnings</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--olu-glass-hover)] rounded-lg transition-colors">
              <X size={18} className="text-olu-muted" />
            </button>
          </div>

          <div className="p-5">
            {step === 'balance' && (
              <div className="space-y-4">
                {/* Balance Cards */}
                <div className="glass rounded-xl p-4">
                  <p className="text-olu-muted text-xs mb-1">Total Balance</p>
                  <p className="font-black text-2xl">${(balances.fiat + balances.usdc).toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-semibold">Fiat</p>
                    </div>
                    <p className="font-bold text-lg">${balances.fiat.toFixed(2)}</p>
                  </div>

                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins size={16} className="text-cyan-600 dark:text-cyan-400" />
                      <p className="text-xs font-semibold">Stablecoin</p>
                    </div>
                    <p className="font-bold text-lg">{balances.usdc.toFixed(2)} USDC</p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('method')}
                  className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition-opacity"
                >
                  Withdraw
                </button>
              </div>
            )}

            {step === 'method' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold mb-3">Select withdrawal method</p>

                <button
                  onClick={() => { setMethod('fiat'); setStep('amount') }}
                  className="w-full p-4 glass glass-hover rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Fiat Currency</p>
                      <p className="text-olu-muted text-xs">Bank transfer (USD)</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-olu-muted" />
                </button>

                <button
                  onClick={() => { setMethod('usdc'); setStep('amount') }}
                  className="w-full p-4 glass glass-hover rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--olu-accent-bg-strong)] flex items-center justify-center">
                      <Coins size={18} className="text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Stablecoin (USDC)</p>
                      <p className="text-olu-muted text-xs">USDC wallet transfer</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-olu-muted" />
                </button>

                <button
                  onClick={() => setStep('balance')}
                  className="w-full py-2.5 rounded-xl border border-olu-border text-sm font-medium text-olu-muted hover:text-olu-text transition-colors"
                >
                  Back
                </button>
              </div>
            )}

            {step === 'amount' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-1">Withdraw {method === 'fiat' ? 'USD' : 'USDC'}</p>
                  <p className="text-olu-muted text-xs mb-3">
                    Available: {method === 'fiat' ? `$${balances.fiat.toFixed(2)}` : `${balances.usdc.toFixed(2)} USDC`}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-olu-muted uppercase tracking-wider block mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 glass rounded-xl text-sm focus:outline-none border border-olu-border focus:border-white/30 transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('method')}
                    className="flex-1 py-2.5 rounded-xl border border-olu-border text-sm font-medium text-olu-muted hover:text-olu-text transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
