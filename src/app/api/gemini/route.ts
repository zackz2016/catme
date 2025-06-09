// app/api/generate-image/route.ts
import { NextResponse } from 'next/server';

const GEMINI_PROXY_BASE_URL = process.env.GEMINI_PROXY_URL;

// 定义 Modality 枚举，因为在服务器端我们可能无法直接导入 SDK 的 Modality
// 实际生产中，你可以考虑安装 Google Generative AI SDK，并在 Worker 中处理这些逻辑。
// 但这里为了模拟通过反向代理，我们手动定义必要的结构。
enum Modality {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO', // 根据实际支持的模态添加
  AUDIO = 'AUDIO', // 根据实际支持的模态添加
}

export async function POST(req: Request) {
  try {
    const { breed, color, pose } = await req.json();

    const prompt = `Generate a high-quality, detailed image of a ${breed} cat. The cat should be ${color} in color and ${pose}. The image should be cute and appealing, with good lighting and composition.`;
    

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt provided.' }, { status: 400 });
    }

    if (!GEMINI_PROXY_BASE_URL) {
      console.error('GEMINI_PROXY_BASE_URL is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error: Gemini proxy URL missing.' }, { status: 500 });
    }

    // 构建 Gemini API 的 contents 结构
    const contents = [{ parts: [{ text: prompt }] }];

    // 调用 Gemini API 的请求体
    const requestBody = {
      model: "gemini-2.0-flash-preview-image-generation", // 你指定的新图像生成模型
      contents: contents,
      generationConfig: {
         responseModalities: [Modality.TEXT, Modality.IMAGE], // 指定响应MIME类型，请求图像和文本
      },
      
    };


    const fullProxyUrl = `${GEMINI_PROXY_BASE_URL}/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent`;

    const response = await fetch(fullProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from Gemini proxy: Status ${response.status}, Details: ${errorText}`);
      // 尝试解析错误响应，如果它是一个有效的 JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      return NextResponse.json({ error: `Gemini API error: ${response.statusText}`, details: errorData }, { status: response.status });
    }

    const data = await response.json();
    console.log("Gemini API 响应:", data);

    let imageUrl: string | null = null;
    let textOutput: string | null = null;

    // 遍历响应的 parts，找到图像数据和文本
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.text) {
          textOutput = part.text;
          console.log("文本部分:", textOutput);
        } else if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
          // 如果是图像，将其 base64 数据转换为数据 URL
          const imageData = part.inlineData.data;
          // 在前端，我们通常会直接使用数据 URL 来显示图像
          imageUrl = `data:${part.inlineData.mimeType};base64,${imageData}`;
          console.log("图像部分 (Base64 数据 URL):", imageUrl.substring(0, 50) + '...'); // 打印前50个字符
        }
      }
    }

    if (imageUrl) {
      return NextResponse.json({ imageUrl, textOutput });
    } else {
      console.error('Gemini API did not return an image part as expected.', data);
      return NextResponse.json({ error: 'Image not generated or unexpected response format.', responseData: data }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in /api/generate-image:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown internal server error occurred.' }, { status: 500 });
  }
}