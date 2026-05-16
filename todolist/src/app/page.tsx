'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { classifyTaskDifficulty } from './actions';
import { Send, CheckCircle2, Circle, Trash2, Edit2, Loader2, Bot, User, Sparkles } from 'lucide-react';

type Todo = {
  id: string;
  created_at: string;
  task: string;
  difficulty: '쉬움' | '중간' | '어려움';
  is_completed: boolean;
};

type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial', sender: 'ai', text: '안녕하세요! 추가할 할 일을 입력해주세요. 제가 난이도를 분석해서 리스트에 추가해 드릴게요.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch initial todos
  useEffect(() => {
    const fetchTodos = async () => {
      // Check if supabase variables are probably set
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')) {
        setIsSupabaseConfigured(false);
        return;
      }
      const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching todos:', error);
      } else {
        setTodos(data || []);
      }
    };
    fetchTodos();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMessage }]);
    setIsProcessing(true);

    try {
      // 1. Get difficulty from Gemini
      const difficulty = await classifyTaskDifficulty(userMessage);
      
      // 2. Add to Supabase
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('todos')
          .insert([{ task: userMessage, difficulty, is_completed: false }])
          .select()
          .single();

        if (error) throw error;
        
        // 3. Update Todos list
        setTodos(prev => [data, ...prev]);
        
        // 4. AI Response
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          sender: 'ai', 
          text: `"${userMessage}" 할 일을 추가했습니다! (난이도: ${difficulty})` 
        }]);
      } else {
        // Mock if no supabase
        const newTodo: Todo = {
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          task: userMessage,
          difficulty,
          is_completed: false
        };
        setTodos(prev => [newTodo, ...prev]);
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          sender: 'ai', 
          text: `[Supabase 미연결 데모] "${userMessage}" 할 일을 추가했습니다! (난이도: ${difficulty})` 
        }]);
      }
    } catch (error) {
      console.error('Failed to process task:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'ai', 
        text: '앗, 처리 중 오류가 발생했습니다. 다시 시도해 주세요.' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
      if (error) console.error('Error updating todo:', error);
    }
    setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
  };

  const deleteTodo = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) console.error('Error deleting todo:', error);
    }
    setTodos(todos.filter(t => t.id !== id));
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTaskText(todo.task);
  };

  const saveEdit = async (id: string) => {
    if (!editTaskText.trim()) {
      setEditingId(null);
      return;
    }
    
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('todos').update({ task: editTaskText }).eq('id', id);
      if (error) console.error('Error updating task text:', error);
    }
    
    setTodos(todos.map(t => t.id === id ? { ...t, task: editTaskText } : t));
    setEditingId(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '쉬움': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case '중간': return 'bg-amber-100 text-amber-700 border-amber-200';
      case '어려움': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-6xl w-full h-[85vh] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        
        {/* Left Panel: AI Chat Interface */}
        <div className="w-full md:w-5/12 bg-slate-50 border-r border-slate-200 flex flex-col relative z-10">
          <div className="p-6 border-b border-slate-200 bg-white flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI Task Assistant</h2>
              <p className="text-sm text-slate-500">할 일을 말해주면 알아서 추가할게요!</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-slate-600" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start animate-in fade-in">
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-slate-500">분석 중...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            {!isSupabaseConfigured && (
              <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                환경 변수(.env.local)가 설정되지 않아 로컬 모드로 동작합니다.
              </div>
            )}
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예: 장보기, 보고서 작성하기..."
                className="w-full bg-slate-100 text-slate-800 placeholder-slate-400 rounded-full py-3.5 pl-5 pr-12 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                disabled={isProcessing}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isProcessing}
                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Todo List */}
        <div className="w-full md:w-7/12 bg-white flex flex-col">
          <div className="p-8 pb-4 border-b border-slate-100">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Tasks</h1>
            <p className="text-slate-500 mt-1">총 {todos.length}개의 할 일이 있습니다.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 pt-4">
            {todos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-slate-300" />
                </div>
                <p>아직 추가된 할 일이 없네요!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div 
                    key={todo.id} 
                    className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                      todo.is_completed 
                        ? 'bg-slate-50 border-slate-200 opacity-60' 
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <button 
                      onClick={() => toggleTodo(todo.id, todo.is_completed)}
                      className="shrink-0 focus:outline-none"
                    >
                      {todo.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {editingId === todo.id ? (
                        <input
                          type="text"
                          value={editTaskText}
                          onChange={(e) => setEditTaskText(e.target.value)}
                          onBlur={() => saveEdit(todo.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(todo.id)}
                          autoFocus
                          className="w-full bg-slate-100 px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <p className={`text-[16px] truncate ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                          {todo.task}
                        </p>
                      )}
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getDifficultyColor(todo.difficulty)}`}>
                        {todo.difficulty}
                      </span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditing(todo)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
