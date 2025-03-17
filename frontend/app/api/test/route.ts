import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      message: "API请求成功",
      timestamp: new Date().toISOString(),
      randomValue: Math.random().toFixed(4)
    }
  });
}

export async function POST(request: Request) {
  // 可以从请求中获取数据
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // 如果请求体为空或不是有效的JSON，忽略错误
  }

  return NextResponse.json({
    success: true,
    data: {
      message: "POST请求成功",
      timestamp: new Date().toISOString(),
      randomValue: Math.random().toFixed(4),
      receivedData: body
    }
  });
} 