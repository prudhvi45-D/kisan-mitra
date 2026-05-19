import { Router, Request, Response } from 'express'

const router = Router()

// Lightweight rule-based assistant stub
router.post('/chat', async (req: Request, res: Response) => {
  const msg: string = (req.body?.message || '').toString()
  const role: string = (req.body?.role || '').toString()
  const lang: string = (req.body?.lang || 'en').toString() // en, hi, te

  if (!msg) return res.status(400).json({ message: 'message required' })

  const lower = msg.toLowerCase()
  let reply = ''

  // === TELUGU (TE) ===
  if (lang === 'te') {
    if (role === 'buyer') {
      if (lower.includes('ధర') || lower.includes('price')) reply = 'మీరు జాబితాల పేజీలో కనిష్ట/గరిష్ట ధర ఫిల్టర్‌లను ఉపయోగించి ధరల ఆధారంగా చూడవచ్చు. నాణ్యత కోసం అత్యధిక రేటింగ్ పొందిన రైతుల (≥ 3★) కోసం చూడండి.'
      else if (lower.includes('సంభాషణ') || lower.includes('మాట') || lower.includes('chat')) reply = 'ఏదైనా జాబితాను తెరిచి, రైతుతో మాట్లాడటానికి క్లిక్ చేయండి. మీకు కొత్త సందేశాలు వచ్చినప్పుడు చాట్ బ్యాడ్జ్ కనిపిస్తుంది.'
      else reply = 'కొనుగోలుదారుగా, జాబితాలలో శోధన మరియు ఫిల్టర్‌లను ప్రయత్నించండి. జాబితాను చూసిన తర్వాత మీరు రైతుకు రేటింగ్ ఇవ్వవచ్చు.'
    } else if (role === 'farmer') {
      if (lower.includes('ఎక్కించు') || lower.includes('అప్‌లోడ్') || lower.includes('upload')) reply = 'జాబితాను సృష్టించడానికి "ఎక్కించు" (Upload) కి వెళ్లండి. మెరుగైన నాణ్యత స్కోరు మరియు ధర సూచన కోసం చిత్రాలను జోడించండి.'
      else if (lower.includes('అమ్మబడింది') || lower.includes('sold')) reply = '"నా జాబితాలు" (My Listings) తెరిచి, జాబితాను ఎంచుకుని, దానిని "అమ్మబడింది" అని గుర్తించండి.'
      else reply = 'రైతుగా, జాబితాలను సృష్టించడానికి "ఎక్కించు" మరియు వాటిని నిర్వహించడానికి "నా జాబితాలు" ఉపయోగించండి. చాట్ ద్వారా కొనుగోలుదారులతో మాట్లాడండి.'
    } else if (role === 'admin') {
      if (lower.includes('ధర') || lower.includes('price')) reply = 'నేటి పంట ధరలను సెట్ చేయడానికి అడ్మిన్ → మార్కెట్ ధరలు ఉపయోగించండి. అవి అప్‌లోడ్‌లు మరియు సూచనలతో సమకాలీకరిస్తాయి.'
      else if (lower.includes('డాష్‌బోర్డ్') || lower.includes('dashboard')) reply = 'అడ్మిన్ డాష్‌బోర్డ్ వినియోగదారులు, జాబితాలు మరియు కొనుగోలుదారుల ఫీడ్‌బ్యాక్ ఆధారంగా అత్యధిక రేటింగ్ పొందిన రైతులను (≥ 3★) చూపిస్తుంది.'
      else reply = 'నిర్వాహకుడిగా, "మార్కెట్ ధరలు" లో ధరలను నిర్వహించండి మరియు "డాష్‌బోర్డ్" లో విశ్లేషణలను సమీక్షించండి.'
    }

    if (!reply) {
      if (lower.includes('సహాయం') || lower.includes('help')) reply = 'మీరు ఏమి చేయాలనుకుంటున్నారో చెప్పండి (ఉదా., "బియ్యం ధర ఎంత", "జాబితాను ఎలా ఎక్కించాలి", లేదా "ధరలను ఎలా సెట్ చేయాలి").'
      else reply = 'నేను నావిగేషన్, ధరల చిట్కాలు మరియు వర్క్‌ఫ్లోల కోసం సహాయం చేయగలను. ఫిల్టర్‌లు, అప్‌లోడ్‌లు లేదా డాష్‌బోర్డ్ గురించి అడగడానికి ప్రయత్నించండి.'
    }
  }

  // === HINDI (HI) ===
  else if (lang === 'hi') {
    if (role === 'buyer') {
      if (lower.includes('कीमत') || lower.includes('मूल्य') || lower.includes('price')) reply = 'आप लिस्टिंग पेज पर न्यूनतम/अधिकतम मूल्य फिल्टर का उपयोग करके कीमतों के आधार पर देख सकते हैं। अच्छी गुणवत्ता के लिए शीर्ष-रेटेड किसानों (≥ 3★) को देखें।'
      else if (lower.includes('संपर्क') || lower.includes('बात') || lower.includes('chat')) reply = 'किसी भी लिस्टिंग को खोलें और किसान से चैट करने के लिए क्लिक करें। जब आपके पास नए संदेश होंगे तो चैट बैज दिखाई देगा।'
      else reply = 'एक खरीदार के रूप में, लिस्टिंग पर खोज और फिल्टर का प्रयास करें। आप लिस्टिंग देखने के बाद किसान को रेटिंग दे सकते हैं।'
    } else if (role === 'farmer') {
      if (lower.includes('अपलोड') || lower.includes('upload')) reply = 'लिस्टिंग बनाने के लिए "अपलोड" पर जाएं। बेहतर गुणवत्ता स्कोर और मूल्य सुझाव के लिए चित्र जोड़ें।'
      else if (lower.includes('बिक') || lower.includes('sold')) reply = '"मेरी सूचियां" खोलें, एक लिस्टिंग चुनें, और उसे "बिक गया" के रूप में चिह्नित करें।'
      else reply = 'एक किसान के रूप में, लिस्टिंग बनाने के लिए "अपलोड" और उन्हें प्रबंधित करने के लिए "मेरी सूचियां" का उपयोग करें। चैट के माध्यम से खरीदारों से जुड़ें।'
    } else if (role === 'admin') {
      if (lower.includes('बाजार') || lower.includes('कीमत') || lower.includes('price')) reply = 'आज की फसल की कीमतें सेट करने के लिए एडमिन → बाजार मूल्य का उपयोग करें। वे अपलोड और सुझावों के साथ सिंक होती हैं।'
      else if (lower.includes('डैशबोर्ड') || lower.includes('dashboard')) reply = 'एडमिन डैशबोर्ड खरीदार फीडबैक के आधार पर कुल योग, लिस्टिंग और शीर्ष-रेटेड किसानों (≥ 3★) को दिखाता है।'
      else reply = 'एक एडमिन के रूप में, "बाजार मूल्य" में कीमतों का प्रबंधन करें और "डैशबोर्ड" में एनालिटिक्स की समीक्षा करें।'
    }

    if (!reply) {
      if (lower.includes('मदद') || lower.includes('help')) reply = 'मुझे बताएं कि आप क्या करना चाहते हैं (उदाहरण के लिए, "चावल की कीमत", "लिस्टिंग कैसे अपलोड करें", या "आज की कीमतें सेट करें")।'
      else reply = 'मैं खरीदारों, किसानों और एडमिन के लिए नेविगेशन, मूल्य निर्धारण सुझावों और कार्यप्रवाह में मदद कर सकता हूं। फिल्टर, अपलोड या डैशबोर्ड के बारे में पूछने का प्रयास करें।'
    }
  }

  // === ENGLISH (EN) - DEFAULT ===
  else {
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
  }

  res.json({ reply })
})

export default router
