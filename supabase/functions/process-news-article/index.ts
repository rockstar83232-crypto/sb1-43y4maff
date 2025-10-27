import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NewsArticleRequest {
  companyId: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const articleData: NewsArticleRequest = await req.json();

    const sentiment = analyzeSentiment(articleData.content);
    const esgRelevance = calculateESGRelevance(articleData.content, articleData.title);
    const topics = extractTopics(articleData.content);

    const { data, error } = await supabase.from('news_articles').insert({
      company_id: articleData.companyId,
      title: articleData.title,
      content: articleData.content,
      source: articleData.source,
      source_url: articleData.sourceUrl,
      published_at: articleData.publishedAt,
      sentiment,
      esg_relevance: esgRelevance,
      topics,
      processing_status: 'completed',
    }).select().single();

    if (error) throw error;

    if (sentiment < -0.5 && esgRelevance > 0.7) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', articleData.companyId)
        .single();

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id')
        .contains('watched_companies', [articleData.companyId]);

      if (profiles) {
        for (const profile of profiles) {
          await supabase.from('alerts').insert({
            user_id: profile.id,
            company_id: articleData.companyId,
            alert_type: 'NEW_REPORT',
            severity: 'WARNING',
            title: `Negative ESG News: ${companyData?.name || 'Company'}`,
            message: `New article with negative sentiment detected: ${articleData.title}`,
            data: { article_id: data.id, sentiment, source: articleData.source },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        article: data,
        analysis: { sentiment, esg_relevance: esgRelevance, topics },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing news article:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function analyzeSentiment(text: string): number {
  const positiveWords = [
    'improved', 'increased', 'success', 'achievement', 'leader', 'innovation',
    'sustainable', 'commitment', 'progress', 'excellence', 'award', 'recognition',
    'certified', 'verified', 'transparent', 'responsible', 'ethical'
  ];

  const negativeWords = [
    'scandal', 'violation', 'lawsuit', 'penalty', 'fine', 'investigation',
    'controversy', 'criticism', 'failure', 'decline', 'loss', 'breach',
    'pollution', 'discrimination', 'corruption', 'greenwashing', 'misleading'
  ];

  const lowerText = text.toLowerCase();
  let score = 0;
  let wordCount = 0;

  positiveWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    score += matches * 0.1;
    wordCount += matches;
  });

  negativeWords.forEach(word => {
    const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
    score -= matches * 0.15;
    wordCount += matches;
  });

  if (wordCount === 0) return 0;

  return Math.max(-1, Math.min(1, score / Math.sqrt(wordCount + 1)));
}

function calculateESGRelevance(content: string, title: string): number {
  const esgKeywords = [
    'environmental', 'social', 'governance', 'esg', 'sustainability',
    'climate', 'carbon', 'emission', 'renewable', 'energy',
    'diversity', 'inclusion', 'labor', 'human rights', 'community',
    'ethics', 'compliance', 'transparency', 'board', 'stakeholder',
    'supply chain', 'circular economy', 'biodiversity', 'water',
    'waste', 'recycling', 'safety', 'health', 'wellbeing'
  ];

  const combinedText = `${title} ${content}`.toLowerCase();
  let matchCount = 0;

  esgKeywords.forEach(keyword => {
    if (combinedText.includes(keyword)) {
      matchCount += keyword.split(' ').length;
    }
  });

  const relevanceScore = Math.min(matchCount / 10, 1);
  return Math.round(relevanceScore * 100) / 100;
}

function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();

  const topicPatterns = [
    { topic: 'Climate Change', keywords: ['climate', 'global warming', 'carbon', 'emission'] },
    { topic: 'Renewable Energy', keywords: ['solar', 'wind', 'renewable energy', 'clean energy'] },
    { topic: 'Diversity & Inclusion', keywords: ['diversity', 'inclusion', 'equity', 'dei'] },
    { topic: 'Labor Practices', keywords: ['labor', 'worker', 'employee rights', 'union'] },
    { topic: 'Corporate Governance', keywords: ['governance', 'board', 'executive', 'shareholder'] },
    { topic: 'Supply Chain', keywords: ['supply chain', 'sourcing', 'supplier', 'procurement'] },
    { topic: 'Water Management', keywords: ['water', 'drought', 'water scarcity'] },
    { topic: 'Waste & Recycling', keywords: ['waste', 'recycling', 'circular economy'] },
    { topic: 'Human Rights', keywords: ['human rights', 'forced labor', 'child labor'] },
    { topic: 'Transparency', keywords: ['transparency', 'disclosure', 'reporting'] },
    { topic: 'Biodiversity', keywords: ['biodiversity', 'ecosystem', 'deforestation'] },
    { topic: 'Health & Safety', keywords: ['safety', 'health', 'accident', 'injury'] },
  ];

  topicPatterns.forEach(({ topic, keywords }) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      topics.push(topic);
    }
  });

  return topics;
}