import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { musicTracks } from '@/lib/db/schema';
import { SunoClient } from '@/lib/suno/client';

function getBaseUrl(request: NextRequest): string {
  // 优先使用环境变量中的 BASE_URL
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // 从请求头获取
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  
  if (host) {
    return `${protocol}://${host}`;
  }
  
  // 默认值
  return 'http://localhost:3000';
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // 解构前端传来的参数
    const {
      customMode,
      prompt,
      style,
      title,
      instrumental,
      model,
      personaId,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
    } = body;

    // 构建回调 URL
    const baseUrl = getBaseUrl(request);
    const callBackUrl = `${baseUrl}/api/music/callback`;

    // 构建Suno API请求
    const sunoClient = new SunoClient();
    
    // 根据API文档要求构建请求
    // 必需字段：customMode, instrumental, callBackUrl, model
    let sunoRequest: any = {
      customMode: customMode,
      instrumental: instrumental || false,
      callBackUrl: callBackUrl,
      model: (model || 'V5') as 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5',
    };

    if (!customMode) {
      // 简单模式（Non-custom Mode）：
      // - customMode: false
      // - prompt: 必需（描述，最大500字符）
      // - style: 留空
      // - title: 留空
      if (!prompt) {
        return NextResponse.json(
          { error: 'Prompt (lyrics) is required in simple mode' },
          { status: 400 }
        );
      }
      sunoRequest.prompt = prompt;
    } else {
      // 自定义模式（Custom Mode）：
      // - customMode: true
      // - style: 必需
      // - title: 必需（最大80字符）
      // - prompt: 如果 instrumental 为 false，则必需（作为歌词）
      if (!style) {
        return NextResponse.json(
          { error: 'Style is required in custom mode' },
          { status: 400 }
        );
      }

      if (!title) {
        return NextResponse.json(
          { error: 'Title is required in custom mode' },
          { status: 400 }
        );
      }

      sunoRequest.style = style;
      sunoRequest.title = title;
      
      // 如果 instrumental 为 false，prompt（歌词）是必需的
      if (!instrumental) {
        if (!prompt) {
          return NextResponse.json(
            { error: 'Prompt (lyrics) is required when instrumental is false in custom mode' },
            { status: 400 }
          );
        }
        sunoRequest.prompt = prompt;
      }
      
      // 可选参数（仅在Custom Mode下可用）
      if (personaId) {
        sunoRequest.personaId = personaId;
      }
      if (negativeTags) {
        sunoRequest.negativeTags = negativeTags;
      }
      if (vocalGender) {
        sunoRequest.vocalGender = vocalGender as 'm' | 'f';
      }
      if (styleWeight !== undefined) {
        sunoRequest.styleWeight = styleWeight;
      }
      if (weirdnessConstraint !== undefined) {
        sunoRequest.weirdnessConstraint = weirdnessConstraint;
      }
      if (audioWeight !== undefined) {
        sunoRequest.audioWeight = audioWeight;
      }
    }

    // 调用Suno API生成音乐
    // 测试
    // const sunoResponse = await sunoClient.generateSong({
    //   customMode: false,
    //   instrumental: false,
    //   prompt: "A calm and relaxing piano track with soft melodies",
    //   model: "V5",
    //   callBackUrl: callBackUrl,
    // });

    // console.log('sunoResponse::', sunoResponse);  
    const sunoResponse = await sunoClient.generateSong(sunoRequest);

    if (!sunoResponse.data || !sunoResponse.data.taskId) {
      return NextResponse.json(
        { error: 'Failed to create music generation task' },
        { status: 500 }
      );
    }

    const sunoTaskId = sunoResponse.data.taskId;

    // 保存到数据库
    const [musicTrack] = await db
      .insert(musicTracks)
      .values({
        userId: user.id,
        title: title || 'Untitled',
        description: prompt || '', // Assuming prompt is the description for simple mode
        lyrics: prompt || null, // Assuming prompt is the lyrics for simple mode
        sunoTaskId: sunoTaskId,
        status: 'pending',
        instrumental: instrumental ? 'true' : 'false',
        isPrivate: false, // Default to false for now
        tags: style || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      taskId: sunoTaskId,
      trackId: musicTrack.id,
      status: 'pending',
    });
  } catch (error) {
    console.error('Error generating music:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

