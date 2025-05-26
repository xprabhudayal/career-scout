// app/api/mcp/route.js - Main MCP Server Endpoint
import { NextResponse } from 'next/server';
import { tools } from '../../../utils/tools.js';
import { searchJobsHandler } from '../../../utils/handlers/searchJobs.js';
import { jobDetailsHandler } from '../../../utils/handlers/jobDetails.js';
import { estimatedSalaryHandler } from '../../../utils/handlers/estimatedSalary.js';
import { companySalaryHandler } from '../../../utils/handlers/companySalary.js';
import { marketInsightHandler } from '../../../utils/handlers/marketInsight.js';

// Handle CORS for all origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET handler - Returns MCP server info and available tools
export async function GET() {
  try {
    const mcpResponse = {
      jsonrpc: "2.0",
      result: {
        protocolVersion: "1.0.0",
        serverInfo: {
          name: "career-scout-mcp",
          version: "1.0.0",
          description: "Career Scout MCP Server for job search and market insights"
        },
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        tools: tools
      }
    };

    return NextResponse.json(mcpResponse, { 
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error fetching MCP server info:', error);
    return NextResponse.json(
      { 
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message
        }
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// POST handler - Execute tool calls
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate JSONRPC request
    if (!body.jsonrpc || body.jsonrpc !== "2.0" || !body.method || !body.id) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: body.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request: Missing required JSONRPC fields'
          }
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Handle tools/list request
    if (body.method === 'tools/list') {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: body.id,
          result: {
            tools: tools
          }
        },
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    }

    // Handle tools/call request
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      
      let result;
      
      // Route to appropriate handler based on tool name
      switch (name) {
        case 'search-jobs':
          result = await searchJobsHandler(args);
          break;
        case 'job-details':
          result = await jobDetailsHandler(args);
          break;
        case 'estimated-salary':
          result = await estimatedSalaryHandler(args);
          break;
        case 'company-job-salary':
          result = await companySalaryHandler(args);
          break;
        case 'market-insight-tool':
          result = await marketInsightHandler(args);
          break;
        default:
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id: body.id,
              error: {
                code: -32601,
                message: `Method not found: ${name}`
              }
            },
            { 
              status: 404,
              headers: corsHeaders
            }
          );
      }

      // Format successful response
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: body.id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result)
              }
            ]
          }
        },
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    }

    // Unknown method
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: body.id,
        error: {
          code: -32601,
          message: `Method not found: ${body.method}`
        }
      },
      { 
        status: 404,
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: body?.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message
        }
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}