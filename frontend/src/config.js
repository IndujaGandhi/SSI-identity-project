const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://ssi-project-backend.onrender.com/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api')
};
console.log('🔧 CONFIG:', config.apiUrl);
export default config;