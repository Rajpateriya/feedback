const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      } catch (_) {}
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Reviews
  getReviews: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.rating) q.append('rating', params.rating);
    if (params.search) q.append('search', params.search);
    if (params.sku) q.append('sku', params.sku);
    if (params.channel) q.append('channel', params.channel);
    if (params.sort) q.append('sort', params.sort);
    if (params.limit) q.append('limit', params.limit);
    return request(`/api/reviews?${q.toString()}`);
  },

  submitReview: (reviewData) => {
    return request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  voteReview: (id, voteType) => {
    return request(`/api/reviews/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType })
    });
  },

  // Moderation
  getModerationQueue: (params = {}) => {
    const q = new URLSearchParams();
    if (params.tab) q.append('tab', params.tab);
    if (params.search) q.append('search', params.search);
    if (params.sku) q.append('sku', params.sku);
    if (params.min_toxicity) q.append('min_toxicity', params.min_toxicity);
    return request(`/api/moderation/queue?${q.toString()}`);
  },

  executeAction: (reviewId, action, note = '', moderatorName = 'Eleanor Vance') => {
    return request(`/api/moderation/reviews/${reviewId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, note, moderator_name: moderatorName })
    });
  },

  executeBulkAction: (reviewIds, action, note = '', moderatorName = 'Eleanor Vance') => {
    return request('/api/moderation/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ review_ids: reviewIds, action, note, moderator_name: moderatorName })
    });
  },

  getRules: () => {
    return request('/api/moderation/rules');
  },

  updateRules: (rulesData) => {
    return request('/api/moderation/rules', {
      method: 'PUT',
      body: JSON.stringify(rulesData)
    });
  },

  // Analytics
  getAnalyticsOverview: () => {
    return request('/api/analytics/overview');
  }
};
