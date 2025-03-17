/**
 * Express 相关模块的类型声明文件
 * 用于解决后端服务的类型错误
 */

declare module 'express' {
  import { IncomingMessage, ServerResponse } from 'http';

  export function Router(options?: any): any;
  export function json(options?: any): any;
  export function urlencoded(options?: any): any;
  export function static(root: string, options?: any): any;

  export interface Request extends IncomingMessage {
    body: any;
    params: Record<string, string>;
    query: Record<string, string>;
  }

  export interface Response extends ServerResponse {
    status(code: number): Response;
    json(data: any): Response;
    send(data: any): Response;
  }

  export interface Application {
    use(path: string | any, ...handlers: any[]): Application;
    use(...handlers: any[]): Application;
    get(path: string, ...handlers: any[]): Application;
    post(path: string, ...handlers: any[]): Application;
    put(path: string, ...handlers: any[]): Application;
    delete(path: string, ...handlers: any[]): Application;
    listen(port: number, callback?: () => void): any;
  }

  export interface Router {
    use(path: string | any, ...handlers: any[]): Router;
    use(...handlers: any[]): Router;
    get(path: string, ...handlers: any[]): Router;
    post(path: string, ...handlers: any[]): Router;
    put(path: string, ...handlers: any[]): Router;
    delete(path: string, ...handlers: any[]): Router;
  }

  export default function express(): Application;
}

declare module 'cors' {
  import { Request, Response } from 'express';
  
  interface CorsOptions {
    origin?: string | string[] | boolean | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  function cors(options?: CorsOptions): (req: Request, res: Response, next: () => void) => void;
  export default cors;
}

declare module 'helmet' {
  import { Request, Response } from 'express';
  
  function helmet(): (req: Request, res: Response, next: () => void) => void;
  export default helmet;
}

declare module 'compression' {
  import { Request, Response } from 'express';
  
  function compression(options?: any): (req: Request, res: Response, next: () => void) => void;
  export default compression;
} 