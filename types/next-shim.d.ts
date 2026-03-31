declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
    metadataBase?: URL;
    [key: string]: unknown;
  }

  export interface NextConfig {
    [key: string]: unknown;
  }
}

declare module "next/server" {
  export class NextRequest extends Request {
    nextUrl: URL;
  }

  export class NextResponse extends Response {
    static json(body: unknown, init?: ResponseInit): NextResponse;
  }
}

declare module "next/font/google" {
  export function Newsreader(config: Record<string, unknown>): {
    className: string;
    variable: string;
  };

  export function Source_Sans_3(config: Record<string, unknown>): {
    className: string;
    variable: string;
  };
}
