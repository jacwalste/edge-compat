import axios from 'axios'; // ❌ Not Edge-safe (use fetch)
import { Client } from 'pg'; // ❌ Not Edge-safe (use @neondatabase/serverless)
import WebSocket from 'ws'; // ❌ Not Edge-safe (use native WebSocket)
import net from 'net'; // ❌ Forbidden in Edge
import { exec } from 'child_process'; // ❌ Forbidden in Edge

// This file demonstrates various Edge compatibility issues

async function fetchData() {
  // ❌ Using axios instead of fetch
  const response = await axios.get('https://api.example.com/data');
  return response.data;
}

async function queryDatabase() {
  // ❌ Using pg which requires TCP sockets
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'mydb',
  });
  
  await client.connect();
  const result = await client.query('SELECT * FROM users');
  await client.end();
  
  return result.rows;
}

function createWebSocketServer() {
  // ❌ Using ws library
  const wss = new WebSocket.Server({ port: 8080 });
  
  wss.on('connection', (ws) => {
    ws.send('Hello!');
  });
}

function createTcpServer() {
  // ❌ Using net module (forbidden)
  const server = net.createServer((socket) => {
    socket.write('Hello!');
  });
  
  server.listen(3000);
}

function runCommand() {
  // ❌ Using child_process (forbidden)
  exec('ls -la', (error, stdout, stderr) => {
    console.log(stdout);
  });
}

// ❌ Using eval (dangerous pattern)
function dynamicCode(code: string) {
  return eval(code);
}

// ❌ Sync WASM instantiation
async function loadWasm() {
  const wasmBytes = new Uint8Array([]);
  // This is the problematic sync version:
  new WebAssembly.Module(wasmBytes);
  
  // Should use: await WebAssembly.instantiate(wasmBytes);
}

export {
  fetchData,
  queryDatabase,
  createWebSocketServer,
  createTcpServer,
  runCommand,
  dynamicCode,
  loadWasm,
};

