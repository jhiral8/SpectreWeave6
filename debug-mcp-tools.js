#!/usr/bin/env node

const { spawn } = require('child_process');

async function listMCPTools() {
    try {
        console.log('🔍 Attempting to connect to Docker MCP server...\n');
        
        // Try to install the MCP SDK first
        console.log('📦 Installing MCP SDK...');
        const installProcess = spawn('npm', ['install', '@modelcontextprotocol/sdk'], {
            stdio: 'inherit',
            env: {
                ...process.env,
                PATH: process.env.HOME + '/.nvm/versions/node/v24.8.0/bin:' + process.env.PATH
            }
        });

        installProcess.on('close', async (code) => {
            if (code === 0) {
                console.log('✅ SDK installed successfully');
                
                // Now try to connect
                try {
                    const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
                    const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
                    
                    const transport = new StdioClientTransport({
                        command: process.env.HOME + '/.nvm/versions/node/v24.8.0/bin/docker-mcp-server',
                        args: [],
                        env: {
                            DOCKER_MCP_LOCAL: 'true'
                        }
                    });

                    const client = new Client(
                        {
                            name: "mcp-debug-client",
                            version: "1.0.0"
                        },
                        {
                            capabilities: {}
                        }
                    );

                    await client.connect(transport);
                    console.log('✅ Connected to MCP server');

                    const result = await client.listTools();
                    
                    console.log(`\n📊 Found ${result.tools.length} tools:\n`);
                    
                    result.tools.forEach((tool, index) => {
                        console.log(`${index + 1}. ${tool.name}`);
                        if (tool.description) {
                            console.log(`   Description: ${tool.description}`);
                        }
                        console.log('');
                    });

                    await client.close();
                    
                } catch (error) {
                    console.error('❌ Error connecting to MCP:', error.message);
                }
            } else {
                console.error('❌ Failed to install SDK');
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

listMCPTools().catch(console.error);