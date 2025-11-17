'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Play, Pause, Download } from 'lucide-react';

interface MusicTrack {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  duration: string;
  lyrics: {
    verse: string[];
    chorus: string[];
  };
}

export default function MusicGeneratorPage() {
  const [customMode, setCustomMode] = useState(false);
  const [version, setVersion] = useState('V4');
  const [songDescription, setSongDescription] = useState('乡间的小路, 走着一堆情侣');
  const [accompaniment, setAccompaniment] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // 示例数据
  const generatedTracks: MusicTrack[] = [
    {
      id: '1',
      title: '乡间小路之恋',
      description: 'romantic, soft, acoustic; gentle guitar picking with a warm and intimate tone',
      timestamp: '2025-11-17 23:32:22',
      duration: '02:33',
      lyrics: {
        verse: [
          '月光洒在小路边',
          '微风轻吻着草尖',
          '树影摇晃像跳舞的线',
        ],
        chorus: [
          '乡间的小路弯弯',
          '我们的心紧紧相连',
          '在这宁静的夜晚',
          '爱意如星光点点',
        ],
      },
    },
    {
      id: '2',
      title: '乡间小路之恋',
      description: 'romantic, soft, acoustic; gentle guitar picking with a warm and intimate tone',
      timestamp: '2025-11-17 23:32:22',
      duration: '02:33',
      lyrics: {
        verse: [
          '月光洒在小路边',
          '微风轻吻着草尖',
          '树影摇晃像跳舞的线',
        ],
        chorus: [
          '乡间的小路弯弯',
          '我们的心紧紧相连',
          '在这宁静的夜晚',
          '爱意如星光点点',
        ],
      },
    },
  ];

  const maxChars = 199;
  const charCount = songDescription.length;

  const handleGenerate = () => {
    // TODO: 调用API生成音乐
    console.log('Generating music...', {
      customMode,
      version,
      songDescription,
      accompaniment,
    });
  };

  const handlePlayTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = currentTrack ? 153 : 0; // 02:33 = 153 seconds
  const progress = totalSeconds > 0 ? (currentTime / totalSeconds) * 100 : 0;

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* 左侧操作区 */}
        <div className="w-1/3 border-r border-gray-700 bg-gray-800 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* 自定义模式和版本选择 */}
            <div className="flex items-center justify-between">
              <Switch
                checked={customMode}
                onChange={(e) => setCustomMode(e.target.checked)}
                label="自定义模式"
                className="peer-checked:bg-purple-600"
              />
              <Select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-20 bg-gray-700 border-gray-600 text-white"
              >
                <option value="V4">V4</option>
                <option value="V3">V3</option>
                <option value="V2">V2</option>
              </Select>
            </div>

            {/* 歌曲描述 */}
            <div className="space-y-2">
              <Label className="text-white font-semibold">歌曲描述</Label>
              <div className="relative">
                <Textarea
                  value={songDescription}
                  onChange={(e) => setSongDescription(e.target.value)}
                  maxLength={maxChars}
                  placeholder="输入歌曲描述..."
                  className="min-h-[120px] bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 resize-none"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {charCount}/{maxChars}
                </div>
              </div>
            </div>

            {/* 伴奏开关 */}
            <div className="flex items-center justify-between">
              <Label className="text-white font-semibold">伴奏</Label>
              <Switch
                checked={accompaniment}
                onChange={(e) => setAccompaniment(e.target.checked)}
                className="peer-checked:bg-purple-600"
              />
            </div>

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerate}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg"
            >
              生成音乐
            </Button>
          </div>
        </div>

        {/* 右侧预览区 */}
        <div className="flex-1 bg-gray-900 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* 生成的音乐列表 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                生成的音乐
              </h2>
              {generatedTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors"
                  onClick={() => handlePlayTrack(track)}
                >
                  <div className="relative w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-50" />
                    <Play className="relative z-10 w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">
                      {track.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {track.description}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      {track.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 当前播放的音乐 */}
            {currentTrack && (
              <div className="space-y-4 pt-6 border-t border-gray-700">
                <h2 className="text-xl font-semibold text-white">
                  {currentTrack.title}
                </h2>

                {/* 播放控制 */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleTogglePlay}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{currentTrack.duration}</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* 歌词 */}
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-purple-400 font-semibold mb-2">
                      [Verse]
                    </h3>
                    {currentTrack.lyrics.verse.map((line, index) => (
                      <p key={index} className="text-gray-300 mb-1">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-purple-400 font-semibold mb-2">
                      [Chorus]
                    </h3>
                    {currentTrack.lyrics.chorus.map((line, index) => (
                      <p key={index} className="text-gray-300 mb-1">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!currentTrack && (
              <div className="text-center text-gray-500 py-12">
                <p>选择一个音乐开始播放</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
