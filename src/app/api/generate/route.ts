import { Modality } from '@google/genai';
import { NextResponse } from 'next/server';

const PROXY_URL = 'https://gemini.aiwinner.top';

export async function POST(req: Request) {
  try {
    const { breed, color, pose } = await req.json();

    // 构建提示词
    const prompt = `Generate a high-quality, detailed image of a ${breed} cat. The cat should be ${color} in color and ${pose}. The image should be cute and appealing, with good lighting and composition.`;

    const response = await generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    let imageBase64 = '';
    for (const file of result.files) {
      if (file.mimeType.startsWith('image/')) {
        // 转换图片数据为base64
        console.log(file);
        imageBase64 = Buffer.from(file.data).toString('base64');
        break;
      }
    }

    return NextResponse.json({ imageBase64 });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
