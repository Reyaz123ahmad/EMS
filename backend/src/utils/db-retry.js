export async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (error.code === 'P2024') {
        console.warn(`DB connection timeout, retry ${attempt}/${maxRetries}`);
        
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, delay * attempt));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

export default withRetry;
