import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { musicTracks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 接收 Suno API 的音乐生成回调
 * 当音乐生成任务完成时，Suno API 会 POST 请求到这个端点
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, msg, data } = body;

    // 验证回调数据格式
    if (!data || !data.task_id) {
      console.error('Invalid callback data:', body);
      return NextResponse.json(
        { error: 'Invalid callback data' },
        { status: 400 }
      );
    }

    const taskId = data.task_id;
    const callbackType = data.callbackType || '';
    const musicData = data.data || [];

    console.log('Received music generation callback:', {
      taskId,
      callbackType,
      status: code,
      message: msg,
      musicCount: musicData.length,
    });

    // 查询数据库中的记录
    const [track] = await db
      .select()
      .from(musicTracks)
      .where(eq(musicTracks.sunoTaskId, taskId))
      .limit(1);

    if (!track) {
      console.warn(`Track not found for taskId: ${taskId}`);
      // 即使找不到记录，也返回 200 确认接收，避免重复回调
      return NextResponse.json({ status: 'received' }, { status: 200 });
    }

    // 幂等性检查：如果已经是完成状态，跳过更新（避免重复处理）
    if (track.status === 'complete' && code === 200 && callbackType === 'complete') {
      console.log(`Track already completed for taskId: ${taskId}, skipping update`);
      return NextResponse.json({ status: 'received' }, { status: 200 });
    }

    // 根据回调状态更新数据库
    if (code === 200 && callbackType === 'complete' && musicData.length > 0) {
      // 任务成功完成，取第一个音频（通常只有一个）
      const audioData = musicData[0];
      
      await db
        .update(musicTracks)
        .set({
          status: 'complete',
          audioUrl: audioData.audio_url || track.audioUrl,
          imageUrl: audioData.image_url || track.imageUrl,
          title: audioData.title || track.title,
          lyrics: audioData.prompt || track.lyrics,
          duration: audioData.duration ? Math.round(audioData.duration) : track.duration,
          tags: audioData.tags || track.tags,
          updatedAt: new Date(),
        })
        .where(eq(musicTracks.id, track.id));

      console.log(`Music generation completed for taskId: ${taskId}`, {
        title: audioData.title,
        duration: audioData.duration,
        audioUrl: audioData.audio_url,
      });
    } else if (code !== 200 || callbackType === 'error') {
      // 任务失败（只有在不是已完成状态时才更新）
      if (track.status !== 'complete') {
        await db
          .update(musicTracks)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(musicTracks.id, track.id));

        console.error(`Music generation failed for taskId: ${taskId}`, {
          code,
          msg,
          callbackType,
        });
      }
    } else if (callbackType === 'first' || callbackType === 'text') {
      // 部分完成（文本生成完成或第一个音频完成）
      // 只有在不是已完成或失败状态时才更新
      if (track.status !== 'complete' && track.status !== 'failed') {
        if (musicData.length > 0) {
          const audioData = musicData[0];
          await db
            .update(musicTracks)
            .set({
              status: 'generating',
              audioUrl: audioData.audio_url || track.audioUrl,
              imageUrl: audioData.image_url || track.imageUrl,
              title: audioData.title || track.title,
              updatedAt: new Date(),
            })
            .where(eq(musicTracks.id, track.id));
        } else {
          await db
            .update(musicTracks)
            .set({
              status: 'generating',
              updatedAt: new Date(),
            })
            .where(eq(musicTracks.id, track.id));
        }
      }
    }

    // 返回 200 状态码确认接收回调
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    console.error('Error processing callback:', error);
    // 即使处理出错，也返回 200 避免重复回调
    return NextResponse.json(
      { status: 'received', error: 'Processing error' },
      { status: 200 }
    );
  }
}

