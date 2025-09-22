from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
import redis
import json
import requests
import os
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Redis connection
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
    logger.info("Connected to Redis")
except:
    logger.warning("Redis not available, using in-memory cache")
    redis_client = None

# Configuration
SCRAPER_SERVICE_URL = "http://localhost:5000"
BACKEND_SERVICE_URL = "http://localhost:3000/api/v1"

class RecommendationEngine:
    def __init__(self):
        self.product_data = pd.DataFrame()
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.tfidf_matrix = None
        self.user_interactions = {}
        self.category_mapping = {
            'Electronics': ['laptop', 'smartphone', 'headphones', 'tablet', 'camera'],
            'Fashion': ['shirt', 'dress', 'shoes', 'jacket', 'jeans'],
            'Sports': ['running shoes', 'fitness tracker', 'sports equipment', 'gym'],
            'Home & Garden': ['furniture', 'home decor', 'kitchen appliances'],
            'Books': ['books', 'educational', 'novel'],
            'Automotive': ['car accessories', 'automotive parts']
        }
        
    def fetch_product_data(self, queries, limit_per_query=10):
        """Fetch product data from scraper service"""
        products = []
        
        for query in queries:
            try:
                response = requests.get(f"{SCRAPER_SERVICE_URL}/scrape/amazon", 
                                      params={'q': query}, timeout=30)
                if response.status_code == 200:
                    amazon_products = response.json()
                    for product in amazon_products[:limit_per_query]:
                        product['marketplace'] = 'Amazon'
                        product['category'] = self._infer_category(product.get('name', ''))
                        products.append(product)
                
                response = requests.get(f"{SCRAPER_SERVICE_URL}/scrape/myntra", 
                                      params={'q': query}, timeout=30)
                if response.status_code == 200:
                    myntra_products = response.json()
                    for product in myntra_products[:limit_per_query]:
                        product['marketplace'] = 'Myntra'
                        product['category'] = self._infer_category(product.get('name', ''))
                        products.append(product)
                        
            except Exception as e:
                logger.error(f"Error fetching data for query {query}: {e}")
                
        return products
    
    def _infer_category(self, product_name):
        """Infer product category from name"""
        product_name_lower = product_name.lower()
        
        for category, keywords in self.category_mapping.items():
            if any(keyword in product_name_lower for keyword in keywords):
                return category
        
        return 'General'
    
    def update_product_data(self):
        """Update product database with fresh data"""
        logger.info("Updating product data...")
        
        # Fetch data for popular categories
        queries = ['laptop', 'smartphone', 'shirt', 'shoes', 'headphones', 'watch', 'bag']
        products = self.fetch_product_data(queries, limit_per_query=15)
        
        if products:
            self.product_data = pd.DataFrame(products)
            self.product_data['id'] = range(len(self.product_data))
            
            # Create TF-IDF matrix for content-based filtering
            if 'name' in self.product_data.columns:
                self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(
                    self.product_data['name'].fillna('')
                )
            
            logger.info(f"Updated product data with {len(products)} products")
            
            # Cache the data
            if redis_client:
                redis_client.setex('product_data', 3600, json.dumps(products))
        
        return len(products)
    
    def get_cold_start_recommendations(self, user_interests, limit=20):
        """Generate recommendations for new users based on interests"""
        try:
            if self.product_data.empty:
                self.update_product_data()
            
            recommendations = []
            
            for interest in user_interests:
                category = interest.get('category')
                interest_level = interest.get('interest_level', 5)
                
                # Filter products by category
                category_products = self.product_data[
                    self.product_data['category'] == category
                ].copy()
                
                if category_products.empty:
                    continue
                
                # Calculate popularity score
                category_products['popularity_score'] = category_products.apply(
                    self._calculate_popularity_score, axis=1
                )
                
                # Weight by interest level
                category_products['final_score'] = (
                    category_products['popularity_score'] * (interest_level / 10)
                )
                
                # Add to recommendations
                top_products = category_products.nlargest(5, 'final_score')
                
                for _, product in top_products.iterrows():
                    recommendations.append({
                        'product': product.to_dict(),
                        'score': product['final_score'],
                        'reason': f'Popular in {category}',
                        'algorithm': 'cold_start'
                    })
            
            # Sort by score and remove duplicates
            recommendations = sorted(recommendations, key=lambda x: x['score'], reverse=True)
            unique_recommendations = self._remove_duplicates(recommendations)
            
            return unique_recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Cold start recommendations error: {e}")
            return []
    
    def get_content_based_recommendations(self, product_id, limit=10):
        """Get similar products using content-based filtering"""
        try:
            if self.product_data.empty or self.tfidf_matrix is None:
                self.update_product_data()
            
            if product_id >= len(self.product_data):
                return []
            
            # Calculate cosine similarity
            cosine_similarities = cosine_similarity(
                self.tfidf_matrix[product_id:product_id+1], 
                self.tfidf_matrix
            ).flatten()
            
            # Get similar product indices
            similar_indices = cosine_similarities.argsort()[-limit-1:-1][::-1]
            
            recommendations = []
            for idx in similar_indices:
                if idx != product_id:  # Exclude the same product
                    product = self.product_data.iloc[idx]
                    recommendations.append({
                        'product': product.to_dict(),
                        'score': float(cosine_similarities[idx]),
                        'reason': 'Similar products',
                        'algorithm': 'content_based'
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Content-based recommendations error: {e}")
            return []
    
    def get_trending_recommendations(self, limit=20):
        """Get trending products based on popularity metrics"""
        try:
            if self.product_data.empty:
                self.update_product_data()
            
            # Calculate trending score
            df_copy = self.product_data.copy()
            df_copy['trending_score'] = df_copy.apply(
                lambda x: self._calculate_popularity_score(x) * 1.2, axis=1
            )
            
            # Get top trending products
            trending_products = df_copy.nlargest(limit, 'trending_score')
            
            recommendations = []
            for _, product in trending_products.iterrows():
                recommendations.append({
                    'product': product.to_dict(),
                    'score': product['trending_score'],
                    'reason': 'Trending now',
                    'algorithm': 'trending'
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Trending recommendations error: {e}")
            return []
    
    def _calculate_popularity_score(self, product):
        """Calculate popularity score for a product"""
        try:
            # Extract rating (handle different formats)
            rating_str = str(product.get('rating', '4.0'))
            rating = float(rating_str.split()[0]) if rating_str != 'N/A' else 4.0
            rating = min(max(rating, 0), 5)  # Clamp between 0-5
            
            # Extract review count
            reviews_str = str(product.get('reviews', '100'))
            reviews = int(''.join(filter(str.isdigit, reviews_str))) if reviews_str != 'N/A' else 100
            
            # Extract price
            price_str = str(product.get('price', '1000'))
            price = float(''.join(filter(lambda x: x.isdigit() or x == '.', price_str))) or 1000
            
            # Calculate normalized scores
            rating_score = (rating / 5.0) * 0.4
            review_score = min(reviews / 1000, 1.0) * 0.3
            price_score = min(10000 / max(price, 1), 1.0) * 0.3
            
            return rating_score + review_score + price_score
            
        except Exception as e:
            logger.error(f"Error calculating popularity score: {e}")
            return 0.5  # Default score
    
    def _remove_duplicates(self, recommendations):
        """Remove duplicate products from recommendations"""
        seen_titles = set()
        unique_recs = []
        
        for rec in recommendations:
            title = rec['product'].get('name', '').lower()[:50]
            if title not in seen_titles:
                seen_titles.add(title)
                unique_recs.append(rec)
        
        return unique_recs

# Initialize recommendation engine
rec_engine = RecommendationEngine()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'recommendation-engine'})

@app.route('/recommendations/cold-start', methods=['POST'])
def cold_start_recommendations():
    """Generate cold-start recommendations based on user interests"""
    try:
        data = request.get_json()
        user_interests = data.get('interests', [])
        limit = data.get('limit', 20)
        
        if not user_interests:
            return jsonify({'error': 'User interests are required'}), 400
        
        # Check cache
        cache_key = f"cold_start:{hash(str(user_interests))}:{limit}"
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                return jsonify(json.loads(cached))
        
        recommendations = rec_engine.get_cold_start_recommendations(user_interests, limit)
        
        result = {
            'recommendations': recommendations,
            'algorithm': 'cold_start',
            'total': len(recommendations)
        }
        
        # Cache for 1 hour
        if redis_client:
            redis_client.setex(cache_key, 3600, json.dumps(result))
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Cold start recommendations error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/recommendations/trending', methods=['GET'])
def trending_recommendations():
    """Get trending product recommendations"""
    try:
        limit = request.args.get('limit', 20, type=int)
        
        # Check cache
        cache_key = f"trending:{limit}"
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                return jsonify(json.loads(cached))
        
        recommendations = rec_engine.get_trending_recommendations(limit)
        
        result = {
            'recommendations': recommendations,
            'algorithm': 'trending',
            'total': len(recommendations)
        }
        
        # Cache for 30 minutes
        if redis_client:
            redis_client.setex(cache_key, 1800, json.dumps(result))
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Trending recommendations error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/recommendations/similar/<int:product_id>', methods=['GET'])
def similar_recommendations(product_id):
    """Get similar product recommendations"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        # Check cache
        cache_key = f"similar:{product_id}:{limit}"
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                return jsonify(json.loads(cached))
        
        recommendations = rec_engine.get_content_based_recommendations(product_id, limit)
        
        result = {
            'recommendations': recommendations,
            'algorithm': 'content_based',
            'total': len(recommendations),
            'product_id': product_id
        }
        
        # Cache for 2 hours
        if redis_client:
            redis_client.setex(cache_key, 7200, json.dumps(result))
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Similar recommendations error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/recommendations/update-data', methods=['POST'])
def update_product_data():
    """Manually trigger product data update"""
    try:
        count = rec_engine.update_product_data()
        return jsonify({
            'success': True,
            'message': f'Updated product data with {count} products'
        })
    except Exception as e:
        logger.error(f"Data update error: {e}")
        return jsonify({'error': 'Failed to update data'}), 500

@app.route('/recommendations/stats', methods=['GET'])
def get_stats():
    """Get recommendation service statistics"""
    try:
        stats = {
            'total_products': len(rec_engine.product_data),
            'categories': rec_engine.product_data['category'].value_counts().to_dict() if not rec_engine.product_data.empty else {},
            'marketplaces': rec_engine.product_data['marketplace'].value_counts().to_dict() if not rec_engine.product_data.empty else {},
            'last_updated': datetime.now().isoformat(),
            'cache_status': 'connected' if redis_client else 'disconnected'
        }
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return jsonify({'error': 'Failed to get stats'}), 500

if __name__ == '__main__':
    # Initialize with some data
    try:
        rec_engine.update_product_data()
        logger.info("Recommendation service started successfully")
    except Exception as e:
        logger.error(f"Failed to initialize data: {e}")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
