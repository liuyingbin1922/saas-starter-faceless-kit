import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { musicTracks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SunoClient } from '@/lib/suno/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.taskId;

    // 查询数据库中的记录
    const [track] = await db
      .select()
      .from(musicTracks)
      .where(eq(musicTracks.sunoTaskId, taskId))
      .limit(1);

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // 检查是否是当前用户的记录
    if (track.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 调用Suno API查询任务状态
    const sunoClient = new SunoClient();
    const sunoStatus = await sunoClient.getTaskStatus(taskId);

    if (sunoStatus.code !== 200) {
      return NextResponse.json(
        { error: sunoStatus.msg || 'Failed to get task status' },
        { status: 500 }
      );
    }

    const sunoData = sunoStatus.data;
    let dbStatus = track.status;
    let audioUrl = track.audioUrl;
    let imageUrl = track.imageUrl;
    let title = track.title;
    let lyrics = track.lyrics;
    let duration = track.duration;
    let progress = 0;

    // 解析响应格式：data.data 数组包含生成的音频信息
    if (sunoData.data && sunoData.data.length > 0) {
      // 取第一个音频（通常只有一个）
      const audioData = sunoData.data[0];
      audioUrl = audioData.audio_url || audioUrl;
      imageUrl = audioData.image_url || imageUrl;
      title = audioData.title || title;
      lyrics = audioData.lyrics || lyrics;
      duration = audioData.duration ? Math.round(audioData.duration) : duration;
    }

    // 根据状态更新数据库
    const statusFromApi = sunoData.status || sunoData.callbackType;
    progress = sunoData.progress || 0;

    if (statusFromApi === 'complete' || statusFromApi === 'SUCCESS' || (audioUrl && audioUrl !== track.audioUrl)) {
      dbStatus = 'complete';
      await db
        .update(musicTracks)
        .set({
          status: 'complete',
          audioUrl: audioUrl,
          imageUrl: imageUrl,
          title: title,
          lyrics: lyrics,
          duration: duration,
          updatedAt: new Date(),
        })
        .where(eq(musicTracks.id, track.id));
    } else if (statusFromApi === 'failed' || statusFromApi === 'FAILED') {
      dbStatus = 'failed';
      await db
        .update(musicTracks)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(musicTracks.id, track.id));
    } else if (statusFromApi === 'generating' || statusFromApi === 'pending' || statusFromApi === 'PROCESSING') {
      dbStatus = 'generating';
      await db
        .update(musicTracks)
        .set({
          status: 'generating',
          updatedAt: new Date(),
        })
        .where(eq(musicTracks.id, track.id));
    }

    return NextResponse.json({
      status: dbStatus,
      audioUrl: audioUrl,
      imageUrl: imageUrl,
      title: title,
      lyrics: lyrics,
      duration: duration,
      progress: progress,
    });
  } catch (error) {
    console.error('Error getting task status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

