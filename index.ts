import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

// Define interface for environment variables
interface Env {
	JSEARCH_API_KEY: string;
	SERPER_API_KEY: string;
}

// Store API keys in module scope for legacy code that isn't yet updated
let jsearchApiKey = "";
let serperApiKey = "";

// Job data types
interface JobMatch {
	job_id: string;
	job_title: string;
	employer_name: string;
	job_city: string;
	job_state: string;
	job_country: string;
	job_employment_type: string;
	job_salary: string;
	job_description: string;
	job_apply_link: string;
	job_posted_at_datetime_utc: string;
	skill_match_score: number;
	match_reasons: string[];
}

interface DomainClassification {
	selected_domain: string;
	confidence_score: number;
	selection_reason: string;
	recommended_job_titles: string[];
}

// API response interfaces
interface SerperSearchResponse {
	organic?: Array<{
		title: string;
		snippet: string;
		link: string;
		date?: string;
		attributes?: Record<string, string>;
		position?: number;
	}>;
}

interface SerperNewsResponse {
	news?: Array<{
		title: string;
		link: string;
		snippet: string;
		date: string;
		source: string;
		imageUrl?: string;
		position: number;
	}>;
}

interface JSearchResponse {
	data?: Array<{
		job_id: string;
		job_title: string;
		employer_name: string;
		job_city: string;
		job_state: string;
		job_country: string;
		job_employment_type: string;
		job_salary: string;
		job_description: string;
		job_apply_link: string;
		job_posted_at_datetime_utc: string;
	}>;
}

// Job data type for internal use
interface JobData {
	job_id: string;
	job_title: string;
	employer_name: string;
	job_city: string;
	job_state: string;
	job_country: string;
	job_employment_type: string;
	job_salary: string;
	job_description: string;
	job_apply_link: string;
	job_posted_at_datetime_utc: string;
}

// Company analysis results
interface CompanyInfo {
	company_name: string;
	search_results: Array<{
		title: string;
		snippet: string;
		link: string;
		date?: string;
		attributes?: Record<string, string>;
		position?: number;
	}>;
	news?: Array<{
		title: string;
		link: string;
		snippet: string;
		date: string;
		source: string;
		imageUrl?: string;
		position: number;
	}>;
	current_openings: number;
	jobs: JobData[];
	analysis_summary: string;
}

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "Career Scout AI Tools",
		version: "2.0.0",
	});

	async init() {
		// Intelligent Job Search Tool (Enhanced)
		this.server.tool(
			"intelligent-job-search",
			{
				user_skills: z
					.array(z.string())
					.describe("Array of user skills"),
				job_role: z.string().describe("Primary job role/title user is looking for"),
				location: z.string().describe("Preferred job location"),
				experience_level: z.enum(["entry", "mid", "senior", "executive"]).optional(),
				employment_type: z
					.enum(["FULLTIME", "PARTTIME", "CONTRACTOR", "INTERN"])
					.optional(),
			},
			async ({
				user_skills,
				job_role,
				location,
				experience_level = "mid",
				employment_type = "FULLTIME",
			}) => {
				try {
					// Step 1: Classify domain and get job suggestions
					const domainClassification = await this.classifyJobDomain(
						user_skills,
						job_role,
					);

					// Step 2: Search for jobs using JSearch API
					const rawJobs = await this.searchJobsWithJSearch(
						job_role,
						location,
						employment_type,
					);

					// Step 3: Score and rank jobs based on skill match
					const rankedJobs = await this.scoreAndRankJobs(
						rawJobs,
						user_skills,
						domainClassification,
					);

					// Step 4: Generate career insights
					const careerInsights = await this.generateCareerInsights(
						user_skills,
						domainClassification,
						rankedJobs,
					);

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: true,
										domain_classification: domainClassification,
										total_jobs_found: rawJobs.length,
										top_matches: rankedJobs.slice(0, 10),
										career_insights: careerInsights,
										search_metadata: {
											query: job_role,
											location,
											employment_type,
											searched_at: new Date().toISOString(),
										},
									},
									null,
									2,
								),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error:
											error instanceof Error
												? error.message
												: "Failed to perform intelligent job search",
										input_params: { user_skills, job_role, location },
									},
									null,
									2,
								),
							},
						],
					};
				}
			},
		);

		// Company Intelligence Tool
		this.server.tool(
			"analyze-company",
			{
				company_name: z.string().describe("Company name to analyze"),
				include_jobs: z
					.boolean()
					.optional()
					.describe("Whether to include current job openings"),
			},
			async ({ company_name, include_jobs = false }) => {
				try {
					const companyInfo = await this.analyzeCompany(company_name, include_jobs);

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: true,
										company_analysis: companyInfo,
										analyzed_at: new Date().toISOString(),
									},
									null,
									2,
								),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									{
										success: false,
										error:
											error instanceof Error
												? error.message
												: "Failed to analyze company",
										company_name,
									},
									null,
									2,
								),
							},
						],
					};
				}
			},
		);

		// Web search tool (keeping your existing one)
		this.server.tool(
			"web-search",
			{
				search_query: z.string().describe("Search query to look up on the web"),
			},
			async ({ search_query }) => {
				try {
					const response = await fetch("https://google.serper.dev/search", {
						method: "POST",
						headers: {
							"X-API-KEY": this.env.SERPER_API_KEY,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ q: search_query }),
					});

					if (!response.ok) {
						throw new Error(`Search API responded with status: ${response.status}`);
					}

					const data = (await response.json()) as SerperSearchResponse;
					return {
						content: [{ type: "text", text: JSON.stringify(data) }],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									success: false,
									error:
										error instanceof Error
											? error.message
											: "Failed to perform web search",
									search_query,
								}),
							},
						],
					};
				}
			},
		);
	}

	// Helper method to classify job domain
	private async classifyJobDomain(
		skills: string[],
		jobRole: string,
	): Promise<DomainClassification> {
		const domains = {
			"Software Engineering": [
				"javascript",
				"python",
				"react",
				"node",
				"aws",
				"git",
				"api",
				"database",
				"programming",
				"development",
			],
			"Design & UI/UX": [
				"figma",
				"sketch",
				"photoshop",
				"ui",
				"ux",
				"design",
				"prototyping",
				"wireframe",
				"user experience",
			],
			"Product Management": [
				"product",
				"roadmap",
				"strategy",
				"analytics",
				"stakeholder",
				"requirements",
				"agile",
				"scrum",
			],
			Marketing: [
				"marketing",
				"seo",
				"content",
				"social media",
				"campaigns",
				"brand",
				"advertising",
				"growth",
			],
			Sales: [
				"sales",
				"crm",
				"lead generation",
				"negotiation",
				"business development",
				"client relations",
			],
			"Data Science": [
				"python",
				"sql",
				"machine learning",
				"statistics",
				"data analysis",
				"pandas",
				"numpy",
				"visualization",
			],
		};

		let bestMatch = "Software Engineering";
		let highestScore = 0;
		let matchedSkills: string[] = [];

		for (const [domain, domainSkills] of Object.entries(domains)) {
			const matches = skills.filter((skill) =>
				domainSkills.some(
					(domainSkill) =>
						skill.toLowerCase().includes(domainSkill.toLowerCase()) ||
						domainSkill.toLowerCase().includes(skill.toLowerCase()),
				),
			);

			const score = matches.length;
			if (score > highestScore) {
				highestScore = score;
				bestMatch = domain;
				matchedSkills = matches;
			}
		}

		const confidence = Math.min((highestScore / skills.length) * 100, 100);

		return {
			selected_domain: bestMatch,
			confidence_score: Math.round(confidence),
			selection_reason: `Matched ${highestScore} skills: ${matchedSkills.join(", ")}`,
			recommended_job_titles: this.getRecommendedTitles(bestMatch),
		};
	}

	// Helper method to search jobs with JSearch
	private async searchJobsWithJSearch(
		role: string,
		location: string,
		employmentType: string,
	): Promise<JobData[]> {
		const query = `${role} ${location}`;
		const response = await fetch(
			`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=3&employment_types=${employmentType}`,
			{
				headers: {
					"x-rapidapi-host": "jsearch.p.rapidapi.com",
					"x-rapidapi-key": this.env.JSEARCH_API_KEY,
				},
			},
		);

		const data = (await response.json()) as JSearchResponse;
		return data.data || [];
	}

	// Helper method to score and rank jobs
	private async scoreAndRankJobs(
		jobs: JobData[],
		userSkills: string[],
		domainInfo: DomainClassification,
	): Promise<JobMatch[]> {
		const scoredJobs = jobs.map((job) => {
			const jobDescription = (job.job_description || "").toLowerCase();
			const jobTitle = (job.job_title || "").toLowerCase();

			// Calculate skill match score
			let matchCount = 0;
			const matchedSkills: string[] = [];

			for (const skill of userSkills) {
				const skillLower = skill.toLowerCase();
				if (jobDescription.includes(skillLower) || jobTitle.includes(skillLower)) {
					matchCount++;
					matchedSkills.push(skill);
				}
			}

			const skillMatchScore = Math.round((matchCount / userSkills.length) * 100);

			// Generate match reasons
			const matchReasons = [
				`${matchCount} of your skills match this role`,
				matchedSkills.length > 0
					? `Matched skills: ${matchedSkills.slice(0, 3).join(", ")}`
					: "Role aligns with your domain expertise",
				`${domainInfo.confidence_score}% confidence in domain match`,
			];

			return {
				job_id: job.job_id || "",
				job_title: job.job_title || "",
				employer_name: job.employer_name || "",
				job_city: job.job_city || "",
				job_state: job.job_state || "",
				job_country: job.job_country || "",
				job_employment_type: job.job_employment_type || "",
				job_salary: job.job_salary || "",
				job_description: job.job_description || "",
				job_apply_link: job.job_apply_link || "",
				job_posted_at_datetime_utc: job.job_posted_at_datetime_utc || "",
				skill_match_score: skillMatchScore,
				match_reasons: matchReasons,
			};
		});

		// Sort by skill match score (descending)
		return scoredJobs.sort((a, b) => b.skill_match_score - a.skill_match_score);
	}

	// Helper method to generate career insights
	private async generateCareerInsights(
		skills: string[],
		domainInfo: DomainClassification,
		topJobs: JobMatch[],
	): Promise<any> {
		const insights = {
			skill_analysis: {
				total_skills: skills.length,
				top_skills: skills.slice(0, 5),
				domain_match: domainInfo.selected_domain,
				confidence: domainInfo.confidence_score,
			},
			market_trends: {
				avg_match_score: Math.round(
					topJobs.reduce((sum, job) => sum + job.skill_match_score, 0) / topJobs.length || 0,
				),
				top_employers: [
					...new Set(topJobs.slice(0, 10).map((job) => job.employer_name)),
				].slice(0, 5),
				common_locations: [
					...new Set(
						topJobs.slice(0, 10).map((job) => `${job.job_city}, ${job.job_state}`),
					),
				].slice(0, 5),
			},
			recommendations: {
				skill_gaps: this.identifySkillGaps(skills, topJobs),
				growth_opportunities: domainInfo.recommended_job_titles,
				next_steps: [
					"Focus on roles with 70%+ skill match",
					"Consider companies in your domain area",
					"Strengthen skills mentioned in top job descriptions",
				],
			},
		};

		return insights;
	}

	// Helper method to analyze company
	private async analyzeCompany(companyName: string, includeJobs: boolean): Promise<CompanyInfo> {
		// General company search
		const searchQuery = `"${companyName}" company profile business model revenue employees culture`;
		const searchResponse = await fetch("https://google.serper.dev/search", {
			method: "POST",
			headers: {
				"X-API-KEY": this.env.SERPER_API_KEY,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ q: searchQuery, num: 5 }),
		});

		const searchData = (await searchResponse.json()) as SerperSearchResponse;

		// Get company news
		const newsResponse = await fetch("https://google.serper.dev/news", {
			method: "POST",
			headers: {
				"X-API-KEY": this.env.SERPER_API_KEY,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ q: `${companyName}` }),
		});

		const newsData = (await newsResponse.json()) as SerperNewsResponse;

		let companyJobs: JobData[] = [];
		if (includeJobs) {
			try {
				const jobsResponse = await fetch(
					`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(companyName)}&page=1&num_pages=1`,
					{
						headers: {
							"x-rapidapi-host": "jsearch.p.rapidapi.com",
							"x-rapidapi-key": this.env.JSEARCH_API_KEY,
						},
					},
				);

				if (!jobsResponse.ok) {
					throw new Error(`Jobs API responded with status: ${jobsResponse.status}`);
				}

				const jobsData = (await jobsResponse.json()) as JSearchResponse;
				companyJobs = jobsData.data || [];
			} catch (error) {
				console.error("Error fetching company jobs:", error);
			}
		}

		return {
			company_name: companyName,
			search_results: searchData.organic || [],
			news: newsData.news || [],
			current_openings: companyJobs.length,
			jobs: includeJobs ? companyJobs.slice(0, 5) : [],
			analysis_summary: `Found ${searchData.organic?.length || 0} relevant search results, ${newsData.news?.length || 0} news articles, and ${companyJobs.length} current job openings`,
		};
	}

	// Utility methods for profile parsing
	private getRecommendedTitles(domain: string): string[] {
		const titleMap: Record<string, string[]> = {
			"Software Engineering": [
				"Software Engineer",
				"Full Stack Developer",
				"Backend Developer",
				"Frontend Developer",
				"DevOps Engineer",
			],
			"Design & UI/UX": [
				"UX Designer",
				"UI Designer",
				"Product Designer",
				"Visual Designer",
				"Design Lead",
			],
			"Product Management": [
				"Product Manager",
				"Senior Product Manager",
				"Product Owner",
				"Product Lead",
				"VP of Product",
			],
			Marketing: [
				"Marketing Manager",
				"Growth Manager",
				"Content Manager",
				"Digital Marketing Specialist",
				"Marketing Lead",
			],
			Sales: [
				"Sales Manager",
				"Account Executive",
				"Business Development Manager",
				"Sales Director",
				"Customer Success Manager",
			],
			"Data Science": [
				"Data Scientist",
				"Data Analyst",
				"Machine Learning Engineer",
				"Research Scientist",
				"Analytics Manager",
			],
		};

		return titleMap[domain] || ["Software Engineer", "Product Manager", "Data Analyst"];
	}

	private identifySkillGaps(userSkills: string[], jobs: JobMatch[]): string[] {
		const jobSkills = new Set<string>();
		const skillKeywords = [
			"javascript",
			"python",
			"react",
			"aws",
			"docker",
			"kubernetes",
			"sql",
			"mongodb",
			"api",
			"microservices",
		];

		for (const job of jobs.slice(0, 5)) {
			const description = job.job_description.toLowerCase();
			for (const skill of skillKeywords) {
				if (
					description.includes(skill) &&
					!userSkills.some((userSkill) => userSkill.toLowerCase().includes(skill))
				) {
					jobSkills.add(skill);
				}
			}
		}

		return Array.from(jobSkills).slice(0, 5);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Store API keys in module scope for legacy code that isn't yet updated
		jsearchApiKey = env.JSEARCH_API_KEY;
		serperApiKey = env.SERPER_API_KEY;

		// Add CORS headers to all responses
		if (request.method === "OPTIONS") {
			// Handle CORS preflight requests
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
					"Access-Control-Max-Age": "86400",
				}
			});
		}

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			// Create response from MCP handler
			const response = MyMCP.serveSSE("/sse").fetch(request, env, ctx);
			// Add CORS headers to the response
			return response.then(resp => {
				const newHeaders = new Headers(resp.headers);
				newHeaders.set("Access-Control-Allow-Origin", "*");
				newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
				newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
				
				return new Response(resp.body, {
					status: resp.status,
					statusText: resp.statusText,
					headers: newHeaders
				});
			});
		}

		if (url.pathname === "/mcp") {
			// Create response from MCP handler
			const response = MyMCP.serve("/mcp").fetch(request, env, ctx);
			// Add CORS headers to the response
			return response.then(resp => {
				const newHeaders = new Headers(resp.headers);
				newHeaders.set("Access-Control-Allow-Origin", "*");
				newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
				newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
				
				return new Response(resp.body, {
					status: resp.status,
					statusText: resp.statusText,
					headers: newHeaders
				});
			});
		}

		// Add a root route to provide basic info
		if (url.pathname === "/") {
			return new Response(JSON.stringify({
				status: "ok",
				message: "Career Scout MCP Server is running",
				endpoints: {
					mcp: "/mcp",
					sse: "/sse"
				}
			}), { 
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
				}
			});
		}

		return new Response("Not found", { 
			status: 404,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
			}
		});
	},
};
