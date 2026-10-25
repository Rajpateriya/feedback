import React, { useState } from 'react';
import { api } from '../api/client';

const PRODUCTS = [
  { sku: 'SKU-PRO-AUDIO-9', name: 'Aura Pro Wireless ANC Headphones', category: 'Pro Audio' },
  { sku: 'SKU-ULTRA-DISPLAY-X', name: 'UltraVision 4K HDR Monitor', category: 'Displays' },
  { sku: 'SKU-STUDIO-MIC-PRO', name: 'SonicWave Studio Condenser Mic', category: 'Microphones' },
  { sku: 'SKU-STREAM-DECK-ELITE', name: 'OmniDeck Stream Controller', category: 'Production' },
];

const AVAILABLE_TAGS = [
  'Sound Quality', 'ANC Performance', 'Build Quality', 'Battery Life',
  'Ergonomics & Comfort', 'Color Accuracy', 'Software & Drivers', 'Value for Price'
];

export default function SubmitReview({ onReviewSubmitted, showToast }) {
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [channel, setChannel] = useState('Direct Web');
  const [recommend, setRecommend] = useState(true);
  const [verifiedPurchase, setVerifiedPurchase] = useState(true);
  const [selectedTags, setSelectedTags] = useState(['Sound Quality', 'Build Quality']);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return '5 Stars - Exceptional';
      case 4: return '4 Stars - Highly Satisfied';
      case 3: return '3 Stars - Average';
      case 2: return '2 Stars - Below Expectations';
      case 1: return '1 Star - Unsatisfactory';
      default: return 'Select Rating';
    }
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
        image_url: imageUrl.trim() || null
      };

      const res = await api.submitReview(payload);
      setSubmittedResult(res);
      showToast?.('Review processed by Trust Engine', 'success');
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
    setImageUrl('');
    setRating(5);
    setSubmittedResult(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-4">
      
      {/* Result Confirmation Banner */}
      {submittedResult && (
        <div className="mb-4 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] animate-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                submittedResult.status === 'approved' ? 'bg-emerald-600' : 
                submittedResult.status === 'flagged' ? 'bg-rose-600' : 'bg-slate-900'
              }`}>
                <span className="material-symbols-outlined text-[17px]">
                  {submittedResult.status === 'approved' ? 'verified' : 
                   submittedResult.status === 'flagged' ? 'warning' : 'pending_actions'}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  {submittedResult.status === 'approved' && 'Review Verified & Published Live!'}
                  {submittedResult.status === 'pending' && 'Review Queued for Verification'}
                  {submittedResult.status === 'flagged' && 'Review Flagged for Moderator Audit'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Sentiment: <strong>{(submittedResult.sentiment_score * 100).toFixed(0)}%</strong> &bull; Toxicity Risk: <strong>{(submittedResult.toxicity_score * 100).toFixed(0)}%</strong>
                </p>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              Write Another
            </button>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
        
        {/* Header */}
        <div className="border-b border-slate-100 pb-3">
          <h1 className="font-headline text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Submit a Review
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Share feedback on hardware performance, build quality, and usability.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Step 1: Select Product */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              Hardware / Software Asset <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRODUCTS.map((prod) => {
                const isSelected = selectedProduct.sku === prod.sku;
                return (
                  <button
                    key={prod.sku}
                    type="button"
                    onClick={() => setSelectedProduct(prod)}
                    className={`p-2 rounded-lg text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-[9px] font-medium text-slate-400 uppercase">{prod.category}</div>
                      <div className="font-semibold text-xs text-slate-800 mt-0.5">{prod.name}</div>
                    </div>
                    <div className="font-mono text-[9px] text-indigo-600 mt-0.5">{prod.sku}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Rating */}
          <div className="space-y-1 pt-0.5">
            <label className="block text-xs font-semibold text-slate-800">
              Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-0.5 text-amber-400 hover:scale-110 active:scale-95 transition-transform focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[20px] material-symbols-filled">
                      {star <= (hoverRating || rating) ? 'star' : 'star_border'}
                    </span>
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-slate-700">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          {/* Step 3: Title & Body */}
          <div className="space-y-2.5 pt-0.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Headline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Crisp soundstage and great battery life"
                className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800">
                  Review Text <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">{body.length} characters</span>
              </div>
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your workflows, key strengths, potential areas for improvement..."
                className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
              ></textarea>
            </div>
          </div>

          {/* Step 4: Tags */}
          <div className="space-y-1 pt-0.5">
            <label className="block text-xs font-semibold text-slate-800">
              Features
            </label>
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tag}</span>
                    <span className="material-symbols-outlined text-[11px]">
                      {isSelected ? 'check' : 'add'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: User details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <div className="space-y-0.5">
              <label className="block text-xs font-semibold text-slate-800">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Alex Sterling"
                className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="space-y-0.5">
              <label className="block text-xs font-semibold text-slate-800">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="alex@enterprise.com"
                className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="block text-xs font-semibold text-slate-800">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="Direct Web">Direct Web</option>
                <option value="Amazon Global">Amazon Global</option>
                <option value="Shopify Store">Shopify Store</option>
                <option value="In-App iOS">In-App iOS</option>
              </select>
            </div>

            <div className="space-y-0.5">
              <label className="block text-xs font-semibold text-slate-800">
                Screenshot URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recommend}
                onChange={(e) => setRecommend(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700">
                I recommend this product
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedPurchase}
                onChange={(e) => setVerifiedPurchase(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700">
                Verified buyer confirmation
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                  <span>Scoring...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">send</span>
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
