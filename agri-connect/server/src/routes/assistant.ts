import { Router, Request, Response } from 'express'

const router = Router()

// Lightweight rule-based assistant stub
router.post('/chat', async (req: Request, res: Response) => {
  const msg: string = (req.body?.message || '').toString()
  const role: string = (req.body?.role || '').toString()
  if (!msg) return res.status(400).json({ message: 'message required' })

  const lower = msg.toLowerCase()
  let reply = ''

  // Role-aware quick tips
  if (role === 'buyer') {
    if (lower.includes('price') || lower.includes('pricing')) reply = 'You can filter by price on the Listings page using Min/Max Price. Look for Top-Rated farmers (≥ 3★) for quality.'
    else if (lower.includes('contact') || lower.includes('chat')) reply = 'Open any listing and click to chat with the farmer. A chat badge appears when you have new messages.'
    else reply = 'As a buyer, try search and filters on Listings. You can rate a farmer after viewing a listing using the stars below the card.'
  } else if (role === 'farmer') {
    if (lower.includes('upload') || lower.includes('listing')) reply = 'Go to Upload to create a listing. Add images for a better quality score and suggested price.'
    else if (lower.includes('sold')) reply = 'Open My Listings, choose a listing, and mark it as sold.'
    else reply = 'As a farmer, use Upload to create listings and My Listings to manage them. Engage buyers via Chat.'
  } else if (role === 'admin') {
    if (lower.includes('market') || lower.includes('price')) reply = 'Use Admin → Market Prices to set today’s crop prices. They sync with uploads and suggestions.'
    else if (lower.includes('dashboard')) reply = 'Admin Dashboard shows totals, listings, and Top-Rated Farmers (≥ 3★) based on buyer feedback.'
    else reply = 'As an admin, manage prices in Admin → Market Prices and review analytics in the Admin Dashboard.'
  }

  if (!reply) {
    // Generic fallbacks
    if (lower.includes('help') || lower.includes('how')) reply = 'Tell me what you want to do (e.g., “filter rice under 70”, “upload a listing”, or “set today’s prices”).'
    else reply = 'I can help with navigation, pricing tips, and workflows for buyers, farmers, and admins. Try asking about filters, uploads, or dashboard.'
  }

  res.json({ reply })
})

export default router
