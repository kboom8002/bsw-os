const payload = {
  subIndustryKey: "skincare",
  options: {
    engines: ["chatgpt", "gemini"] 
  }
};

async function run() {
  console.log("Generating full industry report (using default domain config brands)...");
  
  try {
    const res = await fetch('http://localhost:3000/api/industry-report/generate', {
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
      const pubRes = await fetch(`http://localhost:3000/api/industry-report/${data.reportId}`, {
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
