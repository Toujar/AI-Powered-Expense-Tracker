// Test file to check environment variables
console.log('Environment variables test:');
console.log('import.meta.env:', import.meta.env);
console.log('VITE_AI_PROVIDER:', import.meta.env.VITE_AI_PROVIDER);
console.log('VITE_AI_MODEL:', import.meta.env.VITE_AI_MODEL);
console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? '***' : 'undefined');
