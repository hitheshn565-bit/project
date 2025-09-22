# Truetag Recommendation System

## Overview
A hybrid recommendation system combining collaborative filtering, content-based filtering, and cold-start solutions for new users.

## Algorithm Components

### 1. **Cold-Start Recommendations** (For New Users)
**Algorithm**: Interest-Based Content Filtering
- **Input**: User interests from signup (e.g., "Electronics", "Fashion", "Sports")
- **Process**: 
  - Map interests to product categories
  - Fetch trending/popular products from those categories
  - Apply popularity scoring based on ratings and review counts
- **Output**: Personalized product recommendations for new users

### 2. **Behavioral Recommendations** (For Existing Users)
**Algorithm**: Collaborative Filtering + Content-Based Hybrid
- **Input**: User interaction history (searches, views, purchases, wishlist)
- **Process**:
  - **Collaborative Filtering**: Find similar users based on behavior patterns
  - **Content-Based**: Recommend products similar to user's previous interactions
  - **Popularity Boost**: Boost trending items in user's preferred categories
- **Output**: Personalized recommendations based on behavior

### 3. **Real-Time Recommendations**
**Algorithm**: Session-Based Filtering
- **Input**: Current session activity (current search, viewed products)
- **Process**: 
  - Analyze current session context
  - Find products frequently viewed together
  - Apply real-time popularity scoring
- **Output**: "You might also like" recommendations

## Implementation Architecture

### Database Schema
```sql
-- User Interests (from signup)
CREATE TABLE user_interests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category VARCHAR NOT NULL,
  interest_level INTEGER DEFAULT 5, -- 1-10 scale
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Interactions
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_id VARCHAR NOT NULL, -- External product URL/ID
  interaction_type VARCHAR NOT NULL, -- 'view', 'search', 'wishlist', 'purchase'
  marketplace VARCHAR NOT NULL,
  category VARCHAR,
  price DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Categories Mapping
CREATE TABLE product_categories (
  id UUID PRIMARY KEY,
  product_id VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  subcategory VARCHAR,
  marketplace VARCHAR NOT NULL,
  confidence_score DECIMAL DEFAULT 0.8
);

-- Recommendation Cache
CREATE TABLE recommendation_cache (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  recommendations JSONB NOT NULL, -- Array of product recommendations
  recommendation_type VARCHAR NOT NULL, -- 'cold_start', 'behavioral', 'trending'
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints
```typescript
// Get personalized recommendations
GET /api/v1/recommendations/personal
GET /api/v1/recommendations/trending
GET /api/v1/recommendations/similar/:productId

// Track user interactions
POST /api/v1/interactions/track
{
  "product_id": "string",
  "interaction_type": "view|search|wishlist|purchase",
  "marketplace": "Amazon|Myntra",
  "category": "string",
  "price": number
}
```

## Recommendation Algorithms

### 1. **Cold-Start Algorithm**
```python
def get_cold_start_recommendations(user_interests, limit=20):
    recommendations = []
    
    for interest in user_interests:
        # Get trending products in this category
        trending_products = get_trending_by_category(interest.category, limit=10)
        
        # Score products based on popularity metrics
        for product in trending_products:
            score = calculate_popularity_score(product)
            recommendations.append({
                'product': product,
                'score': score * interest.interest_level,
                'reason': f'Popular in {interest.category}'
            })
    
    # Sort by score and return top recommendations
    return sorted(recommendations, key=lambda x: x['score'], reverse=True)[:limit]

def calculate_popularity_score(product):
    # Weighted scoring based on multiple factors
    rating_score = (product.rating / 5.0) * 0.3
    review_score = min(product.review_count / 1000, 1.0) * 0.2
    recency_score = calculate_recency_score(product.scraped_at) * 0.2
    price_competitiveness = calculate_price_score(product) * 0.3
    
    return rating_score + review_score + recency_score + price_competitiveness
```

### 2. **Behavioral Algorithm**
```python
def get_behavioral_recommendations(user_id, limit=20):
    user_interactions = get_user_interactions(user_id)
    
    # Collaborative Filtering
    similar_users = find_similar_users(user_id, user_interactions)
    collaborative_recs = get_recommendations_from_similar_users(similar_users)
    
    # Content-Based Filtering
    user_preferences = extract_user_preferences(user_interactions)
    content_recs = find_similar_products(user_preferences)
    
    # Hybrid Scoring
    final_recs = []
    for product in set(collaborative_recs + content_recs):
        collab_score = get_collaborative_score(product, collaborative_recs)
        content_score = get_content_score(product, content_recs)
        
        # Weighted hybrid score
        final_score = (collab_score * 0.6) + (content_score * 0.4)
        final_recs.append({
            'product': product,
            'score': final_score,
            'reason': 'Based on your activity'
        })
    
    return sorted(final_recs, key=lambda x: x['score'], reverse=True)[:limit]
```

### 3. **Real-Time Session Algorithm**
```python
def get_session_recommendations(session_data, current_product=None, limit=10):
    if current_product:
        # Find frequently bought/viewed together
        related_products = find_related_products(current_product)
        
        # Score based on co-occurrence frequency
        recommendations = []
        for product in related_products:
            score = calculate_co_occurrence_score(current_product, product)
            recommendations.append({
                'product': product,
                'score': score,
                'reason': 'Frequently viewed together'
            })
    else:
        # Use session search history
        session_categories = extract_session_categories(session_data)
        recommendations = get_trending_by_categories(session_categories, limit)
    
    return sorted(recommendations, key=lambda x: x['score'], reverse=True)[:limit]
```

## Performance Optimizations

### 1. **Caching Strategy**
- **Redis Cache**: Store computed recommendations for 1-6 hours
- **Background Jobs**: Pre-compute recommendations for active users
- **Incremental Updates**: Update recommendations when new interactions occur

### 2. **Scalability**
- **Batch Processing**: Process user interactions in batches
- **Distributed Computing**: Use Apache Spark for large-scale collaborative filtering
- **Real-time Streaming**: Use Kafka for real-time interaction tracking

### 3. **A/B Testing Framework**
- **Multiple Algorithms**: Test different recommendation strategies
- **Performance Metrics**: Track CTR, conversion rate, user engagement
- **Gradual Rollout**: Deploy new algorithms to subset of users

## Success Metrics

### 1. **Engagement Metrics**
- Click-through rate (CTR) on recommendations
- Time spent viewing recommended products
- Recommendation to wishlist conversion rate

### 2. **Business Metrics**
- Revenue from recommended products
- Average order value increase
- User retention improvement

### 3. **Technical Metrics**
- Recommendation response time (<100ms)
- Cache hit rate (>80%)
- System throughput (>1000 req/sec)

## Implementation Phases

### Phase 1: Cold-Start System (Week 1-2)
- Implement interest-based recommendations
- Basic category mapping
- Simple popularity scoring

### Phase 2: Behavioral System (Week 3-4)
- User interaction tracking
- Basic collaborative filtering
- Content-based recommendations

### Phase 3: Real-Time System (Week 5-6)
- Session-based recommendations
- Real-time interaction processing
- Advanced caching

### Phase 4: Optimization (Week 7-8)
- A/B testing framework
- Performance optimization
- Advanced ML algorithms
