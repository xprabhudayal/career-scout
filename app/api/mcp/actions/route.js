// app/api/mcp/actions/route.js
// the main mcp server which handles all the tools for assistnt

import { NextResponse } from 'next/server';
import { tools } from '../../../utils/tools.js';
import { searchJobsHandler } from '../../../utils/handlers/searchJobs.js';
import { jobDetailsHandler } from '../../../utils/handlers/jobDetails.js';
import { estimatedSalaryHandler } from '../../../utils/handlers/estimatedSalary.js';
import { companySalaryHandler } from '../../../utils/handlers/companySalary.js';
import { marketInsightHandler } from '../../../utils/handlers/marketInsight.js';

// GET handler - Returns available tools
export async function GET() {
  try {
    return NextResponse.json(tools, { status: 200 });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

// POST handler - Execute tool actions
export async function POST(request) {
  try {
    const { tool, parameters } = await request.json();

    if (!tool || !parameters) {
      return NextResponse.json(
        { error: 'Missing tool or parameters' },
        { status: 400 }
      );
    }

    let result;

    // Route to appropriate handler based on tool name
    switch (tool) {
      case 'search-jobs':
        result = await searchJobsHandler(parameters);
        break;
      case 'job-details':
        result = await jobDetailsHandler(parameters);
        break;
      case 'estimated-salary':
        result = await estimatedSalaryHandler(parameters);
        break;
      case 'company-job-salary':
        result = await companySalaryHandler(parameters);
        break;
      case 'market-insight-tool':
        result = await marketInsightHandler(parameters);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error executing tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}