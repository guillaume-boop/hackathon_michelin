'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

type Restaurant = {
  id: string
  name: string
  city: string
  michelin_stars: number
  green_stars: boolean
  lat: number
  lng: number
}

type Photo = {
  file: File
  preview: string
  id: string
}

function markerColor(stars: number, green: boolean) {
  if (green && stars === 0) return '#4ade80'
  if (stars >= 3) return '#E4002B'
  if (stars === 2) return '#f97316'
  return '#facc15'
}

export default function MapClient({ restaurantId }: { restaurantId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const restaurantIdRef = useRef(restaurantId)
  
  // Review modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Detect dark/light mode for modal only
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(isDark)
    }
    
    checkTheme()
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  // ✅ FIX: attach stream to video element AFTER isCameraOpen renders the <video>
  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current
      videoRef.current.play().catch(console.error)
    }
  }, [isCameraOpen])

  const handleOpenModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setRating(0)
    setHoverRating(0)
    setReviewText('')
    setPhotos([])
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRestaurant(null)
    stopCamera()
    photos.forEach(photo => URL.revokeObjectURL(photo.preview))
    setPhotos([])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPhotos: Photo[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    // Reset input so the same file can be selected again
    e.target.value = ''
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id)
      if (photoToRemove) URL.revokeObjectURL(photoToRemove.preview)
      return prev.filter(p => p.id !== id)
    })
  }

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOpen(false)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      })
      // ✅ FIX: store stream in ref, then open camera — useEffect will attach it
      cameraStreamRef.current = stream
      setIsCameraOpen(true)
    } catch (err) {
      console.error('Erreur d\'accès à la caméra:', err)
      alert('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.')
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      const preview = URL.createObjectURL(blob)
      const newPhoto: Photo = {
        file,
        preview,
        id: Math.random().toString(36).substr(2, 9)
      }
      setPhotos(prev => [...prev, newPhoto])
    }, 'image/jpeg', 0.9)
  }

  const handleDoneWithCamera = () => {
    stopCamera()
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Veuillez noter le restaurant')
      return
    }
    if (!reviewText.trim()) {
      alert('Veuillez écrire un avis')
      return
    }

    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append('restaurantId', selectedRestaurant!.id)
    formData.append('rating', rating.toString())
    formData.append('review', reviewText)
    photos.forEach((photo, index) => {
      formData.append(`photo_${index}`, photo.file)
    })
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Review submitted:', {
        restaurantId: selectedRestaurant?.id,
        rating,
        review: reviewText,
        photos: photos.length
      })
      alert(`Merci pour votre avis ! ${photos.length} photo${photos.length > 1 ? 's' : ''} ajoutée${photos.length > 1 ? 's' : ''}`)
      stopCamera()
      handleCloseModal()
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl

    const map = L.map(containerRef.current, { center: [46, 8], zoom: 4, zoomControl: false })
    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      maxZoom: 19,
    }).addTo(map)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (c: { getChildCount: () => number }) => {
        const count = c.getChildCount()
        return L.divIcon({
          html: `<div style="
            width:40px;height:40px;border-radius:50%;
            background:#E4002B;border:3px solid white;
            display:flex;align-items:center;justify-content:center;
            font-weight:900;font-size:13px;color:white;
            box-shadow:0 2px 8px rgba(0,0,0,0.5);
          ">${count}</div>`,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })
      },
    })

    fetch('/api/restaurants')
      .then(r => r.json())
      .then((restaurants: Restaurant[]) => {
        const currentMap = mapRef.current
        if (!currentMap) return

        restaurants.forEach((r) => {
          if (!r.lat || !r.lng) return
          const color = markerColor(r.michelin_stars, r.green_stars)
          const label = r.michelin_stars > 0 ? '★'.repeat(r.michelin_stars) : '🌿'
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
            <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2.5"/>
            <text x="18" y="23" text-anchor="middle" font-size="11" font-weight="bold" fill="white">${label}</text>
            <polygon points="11,32 25,32 18,44" fill="${color}"/>
          </svg>`

          const icon = L.divIcon({ html: svg, className: '', iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -46] })

          const greenBadge = r.green_stars
            ? `<span style="background:#4ade80;color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:999px;margin-left:4px;">🌿</span>`
            : ''

          const marker = L.marker([r.lat, r.lng], { icon })
          
          const popupContent = `
            <div style="font-family:sans-serif;min-width:200px;padding:4px;background:white;color:#1a1a1a;">
              <div style="font-weight:900;font-size:14px;line-height:1.3;margin-bottom:4px;color:#1a1a1a;">${r.name}</div>
              <div style="font-size:11px;color:#666;margin-bottom:8px;">${r.city}</div>
              <div style="display:flex;align-items:center;margin-bottom:12px;">
                <span style="color:${color};font-size:14px;font-weight:600;">${'★'.repeat(r.michelin_stars)}</span>
                ${greenBadge}
              </div>
              <div style="display:flex;gap:8px;justify-content:space-between;">
                <a href="/restaurant/${r.id}"
                  style="flex:1;background:#E4002B;color:white;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px;text-decoration:none;text-align:center;transition:all 0.2s ease;border:none;cursor:pointer;">
                  Voir
                </a>
                <button class="review-btn" data-id="${r.id}" data-name="${r.name}" data-city="${r.city}" data-stars="${r.michelin_stars}" data-green="${r.green_stars}" data-lat="${r.lat}" data-lng="${r.lng}"
                  style="flex:1;background:#f0f0f0;color:#1a1a1a;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px;border:1px solid #ddd;cursor:pointer;transition:all 0.2s ease;">
                  Laisser un avis
                </button>
              </div>
            </div>
          `

          marker.bindPopup(popupContent)

          marker.on('popupopen', () => {
            const reviewBtn = document.querySelector('.review-btn')
            if (reviewBtn) {
              reviewBtn.addEventListener('click', (e) => {
                e.preventDefault()
                const btn = e.currentTarget as HTMLButtonElement
                const restaurantData: Restaurant = {
                  id: btn.dataset.id!,
                  name: btn.dataset.name!,
                  city: btn.dataset.city!,
                  michelin_stars: parseInt(btn.dataset.stars!),
                  green_stars: btn.dataset.green === 'true',
                  lat: parseFloat(btn.dataset.lat!),
                  lng: parseFloat(btn.dataset.lng!)
                }
                handleOpenModal(restaurantData)
              })
            }
          })

          cluster.addLayer(marker)

          if (restaurantIdRef.current && r.id === restaurantIdRef.current) {
            setTimeout(() => {
              currentMap.setView([r.lat, r.lng], 15)
              marker.openPopup()
            }, 300)
          }
        })

        if (mapRef.current) currentMap.addLayer(cluster)
      })

    return () => {
      mapRef.current = null
      try { map.remove() } catch { /* already removed */ }
    }
  }, [])

  const modalBgColor = isDarkMode ? '#1a1a1a' : '#ffffff'
  const modalTextColor = isDarkMode ? '#ffffff' : '#1a1a1a'
  const modalSubTextColor = isDarkMode ? '#888' : '#666'
  const inputBgColor = isDarkMode ? '#2a2a2a' : '#f5f5f5'
  const inputBorderColor = isDarkMode ? '#444' : '#e0e0e0'
  const starColorInactive = isDarkMode ? '#444' : '#ddd'

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {isModalOpen && (
        <div 
          className="modal-overlay"
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: modalBgColor,
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '24px',
              position: 'relative',
              boxShadow: isDarkMode 
                ? '0 -4px 20px rgba(0, 0, 0, 0.5)' 
                : '0 -4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{
              width: '40px', height: '4px',
              backgroundColor: isDarkMode ? '#444' : '#ddd',
              borderRadius: '2px',
              margin: '0 auto 20px',
              cursor: 'pointer'
            }}></div>

            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'none', border: 'none',
                color: modalSubTextColor, fontSize: '24px',
                cursor: 'pointer', padding: '4px 8px', borderRadius: '8px'
              }}
            >✕</button>

            {selectedRestaurant && (
              <>
                <div style={{ marginBottom: '24px', paddingRight: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: modalTextColor, marginBottom: '4px' }}>
                    {selectedRestaurant.name}
                  </h2>
                  <p style={{ fontSize: '14px', color: modalSubTextColor }}>{selectedRestaurant.city}</p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: modalSubTextColor, marginBottom: '12px' }}>
                    Notez ce restaurant
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none', border: 'none', fontSize: '36px', cursor: 'pointer', padding: '4px',
                          color: (hoverRating || rating) >= star ? '#FFD700' : starColorInactive,
                          transition: 'all 0.2s ease',
                          transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)'
                        }}
                      >★</button>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: modalSubTextColor, marginTop: '8px' }}>
                    {rating > 0 && (
                      <span>
                        {rating} étoile{rating > 1 ? 's' : ''}
                        {rating === 1 && ' - Décevant'}
                        {rating === 2 && ' - Peut mieux faire'}
                        {rating === 3 && ' - Correct'}
                        {rating === 4 && ' - Très bien'}
                        {rating === 5 && ' - Exceptionnel'}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: modalSubTextColor, marginBottom: '12px' }}>
                    Photos (optionnel)
                  </label>
                  
                  {photos.length > 0 && (
                    <div style={{
                      display: 'flex', gap: '8px', marginBottom: '12px',
                      overflowX: 'auto', padding: '4px 0'
                    }}>
                      {photos.map((photo) => (
                        <div key={photo.id} style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={photo.preview}
                            alt="Preview"
                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            style={{
                              position: 'absolute', top: '2px', right: '2px',
                              background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                              width: '20px', height: '20px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: 'white', fontSize: '12px'
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1, padding: '10px',
                        backgroundColor: inputBgColor,
                       
                        borderRadius: '8px', color: modalTextColor,
                        fontSize: '13px', cursor: 'pointer'
                      }}
                    >Choisir des photos</button>
                    <button
                      onClick={startCamera}
                      style={{
                        flex: 1, padding: '10px',
                        backgroundColor: 'inputBgColor',
                        borderRadius: '8px', color: modalTextColor,
                        fontSize: '13px', cursor: 'pointer'
                      }}
                    > Prendre une photo</button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  
                  <div style={{ fontSize: '11px', color: modalSubTextColor, marginTop: '8px' }}>
                    {photos.length === 0 ? 'Ajoutez des photos pour illustrer votre avis' : `${photos.length} photo${photos.length > 1 ? 's' : ''} sélectionnée${photos.length > 1 ? 's' : ''}`}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: modalSubTextColor, marginBottom: '12px' }}>
                    Votre avis
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    rows={4}
                    style={{
                      width: '100%', padding: '12px',
                      backgroundColor: inputBgColor,
                      borderRadius: '12px', color: modalTextColor,
                      fontSize: '14px', fontFamily: 'inherit',
                      resize: 'vertical', outline: 'none'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#E4002B' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = inputBorderColor }}
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  style={{
                    width: '100%', padding: '14px',
                    backgroundColor: isSubmitting ? (isDarkMode ? '#555' : '#ccc') : '#E4002B',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '16px', fontWeight: 'bold',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Soumettre mon avis'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'black',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={stopCamera}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
            >✕</button>
            <h3 style={{ color: 'white', margin: 0 }}>Prendre une photo</h3>
            {/* ✅ "Terminer" button to go back to modal with photos */}
            <button
              onClick={handleDoneWithCamera}
              style={{
                background: '#E4002B', border: 'none', color: 'white',
                fontSize: '13px', fontWeight: '700',
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              Terminer {photos.length > 0 ? `(${photos.length})` : ''}
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            {/* ✅ FIX: video element always in DOM when isCameraOpen, ref attaches correctly */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxHeight: '60vh',
                objectFit: 'cover',
                borderRadius: '12px'
              }}
            />
          </div>

          <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.8)' }}>
            {photos.length > 0 && (
              <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto',
                marginBottom: '16px', padding: '8px'
              }}>
                {photos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={photo.preview}
                      alt="Captured"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      style={{
                        position: 'absolute', top: '2px', right: '2px',
                        background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                        width: '20px', height: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'white', fontSize: '12px'
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={capturePhoto}
                style={{
                  width: '70px', height: '70px', borderRadius: '50%',
                  backgroundColor: 'white', border: '3px solid #E4002B',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '54px', height: '54px', borderRadius: '50%',
                  backgroundColor: '#E4002B'
                }}></div>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px', color: 'white', fontSize: '12px' }}>
              {photos.length} photo{photos.length > 1 ? 's' : ''} capturée{photos.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-overlay { animation: fadeIn 0.2s ease-out; }
        .modal-content { animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
          background: white !important;
        }
        .leaflet-popup-tip {
          background: white !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
        }
        .review-btn:hover {
          background-color: #e0e0e0 !important;
          transform: translateY(-1px);
        }
        a[href^="/restaurant/"]:hover {
          background-color: #c40026 !important;
          transform: translateY(-1px);
        }
      `}</style>
    </>
  )
}