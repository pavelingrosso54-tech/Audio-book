
import React, { useState, useRef } from 'react';
import { VOICES, VoiceName, AudiobookJob } from './types';
import { extractTextFromFile, synthesizeSpeech, previewVoice } from './services/geminiService';

const App: React.FC = () => {
  const [job, setJob] = useState<AudiobookJob>({
    id: Math.random().toString(36).substr(2, 9),
    text: '',
    voice: VoiceName.Puck,
    secondaryVoice: VoiceName.Kore,
    isDuoMode: false,
    status: 'idle',
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setJob(prev => ({ ...prev, status: 'extracting', error: undefined }));
    try {
      const extractedText = await extractTextFromFile(file);
      setJob(prev => ({ ...prev, text: extractedText, status: 'idle' }));
    } catch (err) {
      setJob(prev => ({ ...prev, status: 'error', error: 'Не удалось извлечь текст из файла.' }));
      console.error(err);
    }
  };

  const handlePreview = async (v: VoiceName, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewLoading(v);
    try {
      const url = await previewVoice(v);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error("Preview failed", err);
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleGenerate = async () => {
    if (!job.text) return;
    setJob(prev => ({ ...prev, status: 'synthesizing', error: undefined }));
    try {
      const audioUrl = await synthesizeSpeech(
        job.text, 
        job.voice, 
        job.isDuoMode, 
        job.secondaryVoice
      );
      setJob(prev => ({ ...prev, status: 'completed', audioUrl }));
    } catch (err) {
      setJob(prev => ({ ...prev, status: 'error', error: 'Ошибка при генерации аудио.' }));
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
        
        <header className="text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <span className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-3 rounded-2xl shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            Gemini Audiobook
          </h1>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            Профессиональная озвучка ваших документов с поддержкой диалогов.
          </p>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">1. Текст</h2>
            {job.status === 'extracting' && (
              <span className="flex items-center text-blue-600 animate-pulse font-bold text-sm uppercase tracking-wider">
                Извлечение...
              </span>
            )}
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
            className={`group border-2 border-dashed rounded-2xl p-6 transition-all text-center cursor-pointer ${
              isDragging ? 'border-blue-500 bg-blue-50 scale-[0.99]' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} accept=".pdf,.txt,.docx" />
            <div className="flex flex-col items-center gap-2">
              <svg className="h-10 w-10 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 text-sm font-medium">Загрузите файл или перетащите его сюда</p>
            </div>
          </div>

          <textarea
            className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none font-medium text-gray-700"
            placeholder="Или вставьте текст вручную..."
            value={job.text}
            onChange={(e) => setJob(prev => ({ ...prev, text: e.target.value }))}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">2. Голос и Режим</h2>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input type="checkbox" className="sr-only peer" checked={job.isDuoMode} onChange={(e) => setJob(prev => ({ ...prev, isDuoMode: e.target.checked }))} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Режим Диалога</span>
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">{job.isDuoMode ? 'Основной голос (Рассказчик)' : 'Выберите голос'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setJob(prev => ({ ...prev, voice: v.id }))}
                    className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 group ${
                      job.voice === v.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className={`text-xs font-black truncate w-full text-center ${job.voice === v.id ? 'text-blue-700' : 'text-gray-700'}`}>{v.name}</span>
                    <button 
                      onClick={(e) => handlePreview(v.id, e)}
                      disabled={previewLoading !== null}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
                      title="Прослушать образец"
                    >
                      {previewLoading === v.id ? (
                        <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </button>
                ))}
              </div>
            </div>

            {job.isDuoMode && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Второй голос (Персонаж)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setJob(prev => ({ ...prev, secondaryVoice: v.id }))}
                      className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        job.secondaryVoice === v.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <span className={`text-xs font-black truncate w-full text-center ${job.secondaryVoice === v.id ? 'text-indigo-700' : 'text-gray-700'}`}>{v.name}</span>
                      <button 
                        onClick={(e) => handlePreview(v.id, e)}
                        className="text-indigo-500 hover:text-indigo-700 p-1 rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="pt-6 border-t border-gray-100 flex flex-col items-center gap-6">
          {job.error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold">{job.error}</span>
            </div>
          )}

          <div className="w-full flex flex-col items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={!job.text || job.status === 'synthesizing' || job.status === 'extracting'}
              className={`w-full max-w-md py-4 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 transform ${
                !job.text || job.status === 'synthesizing' || job.status === 'extracting'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-2xl active:scale-95 hover:-translate-y-1'
              }`}
            >
              {job.status === 'synthesizing' ? (
                <>
                  <div className="h-6 w-6 border-4 border-white border-t-transparent animate-spin rounded-full"></div>
                  Синтез речи...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Озвучить Текст
                </>
              )}
            </button>
            
            {job.status === 'completed' && job.audioUrl && (
              <div className="w-full bg-blue-50 p-6 rounded-3xl border border-blue-100 flex flex-col items-center gap-5 animate-in fade-in zoom-in duration-500 shadow-inner">
                <div className="flex items-center gap-2 text-blue-800 font-black tracking-tight">
                  <div className="flex gap-1 h-4 items-end">
                    <div className="w-1 bg-blue-400 animate-pulse h-full"></div>
                    <div className="w-1 bg-blue-500 animate-pulse h-2/3"></div>
                    <div className="w-1 bg-blue-600 animate-pulse h-full"></div>
                    <div className="w-1 bg-blue-500 animate-pulse h-1/2"></div>
                  </div>
                  АУДИОКНИГА ГОТОВА
                </div>
                <audio controls className="w-full h-12" src={job.audioUrl}>
                  Ваш браузер не поддерживает аудио.
                </audio>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={job.audioUrl}
                    download="audiobook.wav"
                    className="flex items-center gap-2 bg-white text-blue-700 border-2 border-blue-100 px-6 py-2 rounded-xl font-black hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Скачать WAV
                  </a>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-6 py-2 rounded-xl font-bold hover:bg-blue-200 transition-all"
                  >
                    Перегенерировать
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-8 text-gray-400 text-xs font-bold tracking-widest uppercase">
        Google Gemini 3 & 2.5 TTS • High Fidelity Audio
      </footer>
    </div>
  );
};

export default App;
