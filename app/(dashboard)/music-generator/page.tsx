'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Play, Pause, Download, Sparkles, Lock, Music, Wand2, X, Volume2, VolumeX } from 'lucide-react';

interface MusicTrack {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  duration: string;
  audioUrl?: string;
  imageUrl?: string;
  status?: 'pending' | 'generating' | 'complete' | 'failed';
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
  const [generatedTracks, setGeneratedTracks] = useState<MusicTrack[]>([]);
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [currentGeneratingTrack, setCurrentGeneratingTrack] = useState<{taskId: string, title: string} | null>(null);
  const [volume, setVolume] = useState<number>(1);

  // 自定义模式状态
  const [lyrics, setLyrics] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [showLyricsMenu, setShowLyricsMenu] = useState(false);

  // 高级设置状态
  const [model, setModel] = useState<string>('V5');
  const [negativeTags, setNegativeTags] = useState<string>('');
  const [vocalGender, setVocalGender] = useState<string>('');
  const [styleWeight, setStyleWeight] = useState<number>(0.65);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState<number>(0.65);
  const [audioWeight, setAudioWeight] = useState<number>(0.65);

  // 音频播放器引用
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // 加载音乐列表
  useEffect(() => {
    loadTracks();
  }, []);

  // 轮询任务状态（作为回调机制的备选方案，降低频率）
  useEffect(() => {
    if (pollingTaskId) {
      // 回调机制下，降低轮询频率到10秒
      // 回调会更新数据库，轮询主要用于UI更新
      pollingIntervalRef.current = setInterval(() => {
        checkTaskStatus(pollingTaskId);
      }, 10000); // 每10秒轮询一次

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [pollingTaskId]);

  // 音频播放器事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    
    // 设置音量
    audio.volume = volume;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, volume]);

  const loadTracks = async () => {
    try {
      const response = await fetch('/api/music/tracks');
      if (response.ok) {
        const data = await response.json();
        setGeneratedTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  };

  const checkTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/music/status/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        
        // 更新进度
        if (data.progress !== undefined) {
          setGenerationProgress(data.progress);
        }
        
        // 更新状态文本
        setGenerationStatus(
          data.status === 'complete' 
            ? '生成完成！' 
            : data.status === 'generating' 
            ? `正在生成中... ${data.progress ? `${data.progress}%` : ''}` 
            : data.status === 'failed'
            ? '生成失败'
            : '等待中...'
        );

        if (data.status === 'complete' || data.status === 'failed') {
          // 任务完成或失败，停止轮询
          setPollingTaskId(null);
          setCurrentGeneratingTrack(null);
          setGenerationProgress(0);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          // 重新加载音乐列表（回调可能已经更新了数据库）
          await loadTracks();
        }
      }
    } catch (error) {
      console.error('Failed to check task status:', error);
    }
  };

  // 定期刷新音乐列表，以便接收回调更新
  useEffect(() => {
    if (pollingTaskId) {
      // 每5秒刷新一次列表，以便及时显示回调更新的结果
      const refreshInterval = setInterval(() => {
        loadTracks();
      }, 5000);

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [pollingTaskId]);

  // 根据API文档的字符限制
  const maxChars = 500; // Simple模式：prompt最大500字符
  const titleMaxChars = 80; // Custom模式：title最大80字符
  const lyricsMaxChars = 5000; // Custom模式：prompt（歌词）V4_5/V4_5PLUS/V5最大5000字符，V3_5/V4最大3000字符
  const charCount = songDescription.length;
  const lyricsCount = lyrics.length;
  const titleCount = songTitle.length;

  // 检查是否可以生成（根据API文档要求）
  // 简单模式（Non-custom Mode）：
  // - prompt（描述）必需，最大500字符
  // 自定义模式（Custom Mode）：
  // - style 必需
  // - title 必需（最大80字符）
  // - prompt（歌词）必需（如果 instrumental 为 false）
  const canGenerate =
    mode === 'simple'
      ? songDescription.trim().length > 0 && songDescription.trim().length <= 500
      : selectedStyles.length > 0 &&
        songTitle.trim().length > 0 &&
        songTitle.trim().length <= 80 &&
        (instrumental || (lyrics.trim().length > 0 || songDescription.trim().length > 0));

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return;
    
    setIsGenerating(true);
    setGenerationStatus('正在创建生成任务...');
    
    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 必需字段
          customMode: mode === 'custom',
          instrumental: instrumental,
          model: model || 'V5',
          callBackUrl: `${window.location.origin}/api/music/callback`,
          
          // 根据模式选择传参
          ...(mode === 'simple' ? {
            // 简单模式：只需要 prompt
            prompt: songDescription.trim()
          } : {
            // 自定义模式：需要 style, title, prompt
            style: selectedStyles.join(', '),
            title: songTitle.trim(),
            prompt: instrumental ? undefined : (lyrics.trim() || songDescription.trim())
          }),
          
          // 可选字段（仅在自定义模式下有效）
          ...(mode === 'custom' && selectedPersona && { personaId: selectedPersona }),
          ...(mode === 'custom' && negativeTags.trim() && { negativeTags: negativeTags.trim() }),
          ...(mode === 'custom' && vocalGender && { vocalGender: vocalGender }),
          ...(mode === 'custom' && { styleWeight: styleWeight }),
          ...(mode === 'custom' && { weirdnessConstraint: weirdnessConstraint }),
          ...(mode === 'custom' && { audioWeight: audioWeight })
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate music');
      }

      const data = await response.json();
      setPollingTaskId(data.taskId);
      setCurrentGeneratingTrack({ taskId: data.taskId, title: songTitle || songDescription || 'Untitled' });
      setGenerationStatus('任务已创建，等待生成中...（回调机制已启用）');
      setGenerationProgress(0);
      
      // 立即检查一次状态（作为初始状态检查）
      setTimeout(() => {
        checkTaskStatus(data.taskId);
      }, 1000);
      
      // 立即刷新一次列表，以便显示新创建的任务
      setTimeout(() => {
        loadTracks();
      }, 500);
    } catch (error) {
      console.error('Error generating music:', error);
      setGenerationStatus('生成失败，请重试');
      alert(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
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
    if (track.status !== 'complete' || !track.audioUrl) {
      alert('音乐尚未生成完成，请稍候');
      return;
    }

    // 如果切换不同的track，需要重新加载audio元素
    if (currentTrack?.id !== track.id) {
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      // 延迟设置audio源，确保状态更新后再操作
      setTimeout(() => {
        if (audioRef.current && track.audioUrl) {
          audioRef.current.src = track.audioUrl;
          audioRef.current.play().catch(console.error);
        }
      }, 0);
    } else {
      handleTogglePlay();
    }
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * parseDuration(currentTrack.duration);
    audio.currentTime = newTime;
  };

  const handleDownload = async (track: MusicTrack) => {
    if (!track.audioUrl) {
      alert('音频文件不可用');
      return;
    }

    try {
      const response = await fetch(track.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title || 'music'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('下载失败');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseDuration = (duration: string): number => {
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  const totalSeconds = currentTrack ? parseDuration(currentTrack.duration) : 0;
  const progress = totalSeconds > 0 ? (currentTime / totalSeconds) * 100 : 0;

  return (
    <main className="h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* 左侧操作区 */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 overflow-y-auto flex-shrink-0">
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
                      {generationStatus || '正在生成...'}
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
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-900 dark:text-white font-semibold">
                      歌曲标题
                    </Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {titleCount}/{titleMaxChars}
                    </span>
                  </div>
                  <Input
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    maxLength={titleMaxChars}
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
                      {generationStatus || '正在生成...'}
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
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto min-w-0">
          {/* 隐藏的音频播放器 */}
          {currentTrack?.audioUrl && (
            <audio
              ref={audioRef}
              src={currentTrack.audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}

          <div className="space-y-6">
            {/* 生成进度显示 */}
            {currentGeneratingTrack && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  正在生成: {currentGeneratingTrack.title}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{generationStatus}</span>
                    {generationProgress > 0 && (
                      <span>{generationProgress}%</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-orange-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 生成的音乐列表 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                生成的音乐
              </h2>
              {generatedTracks.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <p>还没有生成的音乐，开始创作吧！</p>
                </div>
              ) : (
                <>
                  {generatedTracks.map((track) => (
                    <div
                      key={track.id}
                      className={`flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm ${
                        track.status === 'complete' && track.audioUrl
                          ? 'hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer'
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => track.status === 'complete' && track.audioUrl && handlePlayTrack(track)}
                    >
                      <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {track.imageUrl ? (
                          <img
                            src={track.imageUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-50" />
                            {track.status === 'complete' ? (
                              <Play className="relative z-10 w-6 h-6 text-white" />
                            ) : track.status === 'generating' ? (
                              <span className="relative z-10 text-white animate-spin">⏳</span>
                            ) : (
                              <span className="relative z-10 text-white">⏸</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
                            {track.title}
                          </h3>
                          {track.status === 'generating' && (
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              生成中...
                            </span>
                          )}
                          {track.status === 'pending' && (
                            <span className="text-xs text-gray-500">
                              等待中...
                            </span>
                          )}
                          {track.status === 'failed' && (
                            <span className="text-xs text-red-600">
                              失败
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {track.description}
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                          {track.timestamp}
                        </p>
                      </div>
                      {track.status === 'complete' && track.audioUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(track);
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* 歌词预览 */}
            {currentTrack && (
              <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentTrack.title}
                </h2>
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

            {!currentTrack && !currentGeneratingTrack && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p>选择一个音乐开始播放</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部固定音乐播放器 */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <div className="max-w-full px-6 py-4">
            <div className="flex items-center gap-4">
              {/* 封面图 */}
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                {currentTrack.imageUrl ? (
                  <img
                    src={currentTrack.imageUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* 音乐信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentTrack.description}
                </p>
              </div>

              {/* 播放控制 */}
              <div className="flex items-center gap-4 flex-1 max-w-2xl">
                <Button
                  onClick={handleTogglePlay}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-2 flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>

                {/* 进度条 */}
                <div className="flex-1 min-w-0">
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="bg-orange-600 h-1 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* 时间显示 */}
                <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{currentTrack.duration}</span>
                </div>

                {/* 音量控制 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const newVolume = volume > 0 ? 0 : 1;
                      setVolume(newVolume);
                      if (audioRef.current) {
                        audioRef.current.volume = newVolume;
                      }
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {volume > 0 ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <VolumeX className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* 下载按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(currentTrack)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex-shrink-0"
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
