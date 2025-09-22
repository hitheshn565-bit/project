from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import requests
import random
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
SCRAPER_SERVICE_URL = "http://localhost:5000"

class SimpleRecommendationEngine:
    def __init__(self):
        self.category_queries = {
            'Electronics': ['laptop', 'smartphone', 'headphones', 'tablet', 'camera'],
            'Fashion': ['shirt', 'dress', 'shoes', 'jacket', 'jeans'],
            'Sports': ['running shoes', 'fitness tracker', 'sports equipment', 'gym'],
            'Home & Garden': ['furniture', 'home decor', 'kitchen appliances'],
            'Books': ['books', 'educational', 'novel'],
            'Automotive': ['car accessories', 'automotive parts']
        }
        
    def fetch_products_from_backend(self, query, limit=10):
        """Fetch products from our Node.js backend scraper service"""
        try:
            response = requests.get(f"http://localhost:3000/api/v1/scraper/search", 
                                  params={'q': query, 'limit': limit}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('combined', [])
        except Exception as e:
            logger.error(f"Error fetching from backend: {e}")
        return []
    
    def get_cold_start_recommendations(self, user_interests, limit=20):
        """Generate recommendations for new users based on interests"""
        try:
            recommendations = []
            
            for interest in user_interests:
                category = interest.get('category', 'Electronics')
                interest_level = interest.get('interest_level', 5)
                
                # Get queries for this category
                queries = self.category_queries.get(category, ['laptop'])
                
                for query in queries[:2]:  # Limit to 2 queries per category
                    products = self.fetch_products_from_backend(query, 5)
                    
                    for product in products:
                        score = self.calculate_popularity_score(product) * (interest_level / 10)
                        
                        recommendations.append({
                            'product': product,
                            'score': score,
                            'reason': f'Popular in {category}',
                            'algorithm': 'cold_start'
                        })
            
            # Sort by score and remove duplicates
            unique_recs = self.remove_duplicates(recommendations)
            return sorted(unique_recs, key=lambda x: x['score'], reverse=True)[:limit]
            
        except Exception as e:
            logger.error(f"Cold start recommendations error: {e}")
            return []
    
    def get_trending_recommendations(self, limit=20):
        """Get trending products"""
        try:
            trending_queries = ['laptop', 'smartphone', 'shoes', 'headphones', 'watch']
            recommendations = []
            
            for query in trending_queries:
                products = self.fetch_products_from_backend(query, 4)
                
                for product in products:
                    score = self.calculate_popularity_score(product) * 1.2  # Trending boost
                    
                    recommendations.append({
                        'product': product,
                        'score': score,
                        'reason': 'Trending now',
                        'algorithm': 'trending'
                    })
            
            unique_recs = self.remove_duplicates(recommendations)
            return sorted(unique_recs, key=lambda x: x['score'], reverse=True)[:limit]
            
        except Exception as e:
            logger.error(f"Trending recommendations error: {e}")
            return []
    
    def get_similar_recommendations(self, product_id, limit=10):
        """Get similar products (simplified version)"""
        try:
            # For simplicity, return random products from popular categories
            queries = ['laptop', 'smartphone', 'headphones']
            query = random.choice(queries)
            
            products = self.fetch_products_from_backend(query, limit)
            recommendations = []
            
            for product in products:
                score = self.calculate_popularity_score(product)
                recommendations.append({
                    'product': product,
                    'score': score,
                    'reason': 'Similar products',
                    'algorithm': 'similar'
                })
            
            return sorted(recommendations, key=lambda x: x['score'], reverse=True)
            
        except Exception as e:
            logger.error(f"Similar recommendations error: {e}")
            return []
    
    def calculate_popularity_score(self, product):
        """Calculate popularity score for a product"""
        try:
            # Extract rating
            rating_str = str(product.get('rating', '4.0'))
            rating = float(rating_str.split()[0]) if rating_str != 'N/A' else 4.0
            rating = min(max(rating, 0), 5)
            
            # Extract review count
            reviews_str = str(product.get('reviews_count', '100'))
            reviews = int(''.join(filter(str.isdigit, reviews_str))) if reviews_str != 'N/A' else 100
            
            # Extract price
            price_str = str(product.get('price', '1000'))
            price = float(''.join(filter(lambda x: x.isdigit() or x == '.', price_str))) or 1000
            
            # Calculate scores
            rating_score = (rating / 5.0) * 0.4
            review_score = min(reviews / 1000, 1.0) * 0.3
            price_score = min(10000 / max(price, 1), 1.0) * 0.3
            
            return rating_score + review_score + price_score
            
        except Exception as e:
            logger.error(f"Error calculating popularity score: {e}")
            return 0.5
    
    def remove_duplicates(self, recommendations):
        """Remove duplicate products"""
        seen_titles = set()
        unique_recs = []
        
        for rec in recommendations:
            title = rec['product'].get('title', '').lower()[:50]
            if title not in seen_titles:
                seen_titles.add(title)
                unique_recs.append(rec)
        
        return unique_recs

# Initialize recommendation engine
rec_engine = SimpleRecommendationEngine()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'simple-recommendation-engine'})

@app.route('/recommendations/cold-start', methods=['POST'])
def cold_start_recommendations():
    """Generate cold-start recommendations"""
    try:
        data = request.get_json()
        user_interests = data.get('interests', [])
        limit = data.get('limit', 20)
        
        if not user_interests:
            return jsonify({'error': 'User interests are required'}), 400
        
        recommendations = rec_engine.get_cold_start_recommendations(user_interests, limit)
        
        return jsonify({
            'recommendations': recommendations,
            'algorithm': 'cold_start',
            'total': len(recommendations)
        })
        
    except Exception as e:
        logger.error(f"Cold start recommendations error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/recommendations/trending', methods=['GET'])
def trending_recommendations():
    """Get trending recommendations"""
    try:
        limit = request.args.get('limit', 20, type=int)
        recommendations = rec_engine.get_trending_recommendations(limit)
        
        return jsonify({
            'recommendations': recommendations,
            'algorithm': 'trending',
            'total': len(recommendations)
        })
        
    except Exception as e:
        logger.error(f"Trending recommendations error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/recommendations/similar/<int:product_id>', methods=['GET'])
def similar_recommendations(product_id):
    """Get similar recommendations"""
    try:
        limit = request.args.get('limit', 10, type=int)
        recommendations = rec_engine.get_similar_recommendations(product_id, limit)
        
        return jsonify({
            'recommendations': recommendations,
            'algorithm': 'similar',
            'total': len(recommendations),
            'product_id': product_id
        })
        
    except Exception as e:
        logger.error(f"Similar recommendations error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/recommendations/stats', methods=['GET'])
def get_stats():
    """Get service stats"""
    return jsonify({
        'service': 'simple-recommendation-engine',
        'status': 'running',
        'algorithms': ['cold_start', 'trending', 'similar'],
        'last_updated': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("Simple recommendation service starting...")
    app.run(host='0.0.0.0', port=5001, debug=True)
