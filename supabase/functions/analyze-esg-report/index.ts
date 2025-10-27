import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalyzeRequest {
  reportId: string;
  reportText: string;
  companyId: string;
}

interface ESGIndicator {
  category: string;
  subcategory: string;
  indicator_name: string;
  indicator_value: string;
  unit?: string;
  context: string;
  sentiment: number;
  credibility_score: number;
  source_page?: number;
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

    const { reportId, reportText, companyId }: AnalyzeRequest = await req.json();

    const indicators: ESGIndicator[] = await extractESGIndicators(reportText);
    
    for (const indicator of indicators) {
      await supabase.from('esg_indicators').insert({
        report_id: reportId,
        company_id: companyId,
        ...indicator,
      });
    }

    const greenwashingFlags = await detectGreenwashing(reportText, indicators);
    
    if (greenwashingFlags.length > 0) {
      for (const flag of greenwashingFlags) {
        await supabase.from('greenwashing_flags').insert({
          company_id: companyId,
          report_id: reportId,
          ...flag,
        });
      }
    }

    const esgScore = calculateESGScore(indicators);
    
    const { data: scoreData, error: scoreError } = await supabase.from('esg_scores').insert({
      company_id: companyId,
      report_id: reportId,
      ...esgScore,
    }).select().single();

    if (scoreError) throw scoreError;

    await supabase.from('esg_reports').update({
      processing_status: 'completed',
      processed_at: new Date().toISOString(),
    }).eq('id', reportId);

    return new Response(
      JSON.stringify({
        success: true,
        indicators: indicators.length,
        greenwashing_flags: greenwashingFlags.length,
        score: scoreData,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error analyzing report:', error);
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

function extractESGIndicators(text: string): ESGIndicator[] {
  const indicators: ESGIndicator[] = [];
  const sentences = text.split(/[.!?]+/);

  const environmentalKeywords = [
    { pattern: /carbon emission|co2 emission|greenhouse gas|ghg/i, subcategory: 'carbon_emissions' },
    { pattern: /renewable energy|solar|wind power/i, subcategory: 'renewable_energy' },
    { pattern: /water consumption|water usage/i, subcategory: 'water_management' },
    { pattern: /waste reduction|recycling|circular economy/i, subcategory: 'waste_management' },
    { pattern: /biodiversity|ecosystem|deforestation/i, subcategory: 'biodiversity' },
  ];

  const socialKeywords = [
    { pattern: /employee|worker|labor/i, subcategory: 'labor_practices' },
    { pattern: /diversity|inclusion|equity/i, subcategory: 'diversity_inclusion' },
    { pattern: /safety|health|wellbeing/i, subcategory: 'health_safety' },
    { pattern: /community|local engagement/i, subcategory: 'community_engagement' },
    { pattern: /human rights|fair trade/i, subcategory: 'human_rights' },
  ];

  const governanceKeywords = [
    { pattern: /board|director|governance/i, subcategory: 'board_structure' },
    { pattern: /ethics|compliance|integrity/i, subcategory: 'ethics_compliance' },
    { pattern: /transparency|disclosure|reporting/i, subcategory: 'transparency' },
    { pattern: /risk management|risk assessment/i, subcategory: 'risk_management' },
    { pattern: /shareholder|stakeholder/i, subcategory: 'stakeholder_engagement' },
  ];

  const allKeywords = [
    { category: 'environmental', keywords: environmentalKeywords },
    { category: 'social', keywords: socialKeywords },
    { category: 'governance', keywords: governanceKeywords },
  ];

  sentences.forEach((sentence) => {
    if (sentence.trim().length < 10) return;

    allKeywords.forEach(({ category, keywords }) => {
      keywords.forEach(({ pattern, subcategory }) => {
        if (pattern.test(sentence)) {
          const numberMatch = sentence.match(/\d+\.?\d*/);
          const unitMatch = sentence.match(/(?:tonnes?|kg|kwh|mwh|percent|%|employees?|hours?)/i);

          if (numberMatch) {
            indicators.push({
              category,
              subcategory,
              indicator_name: subcategory.replace(/_/g, ' '),
              indicator_value: numberMatch[0],
              unit: unitMatch ? unitMatch[0] : undefined,
              context: sentence.trim(),
              sentiment: analyzeSentiment(sentence),
              credibility_score: calculateCredibility(sentence),
            });
          }
        }
      });
    });
  });

  return indicators;
}

function analyzeSentiment(text: string): number {
  const positiveWords = ['improved', 'increased', 'reduced emissions', 'enhanced', 'achieved', 'succeeded', 'committed', 'progress'];
  const negativeWords = ['failed', 'decreased performance', 'violation', 'incident', 'penalty', 'lawsuit', 'delayed'];

  let score = 0;
  const lowerText = text.toLowerCase();

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.2;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.2;
  });

  return Math.max(-1, Math.min(1, score));
}

function calculateCredibility(text: string): number {
  let credibility = 0.5;

  if (/verified|certified|audited|third[- ]party/i.test(text)) credibility += 0.3;
  if (/approximately|around|roughly/i.test(text)) credibility -= 0.1;
  if (/\d{4}|specific|measured/i.test(text)) credibility += 0.1;
  if (/aim to|plan to|intend to/i.test(text)) credibility -= 0.15;

  return Math.max(0, Math.min(1, credibility));
}

function detectGreenwashing(text: string, indicators: ESGIndicator[]) {
  const flags: any[] = [];

  const vagueClaims = text.match(/eco[- ]friendly|green|sustainable|environmentally[- ]conscious/gi);
  if (vagueClaims && vagueClaims.length > 5) {
    const specificMetrics = indicators.filter(i => i.indicator_value && i.unit).length;
    if (specificMetrics < vagueClaims.length * 0.3) {
      flags.push({
        flag_type: 'VAGUE_CLAIM',
        severity: 'MEDIUM',
        description: `High frequency of vague environmental claims (${vagueClaims.length}) with limited specific metrics (${specificMetrics})`,
        evidence: { vague_claims: vagueClaims.length, specific_metrics: specificMetrics },
      });
    }
  }

  const futureClaims = text.match(/will reduce|plan to|committed to|by 2030|by 2050/gi);
  const currentMetrics = indicators.filter(i => i.credibility_score > 0.6).length;
  if (futureClaims && futureClaims.length > currentMetrics * 2) {
    flags.push({
      flag_type: 'INCONSISTENCY',
      severity: 'HIGH',
      description: 'Excessive future commitments compared to current verified performance data',
      evidence: { future_claims: futureClaims.length, current_metrics: currentMetrics },
    });
  }

  const lowCredibilityCount = indicators.filter(i => i.credibility_score < 0.4).length;
  if (lowCredibilityCount > indicators.length * 0.5) {
    flags.push({
      flag_type: 'MISSING_DATA',
      severity: 'MEDIUM',
      description: 'Majority of claims lack third-party verification or specific measurements',
      evidence: { low_credibility_indicators: lowCredibilityCount, total_indicators: indicators.length },
    });
  }

  return flags;
}

function calculateESGScore(indicators: ESGIndicator[]) {
  const envIndicators = indicators.filter(i => i.category === 'environmental');
  const socIndicators = indicators.filter(i => i.category === 'social');
  const govIndicators = indicators.filter(i => i.category === 'governance');

  const calculateCategoryScore = (categoryIndicators: ESGIndicator[]) => {
    if (categoryIndicators.length === 0) return 50;

    const avgSentiment = categoryIndicators.reduce((sum, i) => sum + i.sentiment, 0) / categoryIndicators.length;
    const avgCredibility = categoryIndicators.reduce((sum, i) => sum + i.credibility_score, 0) / categoryIndicators.length;
    const dataRichness = Math.min(categoryIndicators.length / 10, 1);

    const baseScore = 50;
    const sentimentBonus = avgSentiment * 20;
    const credibilityBonus = avgCredibility * 20;
    const richnessBonus = dataRichness * 10;

    return Math.max(0, Math.min(100, baseScore + sentimentBonus + credibilityBonus + richnessBonus));
  };

  const environmentalScore = calculateCategoryScore(envIndicators);
  const socialScore = calculateCategoryScore(socIndicators);
  const governanceScore = calculateCategoryScore(govIndicators);

  const overallScore = (environmentalScore * 0.35 + socialScore * 0.35 + governanceScore * 0.3);

  let riskLevel = 'LOW';
  if (overallScore < 40) riskLevel = 'CRITICAL';
  else if (overallScore < 60) riskLevel = 'HIGH';
  else if (overallScore < 75) riskLevel = 'MEDIUM';

  const avgConfidence = indicators.reduce((sum, i) => sum + i.credibility_score, 0) / Math.max(indicators.length, 1);

  return {
    overall_score: Math.round(overallScore * 10) / 10,
    environmental_score: Math.round(environmentalScore * 10) / 10,
    social_score: Math.round(socialScore * 10) / 10,
    governance_score: Math.round(governanceScore * 10) / 10,
    risk_level: riskLevel,
    framework_used: 'HYBRID',
    confidence_score: Math.round(avgConfidence * 100) / 100,
    metrics: {
      total_indicators: indicators.length,
      environmental_indicators: envIndicators.length,
      social_indicators: socIndicators.length,
      governance_indicators: govIndicators.length,
    },
  };
}