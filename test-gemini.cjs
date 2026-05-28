const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyDLZbvwEHTR5gvZqSm15xjQZcHd9U3p5gE';
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say exactly: Hello world');
    console.log(`✅ Success with ${modelName}:`, result.response.text().trim());
    return true;
  } catch (err) {
    console.log(`❌ Error with ${modelName}:`, err.message);
    return false;
  }
}

async function runTests() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-pro');
  await testModel('gemini-1.0-pro');
}

runTests();
