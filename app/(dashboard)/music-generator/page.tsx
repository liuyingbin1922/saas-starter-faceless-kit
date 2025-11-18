'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Play, Pause, Download, Sparkles, Lock, Music, Wand2, X } from 'lucide-react';

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
  const [mode, setMode] = useState<'simple' | 'custom'>('simple');
  const [songDescription, setSongDescription] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // 自定义模式状态
  const [lyrics, setLyrics] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [showLyricsMenu, setShowLyricsMenu] = useState(false);

  // 灵感示例
  const inspirationExamples = [
    'Lo-Fi 学习音乐',
    '史诗管弦',
    '轻松爵士',
  ];

  // Persona 数据
  const personas = [
    {
      id: '1',
      name: 'Chill-Hop DJ',
      description: '轻松节拍，适合工作学习',
    },
    {
      id: '2',
      name: 'Rock Master',
      description: '摇滚风格，充满能量',
    },
    {
      id: '3',
      name: 'Jazz Virtuoso',
      description: '爵士乐，优雅浪漫',
    },
  ];

  // 风格标签选项
  const styleOptions = [
    'Rock',
    'Pop',
    'Jazz',
    'Electronic',
    'Hip-Hop',
    'Classical',
    'Country',
    'R&B',
    'Folk',
    'Blues',
  ];

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
  const lyricsMaxChars = 500;
  const lyricsCount = lyrics.length;

  // 检查是否可以生成
  // 简单模式：只需要描述
  // 自定义模式：歌词/描述+风格至少有一项填写
  const canGenerate =
    mode === 'simple'
      ? songDescription.trim().length > 0
      : (lyrics.trim().length > 0 || songDescription.trim().length > 0) &&
        selectedStyles.length > 0;

  const handleGenerate = () => {
    if (!canGenerate || isGenerating) return;
    
    setIsGenerating(true);
    // TODO: 调用API生成音乐
    console.log('Generating music...', {
      mode,
      songDescription,
      lyrics,
      songTitle,
      selectedStyles,
      instrumental,
      isPrivate,
      selectedPersona,
    });
    
    // 模拟生成过程
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  const handleInspirationClick = (example: string) => {
    setSongDescription(example);
  };

  const handleStyleToggle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style]
    );
  };

  const handleLyricsEnhance = (action: string) => {
    // TODO: 实现歌词AI增强功能
    console.log('Lyrics enhance action:', action);
    setShowLyricsMenu(false);
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="flex h-screen">
        {/* 左侧操作区 */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* 模式切换 */}
            <div className="flex justify-center">
              <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'custom')}>
                <TabsList>
                  <TabsTrigger value="custom">自定义模式</TabsTrigger>
                  <TabsTrigger value="simple">简单模式</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 简单模式内容 */}
            {mode === 'simple' && (
              <div className="space-y-6">
                {/* 标题 */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-orange-500" />
                    创作你的下一个节拍
                    <Sparkles className="w-6 h-6 text-orange-500" />
                  </h2>
                </div>

                {/* 描述输入框 */}
                <div className="space-y-2">
                  <Textarea
                    value={songDescription}
                    onChange={(e) => setSongDescription(e.target.value)}
                    maxLength={maxChars}
                    placeholder="一首史诗般的赛博朋克管弦乐"
                    className="min-h-[100px] text-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                  />
                </div>

                {/* 灵感示例 */}
                <div className="flex flex-wrap gap-2">
                  {inspirationExamples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleInspirationClick(example)}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-500 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {example}
                    </button>
                  ))}
                </div>

                {/* 快捷开关 */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={instrumental}
                      onChange={(e) => setInstrumental(e.target.checked)}
                      className="peer-checked:bg-orange-600"
                    />
                    <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      Instrumental
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="peer-checked:bg-orange-600"
                    />
                    <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Private
                    </Label>
                  </div>
                </div>

                {/* 高级设置 */}
                <Collapsible title="⬇️ 高级设置">
                  <div className="space-y-4 pt-2">
                    {/* Persona 选择 */}
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white font-semibold">
                        Select Persona (制作人角色卡片)
                      </Label>
                      <div className="grid grid-cols-1 gap-3">
                        {personas.map((persona) => (
                          <button
                            key={persona.id}
                            onClick={() => setSelectedPersona(persona.id)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              selectedPersona === persona.id
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-orange-300'
                            }`}
                          >
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {persona.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {persona.description}
                            </p>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 pt-2">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          预估生成时间: 45秒
                        </span>
                        <span>复杂程度: 中等</span>
                      </div>
                    </div>
                  </div>
                </Collapsible>

                {/* 生成按钮 */}
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className={`w-full text-white font-semibold py-4 rounded-lg text-lg relative overflow-hidden ${
                    canGenerate
                      ? 'bg-orange-600 hover:bg-orange-700 shadow-lg'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      正在生成...
                    </span>
                  ) : (
                    <>
                      {canGenerate && (
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      )}
                      <span className="relative flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        生成
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 自定义模式内容 */}
            {mode === 'custom' && (
              <div className="space-y-6">
                {/* 标题 */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                    <span>📝</span>
                    歌词驱动式创作
                    <span>📝</span>
                  </h2>
                </div>

                {/* 歌词输入框 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-900 dark:text-white font-semibold">
                      歌词
                    </Label>
                    <DropdownMenu open={showLyricsMenu} onOpenChange={setShowLyricsMenu}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400"
                        >
                          <Wand2 className="w-4 h-4 mr-1" />
                          歌词 AI 增强
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleLyricsEnhance('polish')}
                        >
                          润色歌词
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleLyricsEnhance('rhyme')}
                        >
                          建议押韵
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleLyricsEnhance('chorus')}
                        >
                          生成副歌
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      maxLength={lyricsMaxChars}
                      placeholder="输入歌词内容..."
                      className="min-h-[150px] text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                      {lyricsCount}/{lyricsMaxChars}
                    </div>
                  </div>
                </div>

                {/* 标题输入框 */}
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white font-semibold">
                    歌曲标题
                  </Label>
                  <Input
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="输入歌曲标题..."
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>

                {/* 歌曲风格输入框（多选气泡） */}
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white font-semibold">
                    歌曲风格
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {styleOptions.map((style) => (
                      <button
                        key={style}
                        onClick={() => handleStyleToggle(style)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedStyles.includes(style)
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {style}
                        {selectedStyles.includes(style) && (
                          <X className="w-3 h-3 inline-block ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedStyles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStyles.map((style) => (
                        <span
                          key={style}
                          className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm flex items-center gap-1"
                        >
                          {style}
                          <button
                            onClick={() => handleStyleToggle(style)}
                            className="hover:text-orange-900 dark:hover:text-orange-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 快捷开关 */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={instrumental}
                      onChange={(e) => setInstrumental(e.target.checked)}
                      className="peer-checked:bg-orange-600"
                    />
                    <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      Instrumental
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="peer-checked:bg-orange-600"
                    />
                    <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Private
                    </Label>
                  </div>
                </div>

                {/* 高级设置 */}
                <Collapsible title="⬇️ 高级设置">
                  <div className="space-y-4 pt-2">
                    {/* Persona 选择 */}
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white font-semibold">
                        Select Persona (制作人角色卡片)
                      </Label>
                      <div className="grid grid-cols-1 gap-3">
                        {personas.map((persona) => (
                          <button
                            key={persona.id}
                            onClick={() => setSelectedPersona(persona.id)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              selectedPersona === persona.id
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-orange-300'
                            }`}
                          >
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {persona.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {persona.description}
                            </p>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 pt-2">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          预估生成时间: 1分钟
                        </span>
                        <span>复杂程度: 复杂</span>
                      </div>
                    </div>
                  </div>
                </Collapsible>

                {/* 生成按钮 */}
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className={`w-full text-white font-semibold py-4 rounded-lg text-lg relative overflow-hidden ${
                    canGenerate
                      ? 'bg-orange-600 hover:bg-orange-700 shadow-lg'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      正在生成...
                    </span>
                  ) : (
                    <>
                      {canGenerate && (
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      )}
                      <span className="relative flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        生成
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 右侧预览区 */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* 生成的音乐列表 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                生成的音乐
              </h2>
              {generatedTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors shadow-sm"
                  onClick={() => handlePlayTrack(track)}
                >
                  <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-50" />
                    <Play className="relative z-10 w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
                      {track.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {track.description}
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                      {track.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 当前播放的音乐 */}
            {currentTrack && (
              <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentTrack.title}
                </h2>

                {/* 播放控制 */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleTogglePlay}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-3"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{currentTrack.duration}</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* 歌词 */}
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-orange-600 dark:text-orange-500 font-semibold mb-2">
                      [Verse]
                    </h3>
                    {currentTrack.lyrics.verse.map((line, index) => (
                      <p key={index} className="text-gray-700 dark:text-gray-300 mb-1">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-orange-600 dark:text-orange-500 font-semibold mb-2">
                      [Chorus]
                    </h3>
                    {currentTrack.lyrics.chorus.map((line, index) => (
                      <p key={index} className="text-gray-700 dark:text-gray-300 mb-1">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!currentTrack && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p>选择一个音乐开始播放</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
