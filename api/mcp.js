const { randomUUID } = require('crypto');

const resources = [
  {
    title: 'WHO: El Niño preparedness and health guidance',
    url: 'https://www.who.int/emergencies/situations/el-nino',
    topics: ['health', 'water', 'food'],
  },
  {
    title: 'IFRC: El Niño preparedness resources',
    url: 'https://www.ifrc.org/our-work/disasters-climate-and-crises/climate-change-and-disaster-risk-reduction/el-nino',
    topics: ['shelter', 'water', 'evacuation'],
  },
  {
    title: 'ReliefWeb: El Niño updates and situation reports',
    url: 'https://reliefweb.int/disaster/elnino-2015-2016',
    topics: ['food', 'health', 'shelter', 'evacuation'],
  },
];

const tools = [
  {
    name: 'search_preparedness_resources',
    description: 'Find reputable El Niño preparedness resources for a broad location and topic. This is not emergency dispatch or official local advice.',
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'Country, region, or community; do not provide a precise address.' },
        topic: { type: 'string', enum: ['food', 'water', 'shelter', 'health', 'evacuation', 'general'], description: 'Preparedness topic.' },
      },
      required: ['location'],
      additionalProperties: false,
    },
  },
  {
    name: 'draft_community_contribution',
    description: 'Prepare a safe public draft for an El Niño-related offer, need, resource, or update. It never publishes content or stores personal data.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['offer', 'need', 'resource', 'update'] },
        title: { type: 'string' },
        description: { type: 'string' },
        broad_location: { type: 'string', description: 'A country, region, or community, never a precise address.' },
      },
      required: ['kind', 'title', 'description', 'broad_location'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_response_plan',
    description: 'Create a non-persistent, open response-project plan with practical next tasks for community coordination.',
    inputSchema: {
      type: 'object',
      properties: {
        project_name: { type: 'string' },
        location: { type: 'string', description: 'Country, region, or community.' },
        objective: { type: 'string' },
      },
      required: ['project_name', 'location', 'objective'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_research_resources',
    description: 'List the public research and preparedness resources included with Super El Nino.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, mcp-session-id, mcp-protocol-version');
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function toolResult(text) {
  return { content: [{ type: 'text', text }] };
}

function callTool(name, args = {}) {
  if (name === 'search_preparedness_resources') {
    const topic = args.topic || 'general';
    const matching = resources.filter((item) => topic === 'general' || item.topics.includes(topic));
    const links = (matching.length ? matching : resources).map((item) => `- ${item.title}: ${item.url}`).join('\n');
    return toolResult(`Preparedness resources for ${args.location}${topic === 'general' ? '' : ` (${topic})`}:\n${links}\n\nThese are broad resources, not a substitute for current local authority advice. For immediate danger, contact local emergency services.`);
  }

  if (name === 'draft_community_contribution') {
    return toolResult(`Draft only — not published or stored:\n\nType: ${args.kind}\nTitle: ${args.title}\nBroad location: ${args.broad_location}\nDescription: ${args.description}\n\nBefore sharing publicly, remove precise addresses, private contact details, medical information, and information about other people without their permission. Verify urgent or safety-critical information with local authorities.`);
  }

  if (name === 'create_response_plan') {
    return toolResult(`Non-persistent response plan for ${args.project_name} (${args.location})\nObjective: ${args.objective}\n\nSuggested open tasks:\n1. Confirm current guidance with relevant local authorities.\n2. List verified evacuation, water, food, shelter, and health resources.\n3. Assign an owner and due date for each verified resource.\n4. Publish only broad locations and consented contact channels.\n5. Schedule a review before sharing updates.\n\nThis plan has not been created in an external project system.`);
  }

  if (name === 'list_research_resources') {
    return toolResult(resources.map((item) => `- ${item.title}: ${item.url}`).join('\n'));
  }

  throw new Error('Unknown tool');
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204);
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST for MCP JSON-RPC requests.' });

  let message = req.body;
  if (typeof message === 'string') {
    try { message = JSON.parse(message); } catch { return send(res, 400, rpcError(null, -32700, 'Invalid JSON.')); }
  }
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return send(res, 400, rpcError(message?.id, -32600, 'Invalid JSON-RPC request.'));
  }

  const { id, method, params = {} } = message;
  if (method === 'initialize') {
    return send(res, 200, {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: params.protocolVersion || '2025-03-26',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'super-el-nino', version: '1.0.0' },
        instructions: 'Use this server for El Niño preparedness resources, safe non-persistent community contribution drafts, and response-plan templates. It is not an emergency service.',
      },
    }, { 'mcp-session-id': randomUUID() });
  }
  if (method === 'notifications/initialized') return send(res, 202);
  if (method === 'ping') return send(res, 200, { jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return send(res, 200, { jsonrpc: '2.0', id, result: { tools } });
  if (method === 'tools/call') {
    try {
      return send(res, 200, { jsonrpc: '2.0', id, result: callTool(params.name, params.arguments) });
    } catch (error) {
      return send(res, 200, rpcError(id, -32602, error.message));
    }
  }
  return send(res, 200, rpcError(id, -32601, 'Method not found.'));
};
