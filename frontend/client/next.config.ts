import type { NextConfig } from "next";

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  env: {
    CLIENT_URL: process.env.CLIENT_URL,
	PORT_BACKEND: process.env.PORT_BACKEND,
  }
};

export default nextConfig;
