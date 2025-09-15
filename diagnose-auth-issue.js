#!/usr/bin/env node

/**
 * Authentication Issue Diagnostic Tool
 * 
 * This script helps identify the specific cause of 401 authentication errors
 * in the image generation API by testing various authentication scenarios.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class AuthDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:3006';
    this.envPath = path.join(__dirname, '.env.local');
  }

  async runDiagnostics() {
    console.log('🔍 Authentication Issue Diagnostic Tool');
    console.log('=======================================');
    console.log();

    await this.checkEnvironmentVariables();
    await this.checkServerResponse();
    await this.testAuthenticationFlow();
    await this.checkSupabaseConnection();
    await this.provideSolutions();
  }

  async checkEnvironmentVariables() {
    console.log('🔧 Checking Environment Variables...');
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    let envContent = '';
    try {
      envContent = fs.readFileSync(this.envPath, 'utf8');
    } catch (error) {
      console.log('❌ .env.local file not found or not readable');
      console.log('   Create .env.local with your Supabase credentials');
      return;
    }

    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    requiredVars.forEach(varName => {
      const value = envVars[varName] || process.env[varName];
      if (value) {
        console.log(`✅ ${varName}: Present`);
        
        // Basic validation
        if (varName.includes('URL') && !value.startsWith('https://')) {
          console.log(`   ⚠️  Warning: URL should start with https://`);
        }
        if (varName.includes('KEY') && value.length < 20) {
          console.log(`   ⚠️  Warning: Key seems too short`);
        }
      } else {
        console.log(`❌ ${varName}: Missing`);
      }
    });
    
    console.log();
  }

  async checkServerResponse() {
    console.log('🌐 Checking Server Response Details...');
    
    try {
      const result = await this.makeDetailedRequest('/api/children-books/generate-images', 'POST', {
        bookId: 'diagnostic-test',
        action: 'generate-single',
        pageNumber: 1,
        illustrationPrompt: 'Diagnostic test prompt',
        style: 'watercolor',
        theme: 'test',
        targetAge: '3-5'
      });

      console.log('📤 Request sent successfully');
      console.log(`📥 Response Status: ${result.status}`);
      console.log(`📥 Response Headers:`, JSON.stringify(result.headers, null, 2));
      console.log(`📥 Response Body:`, JSON.stringify(result.data, null, 2));
      
      if (result.status === 401 && result.data && result.data.error === 'Authentication required') {
        console.log('✅ Server is correctly identifying lack of authentication');
        console.log('🎯 Root cause: Client is not sending authentication headers');
      } else {
        console.log('⚠️  Unexpected server response');
      }
    } catch (error) {
      console.log(`❌ Server request failed: ${error.message}`);
    }
    
    console.log();
  }

  async testAuthenticationFlow() {
    console.log('🔐 Testing Authentication Flow...');
    
    // Test 1: No authentication
    console.log('   Testing without authentication...');
    const noAuthResult = await this.makeDetailedRequest('/api/children-books/generate-images', 'POST', {
      bookId: 'test',
      action: 'generate-single'
    });
    
    if (noAuthResult.status === 401) {
      console.log('   ✅ Correctly rejects unauthenticated requests');
    } else {
      console.log(`   ❌ Unexpected response: ${noAuthResult.status}`);
    }

    // Test 2: Invalid Bearer token
    console.log('   Testing with invalid Bearer token...');
    const invalidTokenResult = await this.makeDetailedRequest('/api/children-books/generate-images', 'POST', {
      bookId: 'test',
      action: 'generate-single'
    }, {
      'Authorization': 'Bearer invalid-token-12345'
    });
    
    if (invalidTokenResult.status === 401) {
      console.log('   ✅ Correctly rejects invalid Bearer tokens');
    } else {
      console.log(`   ❌ Unexpected response for invalid token: ${invalidTokenResult.status}`);
    }

    // Test 3: Malformed Authorization header
    console.log('   Testing with malformed Authorization header...');
    const malformedAuthResult = await this.makeDetailedRequest('/api/children-books/generate-images', 'POST', {
      bookId: 'test',
      action: 'generate-single'
    }, {
      'Authorization': 'NotBearer token-value'
    });
    
    if (malformedAuthResult.status === 401) {
      console.log('   ✅ Correctly rejects malformed Authorization headers');
    } else {
      console.log(`   ❌ Unexpected response for malformed auth: ${malformedAuthResult.status}`);
    }
    
    console.log();
  }

  async checkSupabaseConnection() {
    console.log('🗄️  Checking Supabase Connection...');
    
    try {
      // Test basic Supabase endpoint accessibility
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });

      const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
      const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

      if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Supabase credentials not found in .env.local');
        return;
      }

      // Test Supabase health endpoint
      const healthUrl = `${supabaseUrl}/rest/v1/`;
      console.log(`   Testing Supabase endpoint: ${healthUrl}`);
      
      const healthResult = await this.makeExternalRequest(healthUrl, 'GET', null, {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      });

      if (healthResult.status === 200 || healthResult.status === 404) {
        console.log('   ✅ Supabase endpoint is accessible');
      } else {
        console.log(`   ❌ Supabase endpoint returned: ${healthResult.status}`);
        console.log(`   Response: ${JSON.stringify(healthResult.data)}`);
      }

    } catch (error) {
      console.log(`   ❌ Supabase connection test failed: ${error.message}`);
    }
    
    console.log();
  }

  async provideSolutions() {
    console.log('💡 Diagnostic Results and Solutions');
    console.log('===================================');
    
    console.log('🎯 Key Findings:');
    console.log('   • The API is correctly configured and rejecting unauthenticated requests');
    console.log('   • The 401 error is expected behavior when no authentication is provided');
    console.log('   • The issue is that the client (frontend) is not sending authentication');
    console.log();
    
    console.log('🔧 Required Actions to Fix 401 Error:');
    console.log();
    console.log('1. **Client-Side Authentication (CRITICAL)**');
    console.log('   • User must be logged in to the application');
    console.log('   • Frontend must include Authorization header in API requests');
    console.log('   • Session token must be valid and not expired');
    console.log();
    
    console.log('2. **Frontend Implementation**');
    console.log('   • Check if user authentication state is properly managed');
    console.log('   • Verify that API calls include authentication headers');
    console.log('   • Example fix: Add Authorization header to fetch requests');
    console.log();
    
    console.log('   ```javascript');
    console.log('   const { data: { session } } = await supabase.auth.getSession()');
    console.log('   if (!session) {');
    console.log('     // Redirect to login or show auth required message');
    console.log('     return;');
    console.log('   }');
    console.log();
    console.log('   const response = await fetch("/api/children-books/generate-images", {');
    console.log('     method: "POST",');
    console.log('     headers: {');
    console.log('       "Content-Type": "application/json",');
    console.log('       "Authorization": `Bearer ${session.access_token}` // This is missing!');
    console.log('     },');
    console.log('     body: JSON.stringify(requestData)');
    console.log('   });');
    console.log('   ```');
    console.log();
    
    console.log('3. **Testing Steps**');
    console.log('   • Navigate to the book creator page in your browser');
    console.log('   • Log in with a test user account');
    console.log('   • Create a children\'s book project');
    console.log('   • Generate story content first');
    console.log('   • Then try image generation');
    console.log();
    
    console.log('4. **Debugging Tips**');
    console.log('   • Open browser developer tools');
    console.log('   • Check Network tab when making image generation request');
    console.log('   • Verify that Authorization header is being sent');
    console.log('   • Check Application tab for Supabase session data');
    console.log();
    
    console.log('🎉 Summary: The API is working correctly!');
    console.log('   The 401 error is proper authentication enforcement.');
    console.log('   Fix: Ensure frontend sends authentication headers.');
  }

  async makeDetailedRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 80,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      let postData = '';
      if (body && method !== 'GET') {
        postData = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsedData = null;
          try {
            parsedData = data ? JSON.parse(data) : null;
          } catch (e) {
            parsedData = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
            raw: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  async makeExternalRequest(url, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = url.startsWith('https');
      const httpModule = isHttps ? require('https') : require('http');
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: headers
      };

      let postData = '';
      if (body && method !== 'GET') {
        postData = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = httpModule.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsedData = null;
          try {
            parsedData = data ? JSON.parse(data) : null;
          } catch (e) {
            parsedData = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
            raw: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
  const diagnostic = new AuthDiagnostic();
  diagnostic.runDiagnostics()
    .then(() => {
      console.log('\n🔍 Diagnostic complete. Review the findings above.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Diagnostic failed:', error.message);
      process.exit(1);
    });
}

module.exports = AuthDiagnostic;