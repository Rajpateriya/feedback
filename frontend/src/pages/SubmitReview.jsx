import React, { useState } from 'react';
import { api } from '../api/client';

const SHOE_PRODUCTS = [
  { sku: 'SHOE-NIKE-PULSE', name: 'Nike Air Max Pulse', category: 'Air Cushioning' },
  { sku: 'SHOE-ADIDAS-BOOST', name: 'Adidas Ultraboost Light', category: 'Performance Run' },
  { sku: 'SHOE-AJ1-RETRO', name: 'Air Jordan 1 High OG', category: 'Heritage Classic' },
  { sku: 'SHOE-NB-9060', name: 'New Balance 9060', category: 'Chunky Lifestyle' },
  { sku: 'SHOE-ON-MONSTER', name: 'On Cloudmonster 2', category: 'Max Road Cushion' },
  { sku: 'SHOE-SALOMON-XT6', name: 'Salomon XT-6 Expanse', category: 'Trail / All-Terrain' },
];

const SHOE_TAGS = [
  'Cushioning & Bounce',
  'True to Size',
  'Arch Support',
  'Breathability',
  'Ankle Lockdown',
  'Continental Grip',
  'Wide Foot Friendly',
  'Durable Outsole'
];

const SAMPLE_SHOE_PHOTOS = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&auto=format&fit=crop&q=80'
];

export default function SubmitReview({ isOpen = true, onClose, onReviewSubmitted, showToast }) {
  const [selectedProduct, setSelectedProduct] = useState(SHOE_PRODUCTS[0]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [channel, setChannel] = useState('Direct Web');
  const [recommend, setRecommend] = useState(true);
  const [verifiedPurchase, setVerifiedPurchase] = useState(true);
  const [selectedTags, setSelectedTags] = useState(['Cushioning & Bounce', 'True to Size']);
  const [photos, setPhotos] = useState([]); // Up to 6 photos
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  if (isOpen === false) return null;

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return '5★ - Exceptional Cushion';
      case 4: return '4★ - Highly Satisfied';
      case 3: return '3★ - Average Comfort';
      case 2: return '2★ - Below Expectations';
      case 1: return '1★ - Unsatisfactory';
      default: return 'Select Rating';
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 6 - photos.length;
    if (remainingSlots <= 0) {
      showToast?.('Maximum of 6 photos allowed.', 'error');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast?.('Only image files are allowed.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setPhotos(prev => {
          if (prev.length >= 6) return prev;
          return [...prev, loadEvent.target.result];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    showToast?.(`Photo(s) added (${Math.min(6, photos.length + filesToProcess.length)}/6)`, 'success');
  };

  const removePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const loadSamplePhotos = () => {
    setPhotos(SAMPLE_SHOE_PHOTOS);
    if (!title) setTitle('Incredible midsole energy return for daily runs');
    if (!body) setBody('Midsole cushion rebound is outstanding over 25km. Outsole rubber grips wet asphalt without slipping. Lockdown through the midfoot is snug with no heel slippage.');
    if (!customerName) setCustomerName('Marcus Vance');
    if (!customerEmail) setCustomerEmail('marcus@sneakers.com');
    showToast?.('Sample review and 6 shoe photos loaded!', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !customerName.trim() || !customerEmail.trim()) {
      showToast?.('Please complete all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        body: body.trim(),
        rating,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        sku: selectedProduct.sku,
        product_name: selectedProduct.name,
        channel,
        recommend,
        verified_purchase: verifiedPurchase,
        tags: selectedTags.join(', '),
        image_url: photos.length > 0 ? photos[0] : null,
        images: photos.slice(0, 6)
      };

      const res = await api.submitReview(payload);
      setSubmittedResult(res);
      showToast?.('Review published successfully!', 'success');
      onReviewSubmitted?.();
      
      // Auto close after brief display if in modal mode
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast?.(err.message || 'Error submitting review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setCustomerName('');
    setCustomerEmail('');
    setPhotos([]);
    setRating(5);
    setSubmittedResult(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl border border-purple-200/90 shadow-[0_24px_70px_rgba(81,34,254,0.22)] max-w-2xl w-full p-5 sm:p-7 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Modal Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center transition-colors cursor-pointer z-10"
            title="Close popup"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}

        {/* Result Confirmation Banner */}
        {submittedResult && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Review Published Live to Feed!
                </h3>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  AI Sentiment Score: {(submittedResult.sentiment_score * 100).toFixed(0)}% &bull; Photos Attached: {(submittedResult.images || []).length} / 6
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-purple-100 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5122fe] to-[#7b4eff] text-white flex items-center justify-center shadow-md shadow-[#5122fe]/25 shrink-0">
              <span className="material-symbols-outlined text-[20px]">rate_review</span>
            </div>
            <div>
              <h1 className="font-headline text-lg font-bold text-purple-950 tracking-tight">
                Write a Shoe Review
              </h1>
              <p className="text-xs text-purple-900/60 mt-0.5">
                Share authentic fit feedback, wear rating, and on-foot photos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadSamplePhotos}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5122fe] text-xs font-semibold border border-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Populate test data instantly"
          >
            <span className="material-symbols-outlined text-[15px] text-[#5122fe]">auto_fix_high</span>
            <span>⚡ Load Sample Data</span>
          </button>
        </div>

        {/* Clean Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4.5 text-xs sm:text-sm">
          
          {/* 1. Shoe Model Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-purple-950">
              Select Shoe Model <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedProduct.sku}
                onChange={(e) => {
                  const prod = SHOE_PRODUCTS.find(p => p.sku === e.target.value);
                  if (prod) setSelectedProduct(prod);
                }}
                className="w-full h-10.5 px-3.5 pr-10 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 font-medium focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all cursor-pointer appearance-none"
              >
                {SHOE_PRODUCTS.map((prod) => (
                  <option key={prod.sku} value={prod.sku}>
                    {prod.name} — {prod.category} ({prod.sku})
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500 flex items-center">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>
          </div>

          {/* 2. Star Rating */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-purple-950">
              Overall Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-120 cursor-pointer p-0.5"
                    >
                      <span className={`material-symbols-outlined text-[24px] ${isFilled ? 'material-symbols-filled text-amber-400' : 'text-purple-200'}`}>
                        star
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-purple-900 bg-purple-50 px-2.5 py-0.8 rounded-lg border border-purple-200">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          {/* 3. Review Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-purple-950">
              Review Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Incredibly comfortable with great arch support"
              className="w-full h-10 px-3.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all placeholder:text-purple-300"
            />
          </div>

          {/* 4. Written Feedback */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-purple-950">
              Written Feedback <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe ground feel, cushioning rebound, toe-box width, and outsole durability across surfaces..."
              className="w-full p-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all leading-relaxed placeholder:text-purple-300"
            ></textarea>
          </div>

          {/* 5. Clean Image Upload Gallery (Up to 6 photos) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-[#5122fe]">photo_camera</span>
                <span>Shoe Photos ({photos.length} / 6 uploaded)</span>
              </label>
              <span className="text-[11px] text-purple-400">Up to 6 images</span>
            </div>

            {/* Photo Thumbnails Row */}
            <div className="flex flex-wrap items-center gap-2.5 p-2.5 rounded-2xl bg-purple-50/30 border border-purple-100">
              {photos.map((imgUrl, index) => (
                <div 
                  key={index} 
                  className="relative group w-18 h-18 rounded-xl overflow-hidden border-2 border-purple-200 bg-purple-50 shadow-xs shrink-0"
                >
                  <img
                    src={imgUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                    title="Remove photo"
                  >
                    <span className="material-symbols-outlined text-[11px]">close</span>
                  </button>
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 py-0.2 rounded font-mono font-medium">
                    #{index + 1}
                  </span>
                </div>
              ))}

              {/* Upload Tile */}
              {photos.length < 6 && (
                <label className="w-18 h-18 rounded-xl border-2 border-dashed border-purple-300 hover:border-[#5122fe] bg-white hover:bg-purple-50/60 flex flex-col items-center justify-center text-purple-500 hover:text-[#5122fe] cursor-pointer transition-all p-1 text-center group shrink-0">
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform text-[#5122fe]">add_a_photo</span>
                  <span className="text-[9px] font-bold mt-0.5 text-purple-950">Add Photo</span>
                  <span className="text-[8px] text-purple-400">{photos.length}/6</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* 6. Fit & Feel Tags */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-purple-950">
              Fit & Feel Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SHOE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-0.8 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#5122fe] text-white shadow-xs'
                        : 'bg-purple-50 text-purple-900/80 hover:bg-purple-100 border border-purple-200/80'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-100">
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Marcus Vance"
                className="w-full h-9.5 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="marcus@sneakers.com"
                className="w-full h-9.5 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all"
              />
            </div>
          </div>

          {/* 8. Channel & Checkboxes */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-900/70 font-semibold whitespace-nowrap">Channel:</span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="h-7.5 px-2.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:border-[#5122fe] font-medium cursor-pointer"
              >
                <option value="Direct Web">Direct Web</option>
                <option value="Nike SNKRS App">Nike SNKRS App</option>
                <option value="Shopify Store">Shopify Store</option>
                <option value="Amazon Global">Amazon Global</option>
                <option value="In-App iOS">In-App iOS</option>
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-purple-950">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5122fe] accent-[#5122fe]"
                />
                <span>Recommends</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedPurchase}
                  onChange={(e) => setVerifiedPurchase(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5122fe] accent-[#5122fe]"
                />
                <span>Verified buyer</span>
              </label>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-purple-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5122fe] to-[#7b4eff] hover:from-[#4316df] hover:to-[#6830ff] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#5122fe]/25 hover:shadow-lg hover:shadow-[#5122fe]/40 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Submit Review {photos.length > 0 && `(${photos.length} Photos)`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
