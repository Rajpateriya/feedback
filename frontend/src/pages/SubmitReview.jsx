import React, { useState } from 'react';
import { api } from '../api/client';

const SHOE_PRODUCTS = [
  { sku: 'SHOE-NIKE-PULSE', name: 'Nike Air Max Pulse', category: 'Lifestyle / Air Cushion' },
  { sku: 'SHOE-ADIDAS-BOOST', name: 'Adidas Ultraboost Light', category: 'Performance Running' },
  { sku: 'SHOE-AJ1-RETRO', name: 'Air Jordan 1 Retro High OG', category: 'Basketball / Heritage' },
  { sku: 'SHOE-NB-9060', name: 'New Balance 9060', category: 'Chunky Lifestyle / Suede' },
  { sku: 'SHOE-ON-MONSTER', name: 'On Cloudmonster 2', category: 'Maximum Cushion / Road' },
  { sku: 'SHOE-SALOMON-XT6', name: 'Salomon XT-6 Expanse', category: 'Trail Running / Gorpcore' },
];

const SHOE_TAGS = [
  'Cushioning & Bounce', 'True to Size', 'Arch Support', 'Breathability',
  'Ankle Lockdown', 'Continental Grip', 'Wide Foot Friendly', 'Durable Outsole',
  'High Stack Height', 'Lightweight Feel'
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
      case 5: return '5 Stars - Exceptional Cushion & Fit';
      case 4: return '4 Stars - Great Shoe, Minor Sizing Nuance';
      case 3: return '3 Stars - Average Comfort';
      case 2: return '2 Stars - Below Expectations / Stiff';
      case 1: return '1 Star - Unsatisfactory Fit or Quality';
      default: return 'Select Rating';
    }
  };

  // Handle local file uploads (supports up to 6 photos)
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

    // Reset input value so same files can be re-selected if needed
    e.target.value = '';
    showToast?.(`Added photo(s). (${Math.min(6, photos.length + filesToProcess.length)}/6 uploaded)`, 'success');
  };

  const removePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const loadSamplePhotos = () => {
    setPhotos(SAMPLE_SHOE_PHOTOS);
    showToast?.('Loaded 6 high-res shoe photos!', 'success');
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
      showToast?.('Shoe review processed by Trust Engine', 'success');
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* Result Confirmation Banner */}
      {submittedResult && (
        <div className="mb-4 p-4 rounded-2xl bg-white border border-purple-200/90 shadow-[0_4px_20px_rgba(147,51,234,0.06)] animate-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                submittedResult.status === 'approved' 
                  ? 'bg-gradient-to-tr from-purple-700 to-violet-600' 
                  : submittedResult.status === 'flagged' 
                  ? 'bg-rose-600' 
                  : 'bg-purple-900'
              }`}>
                <span className="material-symbols-outlined text-[18px]">
                  {submittedResult.status === 'approved' ? 'verified' : 
                   submittedResult.status === 'flagged' ? 'warning' : 'pending_actions'}
                </span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-purple-950">
                  {submittedResult.status === 'approved' && 'Shoe Review Verified & Published Live!'}
                  {submittedResult.status === 'pending' && 'Shoe Review Queued for Fast Moderation'}
                  {submittedResult.status === 'flagged' && 'Review Flagged for Safety Verification'}
                </h3>
                <p className="text-[11px] text-purple-900/60 mt-0.5">
                  AI Sentiment Score: <strong>{(submittedResult.sentiment_score * 100).toFixed(0)}%</strong> &bull; Toxicity Risk: <strong>{(submittedResult.toxicity_score * 100).toFixed(0)}%</strong> &bull; Photos Attached: <strong>{(submittedResult.images || []).length}</strong>
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

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-purple-200/80 shadow-[0_4px_24px_rgba(147,51,234,0.04)] p-6 sm:p-7 space-y-5">
        
        {/* Header */}
        <div className="border-b border-purple-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                Shoe Wear-Test Verification
              </span>
              <span className="text-[11px] text-purple-400">&bull; Up to 6 Photos Supported</span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-bold text-purple-950 tracking-tight mt-1">
              Submit Shoe Wear Review
            </h1>
            <p className="text-xs text-purple-900/70 mt-0.5">
              Share real-world feedback on sneaker fit, outsole durability, cushioning recoil, and comfort.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSamplePhotos}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] text-purple-600">auto_fix_high</span>
            ⚡ Load 6 Sample Shoe Photos
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Step 1: Select Shoe Product */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-purple-950">
              Select Footwear Silhouette <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {SHOE_PRODUCTS.map((prod) => {
                const isSelected = selectedProduct.sku === prod.sku;
                return (
                  <button
                    key={prod.sku}
                    type="button"
                    onClick={() => setSelectedProduct(prod)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-600 ring-2 ring-purple-600/30'
                        : 'bg-white border-purple-100 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="text-[9px] font-bold text-purple-500 uppercase">{prod.category}</div>
                      <div className="font-bold text-xs text-purple-950 mt-0.5">{prod.name}</div>
                    </div>
                    <div className="font-mono text-[9px] text-purple-600 mt-1">{prod.sku}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Rating */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-semibold text-purple-950">
              Overall Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-0.5 focus:outline-none transition-transform hover:scale-110"
                    >
                      <span className={`material-symbols-outlined text-[24px] ${isFilled ? 'material-symbols-filled' : ''}`}>
                        {isFilled ? 'star' : 'star_border'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          {/* Step 3: Photo Upload for Shoes (Up to 6 Photos) */}
          <div className="space-y-2 pt-2 border-t border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-purple-950">
                  Customer Shoe Photos <span className="text-purple-500 font-normal">({photos.length} / 6 uploaded)</span>
                </label>
                <p className="text-[11px] text-purple-900/60 mt-0.5">
                  Upload up to 6 on-foot, outsole, or in-hand sneaker photos to increase trust score.
                </p>
              </div>

              {photos.length < 6 && (
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors">
                  <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                  <span>Add Photos</span>
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

            {/* Photo Preview Grid (Up to 6 photos) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
              {photos.map((imgUrl, index) => (
                <div 
                  key={index} 
                  className="relative group aspect-square rounded-xl overflow-hidden border-2 border-purple-200 bg-purple-50 shadow-xs"
                >
                  <img
                    src={imgUrl}
                    alt={`Shoe upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.2 rounded font-mono font-medium">
                    Photo {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity"
                    title="Remove this photo"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </div>
              ))}

              {/* Empty placeholder slots */}
              {Array.from({ length: 6 - photos.length }).map((_, i) => (
                <label
                  key={`empty-${i}`}
                  className="aspect-square rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50/80 flex flex-col items-center justify-center text-purple-400 hover:text-purple-600 transition-colors cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">add_photo_alternate</span>
                  <span className="text-[10px] font-medium mt-1">Slot {photos.length + i + 1}</span>
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

          {/* Step 4: Review Details */}
          <div className="space-y-3 pt-2 border-t border-purple-100">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-purple-950">
                Headline / Headline Takeaway <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next level heel recoil for marathon prep"
                className="w-full h-9 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-purple-950">
                Written Review Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe fit, arch support, breathability, and ground feel across surfaces..."
                className="w-full p-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all leading-relaxed"
              ></textarea>
            </div>
          </div>

          {/* Step 5: Shoe Tags */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-purple-950">
              Shoe Attributes & Feel
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SHOE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 6: Customer Details & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-purple-100">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-purple-950">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Marcus Vance"
                className="w-full h-8 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-purple-950">
                Customer Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="marcus@sneakers.com"
                className="w-full h-8 px-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-purple-950">
                Retail / Ingestion Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full h-8 px-2.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs text-purple-950 focus:outline-none focus:border-purple-600"
              >
                <option value="Direct Web">Direct Web</option>
                <option value="Shopify Store">Shopify Store</option>
                <option value="Amazon Global">Amazon Global</option>
                <option value="In-App iOS">In-App iOS</option>
              </select>
            </div>
          </div>

          {/* Step 7: Checkboxes */}
          <div className="flex flex-wrap items-center gap-5 pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-purple-950 font-medium">
              <input
                type="checkbox"
                checked={recommend}
                onChange={(e) => setRecommend(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>I recommend this shoe to other runners & sneakerheads</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-purple-950 font-medium">
              <input
                type="checkbox"
                checked={verifiedPurchase}
                onChange={(e) => setVerifiedPurchase(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Verified Purchase (Receipt / Order matched)</span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-purple-300 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Validating Trust & Photos...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Submit Shoe Review ({photos.length} Photos)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
