## Project Overview

This service provides product catalog management capabilities including attribute listings and category tree structures.
The application is containerized for easy deployment and includes comprehensive testing and documentation.

⸻

# 🚀 Quick Start

Prerequisites
• Docker and Docker Compose
• Node.js 18+ (optional, for local development)

⸻

Setup and Execution

Start the application:

```
docker-compose up
```

This command will:  
• Build and start all necessary services and containers  
• Install dependencies and required libraries for the application  
• Initialize the database  
• Expose the application on port 3000  

Seed the Database (Optional)

You can populate the database with initial data for development or testing purposes.

With the app running inside a Docker container:
```
docker exec -it product-app npm run seed
```

Or, if you prefer to run it locally (outside Docker):
```
npm install
npm run seed
```

This will:  
• Create sample categories and attributes  
• Ensure relational integrity between category and attribute records  
• Log progress and results in the console  

⸻

# 🧪 Testing

Run Test Suite

```
npm test
```

The test suite includes:  
• Unit tests for business logic  
• Integration tests for API endpoints  
• Database interaction tests  
• Health check validation  

⸻

# 📘 API Documentation

Available Endpoints

Swagger UI

GET /docs  
• Interactive API documentation  
• Test endpoints directly from the browser  
• Schema definitions and examples  

Health Check

GET /health  
• Service status monitoring  
• Database connectivity check  
• Returns 200 with service status  

Attribute List

GET /attributes  
• Retrieve all attributes  
• Supports filtering ( by name, category, linked type etc) and pagination  
• Returns attribute metadata and values  

Category Tree

GET /categories/tree  
• Hierarchical category structure  
• Nested parent-child relationships  
• Complete product taxonomy  

⸻

# 🏗️ Architecture & Considerations

Metrics & Monitoring  
• Application Metrics: Track request rates, response times, and error rates  
• Business Metrics: Monitor category access patterns and attribute usage  
• Infrastructure Metrics: CPU, memory, and database connection pools  

Caching Strategy  
• Centralized cache manager is used to store frequently accessed data, minimizing redundant computations — particularly for operations with heavy processing or expensive queries.  
• The default cache duration is set to 5 seconds globally, while certain API endpoints are individually configured with extended lifetimes of up to 30 seconds, depending on data volatility and usage patterns.  
• Future optimization: Integrate Redis for enhanced scalability and distributed caching, following a two-layer architecture:  
  • L1: In-memory cache for high-frequency, low-latency data (e.g., product attributes)  
  • L2: Distributed Redis cache for more complex or hierarchical data (e.g., category trees)  

Scalability Considerations  
• Horizontal scaling with stateless application design  
• Database optimization:  
  • Read replicas for heavy read operations (category trees)  
  • Connection pooling and query optimization  
  • indexing on frequently queried fields (category hierarchies, attribute names)  
• CDN integration for static category structures  
• Rate limiting and API throttling  
• Database  
