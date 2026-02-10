
export interface UnifiedSearchParams {
    search?: string;
    category?: string;
    
    // Price filters (products only)
    minPrice?: number;
    maxPrice?: number;
    
    // Product-specific filters
    colors?: string[];
    sizes?: string[];
    materials?: string[];
    styles?: string[];
    
    // Common filters
    minRating?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
    
    // Pagination
    page?: number;
    limit?: number;
    
    // Status filters
    isPushblished?: boolean;
    verified?: boolean; // for vendors
  }
  
  export interface UnifiedSearchResult {
    products: {
      items: any[];
      total: number;
      page: number;
      totalPages: number;
    };
    vendors: {
      items: any[];
      total: number;
      page: number;
      totalPages: number;
    };
    categories: any[];
  }