import { BrandSiteCrawler } from '../lib/crawlers/brand-site-crawler';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const brandName = 'DR.O';
  const startUrl = 'https://www.droanswer.com';
  
  console.log('==================================================');
  console.log(`[Crawler Script] Starting crawling for ${brandName}...`);
  console.log(`URL: ${startUrl}`);
  console.log('==================================================');
  
  const crawler = new BrandSiteCrawler();
  
  try {
    const ssotData = await crawler.crawlAndExtract(startUrl, brandName, 3);
    
    console.log('[Crawler Script] Successfully crawled and structured SSoT data.');
    console.log(JSON.stringify(ssotData, null, 2).slice(0, 500) + '...\n');
    
    // Save to dr-o-ssot.ts
    const targetDir = path.join(process.cwd(), 'db', 'seed', 'domains');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const targetFile = path.join(targetDir, 'dr-o-ssot.ts');
    
    const fileContent = `/**
 * Generated SSoT (Single Source of Truth) for DR.O Brand
 * Created by BrandSiteCrawler on ${new Date().toISOString()}
 */
import { BrandSSoT } from '../../../lib/crawlers/brand-site-crawler';

export const DR_O_SSOT: BrandSSoT = ${JSON.stringify(ssotData, null, 2)};
`;

    fs.writeFileSync(targetFile, fileContent, 'utf8');
    console.log(`[Crawler Script] Saved SSoT data successfully to: ${targetFile}`);
  } catch (err: any) {
    console.error(`[Crawler Script] Error in execution: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
