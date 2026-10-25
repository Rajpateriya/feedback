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
  'Cushioning & Bounce', 'True to Size', 'Arch Support', 'Breathability',
  'Ankle Lockdown', 'Continental Grip', 'Wide Foot Friendly', 'Durable Outsole'
];

const SAMPLE_SHOE_PHOTOS = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&auto=format&fit=crop&q=80'
];

export default function SubmitReview({ onReviewSubmitted, showToast }) {
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
      showToast?.('Maximum of 6 shoe photos allowed.', 'error');
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
    showToast?.('Loaded 6 sample sneaker photos!', 'success');
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
      showToast?.('Shoe review published live!', 'success');
      onReviewSubmitted?.();
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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      
      {/* Result Confirmation Toast Banner */}
      {submittedResult && (
        <div className="mb-3 p-3.5 rounded-2xl bg-white border border-purple-200/90 shadow-[0_4px_20px_rgba(147,51,234,0.06)] animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 to-violet-600 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-purple-950">
                  {submittedResult.status === 'approved' ? 'Shoe Review Verified & Published!' : 'Review Queued for Verification'}
                </h3>
                <p className="text-[11px] text-purple-900/60 mt-0.5">
                  AI Trust: <strong>{(submittedResult.sentiment_score * 100).toFixed(0)}%</strong> &bull; Photos Attached: <strong>{(submittedResult.images || []).length}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
            >
              Write Another
            </button>
          </div>
        </div>
      )}

      {/* Sneakerhead Wear-Test Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 sm:p-6 mb-4 shadow-[0_10px_30px_rgba(107,33,168,0.18)] border border-purple-500/25">
        {/* Ambient atmospheric glow elements */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-purple-500/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-purple-200 border border-white/15 backdrop-blur-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-fuchsia-400">local_fire_department</span>
                Community Footwear Lab
              </span>
              <span className="text-purple-300/60 text-xs hidden sm:inline">&bull; Wear-Test Verification</span>
            </div>
            <h2 className="font-headline text-lg sm:text-2xl font-extrabold tracking-tight text-white">
              Submit Shoe Wear-Test Review & Photos
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl leading-relaxed">
              Share real-world feedback on sneaker cushion rebound, outsole wear, and up to 6 on-foot photos to help fellow runners and sneakerheads.
            </p>

            {/* Footwear Wear-Test Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-purple-200/90">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                <span className="material-symbols-outlined text-[13px] text-purple-300">steps</span>
                6 Verified Silhouettes
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                <span className="material-symbols-outlined text-[13px] text-emerald-400">add_a_photo</span>
                6 High-Res Photo Slots
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                <span className="material-symbols-outlined text-[13px] text-amber-300">verified</span>
                Verified Buyer Badges
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                <span className="material-symbols-outlined text-[13px] text-fuchsia-300">shield_with_heart</span>
                Automated Moderation
              </span>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-row md:flex-col items-start md:items-end gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={loadSamplePhotos}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600/80 to-purple-600/80 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-bold border border-white/25 backdrop-blur-xs transition-all flex items-center gap-1.5 shadow-sm shadow-purple-950 active:scale-98"
            >
              <span className="material-symbols-outlined text-[15px] text-amber-300">bolt</span>
              <span>⚡ Load 6 Sample Photos</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-900/60 border border-purple-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold">Photo Capacity:</span>
              <span className="text-xs font-bold text-emerald-300">Up to 6</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Broad Card: Full Width max-w-6xl */}
      <div className="bg-white rounded-2xl border border-purple-200/80 shadow-[0_4px_24px_rgba(147,51,234,0.04)] p-4 sm:p-5 lg:p-6 transition-all">
        
        {/* Top Header Strip */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
              Review Details Form
            </span>
            <span className="text-[11px] text-purple-400">&bull; All fields marked with * are required</span>
          </div>

          <span className="text-[11px] text-purple-900/50 font-medium">
            Step 1 of 1
          </span>
        </div>

        {/* Form Body: Balanced 2-Column Responsive Layout */}
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: Shoe Selector, Rating, Tags, Customer Info (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-3">
              
              {/* 1. Footwear Silhouette Selector */}
              <div>
                <label className="block text-[11px] font-bold text-purple-950 mb-1">
                  1. Select Shoe Model <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SHOE_PRODUCTS.map((prod) => {
                    const isSelected = selectedProduct.sku === prod.sku;
                    return (
                      <button
                        key={prod.sku}
                        type="button"
                        onClick={() => setSelectedProduct(prod)}
                        className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-50/90 border-purple-600 ring-1 ring-purple-600/40 shadow-2xs'
                            : 'bg-white border-purple-100 hover:border-purple-300'
                        }`}
                      >
                        <div>
                          <div className="text-[8px] font-bold text-purple-500 uppercase tracking-tight">{prod.category}</div>
                          <div className="font-bold text-[11px] text-purple-950 mt-0.5 leading-snug">{prod.name}</div>
                        </div>
                        <div className="font-mono text-[9px] text-purple-600 mt-1">{prod.sku}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Rating */}
              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between gap-2">
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
                        className="focus:outline-none transition-transform hover:scale-115"
                      >
                        <span className={`material-symbols-outlined text-[20px] ${isFilled ? 'material-symbols-filled' : ''}`}>
                          {isFilled ? 'star' : 'star_border'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] font-bold text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>

              {/* 3. Shoe Attribute Tags */}
              <div>
                <label className="block text-[11px] font-bold text-purple-950 mb-1">
                  Shoe Fit & Feel Tags
                </label>
                <div className="flex flex-wrap gap-1">
                  {SHOE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Customer Info */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-100">
                <div>
                  <label className="block text-[10px] font-bold text-purple-950 mb-0.5">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full h-7.5 px-2.5 rounded-lg bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:bg-white focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-purple-950 mb-0.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="marcus@sneakers.com"
                    className="w-full h-7.5 px-2.5 rounded-lg bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:bg-white focus:border-purple-600"
                  />
                </div>
              </div>

              {/* 5. Channel & Verification Checkboxes */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[10px] text-purple-900/70 font-semibold whitespace-nowrap">Channel:</span>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="h-6.5 px-2 rounded-lg bg-purple-50/60 border border-purple-200 text-[10px] text-purple-950 focus:outline-none focus:border-purple-600 font-medium"
                  >
                    <option value="Direct Web">Direct Web</option>
                    <option value="Shopify Store">Shopify Store</option>
                    <option value="Amazon Global">Amazon Global</option>
                    <option value="In-App iOS">In-App iOS</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-medium text-purple-950">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recommend}
                      onChange={(e) => setRecommend(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Recommends Shoe</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedPurchase}
                      onChange={(e) => setVerifiedPurchase(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Verified Buyer</span>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Photo Upload (Up to 6), Review Title & Body, Submit Button (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-3 lg:border-l border-purple-100 lg:pl-5">
              
              {/* Photo Upload Header & 6-Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-purple-600">photo_library</span>
                    <label className="text-[11px] font-bold text-purple-950">
                      Shoe Photos ({photos.length} / 6 uploaded)
                    </label>
                  </div>

                  {photos.length < 6 && (
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-2xs transition-colors">
                      <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
                      <span>Upload Photos</span>
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

                {/* 6 Photo Slots Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {photos.map((imgUrl, index) => (
                    <div 
                      key={index} 
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-purple-200 bg-purple-50 shadow-2xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`Shoe upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[8px] px-1 py-0.2 rounded font-mono font-medium">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <span className="material-symbols-outlined text-[11px]">close</span>
                      </button>
                    </div>
                  ))}

                  {/* Empty slots to complete up to 6 */}
                  {Array.from({ length: 6 - photos.length }).map((_, i) => (
                    <label
                      key={`empty-${i}`}
                      className="aspect-square rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/70 flex flex-col items-center justify-center text-purple-400 hover:text-purple-700 transition-colors cursor-pointer group"
                    >
                      <span className="material-symbols-outlined text-[17px] group-hover:scale-110 transition-transform">add_photo_alternate</span>
                      <span className="text-[9px] font-medium mt-0.5">Slot {photos.length + i + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Review Headline Takeaway */}
              <div>
                <label className="block text-[11px] font-bold text-purple-950 mb-1">
                  Review Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next level heel recoil for marathon prep and daily wear"
                  className="w-full h-8 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all placeholder:text-purple-300"
                />
              </div>

              {/* Written Review Body (Compact 3 rows to keep non-scrollable) */}
              <div>
                <label className="block text-[11px] font-bold text-purple-950 mb-1">
                  Written Feedback <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe ground feel, cushioning rebound, toe-box width, and outsole durability across surfaces..."
                  className="w-full p-2.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all leading-relaxed placeholder:text-purple-300"
                ></textarea>
              </div>

              {/* Submit Action Strip */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-purple-300 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-98"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      <span>Submit Review ({photos.length} Photos)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
