import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { createServer } from 'http';
// import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
// const io = new Server(server);

export { app, server };
