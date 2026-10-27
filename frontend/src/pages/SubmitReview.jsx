import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function SubmitReview({ isOpen = true, onClose, onReviewSubmitted, showToast }) {
  const [productsList, setProductsList] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [channelsList, setChannelsList] = useState([]);
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customSku, setCustomSku] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [channel, setChannel] = useState('');
  const [recommend, setRecommend] = useState(true);
  const [verifiedPurchase, setVerifiedPurchase] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [photos, setPhotos] = useState([]); // Up to 6 photos
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  // Load products, tags, and channels dynamically from MongoDB Atlas backend
  useEffect(() => {
    async function fetchFormMetadata() {
      try {
        const [prods, tags, chs] = await Promise.all([
          api.getProducts(),
          api.getTags(),
          api.getChannels()
        ]);
        if (prods && prods.length > 0) {
          setProductsList(prods);
          setSelectedProduct(prods[0]);
        }
        if (tags && tags.length > 0) {
          setTagsList(tags);
          setSelectedTags([tags[0], tags[1]].filter(Boolean));
        }
        if (chs && chs.length > 0) {
          setChannelsList(chs);
          setChannel(chs[0]);
        }
      } catch (err) {
        console.error('Failed to load review form metadata from database:', err);
      }
    }
    fetchFormMetadata();
  }, []);

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

  const loadSamplePhotos = async () => {
    try {
      const approvedRevs = await api.getReviews({ status: 'approved' });
      const dbPhotos = (approvedRevs || [])
        .flatMap(r => (r.images && r.images.length > 0) ? r.images : (r.image_url ? [r.image_url] : []))
        .filter(Boolean);
      if (dbPhotos.length > 0) {
        const uniquePhotos = Array.from(new Set(dbPhotos)).slice(0, 6);
        setPhotos(uniquePhotos);
      }
    } catch (_) {}

    const prodName = selectedProduct?.name || 'Footwear Model';
    if (!title) setTitle(`Incredible comfort and responsive ride with ${prodName}`);
    if (!body) setBody(`Midsole cushion rebound is outstanding over 25km. Outsole rubber grips wet asphalt without slipping. Lockdown through the midfoot is snug with no heel slippage.`);
    if (!customerName) setCustomerName('Marcus Vance');
    if (!customerEmail) setCustomerEmail('marcus@sneakers.com');
    showToast?.('Sample review loaded from live catalog and reviews!', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !customerName.trim() || !customerEmail.trim()) {
      showToast?.('Please complete all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const finalSku = isCustomProduct ? (customSku.trim() || 'CUSTOM-SKU-1') : (selectedProduct?.sku || 'SHOE-PULSE');
      const finalName = isCustomProduct ? (customName.trim() || 'Custom Footwear') : (selectedProduct?.name || 'Footwear Model');
      const payload = {
        title: title.trim(),
        body: body.trim(),
        rating,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        sku: finalSku,
        product_name: finalName,
        channel,
        recommend,
        verified_purchase: verifiedPurchase,
        tags: selectedTags.join(', '),
        image_url: photos.length > 0 ? photos[0] : null,
        images: photos.slice(0, 6)
      };

      const res = await api.submitReview(payload);
      setSubmittedResult(res);
      showToast?.('Review submitted to moderation queue!', 'info');
      onReviewSubmitted?.();
      
      // Auto close after brief display
      setTimeout(() => {
        if (onClose) onClose();
      }, 1800);
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl border border-purple-200/90 shadow-[0_24px_70px_rgba(81,34,254,0.22)] max-w-5xl xl:max-w-6xl w-full p-5 sm:p-7 lg:p-8 animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Modal Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center transition-colors cursor-pointer z-10 shadow-2xs"
            title="Close popup"
          >
            <span className="material-symbols-outlined text-[19px]">close</span>
          </button>
        )}

        {/* Success Banner if submitted */}
        {submittedResult && (
          <div className="mb-4 p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5122fe] to-[#7b4eff] text-white flex items-center justify-center shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[19px]">hourglass_top</span>
              </div>
              <div className="text-xs sm:text-sm">
                <strong className="text-purple-950 font-bold">Review Sent to Moderation Queue!</strong>
                <span className="text-purple-800 ml-2 font-medium">
                  Status: <span className="capitalize font-bold text-[#5122fe]">{submittedResult.status}</span> &bull; Will appear on home page once approved by staff.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-purple-100 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5122fe] to-[#7b4eff] text-white flex items-center justify-center shadow-md shadow-[#5122fe]/25 shrink-0">
              <span className="material-symbols-outlined text-[22px]">rate_review</span>
            </div>
            <div>
              <h1 className="font-headline text-lg sm:text-xl font-bold text-purple-950 tracking-tight">
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
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5122fe] text-xs font-bold border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
            title="Populate test data instantly"
          >
            <span className="material-symbols-outlined text-[15px] text-[#5122fe]">auto_fix_high</span>
            <span>⚡ Load Sample Data</span>
          </button>
        </div>

        {/* 2-Column Wide Form (Generously sized for bigger screens, completely non-scrollable) */}
        <form onSubmit={handleSubmit} className="text-xs sm:text-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8 items-start">
            
            {/* ========================================================= */}
            {/* LEFT COLUMN: Shoe Model, Rating, Title, Review Body, Tags */}
            {/* ========================================================= */}
            <div className="space-y-3.5">
              
              {/* 1. Shoe Model Dropdown / Custom Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950">
                    Select Shoe Model <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomProduct(!isCustomProduct)}
                    className="text-[11px] font-semibold text-[#5122fe] hover:underline cursor-pointer"
                  >
                    {isCustomProduct ? '← Choose from Catalog' : '+ Custom Product'}
                  </button>
                </div>

                {isCustomProduct ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Product Name (e.g. Puma Deviate Nitro)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 font-semibold focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20"
                    />
                    <input
                      type="text"
                      placeholder="SKU (e.g. SHOE-PUMA-NITRO)"
                      value={customSku}
                      onChange={(e) => setCustomSku(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 font-semibold focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedProduct?.sku || ''}
                      onChange={(e) => {
                        const prod = productsList.find(p => p.sku === e.target.value);
                        if (prod) setSelectedProduct(prod);
                      }}
                      className="w-full h-10.5 px-3.5 pr-9 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 font-semibold focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all cursor-pointer appearance-none"
                    >
                      {productsList.map((prod) => (
                        <option key={prod.sku} value={prod.sku}>
                          {prod.name} — {prod.category || 'Footwear'} ({prod.sku})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500 flex items-center">
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Star Rating */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-950">
                    Overall Rating <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
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
                        <span className={`material-symbols-outlined text-[26px] ${isFilled ? 'material-symbols-filled text-amber-400' : 'text-purple-200'}`}>
                          star
                        </span>
                      </button>
                    );
                  })}
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
                  className="w-full h-10 px-3.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all placeholder:text-purple-300 font-medium"
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
                  className="w-full p-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all leading-relaxed placeholder:text-purple-300 resize-none font-normal"
                ></textarea>
              </div>

              {/* 5. Fit & Feel Tags */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-purple-950">
                  Fit & Feel Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tagsList.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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

            </div>

            {/* ========================================================= */}
            {/* RIGHT COLUMN: Photo Uploads, Customer Info, Channel, Actions */}
            {/* ========================================================= */}
            <div className="space-y-3.5 flex flex-col justify-between">
              
              {/* Photo Upload Gallery (Up to 6 photos) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#5122fe]">photo_camera</span>
                    <span>Shoe Photos ({photos.length} / 6 uploaded)</span>
                  </label>
                  <span className="text-[11px] text-purple-400 font-medium">Up to 6 images</span>
                </div>

                {/* Generous Photo Grid with Clear Previews */}
                <div className="flex flex-wrap items-center gap-2.5 p-2.5 rounded-2xl bg-purple-50/40 border border-purple-200/70 min-h-[84px]">
                  {photos.map((imgUrl, index) => (
                    <div 
                      key={index} 
                      className="relative group w-16 h-16 sm:w-17 sm:h-17 rounded-xl overflow-hidden border-2 border-purple-200 bg-purple-50 shadow-xs shrink-0"
                    >
                      <img
                        src={imgUrl}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                        title="Remove photo"
                      >
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono font-bold">
                        #{index + 1}
                      </span>
                    </div>
                  ))}

                  {/* Add Photo Tile */}
                  {photos.length < 6 && (
                    <label className="w-16 h-16 sm:w-17 sm:h-17 rounded-xl border-2 border-dashed border-purple-300 hover:border-[#5122fe] bg-white hover:bg-purple-50/80 flex flex-col items-center justify-center text-purple-500 hover:text-[#5122fe] cursor-pointer transition-all p-1 text-center group shrink-0">
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform text-[#5122fe]">add_a_photo</span>
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

              {/* Customer Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full h-10 px-3.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all font-medium"
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
                    className="w-full h-10 px-3.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs sm:text-sm text-purple-950 focus:outline-none focus:bg-white focus:border-[#5122fe] focus:ring-2 focus:ring-[#5122fe]/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Channel & Verification Checkboxes */}
              <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-900/70 font-bold whitespace-nowrap">Channel:</span>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="h-8 px-2.5 rounded-xl bg-white border border-purple-200 text-xs text-purple-950 focus:outline-none focus:border-[#5122fe] font-semibold cursor-pointer"
                  >
                    {channelsList.map((ch) => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-purple-950">
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

              {/* Form Action Buttons (Bottom of right column) */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-purple-700 hover:text-purple-950 hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#5122fe] to-[#7b4eff] hover:from-[#4316df] hover:to-[#6830ff] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#5122fe]/30 hover:shadow-lg hover:shadow-[#5122fe]/45 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]">send</span>
                      <span>Publish Review {photos.length > 0 && `(${photos.length} Photos)`}</span>
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
