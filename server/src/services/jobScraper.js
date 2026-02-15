import * as cheerio from 'cheerio';

/**
 * Scrape jobs from DevToolJobs and filter for "Developer" in title
 */
async function scrapeDevToolJobs() {
  const url = 'https://devtooljobs.com/search?q=Developer+Marketing&category=Marketing&page=1&pageSize=30';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const jobs = [];

    // Try different selectors to find job listings
    // DevToolJobs might use various structures
    const possibleSelectors = [
      'a[href*="/jobs/"]',
      '.job-listing',
      '[data-job]',
      'article',
      '.job-card',
      'div[class*="job"]'
    ];

    let foundJobs = false;

    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, element) => {
          const $el = $(element);

          // Try to extract job info
          let title = '';
          let link = '';
          let company = '';

          // If it's a link element
          if (element.name === 'a') {
            link = $el.attr('href');
            title = $el.text().trim();
          } else {
            // Look for title and link within the element
            const titleEl = $el.find('h2, h3, .job-title, [class*="title"]').first();
            title = titleEl.text().trim();

            const linkEl = $el.find('a').first();
            link = linkEl.attr('href');
          }

          // Look for company name
          const companyEl = $el.find('.company, [class*="company"]').first();
          if (companyEl.length) {
            company = companyEl.text().trim();
          }

          // Clean up link
          if (link && !link.startsWith('http')) {
            link = `https://devtooljobs.com${link}`;
          }

          // Only add if we have title and link, and contains developer/market keywords
          const titleLower = title.toLowerCase();
          const hasRelevantKeywords = titleLower.includes('developer') ||
                                      titleLower.includes('market');

          if (title && link && hasRelevantKeywords) {
            jobs.push({
              title: title.trim(),
              company: company || 'Company Name',
              url: link
            });
            foundJobs = true;
          }
        });

        if (foundJobs) {
          break; // Found the right selector
        }
      }
    }

    // If we couldn't parse the page structure, return empty with a note
    if (jobs.length === 0) {
      console.log('Could not parse job listings from DevToolJobs. Page structure may have changed.');

      // Try to extract ANY links that look like job postings as fallback
      $('a[href*="/jobs/"]').each((i, element) => {
        const $el = $(element);
        const title = $el.text().trim();
        const link = $el.attr('href');

        const titleLower = title.toLowerCase();
        const hasRelevantKeywords = titleLower.includes('developer') ||
                                    titleLower.includes('market');

        if (title && link && title.length > 10 && hasRelevantKeywords) {
          jobs.push({
            title: title,
            company: 'See posting for details',
            url: link.startsWith('http') ? link : `https://devtooljobs.com${link}`
          });
        }
      });
    }

    // Remove duplicates
    const uniqueJobs = jobs.reduce((acc, job) => {
      if (!acc.find(j => j.url === job.url)) {
        acc.push(job);
      }
      return acc;
    }, []);

    return uniqueJobs;
  } catch (error) {
    console.error('Error scraping DevToolJobs:', error);
    throw new Error(`Failed to scrape jobs: ${error.message}`);
  }
}

export {
  scrapeDevToolJobs
};
