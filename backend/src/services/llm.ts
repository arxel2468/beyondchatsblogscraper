import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama-3.1-8b-instant'; // Fast model, use 70b for better quality

export interface ReferenceArticle {
  title: string;
  url: string;
  content: string;
}

export interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
}

/**
 * Generate an improved version of an article using LLM
 */
export async function generateImprovedArticle(
  originalTitle: string,
  originalContent: string,
  references: ReferenceArticle[]
): Promise<GeneratedArticle> {
  console.log('🤖 Generating improved article with LLM...');

  // Clean original content (remove HTML)
  const cleanOriginal = originalContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);

  // Prepare reference summaries
  const referenceSummaries = references
    .map(
      (ref, i) => `
### Reference ${i + 1}: "${ref.title}"
Source: ${ref.url}
Content:
${ref.content.slice(0, 2000)}
`
    )
    .join('\n---\n');

  const systemPrompt = `You are an expert content writer and SEO specialist. Your task is to improve an existing article by:
1. Making it more comprehensive and well-structured
2. Incorporating relevant insights from reference articles
3. Improving readability with proper headings and formatting
4. Keeping the core message intact
5. Making it more engaging and informative

IMPORTANT: 
- Write in Markdown format
- Use ## for main headings, ### for subheadings
- Include bullet points and lists where appropriate
- Keep a professional but approachable tone
- Do NOT copy content directly - rewrite and improve
- Aim for 800-1200 words`;

  const userPrompt = `Please improve this article based on the reference articles.

## Original Article
Title: ${originalTitle}

Content:
${cleanOriginal}

---

## Reference Articles (Top Search Results)
${referenceSummaries}

---

Please provide your response in this EXACT format:

TITLE: [Your improved title here]

EXCERPT: [A 2-3 sentence summary/excerpt]

CONTENT:
[Your full improved article in Markdown format]`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Parse the response
    const titleMatch = response.match(/TITLE:\s*(.+?)(?=\n|EXCERPT:)/s);
    const excerptMatch = response.match(/EXCERPT:\s*(.+?)(?=\n\nCONTENT:|CONTENT:)/s);
    const contentMatch = response.match(/CONTENT:\s*([\s\S]+)$/);

    let title = titleMatch?.[1]?.trim() || originalTitle;
    let excerpt = excerptMatch?.[1]?.trim() || '';
    let content = contentMatch?.[1]?.trim() || response;

    // Add references section at the bottom
    const referencesSection = `

---

## References

This article was enhanced using insights from:

${references.map((ref, i) => `${i + 1}. [${ref.title}](${ref.url})`).join('\n')}
`;

    content += referencesSection;

    console.log(`✅ Generated improved article: "${title.slice(0, 50)}..."`);
    console.log(`   Tokens used: ${completion.usage?.total_tokens || 'N/A'}`);

    return { title, content, excerpt };
  } catch (error: any) {
    console.error('LLM Error:', error.message);

    if (error.status === 401) {
      throw new Error('Invalid GROQ_API_KEY. Please check your API key.');
    }
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(`Failed to generate article: ${error.message}`);
  }
}

/**
 * Check if LLM service is available
 */
export async function checkLLMHealth(): Promise<boolean> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY not set');
    return false;
  }

  try {
    await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    });
    return true;
  } catch {
    return false;
  }
}
