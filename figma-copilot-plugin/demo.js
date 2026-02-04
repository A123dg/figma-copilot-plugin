import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

const childProcess = spawn('node', ['figma-copilot-plugin/mcp-server/dist/server.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'inherit']
});

const transport = new StdioClientTransport({ stdio: [childProcess.stdin, childProcess.stdout] });
const client = new Client({ name: 'figma-demo', version: '1.0.0' }, { experimental: {} });

await client.connect(transport);

// Gọi tool 1: Quét tài liệu
console.log('\n=== TOOL 1: figma_scan_document ===');
const scanResult = await client.callTool({
    name: 'figma_scan_document',
    arguments: {}
});
console.log(JSON.stringify(scanResult, null, 2));

// Gọi tool 2: Tạo screen
console.log('\n=== TOOL 2: figma_generate_screens ===');
const generateResult = await client.callTool({
    name: 'figma_generate_screens',
    arguments: {
        names: ['LoginScreen', 'DashboardScreen'],
        targetPageName: 'Screens'
    }
});
console.log(JSON.stringify(generateResult, null, 2));

await transport.close();
process.exit(0);
