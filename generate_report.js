const payload = {
  subIndustryKey: "skincare",
  brands: [
    { slug: "medicube", name: "메디큐브", domains: ["medicube.com", "medicube.co.kr"], keywords: ["메디큐브", "medicube"] },
    { slug: "isntree", name: "이즈앤트리", domains: ["isntree.com", "isntree.kr"], keywords: ["이즈앤트리", "isntree"] },
    { slug: "anua", name: "아누아", domains: ["anua.kr"], keywords: ["아누아", "anua"] },
    { slug: "cosrx", name: "코스알엑스", domains: ["cosrx.com", "cosrx.co.kr"], keywords: ["코스알엑스", "cosrx"] },
    { slug: "torriden", name: "토리든", domains: ["torriden.com", "torriden.co.kr"], keywords: ["토리든", "torriden"] }
  ],
  options: {
    engines: ["chatgpt", "gemini"] // Using chatgpt and gemini for speed, can add perplexity if available
  }
};

async function run() {
  console.log("Generating industry report... This might take a few minutes as it calls LLM APIs.");
  
  try {
    const res = await fetch('https://answerhub.kr/api/industry-report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      return;
    }
    
    console.log("Generate Response:", JSON.stringify(data, null, 2));
    
    if (data.reportId) {
      console.log(`\nPublishing report ${data.reportId}...`);
      const pubRes = await fetch(`https://answerhub.kr/api/industry-report/${data.reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      });
      const pubData = await pubRes.json();
      console.log("Publish Response:", JSON.stringify(pubData, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
