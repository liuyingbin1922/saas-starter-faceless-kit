import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { musicTracks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tracks = await db
      .select()
      .from(musicTracks)
      .where(eq(musicTracks.userId, user.id))
      .orderBy(desc(musicTracks.createdAt));

    // 格式化返回数据
    const formattedTracks = tracks.map((track) => ({
      id: track.id.toString(),
      title: track.title || 'Untitled',
      description: track.description || '',
      timestamp: track.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      duration: track.duration 
        ? `${Math.floor(track.duration / 60).toString().padStart(2, '0')}:${(track.duration % 60).toString().padStart(2, '0')}`
        : '00:00',
      audioUrl: track.audioUrl,
      imageUrl: track.imageUrl,
      status: track.status,
      lyrics: track.lyrics 
        ? parseLyrics(track.lyrics)
        : { verse: [], chorus: [] },
    }));

    return NextResponse.json({ tracks: formattedTracks });
  } catch (error) {
    console.error('Error getting tracks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// 解析歌词格式（假设歌词格式为 [Verse]...\n[Chorus]...）
function parseLyrics(lyrics: string): { verse: string[]; chorus: string[] } {
  const verse: string[] = [];
  const chorus: string[] = [];
  
  let currentSection: 'verse' | 'chorus' | null = null;
  const lines = lyrics.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('[verse]')) {
      currentSection = 'verse';
    } else if (trimmed.toLowerCase().includes('[chorus]')) {
      currentSection = 'chorus';
    } else if (trimmed && currentSection) {
      if (currentSection === 'verse') {
        verse.push(trimmed);
      } else if (currentSection === 'chorus') {
        chorus.push(trimmed);
      }
    }
  }

  return { verse, chorus };
}

