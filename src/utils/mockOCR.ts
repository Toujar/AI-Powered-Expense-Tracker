interface OCRResult {
  amount: number;
  vendor: string;
  date: string;
  category: string;
  confidence: number;
}

export function simulateOCR(file: File): Promise<OCRResult> {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Mock OCR results with random but realistic data
      const mockResults = [
        {
          amount: 45.67,
          vendor: "Grocery Store",
          date: new Date().toISOString().split('T')[0],
          category: "Food & Dining",
          confidence: 0.92
        },
        {
          amount: 12.50,
          vendor: "Coffee Shop",
          date: new Date().toISOString().split('T')[0],
          category: "Food & Dining",
          confidence: 0.88
        },
        {
          amount: 89.99,
          vendor: "Gas Station",
          date: new Date().toISOString().split('T')[0],
          category: "Transportation",
          confidence: 0.95
        },
        {
          amount: 25.00,
          vendor: "Restaurant",
          date: new Date().toISOString().split('T')[0],
          category: "Food & Dining",
          confidence: 0.90
        }
      ];
      
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      resolve(randomResult);
    }, 2000); // 2 second delay to simulate processing
  });
}