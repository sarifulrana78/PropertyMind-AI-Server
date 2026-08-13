import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import { Property } from '../models/Property.model';
import { AuthRequest } from '../middleware/auth.middleware';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ====================================================================
// AI FEATURE 1: Property Advisor Agent (Multi-step tool calling)
// ====================================================================

const ADVISOR_SYSTEM_PROMPT = `You are PropertyMind AI Advisor — an expert real estate agent and investment advisor with deep market knowledge. You help users find their perfect property, analyze markets, and make smart investment decisions.

You have access to these tools:
1. search_properties: Search the database for properties matching specific criteria
2. get_market_stats: Get average prices and market statistics for a city  
3. calculate_mortgage: Calculate monthly mortgage payment
4. compare_properties: Compare 2-3 properties side by side

Use these tools proactively when users ask about properties, prices, mortgages, or market trends. Always provide specific, data-driven advice. Be conversational, professional, and helpful. Format monetary values with $ and commas.`;

const advisorTools: Groq.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_properties',
      description: 'Search for properties in the database matching specific filters',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City to search in' },
          type: { type: 'string', enum: ['house', 'apartment', 'villa', 'condo', 'land'], description: 'Property type' },
          minPrice: { type: 'number', description: 'Minimum price in USD' },
          maxPrice: { type: 'number', description: 'Maximum price in USD' },
          minBeds: { type: 'number', description: 'Minimum bedrooms' },
          status: { type: 'string', enum: ['for-sale', 'for-rent'], description: 'Property status' },
          limit: { type: 'number', description: 'Number of results (max 5)', default: 3 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_market_stats',
      description: 'Get real estate market statistics for a specific city including average prices, trends, and inventory',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name to get statistics for' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_mortgage',
      description: 'Calculate monthly mortgage payment and total interest',
      parameters: {
        type: 'object',
        properties: {
          price: { type: 'number', description: 'Property price in USD' },
          downPaymentPercent: { type: 'number', description: 'Down payment percentage (e.g., 20 for 20%)' },
          annualInterestRate: { type: 'number', description: 'Annual interest rate percentage (e.g., 6.5 for 6.5%)' },
          loanTermYears: { type: 'number', description: 'Loan term in years (typically 15 or 30)' },
        },
        required: ['price', 'downPaymentPercent', 'annualInterestRate', 'loanTermYears'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_properties',
      description: 'Compare two or more properties by their IDs',
      parameters: {
        type: 'object',
        properties: {
          propertyIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of property IDs to compare (2-3 max)',
          },
        },
        required: ['propertyIds'],
      },
    },
  },
];

// Tool execution functions
async function executeSearchProperties(args: {
  city?: string; type?: string; minPrice?: number; maxPrice?: number;
  minBeds?: number; status?: string; limit?: number;
}) {
  const filter: Record<string, unknown> = {};
  if (args.city) filter['address.city'] = { $regex: args.city, $options: 'i' };
  if (args.type) filter.type = args.type;
  if (args.status) filter.status = args.status;
  if (args.minPrice || args.maxPrice) {
    filter.price = {};
    if (args.minPrice) (filter.price as Record<string, number>).$gte = args.minPrice;
    if (args.maxPrice) (filter.price as Record<string, number>).$lte = args.maxPrice;
  }
  if (args.minBeds) filter.bedrooms = { $gte: args.minBeds };

  const properties = await Property.find(filter)
    .limit(args.limit || 3)
    .select('title price address type bedrooms bathrooms sqft images rating status _id')
    .lean();

  return {
    count: properties.length,
    properties: properties.map(p => ({
      id: p._id,
      title: p.title,
      price: `$${p.price.toLocaleString()}`,
      city: p.address.city,
      type: p.type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      sqft: p.sqft,
      rating: p.rating,
      status: p.status,
    })),
  };
}

async function executeGetMarketStats(city: string) {
  const properties = await Property.find({ 'address.city': { $regex: city, $options: 'i' }, status: 'for-sale' }).lean();

  if (properties.length === 0) {
    return { city, message: 'No data available for this city', inventory: 0 };
  }

  const prices = properties.map(p => p.price);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const byType: Record<string, number[]> = {};
  properties.forEach(p => {
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push(p.price);
  });

  const typeStats = Object.entries(byType).map(([type, prices]) => ({
    type,
    count: prices.length,
    avgPrice: `$${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString()}`,
  }));

  return {
    city,
    inventory: properties.length,
    avgPrice: `$${Math.round(avgPrice).toLocaleString()}`,
    priceRange: { min: `$${minPrice.toLocaleString()}`, max: `$${maxPrice.toLocaleString()}` },
    byType: typeStats,
    marketTemperature: properties.length > 10 ? 'Hot' : properties.length > 5 ? 'Moderate' : 'Cool',
  };
}

function executeCalculateMortgage(price: number, downPaymentPercent: number, annualInterestRate: number, loanTermYears: number) {
  const downPayment = price * (downPaymentPercent / 100);
  const principal = price - downPayment;
  const monthlyRate = annualInterestRate / 100 / 12;
  const numPayments = loanTermYears * 12;
  const monthlyPayment = monthlyRate === 0
    ? principal / numPayments
    : (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  const totalPaid = monthlyPayment * numPayments;
  const totalInterest = totalPaid - principal;

  return {
    propertyPrice: `$${price.toLocaleString()}`,
    downPayment: `$${Math.round(downPayment).toLocaleString()} (${downPaymentPercent}%)`,
    loanAmount: `$${Math.round(principal).toLocaleString()}`,
    monthlyPayment: `$${Math.round(monthlyPayment).toLocaleString()}`,
    totalInterest: `$${Math.round(totalInterest).toLocaleString()}`,
    totalCost: `$${Math.round(totalPaid + downPayment).toLocaleString()}`,
    loanTerm: `${loanTermYears} years`,
    interestRate: `${annualInterestRate}%`,
  };
}

async function executeCompareProperties(propertyIds: string[]) {
  const properties = await Property.find({ _id: { $in: propertyIds } })
    .select('title price address type bedrooms bathrooms sqft yearBuilt parking amenities rating pricePerSqft')
    .lean();

  return {
    count: properties.length,
    comparison: properties.map(p => ({
      id: p._id,
      title: p.title,
      price: `$${p.price.toLocaleString()}`,
      pricePerSqft: `$${p.pricePerSqft}/sqft`,
      location: `${p.address.city}, ${p.address.state}`,
      type: p.type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      sqft: p.sqft.toLocaleString(),
      yearBuilt: p.yearBuilt,
      parking: p.parking,
      rating: p.rating,
      amenities: p.amenities?.slice(0, 5).join(', '),
    })),
  };
}

export const advisorChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, message: 'Messages array is required' });
      return;
    }

    const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: ADVISOR_SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Agentic loop with tool calling
    let continueLoop = true;
    const MAX_ITERATIONS = 5;
    let iteration = 0;

    while (continueLoop && iteration < MAX_ITERATIONS) {
      iteration++;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        tools: advisorTools,
        tool_choice: 'auto',
        max_tokens: 1024,
        stream: false,
      });

      const assistantMessage = completion.choices[0].message;
      groqMessages.push(assistantMessage);

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Send tool call notification to client
        res.write(`data: ${JSON.stringify({ type: 'tool_call', tools: assistantMessage.tool_calls.map(tc => tc.function.name) })}\n\n`);

        // Execute tools
        for (const toolCall of assistantMessage.tool_calls) {
          let toolResult: unknown;
          const args = JSON.parse(toolCall.function.arguments);

          try {
            switch (toolCall.function.name) {
              case 'search_properties':
                toolResult = await executeSearchProperties(args);
                break;
              case 'get_market_stats':
                toolResult = await executeGetMarketStats(args.city);
                break;
              case 'calculate_mortgage':
                toolResult = executeCalculateMortgage(args.price, args.downPaymentPercent, args.annualInterestRate, args.loanTermYears);
                break;
              case 'compare_properties':
                toolResult = await executeCompareProperties(args.propertyIds);
                break;
              default:
                toolResult = { error: 'Unknown tool' };
            }
          } catch (err) {
            toolResult = { error: `Tool execution failed: ${err}` };
          }

          groqMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });

          res.write(`data: ${JSON.stringify({ type: 'tool_result', name: toolCall.function.name, result: toolResult })}\n\n`);
        }
      } else {
        // No more tool calls — stream the final response
        continueLoop = false;

        // Now stream the final response
        const streamCompletion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          max_tokens: 1500,
          stream: true,
        });

        for await (const chunk of streamCompletion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            res.write(`data: ${JSON.stringify({ type: 'content', delta })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
      }
    }

    if (iteration >= MAX_ITERATIONS) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Max iterations reached' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('AI Advisor error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'AI advisor failed' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI error occurred' })}\n\n`);
      res.end();
    }
  }
};

// ====================================================================
// AI FEATURE 2: AI Listing Description & Analysis Generator
// ====================================================================

export const generateDescription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyData } = req.body;

    if (!propertyData) {
      res.status(400).json({ success: false, message: 'Property data is required' });
      return;
    }

    const prompt = `You are an expert real estate copywriter and market analyst. Given the following property details, generate:

1. A professional, compelling, SEO-optimized property description (150-200 words) that highlights unique features and emotional appeal
2. A structured market analysis report as JSON

Property Details:
- Title: ${propertyData.title}
- Type: ${propertyData.type}
- Price: $${propertyData.price?.toLocaleString()}
- Location: ${propertyData.address?.city}, ${propertyData.address?.state}
- Bedrooms: ${propertyData.bedrooms}, Bathrooms: ${propertyData.bathrooms}
- Square Footage: ${propertyData.sqft} sqft
- Year Built: ${propertyData.yearBuilt}
- Amenities: ${propertyData.amenities?.join(', ')}
- Status: ${propertyData.status}

Respond ONLY with this JSON structure:
{
  "aiDescription": "The compelling property description here...",
  "aiReport": {
    "positioning": "Brief market positioning statement (e.g., 'Competitively priced for the Austin market')",
    "targetBuyer": "Target buyer persona (e.g., 'Young professional couples, first-time homebuyers')",
    "predictedDaysToSell": 30,
    "confidence": 0.85,
    "highlights": ["key highlight 1", "key highlight 2", "key highlight 3"],
    "investmentScore": 7.5,
    "priceAnalysis": "Brief price analysis relative to market"
  }
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      res.status(500).json({ success: false, message: 'AI did not return a response' });
      return;
    }

    const result = JSON.parse(content);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Generate description error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI description' });
  }
};

export const generateMarketAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city } = req.body;

    if (!city) {
      res.status(400).json({ success: false, message: 'City is required' });
      return;
    }

    const properties = await Property.find({
      'address.city': { $regex: city, $options: 'i' },
      status: 'for-sale',
    }).select('price type bedrooms sqft yearBuilt rating createdAt').lean();

    if (properties.length === 0) {
      res.status(404).json({ success: false, message: 'No properties found for this city' });
      return;
    }

    const stats = {
      totalListings: properties.length,
      avgPrice: Math.round(properties.reduce((a, b) => a + b.price, 0) / properties.length),
      avgSqft: Math.round(properties.reduce((a, b) => a + b.sqft, 0) / properties.length),
      priceRange: { min: Math.min(...properties.map(p => p.price)), max: Math.max(...properties.map(p => p.price)) },
    };

    const prompt = `You are a real estate market analyst. Analyze this market data for ${city} and provide actionable insights.

Market Data:
${JSON.stringify(stats, null, 2)}

Provide a JSON response with:
{
  "summary": "2-3 sentence market overview",
  "trend": "bullish" | "bearish" | "neutral",
  "investmentOpportunity": "high" | "medium" | "low",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "buyerAdvice": "Specific advice for buyers",
  "sellerAdvice": "Specific advice for sellers",
  "priceOutlook": "6-month price outlook",
  "riskFactors": ["risk 1", "risk 2"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    res.json({ success: true, data: { city, stats, analysis } });
  } catch (error) {
    console.error('Market analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate market analysis' });
  }
};
