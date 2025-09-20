import React, { useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseStorage, limitsStorage } from '../utils/storage';
import { calculateCategorySpending, calculateLimitProgress } from '../utils/analytics';
import { generateAdvice, ChatMessage } from '../utils/ai';
import { Send, Bot, User, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I can help you plan and optimize your spending. What would you like to achieve this month?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const expenses = useMemo(() => (user ? expenseStorage.getAll(user.id) : []), [user]);
  const limits = useMemo(() => (user ? limitsStorage.getAll(user.id) : []), [user]);

  const summary = useMemo(() => {
    const totalThisMonth = expenses.reduce((sum, e) => sum + e.amount, 0);
    const topCategories = calculateCategorySpending(expenses)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    const limitsProgress = calculateLimitProgress(expenses, limits);
    const avgDaily = expenses.length > 0 ? totalThisMonth / new Date().getDate() : 0;
    return { totalThisMonth, avgDaily, topCategories, limitsProgress };
  }, [expenses, limits]);

  const scrollToEnd = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!user) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const reply = await generateAdvice(newMessages.filter(m => m.role !== 'system'), {
        monthlyBudget: user.monthlyBudget,
        summary,
      });
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      setTimeout(scrollToEnd, 50);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to get advice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Assistant</h1>
        <a href="#/profile" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
          <Settings className="h-4 w-4 mr-1" /> AI Settings
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[60vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'assistant' ? '' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 ${m.role === 'assistant' ? 'bg-gray-50 border border-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}>
                <div className="flex items-center mb-1 text-sm opacity-70">
                  {m.role === 'assistant' ? <Bot className="h-4 w-4 mr-1" /> : <User className="h-4 w-4 mr-1" />}
                  {m.role === 'assistant' ? 'Assistant' : 'You'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask for budgeting tips, plans, or how to cut costs..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center"
            >
              <Send className="h-4 w-4 mr-2" /> {isLoading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Uses free-tier friendly models via your API key. Keep messages short for best results.
      </div>
    </div>
  );
}
