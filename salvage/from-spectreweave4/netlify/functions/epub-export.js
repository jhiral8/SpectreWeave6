// Temporarily disabled due to dependency issues
export const handler = async (event, context) => {
  return {
    statusCode: 503,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify({ 
      error: 'EPUB export temporarily unavailable',
      message: 'This feature is being updated. Please try again later.'
    })
  };
};