import { db } from '../config/db';
import { logger } from '../utils/logger';

export class DeduplicationService {
  
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  async findDuplicates(productId: string): Promise<Array<{
    product_id: string;
    similarity_score: number;
    match_type: string;
  }>> {
    try {
      const product = await db('products').where('id', productId).first();
      if (!product) return [];
      
      const candidates = await db('products')
        .select('*')
        .where('id', '!=', productId)
        .where('brand', 'ilike', `%${product.brand}%`)
        .limit(50);
      
      const duplicates = [];
      
      for (const candidate of candidates) {
        const titleSim = this.calculateSimilarity(product.title, candidate.title);
        
        if (titleSim > 0.7) {
          duplicates.push({
            product_id: candidate.id,
            similarity_score: titleSim,
            match_type: titleSim > 0.9 ? 'exact' : 'high'
          });
        }
      }
      
      return duplicates.sort((a, b) => b.similarity_score - a.similarity_score);
    } catch (error) {
      logger.error('Deduplication error', { error, productId });
      return [];
    }
  }
}

export const deduplicationService = new DeduplicationService();
