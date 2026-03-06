import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Package, DollarSign, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'

// Mock products data
const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Neon City Hoodie', price: 59.99, stock: 45, creatorId: 'luna', creatorName: 'Luna Chen', gradient: 'from-purple-500 to-pink-500' },
  { id: 'p2', name: 'Pixel Pin Set', price: 24.99, stock: 120, creatorId: 'luna', creatorName: 'Luna Chen', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'p3', name: 'Luna Acrylic Stand', price: 34.99, stock: 67, creatorId: 'luna', creatorName: 'Luna Chen', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'p4', name: 'Chibi Luna Plushie', price: 44.99, stock: 12, creatorId: 'luna', creatorName: 'Luna Chen', gradient: 'from-orange-500 to-red-500' },
]

function ProductCard({ product, onAddToCart, isCreator }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="glass glass-hover rounded-2xl overflow-hidden">
      <div className="aspect-square bg-[#1c1c1c] relative">
        <div className={`w-full h-full bg-gradient-to-br ${product.gradient} flex items-center justify-center`}>
          <Package size={48} className="text-white/30" />
        </div>
        {product.stock < 20 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-red-500/90 text-white text-xs font-semibold">
            Low Stock
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm mb-1">{product.name}</h3>
        <p className="text-olu-muted text-xs mb-2">by {product.creatorName}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">${product.price}</span>
          {!isCreator && (
            <button
              onClick={() => onAddToCart(product)}
              className="px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Add to Cart
            </button>
          )}
        </div>
        {isCreator && (
          <div className="mt-2 text-xs text-olu-muted">
            Stock: {product.stock} units
          </div>
        )}
      </div>
    </motion.div>
  )
}

function CreatorShopView() {
  const navigate = useNavigate()
  const myProducts = MOCK_PRODUCTS // In real app, filter by creator

  const totalRevenue = myProducts.reduce((acc, p) => acc + p.price * 10, 0) // Mock sales
  const totalSold = myProducts.reduce((acc, p) => acc + 10, 0) // Mock

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-emerald-400" />
            <p className="text-xs font-semibold text-olu-muted">Revenue</p>
          </div>
          <p className="font-bold text-xl">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-400" />
            <p className="text-xs font-semibold text-olu-muted">Sold</p>
          </div>
          <p className="font-bold text-xl">{totalSold}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-purple-400" />
            <p className="text-xs font-semibold text-olu-muted">Products</p>
          </div>
          <p className="font-bold text-xl">{myProducts.length}</p>
        </div>
      </div>

      {/* Add Product Button */}
      <button
        onClick={() => alert('Add product modal - TODO')}
        className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add New Product
      </button>

      {/* Products Grid */}
      <div>
        <h2 className="font-bold text-lg mb-3">My Products</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {myProducts.map(product => (
            <ProductCard key={product.id} product={product} isCreator={true} />
          ))}
        </div>
      </div>
    </div>
  )
}

function UserShopView() {
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(!showCart)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-white text-black shadow-lg flex items-center justify-center z-40"
        >
          <ShoppingCart size={20} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {cartCount}
          </span>
        </button>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" onClick={() => setShowCart(false)}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-olu-surface border-l border-olu-border p-6 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-bold text-xl mb-4">Shopping Cart</h2>
            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.id} className="glass rounded-xl p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-[#1c1c1c] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-olu-muted text-xs">Qty: {item.quantity}</p>
                    <p className="font-bold text-sm mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-olu-border pt-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => alert('Checkout - TODO')}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition-opacity"
            >
              Checkout
            </button>
          </motion.div>
        </div>
      )}

      {/* Products Grid */}
      <div>
        <h2 className="font-bold text-lg mb-3">All Products</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_PRODUCTS.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} isCreator={false} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Shop() {
  const { currentRole } = useApp()
  const isCreator = currentRole === 'creator'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
          <ShoppingCart size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl">Shop</h1>
          <p className="text-olu-muted text-sm">
            {isCreator ? 'Manage your products' : 'Browse and buy products'}
          </p>
        </div>
      </div>

      {isCreator ? <CreatorShopView /> : <UserShopView />}
    </div>
  )
}
