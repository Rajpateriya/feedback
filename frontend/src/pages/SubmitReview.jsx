import React, { useState } from 'react';
import { api } from '../api/client';

const SHOE_PRODUCTS = [
  { sku: 'SHOE-NIKE-PULSE', name: 'Nike Air Max Pulse', category: 'Air Cushioning', icon: 'air' },
  { sku: 'SHOE-ADIDAS-BOOST', name: 'Adidas Ultraboost Light', category: 'Performance Run', icon: 'bolt' },
  { sku: 'SHOE-AJ1-RETRO', name: 'Air Jordan 1 High OG', category: 'Heritage Classic', icon: 'sports_basketball' },
  { sku: 'SHOE-NB-9060', name: 'New Balance 9060', category: 'Chunky Lifestyle', icon: 'style' },
  { sku: 'SHOE-ON-MONSTER', name: 'On Cloudmonster 2', category: 'Max Road Cushion', icon: 'cloud' },
  { sku: 'SHOE-SALOMON-XT6', name: 'Salomon XT-6 Expanse', category: 'Trail / All-Terrain', icon: 'terrain' },
];

const SHOE_TAGS = [
  { label: 'Cushioning & Bounce', icon: 'bolt' },
  { label: 'True to Size', icon: 'straighten' },
  { label: 'Arch Support', icon: 'accessibility_new' },
  { label: 'Breathability', icon: 'air' },
  { label: 'Ankle Lockdown', icon: 'lock' },
  { label: 'Continental Grip', icon: 'terrain' },
  { label: 'Wide Foot Friendly', icon: 'width_normal' },
  { label: 'Durable Outsole', icon: 'verified' },
];

const SLOT_LABELS = [
  'Lateral Profile',
  'Outsole Tread',
  'Heel Cushion',
  'Toe-Box Width',
  'On-Foot Action',
  'Insole & Box'
];

const SUGGESTED_HEADLINES = [
  'Plush cushioning for 10K+ runs',
  'Runs true to size with snug ankle lockdown',
  'Exceptional grip across wet road & trails',
  'Best daily lifestyle sneaker of the season'
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

  // Review Completeness / Strength Calculation
  const calculateStrength = () => {
    let score = 0;
    if (selectedProduct) score += 20;
    if (rating > 0) score += 20;
    if (photos.length > 0) score += Math.min(20, photos.length * 4);
    if (title.trim().length >= 8) score += 20;
    if (body.trim().length >= 20 && customerName.trim() && customerEmail.trim()) score += 20;
    return Math.min(100, score);
  };

  const reviewStrength = calculateStrength();

  const toggleTag = (tagLabel) => {
    setSelectedTags(prev => 
      prev.includes(tagLabel) ? prev.filter(t => t !== tagLabel) : [...prev, tagLabel]
    );
  };

  const getRatingFeedback = (val) => {
    switch (val) {
      case 5: return { label: '5.0 - Exceptional Cushion & Energy Rebound', emoji: '🔥', tone: 'text-amber-500' };
      case 4: return { label: '4.0 - Solid Daily Training Support', emoji: '✨', tone: 'text-purple-600' };
      case 3: return { label: '3.0 - Balanced Standard Road Feel', emoji: '⚡', tone: 'text-blue-500' };
      case 2: return { label: '2.0 - Stiff Cushioning / High Impact', emoji: '⚠️', tone: 'text-amber-600' };
      case 1: return { label: '1.0 - Poor Fit & Inadequate Cushion', emoji: '🛑', tone: 'text-rose-600' };
      default: return { label: 'Select Rating', emoji: '⭐', tone: 'text-purple-400' };
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
    showToast?.(`Added photo(s) (${Math.min(6, photos.length + filesToProcess.length)}/6)`, 'success');
  };

  const removePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const loadSamplePhotos = () => {
    setPhotos(SAMPLE_SHOE_PHOTOS);
    if (!title) setTitle('Next level heel recoil for marathon prep and daily wear');
    if (!body) setBody('Midsole cushion rebound is outstanding over 25km. Outsole continental rubber grips wet asphalt without slipping. Lockdown through the midfoot is snug with no heel slippage.');
    if (!customerName) setCustomerName('Marcus Vance');
    if (!customerEmail) setCustomerEmail('marcus@sneakers.com');
    showToast?.('Populated 6 verified sample sneaker photos & review data!', 'success');
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

  const ratingInfo = getRatingFeedback(hoverRating || rating);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      
      {/* Result Confirmation Banner */}
      {submittedResult && (
        <div className="mb-4 p-4 rounded-2xl bg-white border border-purple-200 shadow-[0_4px_24px_rgba(81,34,254,0.08)] animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5122fe] to-[#7b4eff] text-white flex items-center justify-center shadow-sm shadow-[#5122fe]/30">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-purple-950">
                  {submittedResult.status === 'approved' ? 'Footwear Wear-Test Verified & Live!' : 'Review Queued for Verification'}
                </h3>
                <p className="text-xs text-purple-900/60 mt-0.5">
                  AI Sentiment Score: <strong>{(submittedResult.sentiment_score * 100).toFixed(0)}%</strong> &bull; Attached Photos: <strong>{(submittedResult.images || []).length} / 6</strong>
                </p>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="self-start sm:self-auto text-xs font-bold px-4 py-2 rounded-xl bg-[#f5f2ff] text-[#5122fe] hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
            >
              + Submit Another Review
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card: Direct & Elevated Header without separate banner */}
      <div className="bg-white rounded-3xl border border-purple-200/90 shadow-[0_8px_32px_rgba(81,34,254,0.07)] p-4 sm:p-6 lg:p-7 transition-all">
        
        {/* Integrated Form Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5122fe] to-[#7b4eff] text-white flex items-center justify-center shadow-md shadow-[#5122fe]/25 shrink-0">
              <span className="material-symbols-outlined text-[20px]">rate_review</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline text-base sm:text-lg font-extrabold text-purple-950 tracking-tight">
                  Submit Footwear Wear-Test Review
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#f5f2ff] text-[#5122fe] border border-purple-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Community Lab
                </span>
              </div>
              <p className="text-xs text-purple-900/60 mt-0.5">
                Share authentic on-foot wear telemetry, cushioning rebound, and up to 6 photos with fellow sneakerheads.
              </p>
            </div>
          </div>

          {/* Header Action Tools: Sample Loader & Live Review Strength Meter */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={loadSamplePhotos}
              className="px-3.5 py-2 rounded-xl bg-[#f5f2ff] hover:bg-purple-100 text-[#5122fe] text-xs font-bold border border-purple-200/90 transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
              title="Populate 6 sneaker photos and review instantly"
            >
              <span className="material-symbols-outlined text-[15px] text-[#5122fe]">bolt</span>
              <span>⚡ Load 6 Sample Photos</span>
            </button>

            {/* Interactive Quality Meter */}
            <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-xl bg-purple-50/60 border border-purple-100">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-purple-700">Review Strength</span>
                <span className={`text-[10px] font-extrabold ${reviewStrength >= 80 ? 'text-emerald-600' : 'text-[#5122fe]'}`}>
                  {reviewStrength}%
                </span>
              </div>
              <div className="w-24 bg-purple-200/70 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#5122fe] via-[#7b4eff] to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${reviewStrength}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Balanced Responsive Form */}
        <form onSubmit={handleSubmit} className="text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Shoe Selector, Interactive Rating, Fit Tags, Customer Data (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5">
              
              {/* 1. Footwear Model Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#f5f2ff] text-[#5122fe] flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Select Footwear Model</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-purple-900/50">6 Available</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SHOE_PRODUCTS.map((prod) => {
                    const isSelected = selectedProduct.sku === prod.sku;
                    return (
                      <button
                        key={prod.sku}
                        type="button"
                        onClick={() => setSelectedProduct(prod)}
                        className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between relative group cursor-pointer ${
                          isSelected
                            ? 'bg-[#f5f2ff] border-[#5122fe] ring-2 ring-[#5122fe]/25 shadow-sm'
                            : 'bg-white border-purple-100 hover:border-[#5122fe]/40 hover:bg-purple-50/40 hover:-translate-y-0.5'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 text-[#5122fe] material-symbols-outlined text-[15px] material-symbols-filled">
                            check_circle
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-purple-500">{prod.icon}</span>
                            <span className="text-[8px] font-extrabold uppercase tracking-tight text-purple-600">{prod.category}</span>
                          </div>
                          <div className="font-bold text-[11px] text-purple-950 mt-1 leading-snug">{prod.name}</div>
                        </div>
                        <div className="font-mono text-[9px] text-purple-500/80 mt-1.5">{prod.sku}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Interactive Star Rating */}
              <div className="p-3 rounded-2xl bg-[#f5f2ff]/60 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-900/70 mb-1">
                    Cushioning & Wear Rating
                  </div>
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
                          className="focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                          aria-label={`Rate ${star} stars`}
                        >
                          <span className={`material-symbols-outlined text-[24px] ${isFilled ? 'material-symbols-filled text-amber-400' : 'text-purple-200'}`}>
                            star
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="self-start sm:self-auto px-2.5 py-1 rounded-xl bg-white border border-purple-200 shadow-2xs">
                  <div className="text-[10px] font-bold flex items-center gap-1 text-purple-950">
                    <span>{ratingInfo.emoji}</span>
                    <span className="truncate max-w-[180px]">{ratingInfo.label}</span>
                  </div>
                </div>
              </div>

              {/* 3. Shoe Fit & Feel Tags */}
              <div>
                <label className="block text-[11px] font-bold text-purple-950 mb-1.5">
                  Footwear Fit & Performance Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SHOE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.label);
                    return (
                      <button
                        key={tag.label}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#5122fe] text-white shadow-xs scale-102 ring-1 ring-[#5122fe]/40'
                            : 'bg-purple-50/70 text-purple-900/80 hover:bg-purple-100 border border-purple-200/80'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">{tag.icon}</span>
                        <span>{tag.label}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[11px]">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Customer Identity & Verification */}
              <div className="space-y-2.5 pt-2 border-t border-purple-100">
                <div className="grid grid-cols-2 gap-2">
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
                      className="w-full h-8 px-2.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-1 focus:ring-[#5122fe] transition-all"
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
                      className="w-full h-8 px-2.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-1 focus:ring-[#5122fe] transition-all"
                    />
                  </div>
                </div>

                {/* Channel & Verification Checkbox Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-purple-900/70 font-semibold whitespace-nowrap">Channel:</span>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="h-7 px-2 rounded-xl bg-purple-50/60 border border-purple-200 text-[10px] text-purple-950 focus:outline-none focus:border-[#5122fe] font-medium cursor-pointer"
                    >
                      <option value="Direct Web">Direct Web</option>
                      <option value="Nike SNKRS App">Nike SNKRS App</option>
                      <option value="Shopify Store">Shopify Store</option>
                      <option value="Amazon Global">Amazon Global</option>
                      <option value="In-App iOS">In-App iOS</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecommend(!recommend)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                        recommend 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : 'bg-purple-50/50 text-purple-400 border-purple-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{recommend ? 'thumb_up' : 'thumb_up_off'}</span>
                      <span>Recommends</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerifiedPurchase(!verifiedPurchase)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                        verifiedPurchase 
                          ? 'bg-[#f5f2ff] text-[#5122fe] border-purple-300' 
                          : 'bg-purple-50/50 text-purple-400 border-purple-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      <span>Verified Buyer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 6-Slot Photo Gallery, Headline with Quick Suggest Chips, Body & Submit (7 cols) */}
            <div className="lg:col-span-7 space-y-3.5 lg:border-l border-purple-100 lg:pl-6">
              
              {/* Photo Upload Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[17px] text-[#5122fe]">photo_library</span>
                    <label className="text-[11px] font-bold text-purple-950">
                      Shoe Photos ({photos.length} / 6 uploaded)
                    </label>
                  </div>

                  {photos.length < 6 && (
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#5122fe] hover:bg-[#4316df] text-white text-[11px] font-bold shadow-xs shadow-[#5122fe]/30 transition-all hover:scale-102 active:scale-98">
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
                      className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-[#5122fe] bg-purple-50 shadow-xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`Shoe upload ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      
                      {/* Hover Overlay with Delete Action */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="self-end w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow-xs"
                          title="Remove photo"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                        <div className="text-[8px] text-white font-medium truncate">
                          {SLOT_LABELS[index] || `Photo ${index + 1}`}
                        </div>
                      </div>

                      <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[8px] px-1 py-0.2 rounded font-mono font-medium group-hover:opacity-0 transition-opacity">
                        #{index + 1}
                      </span>
                    </div>
                  ))}

                  {/* Empty interactive slots to complete up to 6 */}
                  {Array.from({ length: 6 - photos.length }).map((_, i) => {
                    const slotIdx = photos.length + i;
                    return (
                      <label
                        key={`empty-${slotIdx}`}
                        className="aspect-square rounded-2xl border-2 border-dashed border-purple-200 hover:border-[#5122fe] bg-purple-50/30 hover:bg-[#f5f2ff] flex flex-col items-center justify-center text-purple-400 hover:text-[#5122fe] transition-all cursor-pointer group p-1 text-center"
                      >
                        <span className="material-symbols-outlined text-[18px] group-hover:scale-115 transition-transform text-[#7b4eff]">add_photo_alternate</span>
                        <span className="text-[9px] font-bold mt-0.5 text-purple-950">Slot {slotIdx + 1}</span>
                        <span className="text-[8px] text-purple-500/80 leading-tight line-clamp-1">{SLOT_LABELS[slotIdx]}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Review Headline & Quick Suggestion Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-purple-950">
                    Review Headline <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-purple-400">{title.length} / 100</span>
                </div>

                <input
                  type="text"
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next level heel recoil for marathon prep and daily wear"
                  className="w-full h-8.5 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-1 focus:ring-[#5122fe] transition-all placeholder:text-purple-300"
                />

                {/* Quick Title Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[9px] text-purple-400 font-semibold">Quick suggest:</span>
                  {SUGGESTED_HEADLINES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTitle(preset)}
                      className="text-[9px] px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Written Review Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-purple-950">
                    Written Feedback <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-purple-400">{body.length} / 600</span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={600}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe ground feel, cushioning rebound, toe-box width, and outsole durability across surfaces..."
                  className="w-full p-2.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-1 focus:ring-[#5122fe] transition-all leading-relaxed placeholder:text-purple-300"
                ></textarea>
              </div>

              {/* Submit Action Strip with Live Photo Count Badge */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl text-[11px] font-semibold text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Clear Form</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5122fe] via-[#5e31f7] to-[#7b4eff] hover:from-[#4316df] hover:to-[#6830ff] text-white text-xs font-bold shadow-md shadow-[#5122fe]/30 hover:shadow-lg hover:shadow-[#5122fe]/45 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      <span>Publishing Review...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
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
