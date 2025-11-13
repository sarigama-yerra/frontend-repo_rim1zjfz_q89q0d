import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function SectionTitle({ title, subtitle }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
    </div>
  )
}

function ArtworkCard({ item, onInquire }) {
  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition p-4">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        {item.images && item.images[0] ? (
          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">Artwork</div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-gray-900">{item.title}</h3>
        <p className="text-sm text-gray-500">{item.medium || 'Mixed media'} {item.year ? `• ${item.year}` : ''}</p>
        {item.price !== undefined && (
          <p className="mt-1 text-sm text-gray-800">Guide: {item.currency} {item.price}</p>
        )}
        <button onClick={() => onInquire(item)} className="mt-3 w-full py-2 bg-black text-white rounded-lg hover:opacity-90">Inquire</button>
      </div>
    </div>
  )
}

function SupplyCard({ item, onAdd }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">Supply</div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-gray-900">{item.title}</h3>
        <p className="text-sm text-gray-500">{item.brand || 'Generic'} • {item.category}</p>
        <p className="mt-1 text-sm text-gray-800">{item.currency} {item.price}</p>
        <button onClick={() => onAdd(item)} className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add to cart</button>
      </div>
    </div>
  )
}

function PostCard({ p, onLike }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div>
          <p className="font-semibold text-gray-900">{p.author_name}</p>
          <p className="text-sm text-gray-500">{p.tags?.join(' • ')}</p>
        </div>
      </div>
      {p.image_url && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img src={p.image_url} alt="post" className="w-full object-cover" />
        </div>
      )}
      <p className="mt-3 text-gray-800">{p.content}</p>
      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => onLike(p)} className="px-3 py-1.5 rounded-md border text-sm">❤️ {p.likes || 0}</button>
        <button className="px-3 py-1.5 rounded-md border text-sm">Comment</button>
      </div>
    </div>
  )
}

function App() {
  const [artworks, setArtworks] = useState([])
  const [supplies, setSupplies] = useState([])
  const [posts, setPosts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [a, s, p] = await Promise.all([
          fetch(`${API_BASE}/artworks`).then(r => r.json()),
          fetch(`${API_BASE}/supplies`).then(r => r.json()),
          fetch(`${API_BASE}/posts`).then(r => r.json()),
        ])
        setArtworks(a.items || [])
        setSupplies(s.items || [])
        setPosts(p.items || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleInquire = async (item) => {
    const name = prompt(`Your name to inquire about "${item.title}"`)
    const email = prompt('Your email')
    const message = prompt('Message to the artist') || 'Interested in this piece.'
    if (!name || !email) return
    await fetch(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: item.id,
        buyer_name: name,
        buyer_email: email,
        message,
      })
    })
    alert('Inquiry sent! The artist will reach out to you.')
  }

  const handleAddToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === item.id)
      if (existing) return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const checkout = async () => {
    if (cart.length === 0) return alert('Cart is empty')
    const name = prompt('Your name')
    const email = prompt('Email')
    const address = prompt('Shipping address')
    if (!name || !email || !address) return

    const items = cart.map(c => ({ item_id: c.id, quantity: c.quantity, price: c.price }))
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyer_name: name, buyer_email: email, shipping_address: address, items })
    })
    const data = await res.json()
    alert(`Order placed! Subtotal: ${data.subtotal}`)
    setCart([])
  }

  const likePost = async (p) => {
    await fetch(`${API_BASE}/posts/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: p.id })
    })
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, likes: (x.likes || 0) + 1 } : x))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-indigo-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-extrabold tracking-tight">ArtFlow</div>
          <nav className="flex items-center gap-6 text-sm text-gray-700">
            <a href="#artworks" className="hover:text-black">Artworks</a>
            <a href="#supplies" className="hover:text-black">Supplies</a>
            <a href="#community" className="hover:text-black">Community</a>
          </nav>
          <button onClick={checkout} className="px-3 py-1.5 rounded-md bg-black text-white text-sm">Cart ({cart.reduce((a,c)=>a+c.quantity,0)})</button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">A home for artists, collectors, and makers</h1>
            <p className="mt-3 text-gray-600">Discover original art via rich showcases, inquire directly with artists, shop quality art supplies, and connect with a creative community — all in one place.</p>
            <div className="mt-5 flex gap-3">
              <a href="#artworks" className="px-4 py-2 rounded-lg bg-black text-white">Explore Artworks</a>
              <a href="#community" className="px-4 py-2 rounded-lg border">Join Community</a>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-tr from-rose-100 to-indigo-100 p-6">
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_,i)=> (
                <div key={i} className="aspect-square rounded-lg bg-white/70" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="artworks" className="max-w-6xl mx-auto px-4 py-8">
        <SectionTitle title="Curated Showcases" subtitle="Inquire to start a conversation — no instant checkout" />
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {artworks.map(a => <ArtworkCard key={a.id} item={a} onInquire={handleInquire} />)}
          </div>
        )}
      </section>

      <section id="supplies" className="max-w-6xl mx-auto px-4 py-8">
        <SectionTitle title="Art Supplies" subtitle="Quality tools to power your practice" />
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {supplies.map(s => <SupplyCard key={s.id} item={s} onAdd={handleAddToCart} />)}
          </div>
        )}
      </section>

      <section id="community" className="max-w-3xl mx-auto px-4 py-8">
        <SectionTitle title="Community" subtitle="Share works-in-progress, ask questions, and cheer each other on" />
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            {posts.map(p => <PostCard key={p.id} p={p} onLike={likePost} />)}
          </div>
        )}
      </section>

      <footer className="text-center text-sm text-gray-500 py-10">© {new Date().getFullYear()} ArtFlow</footer>
    </div>
  )
}

export default App
